/**
 * Imports the Netlify contact-form archive (2022-09 → 2026-08) into
 * `contact_messages`, so the dashboard inbox holds the whole history rather
 * than only what has arrived since launch.
 *
 * Source: contact-form.csv at the repo root — 1,353 submissions exported from
 * the old form, columns:
 *   name, email, phone, smsConsent, program, message, ip, user_agent, referrer, created_at
 *
 * Deliberately NOT imported:
 *   • ip / user_agent / referrer — personal data with no use in the inbox. The
 *     CSV keeps them if they are ever needed; the database does not need them.
 *   • smsConsent is recorded on the row but NOT added to `sms_subscribers`.
 *     Consent given on a different form, up to four years ago, is not consent
 *     to be texted today. Turning 44 old checkboxes into a live SMS list is a
 *     compliance decision, and it is the Joseph Center's to make, not this
 *     script's.
 *
 * Nothing is filtered as spam. The obvious junk is only ~2% of the file, and
 * the same crude test flags a National History Day request and a trail-race
 * volunteer director — real people writing in. Deleting on that basis loses
 * more than it saves, so everything lands and the inbox's own search decides.
 *
 * Idempotent: every row carries `import_key`, a hash of the original
 * timestamp + email + message, behind a unique index. Re-running inserts
 * nothing it has already inserted.
 *
 * Run from frontend/:
 *   npx tsx scripts/import-legacy-contact-messages.ts             # dry run
 *   APPLY=yes npx tsx scripts/import-legacy-contact-messages.ts   # write
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@libsql/client';

const APPLY = process.env.APPLY === 'yes';
const CSV = '../contact-form.csv';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

/**
 * The form's program list was re-labelled twice over four years, so the same
 * program appears under two names. Merging them is what makes the field worth
 * having — otherwise IFS looks like two smaller programs. Only unambiguous
 * pairs are merged; anything unrecognised passes through untouched.
 */
const PROGRAM_ALIASES: Record<string, string> = {
  'integrated financial services': 'Financial Services',
  'the golden girls project': 'Golden Girls Project',
  'the joseph center outreach': 'Outreach',
};

function normalizeProgram(raw: string): string | null {
  const v = (raw || '').trim();
  // "nopreference" is the form's placeholder option, not a program.
  if (!v || v.toLowerCase() === 'nopreference') return null;
  return PROGRAM_ALIASES[v.toLowerCase()] ?? v;
}

/** A minimal RFC-4180 parser: the messages contain commas, quotes and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function run() {
  // CRLF is normalised across the whole file before parsing: inside a quoted
  // message it is the writer's own line break and should be stored as \n, and
  // between records it is the separator. Either way the \r is noise.
  const text = fs.readFileSync(CSV, 'utf8').replace(/^\ufeff/, '').replace(/\r\n/g, '\n');
  const [header, ...dataRows] = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

  const seen = new Set<string>();
  const records = [];
  let blankEmail = 0, blankMessage = 0, badDate = 0, dupeInFile = 0;

  for (const r of dataRows) {
    const get = (k: string) => (r[col[k]] ?? '').trim();
    const created = new Date(get('created_at'));
    if (Number.isNaN(created.getTime())) { badDate++; continue; }

    const email = get('email'), message = get('message');
    if (!email) blankEmail++;
    if (!message) blankMessage++;

    const key = crypto.createHash('sha256')
      .update(`${get('created_at')}|${email.toLowerCase()}|${message}`).digest('hex').slice(0, 32);
    if (seen.has(key)) { dupeInFile++; continue; }
    seen.add(key);

    records.push({
      name: get('name'), email, phone: get('phone') || null, message,
      program: normalizeProgram(get('program')),
      smsConsent: get('smsConsent').toLowerCase() === 'on' ? 1 : 0,
      submittedAt: Math.floor(created.getTime() / 1000),
      key,
    });
  }

  // Oldest first, so ids run in the same direction as time.
  records.sort((a, b) => a.submittedAt - b.submittedAt);

  const byProgram = new Map<string, number>();
  for (const r of records) byProgram.set(r.program ?? '(none given)', (byProgram.get(r.program ?? '(none given)') ?? 0) + 1);

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — importing legacy contact messages\n`);
  console.log(`  parsed         ${dataRows.length} CSV rows -> ${records.length} importable`);
  if (dupeInFile) console.log(`  duplicates within the file, skipped: ${dupeInFile}`);
  if (badDate) console.log(`  unparseable created_at, skipped:     ${badDate}`);
  console.log(`  blank email (stored as empty):       ${blankEmail}`);
  console.log(`  blank message (stored as empty):     ${blankMessage}`);
  console.log(`  sms consent recorded (not actioned): ${records.filter((r) => r.smsConsent).length}`);
  const first = records[0], last = records[records.length - 1];
  console.log(`  date range     ${new Date(first.submittedAt * 1000).toISOString().slice(0, 10)} -> ${new Date(last.submittedAt * 1000).toISOString().slice(0, 10)}`);
  console.log('\n  program:');
  for (const [p, n] of [...byProgram].sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(5)}  ${p}`);

  const db = createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });

  const before: any = (await db.execute('SELECT COUNT(*) n FROM contact_messages')).rows[0];
  console.log(`\n  table currently holds ${before.n} row(s).`);

  if (!APPLY) {
    console.log('\nDry run — nothing written. Re-run with APPLY=yes to import.');
    return;
  }

  const SQL = `INSERT OR IGNORE INTO contact_messages
    (name, email, phone, message, program, sms_consent, source, import_key, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, 'netlify-legacy', ?, ?)`;

  for (let i = 0; i < records.length; i += 100) {
    const chunk = records.slice(i, i + 100);
    await db.batch(chunk.map((r) => ({
      sql: SQL,
      args: [r.name, r.email, r.phone, r.message, r.program, r.smsConsent, r.key, r.submittedAt],
    })), 'write');
    process.stdout.write(`\r  inserted ${Math.min(i + 100, records.length)}/${records.length}`);
  }

  const after: any = (await db.execute('SELECT COUNT(*) n FROM contact_messages')).rows[0];
  console.log(`\n\n  table now holds ${after.n} row(s) (+${Number(after.n) - Number(before.n)}).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
