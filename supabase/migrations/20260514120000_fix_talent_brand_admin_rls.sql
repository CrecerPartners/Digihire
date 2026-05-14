-- Fix admin RLS on talent_profiles, brand_profiles, and related tables.
-- The original policies checked app_metadata->>'account_type' or raw_user_meta_data
-- but the admin is identified via the user_roles table (public.has_role).

-- ── talent_profiles ─────────────────────────────────────────────────────────
drop policy if exists "admin can manage all talent profiles" on talent_profiles;
create policy "admin can manage all talent profiles"
  on talent_profiles for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── brand_profiles ───────────────────────────────────────────────────────────
drop policy if exists "admin can manage all brand profiles" on brand_profiles;
create policy "admin can manage all brand profiles"
  on brand_profiles for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── talent_courses ───────────────────────────────────────────────────────────
drop policy if exists "admin can manage courses" on talent_courses;
create policy "admin can manage courses"
  on talent_courses for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── talent_enrollments ───────────────────────────────────────────────────────
drop policy if exists "admin can manage all enrollments" on talent_enrollments;
create policy "admin can manage all enrollments"
  on talent_enrollments for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── talent_webinars ──────────────────────────────────────────────────────────
drop policy if exists "admin can manage webinars" on talent_webinars;
create policy "admin can manage webinars"
  on talent_webinars for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── talent_admin_notes ───────────────────────────────────────────────────────
drop policy if exists "admin can manage admin notes" on talent_admin_notes;
create policy "admin can manage admin notes"
  on talent_admin_notes for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── talent_profile_scores ────────────────────────────────────────────────────
drop policy if exists "admin full access on talent_profile_scores" on talent_profile_scores;
create policy "admin full access on talent_profile_scores"
  on talent_profile_scores for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
