-- Room for the four years of contact-form history that predate this site.
--
-- The old Netlify form collected two fields the current one does not: which
-- program the writer was asking about, and an SMS-consent checkbox. Dropping
-- them on import would throw away the most useful thing in the archive — a
-- four-year record of what people actually write in about — so they get
-- columns rather than being flattened into the message body.
--
-- `source` distinguishes the imported rows from live ones in the inbox.
-- `import_key` is a deterministic hash of the original submission, so the
-- import can be re-run after a correction without duplicating anything; the
-- unique index is partial because live rows have no key and must not collide.
ALTER TABLE contact_messages ADD COLUMN program     TEXT;
-- Nullable on purpose: NULL means the form never asked, which is the case for
-- every message the current site collects. Only the imported rows carry a real
-- 0/1, because only the old form had the checkbox. Defaulting live rows to 0
-- would read as "declined" in the inbox rather than "not asked".
ALTER TABLE contact_messages ADD COLUMN sms_consent INTEGER;
ALTER TABLE contact_messages ADD COLUMN source      TEXT NOT NULL DEFAULT 'website';
ALTER TABLE contact_messages ADD COLUMN import_key  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_import_key_idx
  ON contact_messages (import_key) WHERE import_key IS NOT NULL;
