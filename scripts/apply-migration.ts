/**
 * Applies one migration file from db/migrations to the Turso database.
 *
 * The first nine migrations were applied by hand, which is fine once and
 * error-prone by the tenth. This does the same thing repeatably.
 *
 * `ALTER TABLE ADD COLUMN` has no IF NOT EXISTS, so a re-run would fail on a
 * column that is already there. That specific error is treated as "already
 * applied" and skipped, which makes the whole file safe to run twice —
 * everything else still throws.
 *
 * Run from frontend/:
 *   npx tsx scripts/apply-migration.ts 010_contact_messages_legacy.sql             # preview
 *   APPLY=yes npx tsx scripts/apply-migration.ts 010_contact_messages_legacy.sql   # run
 */
import fs from 'node:fs';
import { createClient } from '@libsql/client';

const APPLY = process.env.APPLY === 'yes';
const file = process.argv[2];
if (!file) { console.error('Usage: npx tsx scripts/apply-migration.ts <file.sql>'); process.exit(1); }

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

async function run() {
  const sql = fs.readFileSync(`db/migrations/${file}`, 'utf8');
  // Comments are stripped BEFORE splitting on ';' — a semicolon inside a
  // comment sentence would otherwise cut the line in two and leave its tail
  // sitting in front of the next statement.
  const statements = sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`${APPLY ? 'APPLY' : 'PREVIEW'} — ${file}: ${statements.length} statement(s)\n`);
  for (const s of statements) console.log(`  ${s.replace(/\s+/g, ' ').slice(0, 100)}`);

  if (!APPLY) { console.log('\nPreview only. Re-run with APPLY=yes.'); return; }

  const db = createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });
  let applied = 0, already = 0;
  for (const s of statements) {
    try { await db.execute(s); applied++; }
    catch (e: any) {
      if (/duplicate column name/i.test(e?.message ?? '')) { already++; continue; }
      throw e;
    }
  }
  console.log(`\n  applied ${applied}, already present ${already}.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
