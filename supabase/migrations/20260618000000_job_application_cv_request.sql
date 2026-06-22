-- Tracks when a brand/admin last requested an applicant upload their CV,
-- so the dashboard can show "Requested" instead of re-prompting indefinitely.
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS cv_requested_at timestamptz;
