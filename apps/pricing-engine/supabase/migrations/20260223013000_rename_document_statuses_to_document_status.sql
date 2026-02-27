BEGIN;

ALTER TABLE public.document_statuses
  RENAME TO document_status;

ALTER INDEX IF EXISTS public.document_statuses_code_global_uniq
  RENAME TO document_status_code_global_uniq;

ALTER INDEX IF EXISTS public.document_statuses_code_org_uniq
  RENAME TO document_status_code_org_uniq;

ALTER INDEX IF EXISTS public.document_statuses_org_display_idx
  RENAME TO document_status_org_display_idx;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_file_statuses_document_status_id_fkey'
  ) THEN
    ALTER TABLE public.document_file_statuses
      RENAME CONSTRAINT document_file_statuses_document_status_id_fkey
      TO document_file_statuses_document_status_fkey;
  END IF;
END $$;

COMMIT;
