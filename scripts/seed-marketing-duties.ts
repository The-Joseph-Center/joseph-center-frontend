/**
 * Seeds marketing_duties from jc_marketing_recurring_duties.json.
 *
 * Safe to re-run whenever the file changes. Reference fields — the task, its
 * category, cadence, priority, owner, notes — are owned by the file and are
 * overwritten every time. `status` is NOT, once a person has changed it:
 * re-seeding a roster should not quietly undo somebody's progress. A row whose
 * status has never been touched takes the file's value, so a corrected starting
 * status does land.
 *
 * The script refuses to seed a duty whose access_group is not in the `duties`
 * capability, because such a row is invisible to everyone except an admin and
 * nothing else would say so.
 *
 * Run from frontend/:
 *   npx tsx scripts/seed-marketing-duties.ts             # dry run
 *   APPLY=yes npx tsx scripts/seed-marketing-duties.ts   # write
 */
import fs from 'node:fs';
import { createClient } from '@libsql/client';
import { RULES } from '../../dashboard/src/lib/capabilities';

const APPLY = process.env.APPLY === 'yes';
const SOURCE = '../jc_marketing_recurring_duties.json';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

interface Duty {
  id: string; task: string; category: string; cadence: string; priority: string;
  status: string; status_editable?: boolean; owner?: string | null;
  owner_names?: string[]; title_role?: string | null;
  access_group?: string | null; notes?: string | null; source?: string | null;
}

async function run() {
  const duties = JSON.parse(fs.readFileSync(SOURCE, 'utf8')) as Duty[];

  const allowed = new Set((RULES.duties === '*' ? [] : RULES.duties).map((g) => g.toLowerCase()));
  const orphaned = [...new Set(
    duties.map((d) => d.access_group).filter((g): g is string => !!g && !allowed.has(g.toLowerCase()))
  )];

  const unassigned = duties.filter((d) => !d.access_group);
  const notEditable = duties.filter((d) => d.status_editable !== true);

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — seeding ${duties.length} recurring duties\n`);
  console.log(`  access groups in the data: ${[...new Set(duties.map((d) => d.access_group ?? '(none)'))].join(', ')}`);
  console.log(`  unassigned (admin-only):   ${unassigned.length}  [${unassigned.map((d) => d.id).join(', ')}]`);
  if (notEditable.length) console.log(`  status_editable not true:  ${notEditable.map((d) => d.id).join(', ')}`);

  if (orphaned.length) {
    console.error(`\n  A duty names a group that cannot open the page: ${orphaned.join(', ')}`);
    console.error('  Add it to the `duties` capability in capabilities.ts, or those rows are');
    console.error('  invisible to everyone but an admin.\n');
    process.exit(1);
  }

  const db = createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });
  const before = (await db.execute('SELECT COUNT(*) n FROM marketing_duties')).rows[0] as Record<string, unknown>;
  const touched = (await db.execute('SELECT COUNT(*) n FROM marketing_duties WHERE status_updated_at IS NOT NULL')).rows[0] as Record<string, unknown>;
  console.log(`\n  table holds ${before.n} row(s); ${touched.n} have a human-set status that will be kept.`);

  if (!APPLY) { console.log('\nDry run — nothing written. Re-run with APPLY=yes.'); return; }

  await db.batch(duties.map((d) => ({
    sql: `INSERT INTO marketing_duties
            (id, task, category, cadence, priority, status, owner, owner_names,
             title_role, access_group, notes, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            task = excluded.task, category = excluded.category,
            cadence = excluded.cadence, priority = excluded.priority,
            owner = excluded.owner, owner_names = excluded.owner_names,
            title_role = excluded.title_role, access_group = excluded.access_group,
            notes = excluded.notes, source = excluded.source,
            -- Keep a status somebody has set; take the file's otherwise.
            status = CASE WHEN marketing_duties.status_updated_at IS NULL
                          THEN excluded.status ELSE marketing_duties.status END`,
    args: [
      d.id, d.task, d.category, d.cadence, d.priority, d.status,
      d.owner ?? null, JSON.stringify(d.owner_names ?? []),
      d.title_role ?? null, d.access_group ?? null, d.notes ?? null, d.source ?? null,
    ],
  })), 'write');

  const after = (await db.execute('SELECT COUNT(*) n FROM marketing_duties')).rows[0] as Record<string, unknown>;
  console.log(`\n  table now holds ${after.n} row(s).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
