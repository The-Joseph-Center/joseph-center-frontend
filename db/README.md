# The database, and why its migrations live here

There is **one** Turso database, shared by both repos:

- **frontend** — the public forms write to it (contact, volunteer, partner, letter requests, event registration).
- **dashboard** — reads and writes the same tables, plus its own: newsletters, marketing duties, duty interest, staff identity, submission follow-ups.

Every migration lives in `frontend/db/migrations`, numbered in order, and the
runner is `frontend/scripts/apply-migration.ts`. That includes migrations for
tables only the dashboard uses — `009_newsletters.sql` and
`019_newsletter_workbench.sql` are newsletter-tool tables, applied from here.

**This is deliberate, and it surprises people, so:** the public forms were built
first, so the folder started here and every migration since has followed. The
alternative — each repo owning the migrations for its own tables — splits the
numbering across two places and makes "which migrations have been applied?" a
question you cannot answer by looking in one directory. That question has
already cost us once: migrations 001–004 sat unapplied while five public forms
returned 500s, because the DB write comes before the confirmation email and a
failed write loses the submission entirely.

So: **one home, one sequence, regardless of which repo the code lives in.**

## Applying a migration

```
cd frontend
npx tsx scripts/apply-migration.ts 019_newsletter_workbench.sql             # preview
APPLY=yes npx tsx scripts/apply-migration.ts 019_newsletter_workbench.sql   # run
```

`ALTER TABLE ADD COLUMN` has no `IF NOT EXISTS`, so the runner treats
"column already exists" as already-applied and skips it. Everything else still
throws. That makes any file safe to run twice.

## Writing one

- Number it next in sequence and name it for what it does.
- Say in a comment at the top *why* the change is needed, not just what it adds.
- Prefer `CREATE TABLE IF NOT EXISTS` and additive `ALTER TABLE`; a migration
  that drops or rewrites data needs a backup taken first (`joseph-center/backups/`).
- Deploy order should not matter. Code that depends on a new column should cope
  with the column not being there yet — see the `workbench` fallback in
  `dashboard/netlify/functions/admin-newsletter.ts` — so a deploy landing before
  a migration cannot lose someone's work.

## Related scripts

| Script | Repo | What it does |
|---|---|---|
| `scripts/apply-migration.ts` | frontend | Applies one migration file |
| `db/seed.ts` | frontend | Connection test against Turso |
| `db/seeds/` | frontend | Seed data |
| `scripts/backfill-newsletters.ts` | dashboard | One-off: February–August 2026 newsletter records from AWeber |
| `scripts/sync-staff-identity.ts` | dashboard | Keeps staff identity rows in step with Okta |
