-- Lets someone be added to the year-end letter list by hand.
--
-- The list is built from two sources: donors read live from Stripe, and this
-- table, which until now only ever held submissions from the public "personal
-- letter from Mona" form. Mona asked to add people herself — individually and
-- in bulk — for the ones who are not in either: a board member, a partner
-- organization, someone who gave by cheque outside Stripe.
--
-- Rows added by hand land here rather than in a table of their own so they flow
-- through the same merge, get the same `req:` key, and can be marked written
-- like everyone else. `source` is what tells them apart in the queue, and
-- `added_by` records who typed them in — the same question the letter_log
-- answers for who wrote the letter.
ALTER TABLE letter_requests ADD COLUMN source   TEXT NOT NULL DEFAULT 'form';
ALTER TABLE letter_requests ADD COLUMN added_by TEXT;

CREATE INDEX IF NOT EXISTS letter_requests_source_idx ON letter_requests (source);
