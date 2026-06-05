-- Drop policy if exists
DROP POLICY IF EXISTS "authenticated_select_brand_profiles" ON brand_profiles;
DROP POLICY IF EXISTS "public_select_brand_profiles" ON brand_profiles;

-- Allow public users (anon and authenticated) to view brand profiles
CREATE POLICY "public_select_brand_profiles"
  ON brand_profiles FOR SELECT
  USING (true);
