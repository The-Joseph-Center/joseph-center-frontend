-- Adds sms_opt_in alongside the existing email_opt_in on donations.
--
-- Consent is recorded at submission but only acted on once the payment
-- succeeds — verify-donation does the AWeber sync and the sms_subscribers
-- insert. Subscribing someone whose card then declines would be signing them up
-- for messages off the back of a donation they never made.
--
-- Run once:
--   turso db shell <db-name> < db/migrations/006_sms_opt_in.sql
-- Safe to re-run: the ALTER is guarded below by checking the column first, and
-- SQLite errors harmlessly if it already exists.

ALTER TABLE donations ADD COLUMN sms_opt_in INTEGER NOT NULL DEFAULT 0;
