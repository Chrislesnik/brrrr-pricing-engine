-- ============================================================================
-- Migration: Rename term_sheet_templates -> document_templates
--            Rename term_sheet_template_fields -> document_template_fields
-- ============================================================================

-- Drop the old empty document_templates table (legacy, unused, no data)
DROP TABLE IF EXISTS public.document_templates;

-- Rename the tables
ALTER TABLE public.term_sheet_templates RENAME TO document_templates;
ALTER TABLE public.term_sheet_template_fields RENAME TO document_template_fields;
