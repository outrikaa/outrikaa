-- 006: fix RLS infinite recursion that breaks signup and every authenticated read
-- -----------------------------------------------------------------------------------
-- Root cause: several policies on `profiles` and `workspace_members` query their own
-- table, which Postgres rejects with "infinite recursion detected in policy". Because
-- ~48 admin policies on other tables also check `profiles`, the whole app failed for
-- signed-in users and signup died on the workspaces/workspace_members insert.
-- Fix: replace self-referencing policies with SECURITY DEFINER helpers that bypass RLS.

-- ---- helpers (safe to re-run; identical definitions to 004) ----
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

CREATE OR REPLACE FUNCTION public.ws_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
     WHERE workspace_id = p_workspace_id
       AND user_id = auth.uid()
       AND status = 'active'
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
    SELECT 1 FROM public.workspace_members
     WHERE workspace_id = p_workspace_id
       AND user_id = auth.uid()
       AND status = 'active'
       AND role IN ('owner', 'admin')
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
    SELECT 1 FROM public.workspace_members WHERE workspace_id = p_workspace_id
  );
$$;

REVOKE ALL ON FUNCTION public.ws_is_empty(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ws_is_empty(uuid) TO anon, authenticated;

-- ---- profiles: drop self-referencing admin policies ----
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- workspace_members: remove every self-referencing policy ----
DROP POLICY IF EXISTS "wm_select_member" ON public.workspace_members;
CREATE POLICY "wm_select_member" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.ws_member(workspace_id));

DROP POLICY IF EXISTS "wm_update_admin" ON public.workspace_members;
CREATE POLICY "wm_update_admin" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.ws_owner_or_admin(workspace_id))
  WITH CHECK (public.ws_owner_or_admin(workspace_id));

DROP POLICY IF EXISTS "wm_delete_admin" ON public.workspace_members;
CREATE POLICY "wm_delete_admin" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (public.ws_owner_or_admin(workspace_id));

-- clear any INSERT policies on both tables (including ones with unknown names)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'workspaces' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.workspaces', r.policyname);
  END LOOP;

  FOR r IN SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'workspace_members' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.workspace_members', r.policyname);
  END LOOP;
END $$;

-- a user may create their own workspace, and owners/admins may add members
CREATE POLICY "workspaces_insert_owner" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "wm_insert_owner_or_admin" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.ws_owner_or_admin(workspace_id)
    OR (user_id = auth.uid() AND public.ws_is_empty(workspace_id))
  );

-- memberships must stay queryable for the workspace owner that just created them
DROP POLICY IF EXISTS "wm_select_own" ON public.workspace_members;
CREATE POLICY "wm_select_own" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---- subscriptions: signing up inserts a trial row right after the owner row ----
DROP POLICY IF EXISTS "subs_insert_admin" ON public.subscriptions;
CREATE POLICY "subs_insert_admin" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.ws_owner_or_admin(workspace_id)
    OR public.ws_member(workspace_id)
  );
