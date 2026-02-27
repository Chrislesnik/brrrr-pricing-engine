ALTER TABLE public.application_appraisal
  ADD COLUMN amc_id uuid NULL
    REFERENCES integration_setup(id) ON DELETE SET NULL;
