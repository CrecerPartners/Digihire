-- Admin app security fixes.
--
-- 1. blog_posts writes were open to ANY authenticated user (USING(true)),
--    letting any account deface/publish/delete public blog content.
-- 2. The admin "grant/revoke admin" UI wrote to user_roles directly, but
--    user_roles has no write RLS policy (writes are default-denied), so the
--    feature silently failed. We keep user_roles locked and expose two
--    admin-only SECURITY DEFINER RPCs instead — no broad table grant.

-- ── 1. Restrict blog_posts writes to admins ────────────────────────────────
DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;

CREATE POLICY "blog_posts_admin_all"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── 2. Admin-only role management RPCs ─────────────────────────────────────
-- Both verify the CALLER is an admin before touching user_roles. Running as
-- SECURITY DEFINER lets them bypass the (intentionally write-less) RLS without
-- opening the table to clients.

CREATE OR REPLACE FUNCTION public.grant_admin(_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can grant admin access';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin(_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can revoke admin access';
  END IF;

  -- Prevent an admin from removing their own access (avoids locking out the
  -- last admin by accident).
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot revoke your own admin access';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = 'admin'::public.app_role;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin(UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.revoke_admin(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(UUID) TO authenticated;
