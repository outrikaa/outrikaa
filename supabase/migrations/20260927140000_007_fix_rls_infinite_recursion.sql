-- 007: eliminate RLS infinite recursion (error 42P17)
--
-- Root cause: admin policies were written with an INLINE subquery on `profiles`:
--     USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
-- On the `profiles` table itself this self-references and Postgres raises
-- "infinite recursion detected in policy". Because every other table's admin
-- policy also reads `profiles`, the failure cascades to all RLS-protected tables
-- (every REST read returned 500 / 42P17).
--
-- Fix: call the SECURITY DEFINER helper public.is_admin(), which runs as a
-- BYPASSRLS owner, so the policy never re-enters RLS on `profiles`.

-- Ensure the helper exists, is SECURITY DEFINER, and is owned by a BYPASSRLS role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- workspace_members: inline subqueries on itself also self-reference.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ws_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.ws_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ws_member(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ws_owner_or_admin(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.ws_owner_or_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ws_owner_or_admin(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ws_is_empty(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
  );
$$;

REVOKE ALL ON FUNCTION public.ws_is_empty(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ws_is_empty(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "wm_select_member" ON public.workspace_members;
CREATE POLICY "wm_select_member" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "wm_update_admin" ON public.workspace_members;
CREATE POLICY "wm_update_admin" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.ws_owner_or_admin(workspace_id) OR public.is_admin())
  WITH CHECK (public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "wm_delete_admin" ON public.workspace_members;
CREATE POLICY "wm_delete_admin" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "wm_insert_admin" ON public.workspace_members;
CREATE POLICY "wm_insert_admin" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "wm_insert_owner_or_admin" ON public.workspace_members;
CREATE POLICY "wm_insert_owner_or_admin" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.ws_owner_or_admin(workspace_id)
    OR (user_id = auth.uid() AND public.ws_is_empty(workspace_id))
  );

-- ---------------------------------------------------------------------------
-- Replace every inline-subquery admin policy with an is_admin() based policy.
-- ---------------------------------------------------------------------------

-- profiles (self-referencing: the actual recursion source)
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- api_keys
DROP POLICY IF EXISTS "admin_read_api_keys" ON public.api_keys;
CREATE POLICY "admin_read_api_keys" ON public.api_keys
  FOR SELECT TO authenticated USING (public.is_admin());

-- audit_logs
DROP POLICY IF EXISTS "al_select_admin" ON public.audit_logs;
CREATE POLICY "al_select_admin" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "al_insert_admin" ON public.audit_logs;
CREATE POLICY "al_insert_admin" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- campaigns
DROP POLICY IF EXISTS "admin_read_campaigns" ON public.campaigns;
CREATE POLICY "admin_read_campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_campaigns" ON public.campaigns;
CREATE POLICY "admin_update_campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- email_events
DROP POLICY IF EXISTS "admin_read_email_events" ON public.email_events;
CREATE POLICY "admin_read_email_events" ON public.email_events
  FOR SELECT TO authenticated USING (public.is_admin());

-- email_messages
DROP POLICY IF EXISTS "admin_read_email_messages" ON public.email_messages;
CREATE POLICY "admin_read_email_messages" ON public.email_messages
  FOR SELECT TO authenticated USING (public.is_admin());

-- email_templates
DROP POLICY IF EXISTS "admin_read_templates" ON public.email_templates;
CREATE POLICY "admin_read_templates" ON public.email_templates
  FOR SELECT TO authenticated USING (public.is_admin());

-- feature_flags
DROP POLICY IF EXISTS "ff_admin_insert" ON public.feature_flags;
CREATE POLICY "ff_admin_insert" ON public.feature_flags
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ff_admin_update" ON public.feature_flags;
CREATE POLICY "ff_admin_update" ON public.feature_flags
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ff_admin_delete" ON public.feature_flags;
CREATE POLICY "ff_admin_delete" ON public.feature_flags
  FOR DELETE TO authenticated USING (public.is_admin());

-- integrations
DROP POLICY IF EXISTS "admin_read_integrations" ON public.integrations;
CREATE POLICY "admin_read_integrations" ON public.integrations
  FOR SELECT TO authenticated USING (public.is_admin());

-- invoices
DROP POLICY IF EXISTS "admin_read_invoices" ON public.invoices;
CREATE POLICY "admin_read_invoices" ON public.invoices
  FOR SELECT TO authenticated USING (public.is_admin());

-- lead_lists
DROP POLICY IF EXISTS "admin_read_lead_lists" ON public.lead_lists;
CREATE POLICY "admin_read_lead_lists" ON public.lead_lists
  FOR SELECT TO authenticated USING (public.is_admin());

-- leads
DROP POLICY IF EXISTS "admin_read_leads" ON public.leads;
CREATE POLICY "admin_read_leads" ON public.leads
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_leads" ON public.leads;
CREATE POLICY "admin_update_leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- mailboxes
DROP POLICY IF EXISTS "admin_read_mailboxes" ON public.mailboxes;
CREATE POLICY "admin_read_mailboxes" ON public.mailboxes
  FOR SELECT TO authenticated USING (public.is_admin());

-- plans
DROP POLICY IF EXISTS "plans_admin_read_all" ON public.plans;
CREATE POLICY "plans_admin_read_all" ON public.plans
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "plans_admin_insert" ON public.plans;
CREATE POLICY "plans_admin_insert" ON public.plans
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "plans_admin_update" ON public.plans;
CREATE POLICY "plans_admin_update" ON public.plans
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "plans_admin_delete" ON public.plans;
CREATE POLICY "plans_admin_delete" ON public.plans
  FOR DELETE TO authenticated USING (public.is_admin());

-- scheduled_emails
DROP POLICY IF EXISTS "admin_read_scheduled" ON public.scheduled_emails;
CREATE POLICY "admin_read_scheduled" ON public.scheduled_emails
  FOR SELECT TO authenticated USING (public.is_admin());

-- sequences
DROP POLICY IF EXISTS "admin_read_sequences" ON public.sequences;
CREATE POLICY "admin_read_sequences" ON public.sequences
  FOR SELECT TO authenticated USING (public.is_admin());

-- subscriptions
DROP POLICY IF EXISTS "subs_admin_read_all" ON public.subscriptions;
CREATE POLICY "subs_admin_read_all" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_admin());

-- system_settings
DROP POLICY IF EXISTS "ss_admin_read_all" ON public.system_settings;
CREATE POLICY "ss_admin_read_all" ON public.system_settings
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "ss_admin_insert" ON public.system_settings;
CREATE POLICY "ss_admin_insert" ON public.system_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ss_admin_update" ON public.system_settings;
CREATE POLICY "ss_admin_update" ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- testimonials
DROP POLICY IF EXISTS "test_admin_insert" ON public.testimonials;
CREATE POLICY "test_admin_insert" ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "test_admin_update" ON public.testimonials;
CREATE POLICY "test_admin_update" ON public.testimonials
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "test_admin_delete" ON public.testimonials;
CREATE POLICY "test_admin_delete" ON public.testimonials
  FOR DELETE TO authenticated USING (public.is_admin());
