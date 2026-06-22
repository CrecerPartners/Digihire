-- Enforce CV / Resume upload on every job application, mirroring the
-- compulsory-CV rule already in place for Talent Pool activation
-- (see 20260610000000_compulsory_cv_talent_pool.sql). Client-side validation
-- alone can be bypassed via direct API calls, so this is a hard DB guarantee.

CREATE OR REPLACE FUNCTION public.check_job_application_cv()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cv_url IS NULL OR NEW.cv_url = '' THEN
    RAISE EXCEPTION 'A CV / Resume is required to apply for this job.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_job_application_cv ON public.job_applications;

-- INSERT only: brands/admins update application status and cv_requested_at
-- on rows that may legitimately have no cv_url yet (e.g. legacy applications,
-- or the request-cv flow), so this must not block UPDATE.
CREATE TRIGGER enforce_job_application_cv
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.check_job_application_cv();
