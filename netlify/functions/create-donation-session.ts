import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@libsql/client/web';
import {
  chargeCents,
  feeCents,
  MIN_DONATION_CENTS,
  MAX_DONATION_CENTS,
} from '../../src/lib/donationFees';

// Creates a PaymentIntent (one-time) or Subscription (monthly) and returns
// the client_secret the Stripe Payment Element needs to confirm payment.
// Also upserts the donor and inserts a pending donation row in Turso. The
// webhook (verify-donation.ts) later flips that row to 'succeeded' and
// triggers the confirmation email.
//
// The browser sends only the donor's intended gift (baseAmountCents) and a
// yes/no on covering fees. The amount actually charged is derived here via the
// shared fee module, so a crafted request can't set its own price and the
// figure quoted in the form always matches the charge.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

type Frequency = 'one-time' | 'monthly';

interface DonorInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface RequestBody {
  baseAmountCents: number;      // what the donor selected, pre-fee-coverage
  frequency: Frequency;
  _gotcha?: string;             // honeypot — populated only by bots
  campaignSlug?: string;        // optional campaign context
  donor: DonorInput;
  feeCovered: boolean;
  emailOptIn: boolean;
  smsOptIn: boolean;
}

function jsonError(statusCode: number, message: string) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify({ error: message }) };
}

function validate(body: Partial<RequestBody>): string | null {
  const base = body.baseAmountCents;
  if (typeof base !== 'number' || !Number.isFinite(base) || base < MIN_DONATION_CENTS) {
    return `Please enter an amount of at least $${(MIN_DONATION_CENTS / 100).toFixed(2)}.`;
  }
  if (base > MAX_DONATION_CENTS) {
    return `For gifts over $${(MAX_DONATION_CENTS / 100).toLocaleString()}, please contact us directly so we can help.`;
  }
  if (body.frequency !== 'one-time' && body.frequency !== 'monthly') {
    return 'frequency must be "one-time" or "monthly"';
  }
  const d = body.donor;
  if (!d || !d.firstName?.trim() || !d.lastName?.trim() || !d.email?.trim()) {
    return 'donor.firstName, donor.lastName, and donor.email are required';
  }
  if (!/\S+@\S+\.\S+/.test(d.email)) return 'donor.email is not a valid email address';
  return null;
}

// Returns the donor row id, creating/updating as needed. Email is the
// natural key for upsert.
async function upsertDonor(d: DonorInput, stripeCustomerId: string | null): Promise<string> {
  const existing = await turso.execute({
    sql: 'SELECT id FROM donors WHERE email = ? LIMIT 1',
    args: [d.email.trim().toLowerCase()],
  });
  if (existing.rows.length > 0) {
    const id = existing.rows[0]!.id as string;
    await turso.execute({
      sql: `UPDATE donors SET
              first_name = ?, last_name = ?, phone = ?, street = ?, city = ?, state = ?, zip = ?,
              stripe_customer_id = COALESCE(?, stripe_customer_id)
            WHERE id = ?`,
      args: [
        d.firstName.trim(),
        d.lastName.trim(),
        d.phone?.trim() || null,
        d.street?.trim() || null,
        d.city?.trim() || null,
        d.state?.trim() || null,
        d.zip?.trim() || null,
        stripeCustomerId,
        id,
      ],
    });
    return id;
  }
  const inserted = await turso.execute({
    sql: `INSERT INTO donors
            (first_name, last_name, email, phone, street, city, state, zip, stripe_customer_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id`,
    args: [
      d.firstName.trim(),
      d.lastName.trim(),
      d.email.trim().toLowerCase(),
      d.phone?.trim() || null,
      d.street?.trim() || null,
      d.city?.trim() || null,
      d.state?.trim() || null,
      d.zip?.trim() || null,
      stripeCustomerId,
    ],
  });
  return inserted.rows[0]!.id as string;
}

async function findCampaignId(slug?: string): Promise<string | null> {
  if (!slug) return null;
  const result = await turso.execute({
    sql: 'SELECT id FROM campaigns WHERE slug = ? AND active = 1 LIMIT 1',
    args: [slug],
  });
  return (result.rows[0]?.id as string) ?? null;
}

// Singleton Product cached at module scope so warm function instances skip
// the extra API call.
let cachedMonthlyProductId: string | null = null;

async function ensureMonthlyDonationProduct(stripe: Stripe): Promise<string> {
  if (cachedMonthlyProductId) return cachedMonthlyProductId;
  const PRODUCT_NAME = 'The Joseph Center — Monthly Giving';
  const list = await stripe.products.list({ limit: 100, active: true });
  const existing = list.data.find((p) => p.name === PRODUCT_NAME);
  if (existing) {
    cachedMonthlyProductId = existing.id;
    return existing.id;
  }
  const created = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Recurring monthly donation to The Joseph Center.',
  });
  cachedMonthlyProductId = created.id;
  return created.id;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonError(405, 'Method not allowed');
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return jsonError(500, 'STRIPE_SECRET_KEY not configured');

  let body: RequestBody;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  // Honeypot — a real donor never fills this in. Return a plausible-looking
  // success so the bot doesn't learn it was caught, but touch nothing.
  if (body._gotcha) {
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ clientSecret: '', donationId: '' }) };
  }

  const validationError = validate(body);
  if (validationError) return jsonError(400, validationError);

  // Derived here, never taken from the request.
  const baseAmountCents = body.baseAmountCents;
  const feeCovered = body.feeCovered === true;
  const amountCents = chargeCents(baseAmountCents, feeCovered);
  const coveredCents = feeCovered ? feeCents(baseAmountCents) : 0;

  // Pin API version — stripe-node 22 defaults to 2025-09-30 where the
  // subscription response was restructured (`latest_invoice.payment_intent`
  // became `latest_invoice.confirmation_secret`). 2024-06-20 keeps the
  // older expansion pattern this function relies on.
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });

  try {
    const campaignId = await findCampaignId(body.campaignSlug);

    // Reuse a Stripe Customer keyed by email so returning donors don't
    // accumulate duplicate records.
    const existingCustomers = await stripe.customers.list({
      email: body.donor.email.trim().toLowerCase(),
      limit: 1,
    });
    const customer = existingCustomers.data[0] ?? (await stripe.customers.create({
      email: body.donor.email.trim().toLowerCase(),
      name: `${body.donor.firstName.trim()} ${body.donor.lastName.trim()}`,
      phone: body.donor.phone?.trim() || undefined,
      address: body.donor.street ? {
        line1: body.donor.street.trim(),
        city: body.donor.city?.trim() || undefined,
        state: body.donor.state?.trim() || undefined,
        postal_code: body.donor.zip?.trim() || undefined,
        country: 'US',
      } : undefined,
    }));

    const donorId = await upsertDonor(body.donor, customer.id);

    let clientSecret: string;
    let stripePaymentId: string | null = null;
    let stripeSubscriptionId: string | null = null;

    if (body.frequency === 'one-time') {
      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
        description: campaignId
          ? `Donation to The Joseph Center (campaign: ${body.campaignSlug})`
          : 'Donation to The Joseph Center',
        metadata: {
          frequency: 'one-time',
          campaign_id: campaignId ?? '',
          campaign_slug: body.campaignSlug ?? '',
          fee_covered: String(feeCovered),
          email_opt_in: String(body.emailOptIn),
          sms_opt_in: String(body.smsOptIn === true),
          base_amount_cents: String(baseAmountCents),
          fees_covered_cents: String(coveredCents),
        },
      });
      clientSecret = intent.client_secret!;
      stripePaymentId = intent.id;
    } else {
      const productId = await ensureMonthlyDonationProduct(stripe);

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            product: productId,
            unit_amount: amountCents,
            recurring: { interval: 'month' },
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card', 'us_bank_account'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          frequency: 'monthly',
          campaign_id: campaignId ?? '',
          campaign_slug: body.campaignSlug ?? '',
          fee_covered: String(feeCovered),
          email_opt_in: String(body.emailOptIn),
          sms_opt_in: String(body.smsOptIn === true),
          base_amount_cents: String(baseAmountCents),
          fees_covered_cents: String(coveredCents),
        },
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice & {
        payment_intent: Stripe.PaymentIntent;
      };
      clientSecret = latestInvoice.payment_intent.client_secret!;
      stripePaymentId = latestInvoice.payment_intent.id;
      stripeSubscriptionId = subscription.id;
    }

    const inserted = await turso.execute({
      sql: `INSERT INTO donations
              (donor_id, amount_cents, frequency, campaign_id,
               stripe_payment_id, stripe_subscription_id, stripe_customer_id,
               status, fee_covered, email_opt_in, sms_opt_in)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            RETURNING id`,
      args: [
        donorId,
        amountCents,
        body.frequency,
        campaignId,
        stripePaymentId,
        stripeSubscriptionId,
        customer.id,
        feeCovered ? 1 : 0,
        body.emailOptIn ? 1 : 0,
        body.smsOptIn === true ? 1 : 0,
      ],
    });
    const donationId = inserted.rows[0]!.id as string;

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        clientSecret,
        donationId,
        stripeCustomerId: customer.id,
      }),
    };
  } catch (err) {
    // The full error goes to the log; the donor gets a sentence they can act on.
    //
    // This previously returned Stripe's own message, which on launch day put
    // "Expired API Key provided: sk_live_****09kho2" in front of donors. A
    // partially masked key is still more than anyone outside the org should
    // see, and a donor cannot do anything with it — the useful part for them is
    // that it is our problem and their card was not charged.
    console.error('create-donation-session error:', err);
    return jsonError(
      500,
      'Something went wrong setting up your gift, and your card has not been charged. ' +
      'Please try again in a few minutes — or call us on (970) 245-7672 and we will gladly take it by phone.'
    );
  }
};
