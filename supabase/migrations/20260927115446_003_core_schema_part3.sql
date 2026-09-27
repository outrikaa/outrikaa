/*
# OUTRIKAA Core Schema — Part 3: Email Messages, Events, Threads, Scheduled, Notifications, Integrations, API Keys, Usage, Invoices, Support, Blog, Help, Testimonials, Feature Flags, Settings, Audit Logs

All remaining tables for the application. Tables created first, then policies.
*/

-- EMAIL_MESSAGES
CREATE TABLE IF NOT EXISTS email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  mailbox_id uuid REFERENCES mailboxes(id) ON DELETE SET NULL,
  sequence_step_id uuid REFERENCES sequence_steps(id) ON DELETE SET NULL,
  message_id text,
  in_reply_to text,
  thread_id text,
  direction text DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  from_address text,
  to_address text,
  subject text,
  preview_text text,
  body text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','opened','clicked','replied','bounced','failed','unsubscribed')),
  is_reply boolean DEFAULT false,
  reply_classification text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- EMAIL_EVENTS
CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id uuid REFERENCES email_messages(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('sent','delivered','opened','clicked','replied','bounced','failed','unsubscribed','complained')),
  recipient text,
  user_agent text,
  ip_address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- EMAIL_THREADS
CREATE TABLE IF NOT EXISTS email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  subject text,
  last_message_at timestamptz,
  message_count integer DEFAULT 0,
  is_unread boolean DEFAULT true,
  classification text,
  folder text DEFAULT 'all' CHECK (folder IN ('all','unread','positive','interested','not_interested','follow_up','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

-- SCHEDULED_EMAILS
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  mailbox_id uuid REFERENCES mailboxes(id) ON DELETE SET NULL,
  sequence_step_id uuid REFERENCES sequence_steps(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','sending','sent','canceled','failed')),
  attempts integer DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  icon text,
  link text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- INTEGRATIONS
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available','connected','error','coming_soon')),
  config jsonb DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  connected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- API_KEYS
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- USAGE_RECORDS
CREATE TABLE IF NOT EXISTS usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric text NOT NULL,
  value integer DEFAULT 1,
  period text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  stripe_invoice_id text,
  invoice_url text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- SUPPORT_TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- SUPPORT_MESSAGES
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_from_admin boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- BLOG_POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image text,
  category text,
  tags text[] DEFAULT '{}',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  reading_time_min integer DEFAULT 5,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- HELP_ARTICLES
CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  subcategory text,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  views integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  unhelpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

-- TESTIMONIALS
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  company text,
  avatar_url text,
  quote text NOT NULL,
  rating integer DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- FEATURE_FLAGS
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  is_global boolean DEFAULT true,
  rollout_percentage integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ip_address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- CAMPAIGN_LEADS (junction: leads enrolled in a campaign with per-lead state)
CREATE TABLE IF NOT EXISTS campaign_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  current_step integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','completed','bounced','unsubscribed','replied')),
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(campaign_id, lead_id)
);
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

-- POLICIES: email_messages
DROP POLICY IF EXISTS "em_select_member" ON email_messages;
CREATE POLICY "em_select_member" ON email_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_messages.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "em_insert_member" ON email_messages;
CREATE POLICY "em_insert_member" ON email_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_messages.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "em_update_member" ON email_messages;
CREATE POLICY "em_update_member" ON email_messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_messages.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_messages.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "em_delete_member" ON email_messages;
CREATE POLICY "em_delete_member" ON email_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_messages.workspace_id AND user_id = auth.uid()));

-- POLICIES: email_events
DROP POLICY IF EXISTS "ee_select_member" ON email_events;
CREATE POLICY "ee_select_member" ON email_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_events.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ee_insert_member" ON email_events;
CREATE POLICY "ee_insert_member" ON email_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_events.workspace_id AND user_id = auth.uid()));

-- POLICIES: email_threads
DROP POLICY IF EXISTS "et2_select_member" ON email_threads;
CREATE POLICY "et2_select_member" ON email_threads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_threads.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "et2_insert_member" ON email_threads;
CREATE POLICY "et2_insert_member" ON email_threads FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_threads.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "et2_update_member" ON email_threads;
CREATE POLICY "et2_update_member" ON email_threads FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_threads.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_threads.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "et2_delete_member" ON email_threads;
CREATE POLICY "et2_delete_member" ON email_threads FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_threads.workspace_id AND user_id = auth.uid()));

-- POLICIES: scheduled_emails
DROP POLICY IF EXISTS "se_select_member" ON scheduled_emails;
CREATE POLICY "se_select_member" ON scheduled_emails FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = scheduled_emails.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "se_insert_member" ON scheduled_emails;
CREATE POLICY "se_insert_member" ON scheduled_emails FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = scheduled_emails.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "se_update_member" ON scheduled_emails;
CREATE POLICY "se_update_member" ON scheduled_emails FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = scheduled_emails.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = scheduled_emails.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "se_delete_member" ON scheduled_emails;
CREATE POLICY "se_delete_member" ON scheduled_emails FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = scheduled_emails.workspace_id AND user_id = auth.uid()));

-- POLICIES: notifications
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POLICIES: integrations
DROP POLICY IF EXISTS "int_select_member" ON integrations;
CREATE POLICY "int_select_member" ON integrations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = integrations.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "int_insert_member" ON integrations;
CREATE POLICY "int_insert_member" ON integrations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = integrations.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "int_update_member" ON integrations;
CREATE POLICY "int_update_member" ON integrations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = integrations.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = integrations.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "int_delete_member" ON integrations;
CREATE POLICY "int_delete_member" ON integrations FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = integrations.workspace_id AND user_id = auth.uid()));

-- POLICIES: api_keys
DROP POLICY IF EXISTS "ak_select_member" ON api_keys;
CREATE POLICY "ak_select_member" ON api_keys FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = api_keys.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ak_insert_member" ON api_keys;
CREATE POLICY "ak_insert_member" ON api_keys FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = api_keys.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ak_update_member" ON api_keys;
CREATE POLICY "ak_update_member" ON api_keys FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = api_keys.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = api_keys.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ak_delete_member" ON api_keys;
CREATE POLICY "ak_delete_member" ON api_keys FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = api_keys.workspace_id AND user_id = auth.uid()));

-- POLICIES: usage_records
DROP POLICY IF EXISTS "ur_select_member" ON usage_records;
CREATE POLICY "ur_select_member" ON usage_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = usage_records.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ur_insert_member" ON usage_records;
CREATE POLICY "ur_insert_member" ON usage_records FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = usage_records.workspace_id AND user_id = auth.uid()));

-- POLICIES: invoices
DROP POLICY IF EXISTS "inv_select_member" ON invoices;
CREATE POLICY "inv_select_member" ON invoices FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = invoices.workspace_id AND user_id = auth.uid()));

-- POLICIES: support_tickets
DROP POLICY IF EXISTS "st_select_own" ON support_tickets;
CREATE POLICY "st_select_own" ON support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "st_select_admin" ON support_tickets;
CREATE POLICY "st_select_admin" ON support_tickets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "st_insert_own" ON support_tickets;
CREATE POLICY "st_insert_own" ON support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "st_update_admin" ON support_tickets;
CREATE POLICY "st_update_admin" ON support_tickets FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: support_messages
DROP POLICY IF EXISTS "sm_select_own" ON support_messages;
CREATE POLICY "sm_select_own" ON support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))));
DROP POLICY IF EXISTS "sm_insert_own" ON support_messages;
CREATE POLICY "sm_insert_own" ON support_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))));

-- POLICIES: blog_posts (public read for published, admin write)
DROP POLICY IF EXISTS "bp_select_public" ON blog_posts;
CREATE POLICY "bp_select_public" ON blog_posts FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "bp_admin_read_all" ON blog_posts;
CREATE POLICY "bp_admin_read_all" ON blog_posts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "bp_admin_insert" ON blog_posts;
CREATE POLICY "bp_admin_insert" ON blog_posts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "bp_admin_update" ON blog_posts;
CREATE POLICY "bp_admin_update" ON blog_posts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "bp_admin_delete" ON blog_posts;
CREATE POLICY "bp_admin_delete" ON blog_posts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: help_articles (public read for published, admin write)
DROP POLICY IF EXISTS "ha_select_public" ON help_articles;
CREATE POLICY "ha_select_public" ON help_articles FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "ha_admin_read_all" ON help_articles;
CREATE POLICY "ha_admin_read_all" ON help_articles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ha_admin_insert" ON help_articles;
CREATE POLICY "ha_admin_insert" ON help_articles FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ha_admin_update" ON help_articles;
CREATE POLICY "ha_admin_update" ON help_articles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ha_admin_delete" ON help_articles;
CREATE POLICY "ha_admin_delete" ON help_articles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: testimonials (public read for published, admin write)
DROP POLICY IF EXISTS "test_select_public" ON testimonials;
CREATE POLICY "test_select_public" ON testimonials FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "test_admin_read_all" ON testimonials;
CREATE POLICY "test_admin_read_all" ON testimonials FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "test_admin_insert" ON testimonials;
CREATE POLICY "test_admin_insert" ON testimonials FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "test_admin_update" ON testimonials;
CREATE POLICY "test_admin_update" ON testimonials FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "test_admin_delete" ON testimonials;
CREATE POLICY "test_admin_delete" ON testimonials FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: feature_flags (public read, admin write)
DROP POLICY IF EXISTS "ff_select_public" ON feature_flags;
CREATE POLICY "ff_select_public" ON feature_flags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ff_admin_insert" ON feature_flags;
CREATE POLICY "ff_admin_insert" ON feature_flags FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ff_admin_update" ON feature_flags;
CREATE POLICY "ff_admin_update" ON feature_flags FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ff_admin_delete" ON feature_flags;
CREATE POLICY "ff_admin_delete" ON feature_flags FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: system_settings (public read for public keys, admin all)
DROP POLICY IF EXISTS "ss_select_public" ON system_settings;
CREATE POLICY "ss_select_public" ON system_settings FOR SELECT TO anon, authenticated USING (is_public = true);
DROP POLICY IF EXISTS "ss_admin_read_all" ON system_settings;
CREATE POLICY "ss_admin_read_all" ON system_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ss_admin_insert" ON system_settings;
CREATE POLICY "ss_admin_insert" ON system_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "ss_admin_update" ON system_settings;
CREATE POLICY "ss_admin_update" ON system_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: audit_logs (admin read only)
DROP POLICY IF EXISTS "al_select_admin" ON audit_logs;
CREATE POLICY "al_select_admin" ON audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "al_insert_admin" ON audit_logs;
CREATE POLICY "al_insert_admin" ON audit_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: campaign_leads
DROP POLICY IF EXISTS "cl_select_member" ON campaign_leads;
CREATE POLICY "cl_select_member" ON campaign_leads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN campaigns c ON c.id = campaign_leads.campaign_id WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "cl_insert_member" ON campaign_leads;
CREATE POLICY "cl_insert_member" ON campaign_leads FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm JOIN campaigns c ON c.id = campaign_leads.campaign_id WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "cl_update_member" ON campaign_leads;
CREATE POLICY "cl_update_member" ON campaign_leads FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN campaigns c ON c.id = campaign_leads.campaign_id WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm JOIN campaigns c ON c.id = campaign_leads.campaign_id WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "cl_delete_member" ON campaign_leads;
CREATE POLICY "cl_delete_member" ON campaign_leads FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN campaigns c ON c.id = campaign_leads.campaign_id WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid()));

-- ADMIN read-all for email activity
DROP POLICY IF EXISTS "admin_read_email_messages" ON email_messages;
CREATE POLICY "admin_read_email_messages" ON email_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_email_events" ON email_events;
CREATE POLICY "admin_read_email_events" ON email_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_scheduled" ON scheduled_emails;
CREATE POLICY "admin_read_scheduled" ON scheduled_emails FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_invoices" ON invoices;
CREATE POLICY "admin_read_invoices" ON invoices FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_api_keys" ON api_keys;
CREATE POLICY "admin_read_api_keys" ON api_keys FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_usage" ON usage_records;
CREATE POLICY "admin_read_usage" ON usage_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_integrations" ON integrations;
CREATE POLICY "admin_read_integrations" ON integrations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_email_messages_ws ON email_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_campaign ON email_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_lead ON email_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON email_messages(status);
CREATE INDEX IF NOT EXISTS idx_email_events_msg ON email_events(email_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_ws ON email_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_ws ON email_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_ws ON scheduled_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_ws ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_ws ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_ws ON usage_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_ws ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead ON campaign_leads(lead_id);

-- TRIGGERS
DROP TRIGGER IF EXISTS set_updated_at_email_messages ON email_messages;
CREATE TRIGGER set_updated_at_email_messages BEFORE UPDATE ON email_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_email_threads ON email_threads;
CREATE TRIGGER set_updated_at_email_threads BEFORE UPDATE ON email_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_scheduled ON scheduled_emails;
CREATE TRIGGER set_updated_at_scheduled BEFORE UPDATE ON scheduled_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_integrations ON integrations;
CREATE TRIGGER set_updated_at_integrations BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_support_tickets ON support_tickets;
CREATE TRIGGER set_updated_at_support_tickets BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_blog_posts ON blog_posts;
CREATE TRIGGER set_updated_at_blog_posts BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_help_articles ON help_articles;
CREATE TRIGGER set_updated_at_help_articles BEFORE UPDATE ON help_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_testimonials ON testimonials;
CREATE TRIGGER set_updated_at_testimonials BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_feature_flags ON feature_flags;
CREATE TRIGGER set_updated_at_feature_flags BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_system_settings ON system_settings;
CREATE TRIGGER set_updated_at_system_settings BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
