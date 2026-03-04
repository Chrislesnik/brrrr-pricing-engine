CREATE TABLE IF NOT EXISTS public.appraisal_borrowers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appraisal_id bigint NOT NULL REFERENCES public.appraisal(id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL REFERENCES public.borrowers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (appraisal_id, borrower_id)
);

CREATE INDEX idx_appraisal_borrowers_appraisal ON public.appraisal_borrowers(appraisal_id);
CREATE INDEX idx_appraisal_borrowers_borrower ON public.appraisal_borrowers(borrower_id);

-- Backfill: migrate existing single borrower_id into the junction table
INSERT INTO public.appraisal_borrowers (appraisal_id, borrower_id)
SELECT id, borrower_id FROM public.appraisal
WHERE borrower_id IS NOT NULL
ON CONFLICT (appraisal_id, borrower_id) DO NOTHING;
