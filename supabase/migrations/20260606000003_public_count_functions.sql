-- Secure functions to get counts bypassing RLS but protecting individual record PII
CREATE OR REPLACE FUNCTION public.get_job_applicant_count(job_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer FROM public.job_applications WHERE job_id = job_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_talent_count_by_category(category_text text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer FROM public.talent_profiles WHERE role_interests @> ARRAY[category_text];
$$;
