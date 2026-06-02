-- Coffee Chat with Mona — guest applications (multi-step form at /media/apply).
--
-- Run once against the Turso DB:
--   turso db shell <db-name> < db/migrations/004_coffee_chat_applications.sql

CREATE TABLE IF NOT EXISTS coffee_chat_applications (
  id                     TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  -- Section 1: Contact
  email                  TEXT NOT NULL,
  -- Section 2: About You
  full_name              TEXT NOT NULL,
  contact_email          TEXT,
  phone                  TEXT,
  connection             TEXT NOT NULL,
  is_18_plus             INTEGER NOT NULL DEFAULT 0,
  -- Section 3: Your Story
  impact_statement       TEXT NOT NULL,
  programs_involved      TEXT NOT NULL,    -- JSON array
  has_legal_matters      INTEGER NOT NULL DEFAULT 0,
  sensitive_topics       TEXT,
  -- Section 4: On-Camera Readiness
  comfortable_recorded   INTEGER NOT NULL DEFAULT 0,
  name_display           TEXT NOT NULL,
  accommodations         TEXT,
  -- Section 5: Media Release
  media_release_granted  INTEGER NOT NULL DEFAULT 0,
  -- Section 6: Expectations (all checked = 1)
  expectations_confirmed INTEGER NOT NULL DEFAULT 0,
  -- Section 7: Scheduling
  best_days              TEXT,             -- JSON array
  best_times             TEXT,             -- JSON array
  contact_methods        TEXT NOT NULL,    -- JSON array
  -- Section 8: Anything Else
  additional_info        TEXT,
  -- Section 9: Consent & Signature
  signature              TEXT NOT NULL,
  signature_date         TEXT NOT NULL,
  -- Meta
  submitted_at           INTEGER NOT NULL DEFAULT (unixepoch())
);
