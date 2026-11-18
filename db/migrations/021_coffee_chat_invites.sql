-- Who has been invited to apply as a Coffee Chat guest.
--
-- The invitation is sent from the dashboard and lands in someone's inbox, which
-- means that without a record there is no way to answer "did we already ask
-- them?" — the sent mail lives in Resend's logs and in nobody's sent folder,
-- because the send is made by a Function rather than by a person's mail client.
--
-- Email is deliberately NOT unique. Inviting the same person twice is a normal
-- thing to do: the first one went unanswered, or they asked to be reminded
-- after the holidays. A hard constraint would turn a reasonable follow-up into
-- an error, so the page shows the previous invitation and its date and lets the
-- sender decide. The guard is information, not a lock.
--
-- `name` is stored as it was typed, because that is what the greeting said. If
-- a follow-up needs to match the first one word for word, this is the only
-- place that records it.
CREATE TABLE IF NOT EXISTS coffee_chat_invites (
  id       TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name     TEXT NOT NULL,
  email    TEXT NOT NULL,
  sent_by  TEXT NOT NULL,                              -- the sender's Okta login
  sent_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- "Have we asked this address before" is the question the page asks on every
-- keystroke, so it gets an index. Lowercased at the call site, not here —
-- SQLite cannot index an expression on an existing column without a generated
-- column, and normalizing on the way in keeps the comparison honest.
CREATE INDEX IF NOT EXISTS coffee_chat_invites_email_idx
  ON coffee_chat_invites (email);

-- The list is always "most recent first".
CREATE INDEX IF NOT EXISTS coffee_chat_invites_sent_idx
  ON coffee_chat_invites (sent_at DESC);
