-- Who has followed up on a submission, and what happened.
--
-- The inbox has been read-only: you could read an application and nothing
-- else. With three Coffee Chat applications that was survivable. It stops
-- being survivable the moment two people both email the same guest, or nobody
-- does because each assumed the other had.
--
-- Deliberately one table keyed by (form, row) rather than status columns added
-- to each submissions table. The forms have almost nothing in common except
-- that someone has to act on them, and that is the only thing recorded here.
-- It also means a new form gets follow-up tracking by naming its statuses in
-- submissionForms.ts, with no migration at all.
CREATE TABLE IF NOT EXISTS submission_followups (
  form_id    TEXT NOT NULL,
  row_id     TEXT NOT NULL,
  status     TEXT NOT NULL,
  note       TEXT,
  -- The signed-in email from Okta, so "who spoke to them" is answerable.
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (form_id, row_id)
);

CREATE INDEX IF NOT EXISTS submission_followups_form_idx
  ON submission_followups (form_id, updated_at DESC);
