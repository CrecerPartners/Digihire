-- Security fix: stop exposing brand PII and anonymous-employer identity to the public.
--
-- Before this migration:
--   * brand_profiles had `FOR SELECT USING (true)` — any anonymous visitor could
--     read contact_name and phone for every brand via the anon key.
--   * job_listings was publicly readable with all columns, so listings marked
--     anonymous still returned the real company_name (and joined brand profile)
--     in the API response; anonymity was enforced only in the UI.
--
-- After this migration:
--   * anon has NO direct access to job_listings or brand_profiles.
--   * The landing site reads job_listings_public, a view that
--       - only contains published listings,
--       - nulls out identifying fields for anonymous listings,
--       - exposes only safe brand profile columns (never contact_name/phone).
--   * Authenticated app surfaces (talentpool/brands/admin) keep their existing
--     row-level access.

-- ── 1. brand_profiles: drop public read, restore authenticated-only ────────
DROP POLICY IF EXISTS "public_select_brand_profiles" ON public.brand_profiles;
DROP POLICY IF EXISTS "authenticated_select_brand_profiles" ON public.brand_profiles;

CREATE POLICY "authenticated_select_brand_profiles"
  ON public.brand_profiles FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.brand_profiles FROM anon;

-- ── 2. job_listings: drop anon read, keep authenticated read of published ──
DROP POLICY IF EXISTS "job_listings_public_read" ON public.job_listings;

CREATE POLICY "job_listings_authenticated_read"
  ON public.job_listings FOR SELECT
  TO authenticated
  USING (status = 'published');

REVOKE SELECT ON public.job_listings FROM anon;

-- ── 3. Safe public view for the landing site ───────────────────────────────
-- Intentionally NOT security_invoker: the view runs as its owner so anon can
-- read through it while having no access to the base tables. The WHERE clause
-- and column list define exactly what is public.
CREATE OR REPLACE VIEW public.job_listings_public AS
SELECT
  j.id,
  j.title,
  j.job_type,
  j.category,
  j.location,
  j.work_mode,
  j.salary_min,
  j.salary_max,
  j.pay_type,
  j.description,
  j.requirements,
  j.skills,
  j.experience_level,
  j.duration,
  j.slots,
  j.deadline,
  j.status,
  j.featured,
  j.anonymous,
  j.created_at,
  j.updated_at,
  -- Identity fields are stripped for anonymous listings
  CASE WHEN j.anonymous THEN NULL ELSE j.company_name END AS company_name,
  CASE WHEN j.anonymous THEN NULL ELSE j.brand_id     END AS brand_id,
  CASE WHEN j.anonymous THEN NULL ELSE j.logo_url     END AS logo_url,
  -- Safe brand profile columns only (never contact_name / phone)
  b.industry AS brand_industry, -- industry is shown even for anonymous listings
  CASE WHEN j.anonymous THEN NULL ELSE b.company_type END AS brand_company_type,
  CASE WHEN j.anonymous THEN NULL ELSE b.company_size END AS brand_company_size,
  CASE WHEN j.anonymous THEN NULL ELSE b.city         END AS brand_city,
  CASE WHEN j.anonymous THEN NULL ELSE b.country      END AS brand_country,
  CASE WHEN j.anonymous THEN NULL ELSE b.description  END AS brand_description,
  CASE WHEN j.anonymous THEN NULL ELSE b.logo_url     END AS brand_logo_url,
  CASE WHEN j.anonymous THEN NULL ELSE b.website      END AS brand_website
FROM public.job_listings j
LEFT JOIN public.brand_profiles b ON b.id = j.brand_id
WHERE j.status = 'published';

GRANT SELECT ON public.job_listings_public TO anon, authenticated;
