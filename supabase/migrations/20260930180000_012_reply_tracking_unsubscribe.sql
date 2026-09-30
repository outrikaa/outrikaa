/*
# OUTRIKAA — Reply tracking + unsubscribe + inbox sync support

- leads.unsubscribed_at: one-click unsubscribe timestamp
- email_messages.email_thread_id: link to email_threads row for Inbox rendering
- email_messages.rfc_id: RFC Message-ID header for reply threading
- email_threads.gmail_thread_id: Gmail thread id for sync dedupe
- mailboxes.sync_cursor: Gmail history id for incremental sync
*/

ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS email_thread_id uuid REFERENCES email_threads(id) ON DELETE SET NULL;
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS rfc_id text;
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS gmail_thread_id text;
ALTER TABLE mailboxes ADD COLUMN IF NOT EXISTS sync_cursor text;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_email_messages_mailbox_gmail
  ON email_messages(mailbox_id, message_id)
  WHERE mailbox_id IS NOT NULL AND message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_messages_email_thread ON email_messages(email_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_key ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_gmail ON email_threads(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_leads_unsubscribed ON leads(status) WHERE status = 'unsubscribed';
