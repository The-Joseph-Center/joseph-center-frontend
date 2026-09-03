-- Who has put their hand up for a recurring duty.
--
-- The duties list is being used to work out who does what. Somebody new to the
-- marketing function can read it and see the shape of the job, but until now
-- had no way to say "I could take that" without it becoming a separate
-- conversation that only happens if they start it.
--
-- This is an expression of interest, not an assignment. Ownership is still set
-- deliberately by the Web Developer on the duty itself — these rows exist to be
-- vetted and discussed, and putting a hand up changes nothing about who can see
-- or do the work.
--
-- Keyed by (duty, person) so the same person cannot register twice for the same
-- duty, and withdrawing removes the row rather than storing a "no" — never
-- offered and thought about and declined should not look the same.
CREATE TABLE IF NOT EXISTS duty_interest (
  duty_id     TEXT NOT NULL REFERENCES marketing_duties(id),
  -- The verified email from the token, never anything the caller sends.
  person      TEXT NOT NULL,
  person_name TEXT,
  note        TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (duty_id, person)
);

CREATE INDEX IF NOT EXISTS duty_interest_duty_idx ON duty_interest (duty_id);
