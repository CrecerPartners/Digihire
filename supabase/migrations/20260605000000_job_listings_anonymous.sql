-- Add anonymous employer flag to job_listings
ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS anonymous boolean DEFAULT false;
