-- Seed file for the donations module's `campaigns` and `spotlights` tables.
-- Fill in the placeholders (look for <<…>>), then run:
--
--   turso db shell main-jc < db/seeds/seed-campaigns.sql
--
-- Open questions for Mona this needs answers to before running:
--   • $600k campaign — public goal? public timeline? show on home + donate?
--   • Golden Girls beds campaign — public goal? show on /programs/golden-girls?
--   • Are there any external-platform spotlights (e.g. Colorado Gives) live
--     right now that should appear below the donate form?
--
-- This file is idempotent ONLY for fresh rows — re-running will INSERT
-- duplicates unless you change the slugs. The `slug` column has a UNIQUE
-- constraint so duplicate slugs are rejected, which is the cheap guard.
--
-- ── Conventions ─────────────────────────────────────────────────────────
--   • Money is in CENTS. $600,000 = 60000000.
--   • Dates are ISO YYYY-MM-DD strings.
--   • program_id is the Sanity program document _id, e.g.
--       'program-day-shelter'
--       'program-food-pantry'
--       'program-golden-girls'
--       'program-financial-services'
--       'program-family-center'
--     Leave NULL for org-wide campaigns that show on the home page.
--   • active=1 makes the campaign visible; active=0 keeps it as a draft.
--   • show_progress=1 shows the progress bar and raised/goal amounts;
--     show_progress=0 shows just the name + description (no bar).

-- ─── Campaigns ──────────────────────────────────────────────────────────

-- $600k org-wide campaign (placeholder values — confirm with Mona)
INSERT INTO campaigns
  (name, slug, description, goal_cents, raised_cents, program_id, active, show_progress, start_date, end_date)
VALUES
  ('<<Campaign name — e.g. "2026 Operating Fund">>',
   'operating-fund-2026',
   '<<One-sentence description shown above the progress bar.>>',
   60000000,    -- $600,000 in cents
   0,           -- starting raised; the webhook will increment as gifts arrive
   NULL,        -- org-wide → no program_id
   1,           -- active
   1,           -- show_progress
   '2026-01-01',
   '2026-12-31');

-- Golden Girls beds campaign (placeholder values — confirm with Mona)
INSERT INTO campaigns
  (name, slug, description, goal_cents, raised_cents, program_id, active, show_progress, start_date, end_date)
VALUES
  ('<<Campaign name — e.g. "16 Beds for Golden Girls">>',
   'golden-girls-beds',
   '<<Short ask explaining what the beds enable.>>',
   <<goal in cents, e.g. 4000000 for $40,000>>,
   0,
   'program-golden-girls',
   1,
   1,
   '<<start ISO date>>',
   '<<end ISO date or NULL>>');

-- ─── Spotlights (optional) ──────────────────────────────────────────────
-- A spotlight is a CALLOUT to an external giving platform (Colorado Gives,
-- Facebook Fundraiser, etc.). Only ONE active spotlight is shown at a time
-- (most recent active row wins). Leave commented out if none active.
--
-- INSERT INTO spotlights
--   (platform_name, headline, description, link_url, active, start_date, end_date)
-- VALUES
--   ('Colorado Gives',
--    'Double your impact December 9',
--    'For Colorado Gives Day every dollar through this platform is matched up to $5,000.',
--    'https://www.coloradogives.org/organization/JosephCenter',
--    1,
--    '2026-12-01',
--    '2026-12-10');
