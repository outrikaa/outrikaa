/*
# OUTRIKAA Core Schema — Part 2: Leads, Lists, Campaigns, Sequences, Templates, Mailboxes

Tables created in dependency order. sequences.campaign_id FK added after both tables exist.
*/

-- MAILBOXES
CREATE TABLE IF NOT EXISTS mailboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  display_name text,
  provider text DEFAULT 'smtp' CHECK (provider IN ('gmail','outlook','smtp','custom')),
  status text DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','needs_attention')),
  daily_limit integer DEFAULT 100,
  sent_today integer DEFAULT 0,
  sending_days text[] DEFAULT '{mon,tue,wed,thu,fri}',
  sending_start_time text DEFAULT '09:00',
  sending_end_time text DEFAULT '17:00',
  provider_config jsonb DEFAULT '{}'::jsonb,
  health_score integer DEFAULT 100,
  bounce_rate numeric DEFAULT 0,
  last_sync_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;

-- EMAIL_TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  body text NOT NULL,
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- LEAD_LISTS
CREATE TABLE IF NOT EXISTS lead_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#8B5CF6',
  lead_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE lead_lists ENABLE ROW LEVEL SECURITY;

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text NOT NULL,
  phone text,
  company text,
  job_title text,
  website text,
  linkedin_url text,
  location text,
  industry text,
  company_size text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'new' CHECK (status IN ('new','contacted','opened','clicked','replied','positive_reply','meeting','not_interested','bounced','unsubscribed')),
  source text,
  score integer DEFAULT 0,
  last_activity_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- LEAD_LIST_MEMBERS
CREATE TABLE IF NOT EXISTS lead_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES lead_lists(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, list_id)
);
ALTER TABLE lead_list_members ENABLE ROW LEVEL SECURITY;

-- LEAD_TAGS
CREATE TABLE IF NOT EXISTS lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#8B5CF6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, name)
);
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

-- SEQUENCES (created without campaign_id FK to break circular dep)
CREATE TABLE IF NOT EXISTS sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- CAMPAIGNS (references lead_lists, mailboxes, sequences - all created above)
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  lead_list_id uuid REFERENCES lead_lists(id) ON DELETE SET NULL,
  mailbox_id uuid REFERENCES mailboxes(id) ON DELETE SET NULL,
  sequence_id uuid REFERENCES sequences(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed','archived')),
  timezone text DEFAULT 'UTC',
  daily_limit integer DEFAULT 100,
  sending_days text[] DEFAULT '{mon,tue,wed,thu,fri}',
  sending_start_time text DEFAULT '09:00',
  sending_end_time text DEFAULT '17:00',
  delay_between_emails integer DEFAULT 60,
  track_opens boolean DEFAULT true,
  track_clicks boolean DEFAULT true,
  unsubscribe_enabled boolean DEFAULT true,
  start_date timestamptz,
  launched_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Now add the FK from sequences.campaign_id to campaigns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequences_campaign_id_fkey') THEN
    ALTER TABLE sequences ADD CONSTRAINT sequences_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- SEQUENCE_STEPS
CREATE TABLE IF NOT EXISTS sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_type text NOT NULL CHECK (step_type IN ('email','wait','condition','stop')),
  step_order integer NOT NULL DEFAULT 0,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  subject text,
  preview_text text,
  body text,
  wait_days integer DEFAULT 0,
  wait_hours integer DEFAULT 0,
  condition_type text,
  condition_value jsonb,
  stop_condition text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;

-- POLICIES: mailboxes
DROP POLICY IF EXISTS "mb_select_member" ON mailboxes;
CREATE POLICY "mb_select_member" ON mailboxes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = mailboxes.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "mb_insert_member" ON mailboxes;
CREATE POLICY "mb_insert_member" ON mailboxes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = mailboxes.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "mb_update_member" ON mailboxes;
CREATE POLICY "mb_update_member" ON mailboxes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = mailboxes.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = mailboxes.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "mb_delete_member" ON mailboxes;
CREATE POLICY "mb_delete_member" ON mailboxes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = mailboxes.workspace_id AND user_id = auth.uid()));

-- POLICIES: email_templates
DROP POLICY IF EXISTS "et_select_member" ON email_templates;
CREATE POLICY "et_select_member" ON email_templates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_templates.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "et_insert_member" ON email_templates;
CREATE POLICY "et_insert_member" ON email_templates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_templates.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "et_update_member" ON email_templates;
CREATE POLICY "et_update_member" ON email_templates FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_templates.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_templates.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "et_delete_member" ON email_templates;
CREATE POLICY "et_delete_member" ON email_templates FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = email_templates.workspace_id AND user_id = auth.uid()));

-- POLICIES: lead_lists
DROP POLICY IF EXISTS "ll_select_member" ON lead_lists;
CREATE POLICY "ll_select_member" ON lead_lists FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_lists.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ll_insert_member" ON lead_lists;
CREATE POLICY "ll_insert_member" ON lead_lists FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_lists.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ll_update_member" ON lead_lists;
CREATE POLICY "ll_update_member" ON lead_lists FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_lists.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_lists.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "ll_delete_member" ON lead_lists;
CREATE POLICY "ll_delete_member" ON lead_lists FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_lists.workspace_id AND user_id = auth.uid()));

-- POLICIES: leads
DROP POLICY IF EXISTS "leads_select_member" ON leads;
CREATE POLICY "leads_select_member" ON leads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = leads.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "leads_insert_member" ON leads;
CREATE POLICY "leads_insert_member" ON leads FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = leads.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "leads_update_member" ON leads;
CREATE POLICY "leads_update_member" ON leads FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = leads.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = leads.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "leads_delete_member" ON leads;
CREATE POLICY "leads_delete_member" ON leads FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = leads.workspace_id AND user_id = auth.uid()));

-- POLICIES: lead_list_members
DROP POLICY IF EXISTS "llm_select_member" ON lead_list_members;
CREATE POLICY "llm_select_member" ON lead_list_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN leads l ON l.id = lead_list_members.lead_id WHERE wm.workspace_id = l.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "llm_insert_member" ON lead_list_members;
CREATE POLICY "llm_insert_member" ON lead_list_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm JOIN leads l ON l.id = lead_list_members.lead_id WHERE wm.workspace_id = l.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "llm_delete_member" ON lead_list_members;
CREATE POLICY "llm_delete_member" ON lead_list_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN leads l ON l.id = lead_list_members.lead_id WHERE wm.workspace_id = l.workspace_id AND wm.user_id = auth.uid()));

-- POLICIES: lead_tags
DROP POLICY IF EXISTS "lt_select_member" ON lead_tags;
CREATE POLICY "lt_select_member" ON lead_tags FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_tags.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "lt_insert_member" ON lead_tags;
CREATE POLICY "lt_insert_member" ON lead_tags FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_tags.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "lt_delete_member" ON lead_tags;
CREATE POLICY "lt_delete_member" ON lead_tags FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = lead_tags.workspace_id AND user_id = auth.uid()));

-- POLICIES: sequences
DROP POLICY IF EXISTS "seq_select_member" ON sequences;
CREATE POLICY "seq_select_member" ON sequences FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = sequences.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "seq_insert_member" ON sequences;
CREATE POLICY "seq_insert_member" ON sequences FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = sequences.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "seq_update_member" ON sequences;
CREATE POLICY "seq_update_member" ON sequences FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = sequences.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = sequences.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "seq_delete_member" ON sequences;
CREATE POLICY "seq_delete_member" ON sequences FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = sequences.workspace_id AND user_id = auth.uid()));

-- POLICIES: campaigns
DROP POLICY IF EXISTS "camp_select_member" ON campaigns;
CREATE POLICY "camp_select_member" ON campaigns FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = campaigns.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "camp_insert_member" ON campaigns;
CREATE POLICY "camp_insert_member" ON campaigns FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = campaigns.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "camp_update_member" ON campaigns;
CREATE POLICY "camp_update_member" ON campaigns FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = campaigns.workspace_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = campaigns.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "camp_delete_member" ON campaigns;
CREATE POLICY "camp_delete_member" ON campaigns FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = campaigns.workspace_id AND user_id = auth.uid()));

-- POLICIES: sequence_steps
DROP POLICY IF EXISTS "ss_select_member" ON sequence_steps;
CREATE POLICY "ss_select_member" ON sequence_steps FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN sequences s ON s.id = sequence_steps.sequence_id WHERE wm.workspace_id = s.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "ss_insert_member" ON sequence_steps;
CREATE POLICY "ss_insert_member" ON sequence_steps FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm JOIN sequences s ON s.id = sequence_steps.sequence_id WHERE wm.workspace_id = s.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "ss_update_member" ON sequence_steps;
CREATE POLICY "ss_update_member" ON sequence_steps FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN sequences s ON s.id = sequence_steps.sequence_id WHERE wm.workspace_id = s.workspace_id AND wm.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm JOIN sequences s ON s.id = sequence_steps.sequence_id WHERE wm.workspace_id = s.workspace_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "ss_delete_member" ON sequence_steps;
CREATE POLICY "ss_delete_member" ON sequence_steps FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm JOIN sequences s ON s.id = sequence_steps.sequence_id WHERE wm.workspace_id = s.workspace_id AND wm.user_id = auth.uid()));

-- ADMIN policies
DROP POLICY IF EXISTS "admin_read_lead_lists" ON lead_lists;
CREATE POLICY "admin_read_lead_lists" ON lead_lists FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_leads" ON leads;
CREATE POLICY "admin_read_leads" ON leads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_update_leads" ON leads;
CREATE POLICY "admin_update_leads" ON leads FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_campaigns" ON campaigns;
CREATE POLICY "admin_read_campaigns" ON campaigns FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_update_campaigns" ON campaigns;
CREATE POLICY "admin_update_campaigns" ON campaigns FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_mailboxes" ON mailboxes;
CREATE POLICY "admin_read_mailboxes" ON mailboxes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_sequences" ON sequences;
CREATE POLICY "admin_read_sequences" ON sequences FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "admin_read_templates" ON email_templates;
CREATE POLICY "admin_read_templates" ON email_templates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_mailboxes_ws ON mailboxes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_templates_ws ON email_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_lists_ws ON lead_lists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_ws ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_llm_lead ON lead_list_members(lead_id);
CREATE INDEX IF NOT EXISTS idx_llm_list ON lead_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_ws ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sequences_ws ON sequences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_seq_steps_seq ON sequence_steps(sequence_id);

-- TRIGGERS
DROP TRIGGER IF EXISTS set_updated_at_mailboxes ON mailboxes;
CREATE TRIGGER set_updated_at_mailboxes BEFORE UPDATE ON mailboxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_templates ON email_templates;
CREATE TRIGGER set_updated_at_templates BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_lead_lists ON lead_lists;
CREATE TRIGGER set_updated_at_lead_lists BEFORE UPDATE ON lead_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_leads ON leads;
CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_campaigns ON campaigns;
CREATE TRIGGER set_updated_at_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_sequences ON sequences;
CREATE TRIGGER set_updated_at_sequences BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_seq_steps ON sequence_steps;
CREATE TRIGGER set_updated_at_seq_steps BEFORE UPDATE ON sequence_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
