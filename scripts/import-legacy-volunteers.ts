/**
 * Imports the previous site's volunteer applications into
 * legacy_volunteer_applications.
 *
 * The old form was a full application — why they want to volunteer, what they
 * hope to gain, qualifications, an employment summary and up to three prior
 * positions with dates and responsibilities. The current form asks for a name,
 * an area and an availability grid. The two are different enough that the
 * archive gets its own table and appears under "Past forms" in the inbox
 * rather than being flattened into today's shape.
 *
 * Field mapping worth knowing about:
 *   • volunteerlocation arrives either as a JSON array of sentences or as one
 *     bare sentence. Both become an array of plain area names — the stored
 *     value was "I would like to work in the Day Shelter.", which is a form
 *     label, not an answer worth reading 86 times.
 *   • the six day columns hold "9to12", "12to3" or "none". Days marked none
 *     are dropped rather than stored as a negative.
 *   • an employment slot whose organisation is blank or a placeholder ("n/a",
 *     "none") is not a job and is not kept.
 *
 * ip, user_agent and referrer are not imported, as with the contact archive.
 *
 * Idempotent via import_key, a hash of the submission timestamp and email.
 *
 * Run from frontend/:
 *   npx tsx scripts/import-legacy-volunteers.ts             # dry run
 *   APPLY=yes npx tsx scripts/import-legacy-volunteers.ts   # write
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@libsql/client';

const APPLY = process.env.APPLY === 'yes';
const CSV = '../form-submissions/volunteer-form.csv';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const PLACEHOLDER = /^(n\/?a|none|no|nil|-+|x+|\.)$/i;

/** RFC-4180 enough: the free-text answers carry commas, quotes and newlines. */
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

/** "I would like to work in the Day Shelter." -> "Day Shelter" */
function areaName(sentence: string): string {
  return sentence
    .trim()
    .replace(/^I would like to work in the\s+/i, '')
    .replace(/\.\s*$/, '')
    .trim();
}

function parseLocations(raw: string): string[] {
  const v = raw.trim();
  if (!v) return [];
  if (v.startsWith('[')) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((s) => areaName(String(s))).filter(Boolean))];
      }
    } catch { /* fall through to treating it as one sentence */ }
  }
  const one = areaName(v);
  return one ? [one] : [];
}

async function run() {
  const text = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const [header, ...dataRows] = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

  const seen = new Set<string>();
  const records = [];
  let badDate = 0, dupeInFile = 0, jobsKept = 0, jobsDropped = 0, noArea = 0;
  const areaTally: Record<string, number> = {};

  for (const r of dataRows) {
    const get = (k: string) => (r[col[k]] ?? '').trim();
    const created = new Date(get('created_at'));
    if (Number.isNaN(created.getTime())) { badDate++; continue; }

    const email = get('email');
    const key = crypto.createHash('sha256')
      .update(`${get('created_at')}|${email.toLowerCase()}`).digest('hex').slice(0, 32);
    if (seen.has(key)) { dupeInFile++; continue; }
    seen.add(key);

    const locations = parseLocations(get('volunteerlocation'));
    if (!locations.length) noArea++;
    for (const a of locations) areaTally[a] = (areaTally[a] ?? 0) + 1;

    const availability: Record<string, string> = {};
    for (const d of DAYS) {
      const slot = get(d).toLowerCase();
      if (slot && slot !== 'none') availability[d] = slot;
    }

    const history = [];
    for (const i of [1, 2, 3]) {
      const org = get(`organization${i}`);
      if (!org || PLACEHOLDER.test(org)) { if (org) jobsDropped++; continue; }
      history.push({
        organization: org,
        begin: get(`beginDate${i}`) || null,
        end: get(`endDate${i}`) || null,
        responsibilities: get(`responsibilities${i}`) || null,
      });
      jobsKept++;
    }

    records.push({
      name: `${get('firstName')} ${get('lastName')}`.trim(),
      email,
      phone: get('phone') || null,
      locations: locations.length ? JSON.stringify(locations) : null,
      availability: Object.keys(availability).length ? JSON.stringify(availability) : null,
      reason: get('reason') || null,
      benefit: get('benefit') || null,
      qualifications: get('qualifications') || null,
      employment: get('employment') || null,
      workHistory: history.length ? JSON.stringify(history) : null,
      additional: get('addlComments') || null,
      submittedAt: Math.floor(created.getTime() / 1000),
      key,
    });
  }

  records.sort((a, b) => a.submittedAt - b.submittedAt);

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — importing previous-form volunteer applications\n`);
  console.log(`  parsed          ${dataRows.length} CSV rows -> ${records.length} importable`);
  if (dupeInFile) console.log(`  duplicates in file, skipped:  ${dupeInFile}`);
  if (badDate) console.log(`  unparseable created_at:       ${badDate}`);
  console.log(`  no area selected:             ${noArea}`);
  console.log(`  prior positions kept:         ${jobsKept}  (placeholder entries dropped: ${jobsDropped})`);
  const first = records[0], last = records[records.length - 1];
  console.log(`  date range      ${new Date(first.submittedAt * 1000).toISOString().slice(0, 10)} -> ${new Date(last.submittedAt * 1000).toISOString().slice(0, 10)}`);
  console.log('\n  areas:');
  for (const [a, n] of Object.entries(areaTally).sort((x, y) => y[1] - x[1])) console.log(`    ${String(n).padStart(4)}  ${a}`);

  const db = createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });
  const before = (await db.execute('SELECT COUNT(*) n FROM legacy_volunteer_applications')).rows[0] as Record<string, unknown>;
  console.log(`\n  table currently holds ${before.n} row(s).`);

  if (!APPLY) { console.log('\nDry run — nothing written. Re-run with APPLY=yes.'); return; }

  await db.batch(records.map((r) => ({
    sql: `INSERT OR IGNORE INTO legacy_volunteer_applications
            (name, email, phone, locations, availability, reason, benefit,
             qualifications, employment, work_history, additional, import_key, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [r.name, r.email, r.phone, r.locations, r.availability, r.reason, r.benefit,
           r.qualifications, r.employment, r.workHistory, r.additional, r.key, r.submittedAt],
  })), 'write');

  const after = (await db.execute('SELECT COUNT(*) n FROM legacy_volunteer_applications')).rows[0] as Record<string, unknown>;
  console.log(`\n  table now holds ${after.n} row(s) (+${Number(after.n) - Number(before.n)}).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
