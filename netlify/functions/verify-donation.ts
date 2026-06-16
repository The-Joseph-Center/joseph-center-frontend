import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@libsql/client';
import { Resend } from 'resend';
import { donorOneTime } from './_email-templates/donor-one-time';
import { donorMonthlyFirst } from './_email-templates/donor-monthly-first';
import { donorMonthlyRecurring } from './_email-templates/donor-monthly-recurring';
import { staffDonation } from './_email-templates/staff-donation';

// Stripe webhook handler. Receives:
//   - payment_intent.succeeded  → one-time gifts
//   - invoice.paid              → recurring monthly gifts (first + renewals)
// On success:
//   1. Mark the matching donations row 'succeeded' (or INSERT a new row for
//      monthly renewals, which don't have a pre-existing pending row)
//   2. If a campaign is attached, increment campaigns.raised_cents
//   3. Send Resend confirmation email to donor (templates 1, 2, or 3)
//   4. Send Resend notification to staff (template 6) if STAFF_DONATION_TO_EMAIL set
//
// Stripe signs every webhook with STRIPE_WEBHOOK_SECRET. We verify the
// signature before doing any work.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

function jsonError(statusCode: number, message: string) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify({ error: message }) };
}

// Marks a pending donation row succeeded; returns it for downstream email
// sends. Returns null if no matching pending row exists (renewal case).
async function markDonationSucceeded(stripePaymentId: string) {
  const result = await turso.execute({
    sql: `UPDATE donations SET status = 'succeeded'
          WHERE stripe_payment_id = ? AND status = 'pending'
          RETURNING id, donor_id, amount_cents, frequency, campaign_id, fee_covered, email_opt_in, stripe_subscription_id`,
    args: [stripePaymentId],
  });
  return result.rows[0] ?? null;
}

// For monthly renewals: look up the original donation by subscription id to
// resolve donor, campaign, opt-in preferences, then insert a fresh row for
// the new charge.
async function insertRenewalDonation(opts: {
  stripePaymentId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  amountCents: number;
}) {
  const orig = await turso.execute({
    sql: `SELECT donor_id, campaign_id, fee_covered, email_opt_in
          FROM donations
          WHERE stripe_subscription_id = ?
          ORDER BY created_at ASC
          LIMIT 1`,
    args: [opts.stripeSubscriptionId],
  });
  const seed = orig.rows[0];
  if (!seed) return null;

  const inserted = await turso.execute({
    sql: `INSERT INTO donations
            (donor_id, amount_cents, frequency, campaign_id,
             stripe_payment_id, stripe_subscription_id, stripe_customer_id,
             status, fee_covered, email_opt_in)
          VALUES (?, ?, 'monthly', ?, ?, ?, ?, 'succeeded', ?, ?)
          RETURNING id, donor_id, amount_cents, frequency, campaign_id, fee_covered, email_opt_in, stripe_subscription_id`,
    args: [
      seed.donor_id,
      opts.amountCents,
      seed.campaign_id,
      opts.stripePaymentId,
      opts.stripeSubscriptionId,
      opts.stripeCustomerId,
      seed.fee_covered,
      seed.email_opt_in,
    ],
  });
  return inserted.rows[0] ?? null;
}

async function incrementCampaign(campaignId: string, amountCents: number) {
  await turso.execute({
    sql: 'UPDATE campaigns SET raised_cents = raised_cents + ? WHERE id = ?',
    args: [amountCents, campaignId],
  });
}

async function getDonor(donorId: string) {
  const result = await turso.execute({
    sql: 'SELECT first_name, last_name, email, phone, street, city, state, zip FROM donors WHERE id = ? LIMIT 1',
    args: [donorId],
  });
  return result.rows[0] ?? null;
}

async function getCampaignName(campaignId: string | null): Promise<string | null> {
  if (!campaignId) return null;
  const result = await turso.execute({
    sql: 'SELECT name FROM campaigns WHERE id = ? LIMIT 1',
    args: [campaignId],
  });
  return (result.rows[0]?.name as string) ?? null;
}

function donorBaseEnvelope(opts: { to: string; subject: string; html: string; text: string }) {
  return {
    from: process.env.DONATION_FROM_EMAIL || 'onboarding@resend.dev',
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  };
}

function staffBaseEnvelope(opts: { to: string; subject: string; html: string; text: string }) {
  return {
    from: process.env.DONATION_FROM_EMAIL || 'onboarding@resend.dev',
    to: opts.to.split(',').map((s) => s.trim()).filter(Boolean),
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  };
}

function formatMailingAddress(donor: Record<string, unknown>): string | null {
  const parts = [
    donor.street,
    donor.city,
    [donor.state, donor.zip].filter(Boolean).join(' '),
  ].filter((s) => typeof s === 'string' && s.trim());
  if (!parts.length) return null;
  return parts.join(', ');
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const provider = process.env.VITE_DONATION_PROVIDER || 'harness';
  if (provider !== 'stripe') return jsonError(501, 'Stripe donations not yet activated.');
  if (event.httpMethod !== 'POST') return jsonError(405, 'Method not allowed');

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return jsonError(500, 'STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured');
  }

  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!signature) return jsonError(400, 'Missing Stripe-Signature header');

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body || '', signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return jsonError(400, 'Invalid webhook signature');
  }

  try {
    let paymentIntentId: string | null = null;
    let isRenewal = false;
    let renewalAmountCents: number | null = null;
    let renewalSubscriptionId: string | null = null;
    let renewalCustomerId: string | null = null;
    let stripeReceiptUrl: string | null = null;

    if (stripeEvent.type === 'payment_intent.succeeded') {
      const pi = stripeEvent.data.object as Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> };
      paymentIntentId = pi.id;
      stripeReceiptUrl = pi.charges?.data?.[0]?.receipt_url ?? null;
    } else if (stripeEvent.type === 'invoice.paid') {
      const invoice = stripeEvent.data.object as Stripe.Invoice & { payment_intent?: string };
      paymentIntentId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null;
      stripeReceiptUrl = invoice.hosted_invoice_url ?? null;
      // billing_reason tells us first invoice vs renewal
      isRenewal = invoice.billing_reason === 'subscription_cycle';
      renewalAmountCents = invoice.amount_paid ?? null;
      renewalSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      renewalCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null;
    } else {
      return {
        statusCode: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ received: true, type: stripeEvent.type, ignored: true }),
      };
    }

    if (!paymentIntentId) {
      console.error('No payment_intent on event:', stripeEvent.type);
      return {
        statusCode: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ received: true, warning: 'no payment_intent' }),
      };
    }

    // Resolve a donation row: either the existing pending one (first-time
    // path) or a freshly inserted renewal row.
    let donation = await markDonationSucceeded(paymentIntentId);
    if (!donation && isRenewal && renewalSubscriptionId && renewalAmountCents && renewalCustomerId) {
      donation = await insertRenewalDonation({
        stripePaymentId: paymentIntentId,
        stripeSubscriptionId: renewalSubscriptionId,
        stripeCustomerId: renewalCustomerId,
        amountCents: renewalAmountCents,
      });
    }

    if (!donation) {
      return {
        statusCode: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ received: true, note: 'no matching donation row' }),
      };
    }

    const amountCents = donation.amount_cents as number;
    const frequency = donation.frequency as 'one-time' | 'monthly';
    const campaignId = (donation.campaign_id as string | null) ?? null;
    const feeCovered = (donation.fee_covered as number) === 1;
    const emailOptIn = (donation.email_opt_in as number) === 1;

    if (campaignId) await incrementCampaign(campaignId, amountCents);

    const donor = await getDonor(donation.donor_id as string);
    if (!donor) {
      return {
        statusCode: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ received: true, warning: 'donor not found', donationId: donation.id }),
      };
    }

    const campaignName = await getCampaignName(campaignId);
    const hasMailingAddress = Boolean(donor.street);
    const firstName = donor.first_name as string;
    const lastName = donor.last_name as string;
    const email = donor.email as string;
    const phone = (donor.phone as string | null) ?? null;
    const mailingAddress = formatMailingAddress(donor);
    const totalChargedCents = amountCents;

    // ─── Donor email ───────────────────────────────────────────────────
    if (emailOptIn) {
      let rendered;
      if (frequency === 'one-time') {
        rendered = donorOneTime({
          firstName,
          amountCents,
          totalChargedCents,
          feeCovered,
          campaignName,
          hasMailingAddress,
          stripeReceiptUrl,
        });
      } else if (isRenewal) {
        rendered = donorMonthlyRecurring({
          firstName,
          amountCents,
          totalChargedCents,
          stripeReceiptUrl,
        });
      } else {
        rendered = donorMonthlyFirst({
          firstName,
          amountCents,
          totalChargedCents,
          feeCovered,
          campaignName,
          hasMailingAddress,
          stripeReceiptUrl,
        });
      }
      await resend.emails.send(donorBaseEnvelope({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }));
    }

    // ─── Staff notification ───────────────────────────────────────────
    const staffTo = process.env.STAFF_DONATION_TO_EMAIL;
    if (staffTo) {
      const staffRendered = staffDonation({
        firstName, lastName, email, phone, mailingAddress,
        amountCents, totalChargedCents,
        frequency, campaignName, feeCovered, stripeReceiptUrl,
        isRenewal,
      });
      await resend.emails.send(staffBaseEnvelope({
        to: staffTo,
        subject: staffRendered.subject,
        html: staffRendered.html,
        text: staffRendered.text,
      }));
    } else {
      console.warn('STAFF_DONATION_TO_EMAIL not set — staff notification skipped');
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ received: true, type: stripeEvent.type, donationId: donation.id, isRenewal }),
    };
  } catch (err) {
    console.error('verify-donation processing error:', err);
    return jsonError(500, 'Webhook processing failed');
  }
};
