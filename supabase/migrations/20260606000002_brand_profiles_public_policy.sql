-- Drop the authenticated-only policy and create public select policy on brand_profiles
DROP POLICY IF EXISTS "authenticated_select_brand_profiles" ON brand_profiles;
DROP POLICY IF EXISTS "public_select_brand_profiles" ON brand_profiles;

CREATE POLICY "public_select_brand_profiles"
  ON brand_profiles FOR SELECT
  USING (true);
