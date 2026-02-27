BEGIN;

DROP INDEX IF EXISTS public.idx_document_files_document_status;

ALTER TABLE public.document_files
  DROP COLUMN IF EXISTS document_status;

DROP TYPE IF EXISTS public.document_status;

COMMIT;
