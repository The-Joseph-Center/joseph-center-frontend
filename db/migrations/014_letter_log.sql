-- Which year-end letters have been written, for every recipient.
--
-- The queue used to be the request form and nothing else, so it showed the
-- handful of people who asked for a letter and none of the donors Mona
-- actually writes to. She writes to everyone; the request form is one small
-- input to that list, not the list.
--
-- Keyed by (year, recipient) rather than living on letter_requests, because
-- most recipients have no request row at all — they are donors read live from
-- Stripe, which has no column of ours to write to. The key is the Stripe
-- customer id where there is one, an email where there is not, and the request
-- id for someone who asked for a letter and has never given.
--
-- letter_requests keeps its own written_at/written_by/note columns for now.
-- They are unused by the new queue and hold no rows; leaving them is a smaller
-- risk than rewriting a table mid-year, and they can go in a later migration.
CREATE TABLE IF NOT EXISTS letter_log (
  year          INTEGER NOT NULL,
  recipient_key TEXT NOT NULL,
  written_at    INTEGER,
  written_by    TEXT,
  note          TEXT,
  PRIMARY KEY (year, recipient_key)
);

CREATE INDEX IF NOT EXISTS letter_log_year_idx ON letter_log (year, written_at);
