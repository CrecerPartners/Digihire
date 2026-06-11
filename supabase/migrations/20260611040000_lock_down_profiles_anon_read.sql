-- CRITICAL: profiles was world-readable.
--
-- The "Anon can read profiles" policy (FOR SELECT TO anon USING (true)) let any
-- unauthenticated caller using the public anon key read EVERY column of EVERY
-- profile row — including bank_name, account_number, bank_code, nin, bvn,
-- whatsapp, id_document_url, proof_of_address_url and transaction_pin.
--
-- The only legitimate anon use is the public seller storefront (/s/:slug and
-- ?ref= referral lookups), which needs a handful of non-sensitive shop columns
-- for profiles that have actually set up a shop. Expose exactly those via a
-- view and remove blanket anon access to the base table.

-- 1. Remove anon access to the base table
DROP POLICY IF EXISTS "Anon can read profiles" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- 1b. Authenticated users could ALSO read every profile ("Authenticated can
--     read profiles" USING(true)) — any logged-in user could dump all bank/NIN/
--     BVN/PIN data. Restrict authenticated reads to the user's own row. Admins
--     keep full read via "Admins can select all profiles" (has_role); cross-user
--     shop data is served by public_shop_profiles below.
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Safe public shop view (non-security_invoker: runs as owner, bypasses base
--    RLS, exposes only shop-safe columns for profiles with a public shop).
CREATE OR REPLACE VIEW public.public_shop_profiles AS
SELECT
  user_id,
  name,
  bio,
  shop_name,
  shop_slug,
  avatar_url,
  shop_logo_url,
  referral_code,
  verification_status
FROM public.profiles
WHERE shop_slug IS NOT NULL;

GRANT SELECT ON public.public_shop_profiles TO anon, authenticated;
