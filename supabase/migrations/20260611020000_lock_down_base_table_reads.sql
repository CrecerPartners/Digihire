-- Complete the anonymity / brand-PII fix at the RLS layer.
--
-- Migration 20260611000000 added the job_listings_public view and switched the
-- landing + talent clients to it, but it left two over-broad SELECT policies in
-- place that let ANY authenticated user read the base tables directly:
--
--   * job_listings_authenticated_read  -> USING (status = 'published')
--   * authenticated_select_brand_profiles -> USING (true)
--
-- Because anonymous job_listings still store the real brand_id, a logged-in
-- talent could bypass the client and de-anonymize every anonymous listing, or
-- dump every brand's contact_name/phone:
--
--   supabase.from('job_listings').select('*, brand_profiles(*)').eq('anonymous', true)
--   supabase.from('brand_profiles').select('id, company_name, contact_name, phone')
--
-- Dropping both policies forces all non-owner reads through job_listings_public
-- (a non-security_invoker view that runs as its owner, so it bypasses base RLS
-- and is granted to anon/authenticated). Every legitimate consumer keeps a
-- narrower policy:
--
--   * Brands  -> own jobs via job_listings_brand_read_own (brand_id = auth.uid())
--               own profile via "brand can manage own profile" (id = auth.uid())
--   * Admin   -> job_listings_admin_all / "admin can manage all brand profiles"
--   * Talent  -> job_listings_public view (safe columns, identity nulled)
--   * Public  -> job_listings_public view (granted to anon)
--
-- The brands_applications_view policy's internal EXISTS(... job_listings ...)
-- subquery still resolves for the owning brand via job_listings_brand_read_own.

DROP POLICY IF EXISTS "job_listings_authenticated_read" ON public.job_listings;
DROP POLICY IF EXISTS "authenticated_select_brand_profiles" ON public.brand_profiles;

-- Defense in depth: the anon role must never touch the base tables either.
REVOKE SELECT ON public.job_listings FROM anon;
REVOKE SELECT ON public.brand_profiles FROM anon;
