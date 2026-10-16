-- A finished month, written once and kept.
--
-- A report is a snapshot, not a query. Simple Analytics keeps settling the
-- last days of a month for a while, Stripe refunds land after the fact, and
-- "how did September go" should have one answer that Mona can read, print and
-- come back to — not a number that quietly changes between the board meeting
-- and the follow-up.
--
-- The whole report is JSON in `data` rather than a column per figure: the
-- shape will grow (newsletter performance, giving, whatever next year needs)
-- and none of it is ever queried across months by SQL. What IS queried — which
-- months exist, in what order — is the month column, which is 'YYYY-MM' so it
-- sorts chronologically as text.
CREATE TABLE IF NOT EXISTS site_reports (
  month       TEXT PRIMARY KEY,
  data        TEXT NOT NULL,
  built_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  built_by    TEXT
);

-- Speed and quality tests, kept separately because they are taken on their own
-- schedule and a month's report picks the first one taken during that month.
-- A test cannot be run for a past date, so months before the first test simply
-- have no speed section — better than a blank one implying a bad score.
CREATE TABLE IF NOT EXISTS site_checks (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  kind        TEXT NOT NULL,            -- 'lighthouse'
  device      TEXT NOT NULL,            -- 'phone' | 'computer'
  data        TEXT NOT NULL,            -- JSON: the scores and measurements
  checked_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS site_checks_kind_idx ON site_checks (kind, checked_at DESC);
