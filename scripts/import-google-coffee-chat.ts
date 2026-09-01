/**
 * Imports the Coffee Chat with Mona applications collected through Google
 * Forms, before /media/apply existed.
 *
 * These go into coffee_chat_applications rather than an archive table: the
 * site's form was built from this Google Form and asks the same questions, so
 * the rows are genuinely the same shape. Only `source` differs.
 *
 * Notes on the export:
 *   • Multi-select answers are semicolon-joined. That is fine for the short
 *     ones (programs, days, times, contact method) but NOT for the
 *     confirmations checklist — two of its six labels contain a semicolon of
 *     their own ("Scheduling and participation are not guaranteed; sessions may
 *     be rescheduled or declined."), so splitting it invents items that were
 *     never on the form. Every confirmation is required to submit, so the
 *     column is the boolean it was always meant to be and the prose is kept
 *     verbatim in additional_info's place — see expectationsConfirmed below.
 *   • The legal-matters answer carries the form's own parenthetical:
 *     "Yes (Note: if "Yes," we may delay or decline scheduling...)". Only the
 *     leading Yes/No is the answer.
 *   • Timestamps are wall-clock with a "CST" label, which is what Google wrote
 *     regardless of the date. Treated as UTC-6. The applicant's own signature
 *     date agrees with the timestamp date on all three rows, so an hour of DST
 *     drift changes nothing that matters here.
 *   • "Username" is the Google account the form was submitted from, which is
 *     the contact address; the separate "Preferred Contact Email" is only
 *     filled in when it differs.
 *
 * Run from frontend/:
 *   npx tsx scripts/import-google-coffee-chat.ts             # dry run
 *   APPLY=yes npx tsx scripts/import-google-coffee-chat.ts   # write
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@libsql/client';

const APPLY = process.env.APPLY === 'yes';
const CSV = '../form-submissions/Coffee Chat with Mona Form.csv';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** "2026/03/23 7:17:51 AM CST" -> epoch seconds. */
function parseTimestamp(s: string): number | null {
  const m = s.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, ap] = m;
  let hour = Number(hh) % 12;
  if (ap.toUpperCase() === 'PM') hour += 12;
  return Math.floor(Date.UTC(Number(y), Number(mo) - 1, Number(d), hour + 6, Number(mm), Number(ss)) / 1000);
}

const yes = (v: string) => /^yes\b/i.test(v.trim());
const list = (v: string) => v.split(';').map((s) => s.trim()).filter(Boolean);

async function run() {
  const text = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const [header, ...dataRows] = parseCsv(text).filter((r) => r.some((c) => c.trim()));

  // Google's headers are the full question text, so match on a distinctive
  // fragment rather than transcribing sentences that may be reworded later.
  const find = (fragment: string) => {
    const i = header.findIndex((h) => h.toLowerCase().includes(fragment.toLowerCase()));
    if (i === -1) throw new Error(`No column matching "${fragment}"`);
    return i;
  };
  const C = {
    timestamp: find('Timestamp'), username: find('Username'), fullName: find('Full Name'),
    contactEmail: find('Preferred Contact Email'), phone: find('Phone'),
    connection: find('connection to The Joseph Center'), age: find('18 or older'),
    impact: find('how has The Joseph Center'), programs: find('Programs involved'),
    legal: find('legal/court matters'), sensitive: find('do NOT want discussed'),
    recorded: find('comfortable being recorded'), nameDisplay: find('How should we identify'),
    accommodations: find('Accessibility or accommodations'), release: find('Media Release'),
    confirm: find('Please confirm all'), days: find('Best days'), times: find('Best Times'),
    contactMethod: find('Preferred contact method'), additional: find('What else should we know'),
    signature: find('sign electronically'), signatureDate: find('Date'),
  };

  const records = [];
  let badDate = 0;
  for (const r of dataRows) {
    const g = (i: number) => (r[i] ?? '').trim();
    const at = parseTimestamp(g(C.timestamp));
    if (at === null) { badDate++; continue; }
    const email = g(C.username);
    records.push({
      email,
      fullName: g(C.fullName),
      contactEmail: g(C.contactEmail) || null,
      phone: g(C.phone) || null,
      connection: g(C.connection),
      is18: yes(g(C.age)) ? 1 : 0,
      impact: g(C.impact),
      programs: JSON.stringify(list(g(C.programs))),
      legal: yes(g(C.legal)) ? 1 : 0,
      sensitiveTopics: g(C.sensitive) || null,
      recorded: yes(g(C.recorded)) ? 1 : 0,
      nameDisplay: g(C.nameDisplay),
      accommodations: g(C.accommodations) || null,
      // The release is a full sentence beginning "I grant …"; anything else is
      // not a grant.
      release: /^i grant\b/i.test(g(C.release)) ? 1 : 0,
      // Every confirmation is required, so a non-empty answer means all of
      // them. Not split — see the header note.
      confirmed: g(C.confirm) ? 1 : 0,
      days: JSON.stringify(list(g(C.days))),
      times: JSON.stringify(list(g(C.times))),
      contactMethods: JSON.stringify(list(g(C.contactMethod))),
      additional: g(C.additional) || null,
      signature: g(C.signature),
      signatureDate: g(C.signatureDate),
      at,
      key: crypto.createHash('sha256').update(`${g(C.timestamp)}|${email.toLowerCase()}`).digest('hex').slice(0, 32),
    });
  }
  records.sort((a, b) => a.at - b.at);

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — importing Google Forms Coffee Chat applications\n`);
  console.log(`  parsed        ${dataRows.length} rows -> ${records.length} importable${badDate ? ` (${badDate} unparseable timestamps)` : ''}`);
  for (const r of records) {
    console.log(`    ${new Date(r.at * 1000).toISOString().slice(0, 10)}  ${r.connection.padEnd(22)} ` +
      `18+:${r.is18} recorded:${r.recorded} release:${r.release} legal:${r.legal} confirmed:${r.confirmed}  ` +
      `programs=${JSON.parse(r.programs).length} days=${JSON.parse(r.days).length} contact=${JSON.parse(r.contactMethods).length}`);
  }

  const db = createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });
  const before = (await db.execute('SELECT COUNT(*) n FROM coffee_chat_applications')).rows[0] as Record<string, unknown>;
  console.log(`\n  table currently holds ${before.n} row(s).`);

  if (!APPLY) { console.log('\nDry run — nothing written. Re-run with APPLY=yes.'); return; }

  await db.batch(records.map((r) => ({
    sql: `INSERT OR IGNORE INTO coffee_chat_applications
            (email, full_name, contact_email, phone, connection, is_18_plus,
             impact_statement, programs_involved, has_legal_matters, sensitive_topics,
             comfortable_recorded, name_display, accommodations, media_release_granted,
             expectations_confirmed, best_days, best_times, contact_methods,
             additional_info, signature, signature_date, source, import_key, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'google-form', ?, ?)`,
    args: [r.email, r.fullName, r.contactEmail, r.phone, r.connection, r.is18,
           r.impact, r.programs, r.legal, r.sensitiveTopics, r.recorded, r.nameDisplay,
           r.accommodations, r.release, r.confirmed, r.days, r.times, r.contactMethods,
           r.additional, r.signature, r.signatureDate, r.key, r.at],
  })), 'write');

  const after = (await db.execute('SELECT COUNT(*) n FROM coffee_chat_applications')).rows[0] as Record<string, unknown>;
  console.log(`\n  table now holds ${after.n} row(s) (+${Number(after.n) - Number(before.n)}).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
