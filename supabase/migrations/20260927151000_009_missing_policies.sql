-- 009: tables that had RLS enabled but NO policies at all
--
-- With row-level security on and zero policies, every role (including admins)
-- sees zero rows and every insert is rejected. That silently broke the public
-- blog / help centre and user support tickets.

-- ---------------------------------------------------------------------------
-- blog_posts: public reads published posts, admins manage all
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "blog_posts_select_public" ON public.blog_posts;
CREATE POLICY "blog_posts_select_public" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "blog_posts_insert_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_insert_admin" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blog_posts_update_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_update_admin" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blog_posts_delete_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_delete_admin" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- help_articles: public reads published articles, admins manage all
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "help_articles_select_public" ON public.help_articles;
CREATE POLICY "help_articles_select_public" ON public.help_articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "help_articles_insert_admin" ON public.help_articles;
CREATE POLICY "help_articles_insert_admin" ON public.help_articles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "help_articles_update_admin" ON public.help_articles;
CREATE POLICY "help_articles_update_admin" ON public.help_articles
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "help_articles_delete_admin" ON public.help_articles;
CREATE POLICY "help_articles_delete_admin" ON public.help_articles
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- support_tickets: users see and open their own tickets, admins see all
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "support_tickets_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_select_own" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "support_tickets_insert_own" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_own" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "support_tickets_update_own" ON public.support_tickets;
CREATE POLICY "support_tickets_update_own" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "support_tickets_delete_own" ON public.support_tickets;
CREATE POLICY "support_tickets_delete_own" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
