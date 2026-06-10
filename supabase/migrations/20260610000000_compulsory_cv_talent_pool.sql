-- Enforce CV / Resume upload before joining the Talent Pool

CREATE OR REPLACE FUNCTION public.check_talent_pool_cv()
RETURNS TRIGGER AS $$
DECLARE
  v_cv_url TEXT;
BEGIN
  IF NEW.module = 'talent_pool' THEN
    SELECT cv_url INTO v_cv_url FROM public.talent_profiles WHERE id = NEW.talent_id;
    IF v_cv_url IS NULL OR v_cv_url = '' THEN
      RAISE EXCEPTION 'A CV / Resume is required to join the Talent Pool.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_talent_pool_cv ON public.talent_module_activations;

CREATE TRIGGER enforce_talent_pool_cv
  BEFORE INSERT OR UPDATE ON public.talent_module_activations
  FOR EACH ROW EXECUTE FUNCTION public.check_talent_pool_cv();
