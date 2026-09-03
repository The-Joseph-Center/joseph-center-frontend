-- Lets an owner be reassigned from the dashboard, and survive a re-seed.
--
-- Owner, owner_names and access_group started as reference data owned by
-- jc_marketing_recurring_duties.json. They are the fields the list exists to
-- settle, so they have to be editable — and once somebody has set one, a
-- re-seed from the file must not quietly hand it back to whoever the
-- spreadsheet last named.
--
-- Same shape as status_updated_by/at: the presence of a timestamp is what tells
-- the seeding script to leave the row alone.
ALTER TABLE marketing_duties ADD COLUMN owner_updated_by TEXT;
ALTER TABLE marketing_duties ADD COLUMN owner_updated_at INTEGER;
