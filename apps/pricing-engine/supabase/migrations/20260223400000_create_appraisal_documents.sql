CREATE TABLE IF NOT EXISTS public.appraisal_documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appraisal_id bigint NOT NULL REFERENCES public.appraisal(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appraisal_documents_appraisal ON public.appraisal_documents(appraisal_id);
CREATE INDEX idx_appraisal_documents_org ON public.appraisal_documents(organization_id);

-- Create appraisal-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('appraisal-documents', 'appraisal-documents', false)
ON CONFLICT (id) DO NOTHING;
