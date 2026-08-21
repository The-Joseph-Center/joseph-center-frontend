/**
 * Backfills email + name onto the Stripe customers Harness created.
 *
 * The problem: 8 customers in the live account have no email, so they can never
 * use the Customer Portal — its login link is email-based. All 8 have active
 * monthly subscriptions ($370.53/mo combined, every invoice paid).
 *
 * Where the data actually is: Harness never populated the *customer* record —
 * `description` is the placeholder "shared harness donor profile for recurring
 * donation" and the only customer metadata is `harness_id`. But it did write
 * the donor's details onto every *charge* it created:
 *
 *     charge.metadata = {
 *       donor_email, first_name, last_name, harness_id,
 *       charity_id, charity_name, fee_paid_by_donor, harness_platform, ...
 *     }
 *
 * So this reads the charges, lifts the donor identity, and promotes it onto the
 * customer. No Harness export is needed — a Stripe subscription export won't
 * help either, since its "Customer Email"/"Customer Name" columns read the same
 * empty customer fields.
 *
 * Safety:
 *   • Only touches customers that currently have NO email — never overwrites.
 *   • Cross-checks the charge's `harness_id` against the customer's; a mismatch
 *     is skipped, not guessed at.
 *   • If a customer's charges disagree on the email, it is skipped for manual
 *     review rather than picking one.
 *   • Dry run by default.
 *
 * Run:
 *   npx tsx scripts/backfill-harness-donor-emails.ts             # dry run
 *   APPLY=yes npx tsx scripts/backfill-harness-donor-emails.ts   # write
 *
 * Note: once a customer has an email, Stripe will email that donor receipts for
 * future charges (per the account's receipt settings). That is the intended
 * outcome — they currently get nothing — but it is a visible change for them.
 */
import fs from 'node:fs';
import Stripe from 'stripe';

const APPLY = process.env.APPLY === 'yes';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as never });

const maskEmail = (e: string) => {
  const [a, b] = e.split('@');
  if (!b) return '***';
  return `${a.slice(0, 2)}***@${b.slice(0, 1)}***${b.slice(b.lastIndexOf('.'))}`;
};

async function run() {
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — promoting donor identity from charge metadata onto customers\n`);

  const targets: Stripe.Customer[] = [];
  for await (const c of stripe.customers.list({ limit: 100 })) {
    if (!(c.email && c.email.trim())) targets.push(c);
  }
  console.log(`${targets.length} customer(s) with no email.\n`);

  let updated = 0, skipped = 0;

  for (const c of targets) {
    const charges = await stripe.charges.list({ customer: c.id, limit: 100 });
    const emails = new Set<string>();
    const names = new Set<string>();
    const harnessIds = new Set<string>();

    for (const ch of charges.data) {
      const m = ch.metadata ?? {};
      if (m.donor_email?.trim()) emails.add(m.donor_email.trim().toLowerCase());
      const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
      if (name) names.add(name);
      if (m.harness_id?.trim()) harnessIds.add(m.harness_id.trim());
    }

    if (!emails.size) {
      console.log(`  SKIP  ${c.id} — no donor_email on any charge`);
      skipped++; continue;
    }
    if (emails.size > 1) {
      console.log(`  SKIP  ${c.id} — charges disagree on the donor email (${emails.size} distinct); resolve by hand`);
      skipped++; continue;
    }

    const customerHarnessId = c.metadata?.harness_id?.trim();
    if (customerHarnessId && harnessIds.size && !harnessIds.has(customerHarnessId)) {
      console.log(`  SKIP  ${c.id} — charge harness_id does not match the customer's; not guessing`);
      skipped++; continue;
    }

    const email = [...emails][0]!;
    const name = [...names][0];

    const update: Stripe.CustomerUpdateParams = { email };
    if (!c.name && name) update.name = name;

    console.log(`  ${APPLY ? 'SET ' : 'would set'}  ${c.id}  ->  ${maskEmail(email)}${name ? `  (${name.split(' ').map((w) => w[0]).join('.')}.)` : ''}`);
    if (APPLY) await stripe.customers.update(c.id, update);
    updated++;
  }

  console.log(`\n${APPLY ? 'Updated' : 'Would update'} ${updated}; skipped ${skipped}.`);
  if (!APPLY && updated) console.log('Re-run with APPLY=yes to write these to Stripe.');
  if (APPLY && updated) console.log('These donors can now use the Donor Portal login link.');
}

run().catch((err) => { console.error(err); process.exit(1); });
