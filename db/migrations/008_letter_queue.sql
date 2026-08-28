-- Working state for Mona's year-end letters.
--
-- The form collects an address; it does not record whether the letter was
-- actually written. Mona writes these by hand at the end of the year, in more
-- than one sitting, so the queue has to remember where she got to — otherwise
-- the only way to resume is to remember which names were already done.
--
-- Kept on letter_requests rather than in a side table: there is exactly one
-- letter per request, and a join would only add a way for the two to disagree.
ALTER TABLE letter_requests ADD COLUMN written_at INTEGER;
ALTER TABLE letter_requests ADD COLUMN written_by TEXT;
ALTER TABLE letter_requests ADD COLUMN note       TEXT;

CREATE INDEX IF NOT EXISTS letter_requests_submitted_idx
  ON letter_requests (submitted_at DESC);
