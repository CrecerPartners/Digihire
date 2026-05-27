-- Job Listings table for public jobs/gigs posted by brands or admin
CREATE TABLE IF NOT EXISTS job_listings (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id          uuid        REFERENCES brand_profiles(id) ON DELETE SET NULL,

  -- Core
  title             text        NOT NULL,
  company_name      text        NOT NULL,
  job_type          text        NOT NULL DEFAULT 'full_time'
                    CHECK (job_type IN ('full_time','part_time','contract','gig','internship')),
  category          text        NOT NULL DEFAULT 'Sales',
  location          text,
  work_mode         text        DEFAULT 'onsite'
                    CHECK (work_mode IN ('onsite','remote','hybrid')),

  -- Compensation
  salary_min        integer,
  salary_max        integer,
  pay_type          text        DEFAULT 'salary'
                    CHECK (pay_type IN ('salary','commission','hourly','per_gig')),

  -- Details
  description       text,
  requirements      text,
  skills            text[],
  experience_level  text        DEFAULT 'any'
                    CHECK (experience_level IN ('entry','mid','senior','any')),

  -- Timeline
  duration          text,
  slots             integer     DEFAULT 1,
  deadline          date,

  -- Meta
  status            text        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','closed')),
  featured          boolean     DEFAULT false,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_listings_status_idx    ON job_listings (status);
CREATE INDEX IF NOT EXISTS job_listings_brand_idx     ON job_listings (brand_id);
CREATE INDEX IF NOT EXISTS job_listings_job_type_idx  ON job_listings (job_type);
CREATE INDEX IF NOT EXISTS job_listings_featured_idx  ON job_listings (featured, status);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Public / talent: read published listings
CREATE POLICY "job_listings_public_read"
  ON job_listings FOR SELECT
  USING (status = 'published');

-- Brands: full CRUD on their own listings
CREATE POLICY "job_listings_brand_insert"
  ON job_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "job_listings_brand_update"
  ON job_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "job_listings_brand_delete"
  ON job_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = brand_id);

-- Brands: read own listings (including drafts)
CREATE POLICY "job_listings_brand_read_own"
  ON job_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = brand_id);

-- Admin: full access
CREATE POLICY "job_listings_admin_all"
  ON job_listings FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'account_type') = 'admin'
  );
