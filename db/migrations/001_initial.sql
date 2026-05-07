-- Initial Turso schema for Growth-tier client.
-- Run with: turso db shell <db-name> < db/migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS volunteer_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  departments TEXT, -- JSON array
  availability TEXT, -- JSON object
  additional_info TEXT,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS referral_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  referrer_name TEXT NOT NULL,
  referrer_email TEXT NOT NULL,
  referrer_phone TEXT,
  agency TEXT,
  individual_first_name TEXT NOT NULL,
  individual_last_name TEXT NOT NULL,
  preferred_name TEXT,
  dob TEXT,
  reason TEXT,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  form_slug TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON blob of field values
  email TEXT,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  event_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  party_size INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- cents
  frequency TEXT NOT NULL, -- one-time | monthly | annual
  donor_email TEXT,
  donor_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
