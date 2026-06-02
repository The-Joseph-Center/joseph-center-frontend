-- Adds the letter_requests table for the Personal Letter from Mona form.
-- Run once against the Turso DB:
--   turso db shell <db-name> < db/migrations/002_personal_letter.sql

CREATE TABLE IF NOT EXISTS letter_requests (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  street       TEXT NOT NULL,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL DEFAULT 'CO',
  zip          TEXT NOT NULL,
  email        TEXT NOT NULL,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);
