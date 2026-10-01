/*
# OUTRIKAA — Custom SMTP credentials

Adds SMTP connection fields to mailbox_credentials (provider = 'smtp').
refresh_token becomes nullable because SMTP stores no OAuth token.

Security model: same as before — RLS enabled with NO policies, only the
service role (Edge Functions) can read or write.
*/

ALTER TABLE mailbox_credentials ALTER COLUMN refresh_token DROP NOT NULL;

ALTER TABLE mailbox_credentials
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port integer,
  ADD COLUMN IF NOT EXISTS smtp_secure boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS smtp_username text,
  ADD COLUMN IF NOT EXISTS smtp_password text;
