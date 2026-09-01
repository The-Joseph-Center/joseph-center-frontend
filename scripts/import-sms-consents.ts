/**
 * Adds the SMS consents from the imported contact-form archive to
 * sms_subscribers.
 *
 * Source is contact_messages (sms_consent = 1) rather than the CSV, because the
 * archive import already landed those rows and the database is now the record.
 *
 * On the consent itself: every one of these was given in 2026 — the checkbox
 * was only added to the old form late in its life — so none is stale. The
 * original consent timestamp is carried over as subscribed_at rather than
 * being stamped with today's date, because when someone agreed is the whole
 * point of the record.
 *
 * What is skipped, and why:
 *   • no phone number — nothing to text.
 *   • a number that is not a valid 10-digit US number. One is 9 digits, one is
 *     25, two carry a leading 1 (kept, normalised). A number that cannot be
 *     dialled is not a subscriber, and guessing at a digit is worse than
 *     leaving it out.
 *   • a number already in sms_subscribers.
 *
 * Where a number appears more than once, the most recent consent wins: a later
 * submission re-affirms it.
 *
 * email_consent is 0 for every row. The old form asked about texts, not about
 * the newsletter, and the two are separate agreements.
 *
 * Run from frontend/:
 *   npx tsx scripts/import-sms-consents.ts             # dry run
 *   APPLY=yes npx tsx scripts/import-sms-consents.ts   # write
 */
import fs from 'node:fs';
import { createClient } from '@libsql/client';

const APPLY = process.env.APPLY === 'yes';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

/** Returns a 10-digit NANP number, or null if the input cannot be one. */
function normalizePhone(raw: unknown): string | null {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return null;
  // Area code and exchange may not begin with 0 or 1.
  if (/^[01]/.test(d) || /^[01]/.test(d.slice(3))) return null;
  return d;
}

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
};

async function run() {
  const db = createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });

  const consents = await db.execute(
    'SELECT name, email, phone, submitted_at FROM contact_messages WHERE sms_consent = 1 ORDER BY submitted_at ASC'
  );

  const existing = new Set(
    (await db.execute('SELECT phone_number FROM sms_subscribers')).rows
      .map((r) => normalizePhone((r as Record<string, unknown>).phone_number))
      .filter((p): p is string => !!p)
  );

  // Most recent consent per number wins — the ascending sort means a later row
  // overwrites an earlier one.
  const byPhone = new Map<string, { first: string; last: string; email: string; at: number }>();
  let noPhone = 0, unusable = 0;

  for (const row of consents.rows as unknown as Record<string, unknown>[]) {
    const raw = String(row.phone ?? '').trim();
    if (!raw) { noPhone++; continue; }
    const phone = normalizePhone(raw);
    if (!phone) { unusable++; continue; }
    const { first, last } = splitName(String(row.name ?? ''));
    byPhone.set(phone, { first, last, email: String(row.email ?? '').trim(), at: Number(row.submitted_at) });
  }

  const fresh = [...byPhone.entries()].filter(([p]) => !existing.has(p));
  const alreadyThere = byPhone.size - fresh.length;

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — adding archived SMS consents to sms_subscribers\n`);
  console.log(`  consents in the archive        ${consents.rows.length}`);
  console.log(`  no phone number, skipped       ${noPhone}`);
  console.log(`  unusable phone number, skipped ${unusable}`);
  console.log(`  distinct usable numbers        ${byPhone.size}`);
  console.log(`  already subscribed, skipped    ${alreadyThere}`);
  console.log(`  to add                         ${fresh.length}`);

  const years: Record<string, number> = {};
  for (const [, v] of fresh) {
    const y = String(new Date(v.at * 1000).getUTCFullYear());
    years[y] = (years[y] ?? 0) + 1;
  }
  console.log(`  consent given in               ${JSON.stringify(years)}`);

  if (!APPLY) { console.log('\nDry run — nothing written. Re-run with APPLY=yes.'); return; }

  await db.batch(fresh.map(([phone, v]) => ({
    sql: `INSERT INTO sms_subscribers
            (first_name, last_name, email, email_consent, phone_number, sms_consent, list, source, subscribed_at)
          VALUES (?, ?, ?, 0, ?, 1, 'general', 'contact-form-archive', ?)`,
    args: [v.first, v.last, v.email, phone, v.at],
  })), 'write');

  const after = await db.execute('SELECT COUNT(*) n FROM sms_subscribers');
  console.log(`\n  sms_subscribers now holds ${(after.rows[0] as Record<string, unknown>).n} row(s).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
