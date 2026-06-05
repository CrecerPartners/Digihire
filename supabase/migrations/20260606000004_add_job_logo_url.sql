-- Add logo_url column to job_listings table
ALTER TABLE public.job_listings ADD COLUMN IF NOT EXISTS logo_url text;
