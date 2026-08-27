-- Messages from the contact form on the site.
--
-- Until now these were emailed and nothing else: if the mail was deleted,
-- filtered, or sent while Resend was misconfigured, the message was gone with
-- no record that anyone had ever written in. Storing them makes the dashboard
-- inbox the durable copy and leaves the email as the notification it should
-- have been all along.
CREATE TABLE IF NOT EXISTS contact_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  message      TEXT NOT NULL,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS contact_messages_submitted_idx
  ON contact_messages (submitted_at DESC);
