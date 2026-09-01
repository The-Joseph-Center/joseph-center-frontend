/**
 * Sends one of each branded email to a single address so the templates can be
 * reviewed in a real inbox rather than in a rendering tool.
 *
 * These use the same template functions the live Functions call, so what
 * arrives is what donors and volunteers actually receive — not an
 * approximation. The From addresses are the real ones too, so SPF/DKIM
 * alignment gets exercised at the same time.
 *
 * Run from frontend/:
 *   npx tsx scripts/send-test-emails.ts                      # list, send nothing
 *   TO=someone@example.com APPLY=yes npx tsx scripts/send-test-emails.ts
 *   ONLY=event,one-time ...   # only those whose label matches, for re-checks
 */
import fs from 'node:fs';
import { Resend } from 'resend';
import { donorOneTime } from '../netlify/functions/_email-templates/donor-one-time';
import { donorMonthlyFirst } from '../netlify/functions/_email-templates/donor-monthly-first';
import { donorMonthlyRecurring } from '../netlify/functions/_email-templates/donor-monthly-recurring';
import { volunteerConfirmation } from '../netlify/functions/_email-templates/volunteer-confirmation';
import { staffDonation } from '../netlify/functions/_email-templates/staff-donation';
import { staffVolunteer } from '../netlify/functions/_email-templates/staff-volunteer';
import { eventRegistration } from '../netlify/functions/_email-templates/event-registration';

const APPLY = process.env.APPLY === 'yes';
const TO = process.env.TO;

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

const RECEIPT = 'https://pay.stripe.com/receipts/example';
const now = new Date();

const emails = [
  {
    who: 'Donor — one-time gift',
    from: env.DONATION_FROM_EMAIL,
    ...donorOneTime({
      firstName: 'Eric', amountCents: 5000, totalChargedCents: 5175, feeCovered: true,
      campaignName: null, hasMailingAddress: true, stripeReceiptUrl: RECEIPT, donationDate: now,
    }),
  },
  {
    who: 'Donor — first monthly gift',
    from: env.DONATION_FROM_EMAIL,
    ...donorMonthlyFirst({
      firstName: 'Eric', amountCents: 2500, totalChargedCents: 2500, feeCovered: false,
      campaignName: 'Golden Girls Project', hasMailingAddress: false, stripeReceiptUrl: RECEIPT, donationDate: now,
    }),
  },
  {
    who: 'Donor — recurring monthly gift',
    from: env.DONATION_FROM_EMAIL,
    ...donorMonthlyRecurring({
      firstName: 'Eric', amountCents: 2500, totalChargedCents: 2500,
      stripeReceiptUrl: RECEIPT, donationDate: now,
    }),
  },
  {
    who: 'Volunteer — confirmation',
    from: env.CONTACT_FROM_EMAIL,
    ...volunteerConfirmation({
      firstName: 'Eric', volunteerType: 'program', departments: ['Day Shelter', 'Kitchen'],
    }),
  },
  {
    who: 'Staff — new donation',
    from: env.DONATION_FROM_EMAIL,
    ...staffDonation({
      firstName: 'Eric', lastName: 'Phifer', email: 'ephifer@josephcentergj.com',
      phone: '(970) 210-0060', mailingAddress: '1123 Aquarius Ave, Fruita, CO 81521',
      amountCents: 5000, totalChargedCents: 5175, frequency: 'one-time',
      campaignName: null, feeCovered: true, stripeReceiptUrl: RECEIPT, donationDate: now,
    }),
  },
  {
    who: 'Staff — new volunteer',
    from: env.CONTACT_FROM_EMAIL,
    ...staffVolunteer({
      firstName: 'Eric', lastName: 'Phifer', email: 'ephifer@josephcentergj.com',
      phone: '(970) 210-0060', volunteerType: 'program',
      departments: ['Day Shelter', 'Kitchen'],
      availabilitySummary: 'Tuesday all day · Wednesday morning · Friday evening',
      message: 'Happy to help wherever the need is greatest.',
    }),
  },
  {
    who: 'Event — registration confirmed',
    from: env.CONTACT_FROM_EMAIL,
    ...eventRegistration({
      firstName: 'Eric',
      eventTitle: '2nd Annual Food Truck Fundraiser',
      eventDate: new Date(Date.now() + 21 * 86400000).toISOString(),
      location: '2511 Belford Ave #B, Grand Junction, CO 81501',
      partySize: 2,
    }),
  },
];

async function run() {
  const only = (process.env.ONLY ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const chosen = only.length
    ? emails.filter((e) => only.some((o) => e.who.toLowerCase().includes(o)))
    : emails;

  console.log(`${APPLY ? `SENDING to ${TO}` : 'DRY RUN'} — ${chosen.length} branded templates\n`);
  for (const e of chosen) console.log(`  ${e.who.padEnd(32)} ${e.subject}`);

  if (!APPLY) { console.log('\nDry run. Re-run with TO=<address> APPLY=yes to send.'); return; }
  if (!TO) { console.error('\nTO is required when APPLY=yes.'); process.exit(1); }

  const resend = new Resend(env.RESEND_API_KEY!);
  let sent = 0;
  for (const e of chosen) {
    const { data, error } = await resend.emails.send({
      from: e.from!, to: [TO], subject: e.subject, html: e.html, text: e.text,
    });
    if (error) { console.error(`  FAILED  ${e.who}: ${error.message}`); continue; }
    console.log(`  sent    ${e.who.padEnd(32)} ${data?.id}`);
    sent++;
    // Resend's default rate limit is 2 requests/second.
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\n  ${sent}/${chosen.length} delivered to Resend.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
