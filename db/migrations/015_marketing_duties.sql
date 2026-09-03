-- The recurring marketing and social-media duties, as a reference list.
--
-- This is a different shape from every other table here: the rest hold things
-- the public submitted, where this holds an internal roster of standing work.
-- It is seeded from jc_marketing_recurring_duties.json and re-seeded when that
-- file changes, so everything except the status is reference data owned by the
-- file rather than by the dashboard.
--
-- Only `status` is editable, which is why it is the only column with
-- attribution beside it. status_updated_by/at follow the naming already used by
-- submission_followups (updated_by/updated_at) and letter_log (written_by/at).
--
-- access_group is the Okta group that may see the row. NULL means nobody has
-- been assigned yet, and those rows are visible to dashboard admins only —
-- unassigned must not mean unrestricted.
CREATE TABLE IF NOT EXISTS marketing_duties (
  id                TEXT PRIMARY KEY,
  task              TEXT NOT NULL,
  category          TEXT NOT NULL,
  cadence           TEXT NOT NULL,
  priority          TEXT NOT NULL,
  status            TEXT NOT NULL,
  owner             TEXT,
  -- JSON array; some duties are jointly owned.
  owner_names       TEXT NOT NULL DEFAULT '[]',
  title_role        TEXT,
  access_group      TEXT,
  notes             TEXT,
  source            TEXT,
  status_updated_by TEXT,
  status_updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS marketing_duties_access_idx ON marketing_duties (access_group);
