-- When a talent uploads/updates their CV on their profile, retroactively
-- attach it to any of their existing job applications that don't have one
-- yet (e.g. they applied before uploading a CV, or a brand/admin used the
-- "Request CV" flow). Only backfills empty cv_url — never overwrites a
-- CV the talent deliberately chose for a specific application.

CREATE OR REPLACE FUNCTION public.backfill_application_cv()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cv_url IS NOT NULL AND NEW.cv_url <> '' THEN
    UPDATE public.job_applications
    SET cv_url = NEW.cv_url,
        cv_requested_at = NULL,
        updated_at = now()
    WHERE talent_id = NEW.id
      AND (cv_url IS NULL OR cv_url = '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_talent_cv_uploaded ON public.talent_profiles;

CREATE TRIGGER on_talent_cv_uploaded
  AFTER UPDATE OF cv_url ON public.talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.backfill_application_cv();

-- Realtime needs to see cv_url/status changes on job_applications so the
-- admin/brand applicant dialogs can update live while open.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'job_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;
  END IF;
END $$;
