-- One-off campaign emails: Giving Tuesday, a year-end appeal, Angel Tree.
--
-- Separate from `newsletters` on purpose. A newsletter is one row per month
-- with a fixed five-section shape and three tier versions of the same copy; a
-- campaign email is one short block per tier, dated to a day rather than a
-- month, and there may be two in a month or none for half a year. Forcing the
-- second into the first would mean a `newsletters` row with no guest, no
-- program, no videos and no stats, and every check in the newsletter review
-- firing on all of it.
--
-- `slug` is the primary key rather than a date, because the campaign is the
-- thing that recurs: `giving-tuesday-2026` and `giving-tuesday-2027` are two
-- rows, and next year's starts as a copy of this year's rather than from
-- nothing. It is also what the donation link's `?campaign=` carries, so the
-- email and the tracking row in `campaigns` can be lined up by eye.
--
-- `variants` holds the per-tier copy as JSON — subject, preview text and body
-- for community-friend, donor and recurring-donor — because which tiers exist
-- and what each one's signature is belongs to the code (TIERS in
-- _lib/newsletter.ts), not to a column that would drift from it.

CREATE TABLE IF NOT EXISTS campaign_emails (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT '',
  -- 'YYYY-MM-DD'. Documentation: nothing here schedules anything, and the
  -- send stays a person in AWeber.
  send_date     TEXT NOT NULL DEFAULT '',
  -- The one link every button points at, campaign parameter included.
  link          TEXT NOT NULL DEFAULT '',
  button_label  TEXT NOT NULL DEFAULT '',
  -- JSON: { "<tier id>": { subject, previewText, body } }
  variants      TEXT NOT NULL DEFAULT '{}',
  -- JSON: notes, the subject lines not chosen, and review items set aside.
  workbench     TEXT NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft',
  sent_at       INTEGER,
  updated_by    TEXT,
  updated_at    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS campaign_emails_send_date ON campaign_emails (send_date DESC);
