/*
# OUTRIKAA Core Schema — Part 1: Profiles, Workspaces, Plans, Subscriptions

Creates foundational tables. Tables created first, policies added after.
*/

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLES (created first so cross-references work)

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  job_title text,
  company text,
  timezone text DEFAULT 'UTC',
  role text DEFAULT 'founder',
  is_admin boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url text,
  industry text,
  company_size text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_email text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  monthly_price integer NOT NULL DEFAULT 0,
  yearly_price integer NOT NULL DEFAULT 0,
  lead_limit integer DEFAULT 100,
  email_limit integer DEFAULT 1000,
  mailbox_limit integer DEFAULT 1,
  campaign_limit integer DEFAULT 5,
  ai_generation_limit integer DEFAULT 50,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- POLICIES: profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
CREATE POLICY "profiles_admin_read_all" ON profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: workspaces
DROP POLICY IF EXISTS "workspaces_select_member" ON workspaces;
CREATE POLICY "workspaces_select_member" ON workspaces FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "workspaces_update_admin" ON workspaces;
CREATE POLICY "workspaces_update_admin" ON workspaces FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "workspaces_admin_read_all" ON workspaces;
CREATE POLICY "workspaces_admin_read_all" ON workspaces FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: workspace_members
DROP POLICY IF EXISTS "wm_select_own" ON workspace_members;
CREATE POLICY "wm_select_own" ON workspace_members FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "wm_select_member" ON workspace_members;
CREATE POLICY "wm_select_member" ON workspace_members FOR SELECT TO authenticated USING (workspace_id IN (SELECT workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()));
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;
CREATE POLICY "wm_insert_admin" ON workspace_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "wm_update_admin" ON workspace_members;
CREATE POLICY "wm_update_admin" ON workspace_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "wm_delete_admin" ON workspace_members;
CREATE POLICY "wm_delete_admin" ON workspace_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "wm_admin_read_all" ON workspace_members;
CREATE POLICY "wm_admin_read_all" ON workspace_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: plans
DROP POLICY IF EXISTS "plans_select_public" ON plans;
CREATE POLICY "plans_select_public" ON plans FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "plans_admin_read_all" ON plans;
CREATE POLICY "plans_admin_read_all" ON plans FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "plans_admin_insert" ON plans;
CREATE POLICY "plans_admin_insert" ON plans FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "plans_admin_update" ON plans;
CREATE POLICY "plans_admin_update" ON plans FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "plans_admin_delete" ON plans;
CREATE POLICY "plans_admin_delete" ON plans FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- POLICIES: subscriptions
DROP POLICY IF EXISTS "subs_select_member" ON subscriptions;
CREATE POLICY "subs_select_member" ON subscriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = subscriptions.workspace_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "subs_update_admin" ON subscriptions;
CREATE POLICY "subs_update_admin" ON subscriptions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = subscriptions.workspace_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = subscriptions.workspace_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "subs_insert_admin" ON subscriptions;
CREATE POLICY "subs_insert_admin" ON subscriptions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = subscriptions.workspace_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "subs_admin_read_all" ON subscriptions;
CREATE POLICY "subs_admin_read_all" ON subscriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_wm_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_subs_workspace_id ON subscriptions(workspace_id);

-- TRIGGERS
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_workspaces ON workspaces;
CREATE TRIGGER set_updated_at_workspaces BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_workspace_members ON workspace_members;
CREATE TRIGGER set_updated_at_workspace_members BEFORE UPDATE ON workspace_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_plans ON plans;
CREATE TRIGGER set_updated_at_plans BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON subscriptions;
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
