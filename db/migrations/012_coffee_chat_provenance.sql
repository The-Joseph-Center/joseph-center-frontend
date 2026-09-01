-- Lets the Google Form era of Coffee Chat applications sit in the same table
-- as the ones the site collects.
--
-- Unlike the volunteer archive, these do not need a table of their own: the
-- form on /media/apply was built from this Google Form and asks the same
-- questions in the same order, so the rows are the same shape. Only their
-- provenance differs, and that is what these two columns record.
ALTER TABLE coffee_chat_applications ADD COLUMN source     TEXT NOT NULL DEFAULT 'website';
ALTER TABLE coffee_chat_applications ADD COLUMN import_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS coffee_chat_import_key_idx
  ON coffee_chat_applications (import_key) WHERE import_key IS NOT NULL;
