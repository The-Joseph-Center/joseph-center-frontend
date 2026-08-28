-- The monthly newsletter, as a working document.
--
-- Built over several sittings from content that arrives at different times —
-- transcripts early, stats late — so it has to survive being half-finished.
-- Kept here rather than in Sanity because none of it is website content: it is
-- an operational record of what was sent, to whom, under which AWeber tag.
--
-- One row per month. `month` is 'YYYY-MM' so ordering is chronological without
-- parsing, and the UNIQUE index is what makes a reused monthly tag impossible —
-- the error the process document calls out as recurring.
CREATE TABLE IF NOT EXISTS newsletters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  month         TEXT NOT NULL,
  guest_name    TEXT,
  guest_frame   TEXT,           -- 'guest' (before/support/transformation) or 'calling'
  program       TEXT,
  aweber_tag    TEXT,
  section1      TEXT,
  section2      TEXT,
  stats         TEXT,           -- JSON: the numbers, entered not estimated
  videos        TEXT,           -- JSON: [{title, url, kind}]
  partners      TEXT,           -- JSON: this quarter's foundation partners
  preview_text  TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft | sent
  sent_at       INTEGER,
  updated_by    TEXT,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletters_month_idx ON newsletters (month);
