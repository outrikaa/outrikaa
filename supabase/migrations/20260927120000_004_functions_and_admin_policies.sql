-- 004: SECURITY DEFINER helpers, admin policy gaps and public voting function
-- -----------------------------------------------------------------------------------
-- Everything that must run with elevated privileges lives here so the client never
-- needs service-role keys. Each function is owned by postgres and executes with the
-- privileges of the owner (SECURITY DEFINER), while still validating its inputs.

-- Helper: safe admin check that never recurses into RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Helper: raise a clear exception when the caller is not an admin.
CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin access required';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_admin() TO authenticated;

-- Role management: promote / demote a user (admin only).
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id uuid, make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_admin();
  UPDATE public.profiles
     SET is_admin = make_admin,
         updated_at = now()
   WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile % not found', target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, boolean) TO authenticated;

-- Usage metering: called by the app when emails are sent or AI copy is generated.
CREATE OR REPLACE FUNCTION public.track_usage(p_workspace_id uuid, p_metric text, p_value integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_workspace_id IS NULL OR p_metric IS NULL THEN
    RAISE EXCEPTION 'workspace and metric are required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
     WHERE wm.workspace_id = p_workspace_id
       AND wm.user_id = auth.uid()
       AND wm.status = 'active'
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not a member of this workspace';
  END IF;

  INSERT INTO public.usage_records (workspace_id, metric, value, period)
  VALUES (
    p_workspace_id,
    p_metric,
    GREATEST(COALESCE(p_value, 1), 0),
    to_char(now(), 'YYYY-MM')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_usage(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_usage(uuid, text, integer) TO authenticated;

-- Audit logging: append-only writer available to any authenticated actor.
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_workspace_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_action IS NULL OR length(trim(p_action)) = 0 THEN
    RAISE EXCEPTION 'action is required';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, workspace_id, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_workspace_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.write_audit_log(text, text, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, uuid, jsonb) TO authenticated;

-- Plan switch: keeps subscription updates atomic and records the change.
CREATE OR REPLACE FUNCTION public.admin_change_subscription(p_subscription_id uuid, p_status text, p_plan_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_admin();

  IF p_status NOT IN ('active', 'canceled', 'past_due', 'trialing', 'paused') THEN
    RAISE EXCEPTION 'invalid status %', p_status;
  END IF;

  UPDATE public.subscriptions
     SET status = p_status,
         plan_id = COALESCE(p_plan_id, plan_id),
         cancel_at_period_end = CASE WHEN p_status = 'canceled' THEN true ELSE cancel_at_period_end END,
         updated_at = now()
   WHERE id = p_subscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription % not found', p_subscription_id;
  END IF;

  PERFORM public.write_audit_log('subscription.status_changed', 'subscription', p_subscription_id, NULL,
    jsonb_build_object('status', p_status, 'plan_id', p_plan_id));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_subscription(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_change_subscription(uuid, text, uuid) TO authenticated;

-- API key issue: returns the plaintext key exactly once; only the hash is stored.
CREATE OR REPLACE FUNCTION public.issue_api_key(p_workspace_id uuid, p_name text, p_key_prefix text, p_key_hash text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
     WHERE wm.workspace_id = p_workspace_id
       AND wm.user_id = auth.uid()
       AND wm.status = 'active'
       AND wm.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'only workspace owners and admins can issue API keys';
  END IF;

  INSERT INTO public.api_keys (workspace_id, name, key_prefix, key_hash)
  VALUES (p_workspace_id, p_name, p_key_prefix, p_key_hash)
  RETURNING id INTO v_id;

  PERFORM public.write_audit_log('api_key.issued', 'api_key', v_id, p_workspace_id,
    jsonb_build_object('name', p_name));
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_api_key(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_api_key(uuid, text, text, text) TO authenticated;

-- Public help-centre voting: increments counters without exposing the table for writes.
CREATE OR REPLACE FUNCTION public.vote_help_article(p_article_id uuid, p_helpful boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_helpful THEN
    UPDATE public.help_articles
       SET helpful_count = helpful_count + 1,
           updated_at = now()
     WHERE id = p_article_id AND status = 'published';
  ELSE
    UPDATE public.help_articles
       SET unhelpful_count = unhelpful_count + 1,
           updated_at = now()
     WHERE id = p_article_id AND status = 'published';
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'help article % not found or not published', p_article_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.vote_help_article(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_help_article(uuid, boolean) TO anon, authenticated;

-- Help article view counter (safe for anonymous visitors).
CREATE OR REPLACE FUNCTION public.increment_help_views(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.help_articles SET views = views + 1 WHERE id = p_article_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_help_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_help_views(uuid) TO anon, authenticated;

-- -----------------------------------------------------------------------------------
-- RLS gap fills: admin read/write paths the console needs
-- -----------------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin_read_email_threads" ON public.email_threads;
CREATE POLICY "admin_read_email_threads" ON public.email_threads
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_read_support_messages" ON public.support_messages;
CREATE POLICY "admin_read_support_messages" ON public.support_messages
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_support_messages" ON public.support_messages;
CREATE POLICY "admin_insert_support_messages" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND is_from_admin = true);

DROP POLICY IF EXISTS "admin_update_integrations" ON public.integrations;
CREATE POLICY "admin_update_integrations" ON public.integrations
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_templates" ON public.email_templates;
CREATE POLICY "admin_update_templates" ON public.email_templates
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_read_notifications" ON public.notifications;
CREATE POLICY "admin_read_notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Audit logs are append-only for admins too (no update/delete policies exist).
DROP POLICY IF EXISTS "al_delete_admin" ON public.audit_logs;
