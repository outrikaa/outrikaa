/*
# OUTRIKAA — Mailbox OAuth credentials

Stores Gmail/Google OAuth tokens per mailbox.

Security model:
- RLS enabled with NO policies => only the service role (Edge Functions)
  can read or write. Authenticated users can never see tokens via PostgREST.
- The public app only ever sees mailboxes.status.
*/

CREATE TABLE IF NOT EXISTS mailbox_credentials (
  mailbox_id uuid PRIMARY KEY REFERENCES mailboxes(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'gmail',
  access_token text,
  refresh_token text NOT NULL,
  token_expires_at timestamptz,
  granted_scopes text[] DEFAULT '{}'::text[],
  google_sub text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mailbox_credentials ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mailbox_credentials_provider ON mailbox_credentials(provider);

-- One mailbox row per address per workspace (needed for ON CONFLICT upserts
-- from the OAuth callback).
CREATE UNIQUE INDEX IF NOT EXISTS idx_mailboxes_workspace_email
  ON mailboxes(workspace_id, email_address);

DROP TRIGGER IF EXISTS set_updated_at_mailbox_credentials ON mailbox_credentials;
CREATE TRIGGER set_updated_at_mailbox_credentials BEFORE UPDATE ON mailbox_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
