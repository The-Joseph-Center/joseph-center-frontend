-- Phase 2 donation flow tables — replaces the placeholder `donations` table
-- created in 001_initial.sql with a normalized donor/donation/campaign
-- schema per build-record/jc-donation-flow-implementation.md.
--
-- The 001 placeholder was never written to (Stripe scaffolds returned 501
-- until VITE_DONATION_PROVIDER=stripe), so dropping it is safe.

DROP TABLE IF EXISTS donations;

CREATE TABLE IF NOT EXISTS donors (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  street      TEXT,
  city        TEXT,
  state       TEXT,
  zip         TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS donors_email_idx ON donors(email);

CREATE TABLE IF NOT EXISTS campaigns (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  goal_cents    INTEGER,
  raised_cents  INTEGER NOT NULL DEFAULT 0,
  program_id    TEXT, -- optional pointer to a Sanity program _id (e.g. "program-golden-girls")
  active        INTEGER NOT NULL DEFAULT 1, -- SQLite boolean
  show_progress INTEGER NOT NULL DEFAULT 1,
  start_date    TEXT, -- ISO date string
  end_date      TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS campaigns_slug_idx ON campaigns(slug);
CREATE INDEX IF NOT EXISTS campaigns_active_idx ON campaigns(active);

CREATE TABLE IF NOT EXISTS spotlights (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  platform_name TEXT NOT NULL,
  headline      TEXT NOT NULL,
  description   TEXT,
  link_url      TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  start_date    TEXT,
  end_date      TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS spotlights_active_idx ON spotlights(active);

CREATE TABLE IF NOT EXISTS donations (
  id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  donor_id           TEXT NOT NULL REFERENCES donors(id),
  amount_cents       INTEGER NOT NULL,
  frequency          TEXT NOT NULL CHECK(frequency IN ('one-time', 'monthly')),
  campaign_id        TEXT REFERENCES campaigns(id),
  -- Stripe identifiers — payment_intent for one-time, subscription for monthly
  stripe_payment_id  TEXT,         -- PaymentIntent id
  stripe_subscription_id TEXT,     -- Subscription id (monthly only)
  stripe_customer_id TEXT,
  -- Lifecycle: pending → succeeded (or failed). Webhook flips pending → succeeded.
  status             TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'succeeded', 'failed')),
  fee_covered        INTEGER NOT NULL DEFAULT 0,
  email_opt_in       INTEGER NOT NULL DEFAULT 1,
  created_at         INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS donations_donor_idx ON donations(donor_id);
CREATE INDEX IF NOT EXISTS donations_campaign_idx ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS donations_stripe_payment_idx ON donations(stripe_payment_id);
CREATE INDEX IF NOT EXISTS donations_stripe_subscription_idx ON donations(stripe_subscription_id);
