-- Fix job_listings admin RLS policy.
-- The original policy checked app_metadata->>'role' and app_metadata->>'account_type',
-- but the super admin is identified via the user_roles table (public.has_role),
-- NOT via JWT app_metadata. Align with every other admin policy in the project.

-- Fix job_listings_admin_all
DROP POLICY IF EXISTS "job_listings_admin_all" ON job_listings;

CREATE POLICY "job_listings_admin_all"
  ON job_listings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Also fix job_applications admin policy (same pattern issue)
DROP POLICY IF EXISTS "admin_applications_all" ON job_applications;

CREATE POLICY "admin_applications_all"
  ON job_applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Also fix talent_module_activations admin policy (same pattern issue)
DROP POLICY IF EXISTS "admin_activations_all" ON talent_module_activations;

CREATE POLICY "admin_activations_all"
  ON talent_module_activations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
