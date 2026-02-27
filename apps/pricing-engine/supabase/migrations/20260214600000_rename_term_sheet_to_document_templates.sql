-- ============================================================================
-- Migration: Rename term_sheet_templates -> document_templates
--            Rename term_sheet_template_fields -> document_template_fields
-- ============================================================================

DO $$
BEGIN
  -- Only run the rename sequence if legacy term_sheet_* tables still exist.
  IF to_regclass('public.term_sheet_templates') IS NOT NULL THEN
    -- Drop only the legacy placeholder table if it still exists before rename.
    IF to_regclass('public.document_templates') IS NOT NULL THEN
      DROP TABLE public.document_templates;
    END IF;

    ALTER TABLE public.term_sheet_templates RENAME TO document_templates;
  END IF;

  IF to_regclass('public.term_sheet_template_fields') IS NOT NULL THEN
    ALTER TABLE public.term_sheet_template_fields RENAME TO document_template_fields;
  END IF;
END $$;
