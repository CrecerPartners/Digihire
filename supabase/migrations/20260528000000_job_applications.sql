CREATE TABLE IF NOT EXISTS job_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES talent_profiles(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  cover_note text,
  cv_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, talent_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_talent ON job_applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Talents can manage their own applications
CREATE POLICY "talent_applications_self" ON job_applications
  FOR ALL USING (talent_id = auth.uid())
  WITH CHECK (talent_id = auth.uid());

-- Admin can manage all applications
CREATE POLICY "admin_applications_all" ON job_applications
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'account_type' = 'admin')
  );

-- Brands can view applications submitted to their jobs
CREATE POLICY "brands_applications_view" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_listings
      WHERE job_listings.id = job_applications.job_id
        AND job_listings.brand_id = auth.uid()
    )
  );
