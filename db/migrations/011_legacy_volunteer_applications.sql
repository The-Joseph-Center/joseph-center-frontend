-- The volunteer applications collected by the previous site's form
-- (2022-11 → 2026-08).
--
-- This is deliberately its own table rather than rows in volunteer_submissions.
-- The old form was a full application — reason for volunteering, expected
-- benefit, qualifications, employment summary and up to three prior positions
-- with dates and responsibilities. The current form asks for none of that.
-- Forcing 86 rich applications into today's narrower shape would mean throwing
-- most of each one away, and widening the live table with ten columns that only
-- ever apply to archived rows would make every new submission look incomplete.
--
-- So: same inbox, separate table, shown under "Past forms".
CREATE TABLE IF NOT EXISTS legacy_volunteer_applications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  -- JSON array of the areas asked about, as department names.
  locations      TEXT,
  -- JSON object of day -> time slot, omitting days marked "none".
  availability   TEXT,
  reason         TEXT,
  benefit        TEXT,
  qualifications TEXT,
  employment     TEXT,
  -- JSON array of { organization, begin, end, responsibilities }.
  work_history   TEXT,
  additional     TEXT,
  import_key     TEXT,
  submitted_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS legacy_volunteer_submitted_idx
  ON legacy_volunteer_applications (submitted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS legacy_volunteer_import_key_idx
  ON legacy_volunteer_applications (import_key) WHERE import_key IS NOT NULL;
