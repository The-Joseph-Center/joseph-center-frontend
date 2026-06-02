-- Stay Connected combined opt-in (email newsletter + SMS).
-- Column names match the Harness CSV template so Mona can export and
-- upload without reformatting.
--
-- Run once against the Turso DB:
--   turso db shell <db-name> < db/migrations/003_sms_subscribers.sql

CREATE TABLE IF NOT EXISTS sms_subscribers (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT,
  email_consent INTEGER NOT NULL DEFAULT 0,   -- 1 = yes, 0 = no
  phone_number  TEXT,
  sms_consent   INTEGER NOT NULL DEFAULT 0,   -- 1 = yes, 0 = no
  list          TEXT DEFAULT 'general',       -- tag for Harness upload
  source        TEXT,                         -- e.g. 'stay-connected-page', 'events-section'
  subscribed_at INTEGER NOT NULL DEFAULT (unixepoch())
);
