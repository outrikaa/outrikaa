-- 008: RLS completeness — tables the app reads/writes had no user-facing policy
--
-- Why this matters: db.insert() always chains .select(), and Postgres evaluates
-- SELECT row-level policies on INSERT ... RETURNING. A table with no usable
-- SELECT policy therefore fails the INSERT itself (42501), even when the INSERT
-- policy passes. That is what broke workspace creation during signup.
--
-- All checks use the SECURITY DEFINER helpers (public.is_admin, public.ws_member,
-- public.ws_owner_or_admin) so no policy re-enters RLS and recurses.

-- ---------------------------------------------------------------------------
-- 1. workspaces: owner must see the workspace immediately after creating it,
--    before any workspace_members row exists.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
CREATE POLICY "workspaces_select_member" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR owner_id = auth.uid()
    OR public.ws_member(id)
    OR public.ws_owner_or_admin(id)
  );

-- ---------------------------------------------------------------------------
-- 2. notifications: user's own notifications (signup welcome message, etc.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. api_keys: workspace members manage their own workspace keys
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "api_keys_select_member" ON public.api_keys;
CREATE POLICY "api_keys_select_member" ON public.api_keys
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "api_keys_insert_member" ON public.api_keys;
CREATE POLICY "api_keys_insert_member" ON public.api_keys
  FOR INSERT TO authenticated
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "api_keys_update_member" ON public.api_keys;
CREATE POLICY "api_keys_update_member" ON public.api_keys
  FOR UPDATE TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin())
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "api_keys_delete_member" ON public.api_keys;
CREATE POLICY "api_keys_delete_member" ON public.api_keys
  FOR DELETE TO authenticated
  USING (public.ws_owner_or_admin(workspace_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. integrations: workspace members connect/manage integrations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "integrations_select_member" ON public.integrations;
CREATE POLICY "integrations_select_member" ON public.integrations
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "integrations_insert_member" ON public.integrations;
CREATE POLICY "integrations_insert_member" ON public.integrations
  FOR INSERT TO authenticated
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "integrations_update_member" ON public.integrations;
CREATE POLICY "integrations_update_member" ON public.integrations
  FOR UPDATE TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin())
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "integrations_delete_member" ON public.integrations;
CREATE POLICY "integrations_delete_member" ON public.integrations
  FOR DELETE TO authenticated
  USING (public.ws_owner_or_admin(workspace_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. email messages / threads: members read (and refresh) their workspace mail
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "email_messages_select_member" ON public.email_messages;
CREATE POLICY "email_messages_select_member" ON public.email_messages
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "email_threads_select_member" ON public.email_threads;
CREATE POLICY "email_threads_select_member" ON public.email_threads
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "email_threads_update_member" ON public.email_threads;
CREATE POLICY "email_threads_update_member" ON public.email_threads
  FOR UPDATE TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin())
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. scheduled emails: members schedule and read sends
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "scheduled_emails_select_member" ON public.scheduled_emails;
CREATE POLICY "scheduled_emails_select_member" ON public.scheduled_emails
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "scheduled_emails_insert_member" ON public.scheduled_emails;
CREATE POLICY "scheduled_emails_insert_member" ON public.scheduled_emails
  FOR INSERT TO authenticated
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "scheduled_emails_update_member" ON public.scheduled_emails;
CREATE POLICY "scheduled_emails_update_member" ON public.scheduled_emails
  FOR UPDATE TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin())
  WITH CHECK (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "scheduled_emails_delete_member" ON public.scheduled_emails;
CREATE POLICY "scheduled_emails_delete_member" ON public.scheduled_emails
  FOR DELETE TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. invoices + usage records: members read their workspace billing/usage
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "invoices_select_member" ON public.invoices;
CREATE POLICY "invoices_select_member" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

DROP POLICY IF EXISTS "usage_records_select_member" ON public.usage_records;
CREATE POLICY "usage_records_select_member" ON public.usage_records
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id) OR public.ws_owner_or_admin(workspace_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. audit logs: admins see all, actors see their own workspace's entries
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_member" ON public.audit_logs;
CREATE POLICY "audit_logs_select_member" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.ws_owner_or_admin(workspace_id) OR actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9. testimonials: public marketing pages need to read published quotes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "testimonials_select_public" ON public.testimonials;
CREATE POLICY "testimonials_select_public" ON public.testimonials
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- ---------------------------------------------------------------------------
-- 10. support messages: users read/reply on their own tickets
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "support_messages_select_own" ON public.support_messages;
CREATE POLICY "support_messages_select_own" ON public.support_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "support_messages_insert_own" ON public.support_messages;
CREATE POLICY "support_messages_insert_own" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_from_admin = false);

DROP POLICY IF EXISTS "support_messages_update_own" ON public.support_messages;
CREATE POLICY "support_messages_update_own" ON public.support_messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
