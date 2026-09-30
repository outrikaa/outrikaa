/*
# OUTRIKAA — Campaign sending pipeline support

- campaigns.template_id: default email template for first touch
- scheduled_emails.subject/body: snapshot of the message at queue time
- mailboxes.sent_date: for daily sent_today reset by the scheduler
*/

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL;
ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE mailboxes ADD COLUMN IF NOT EXISTS sent_date date DEFAULT CURRENT_DATE;
