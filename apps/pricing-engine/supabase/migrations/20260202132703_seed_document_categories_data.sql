-- Seed document_categories table with categories from reference database
-- Exact data from production including storage folders and internal flags

INSERT INTO public.document_categories (code, name, description, storage_folder, icon, default_display_order, is_active, is_internal_only)
VALUES
  ('application', 'Application', NULL, 'application', NULL, 1, true, false),
  ('appraisal', 'Appraisal', NULL, 'appraisal', NULL, 2, true, false),
  ('assets', 'Assets', NULL, 'assets', NULL, 3, true, false),
  ('closing', 'Closing', NULL, 'closing', NULL, 4, true, false),
  ('credit_and_background', 'Credit & Background', NULL, 'credit-and-background', NULL, 5, true, true),
  ('construction', 'Construction', NULL, 'construction', NULL, 6, true, false),
  ('environmental', 'Environmental', NULL, 'environmental', NULL, 7, true, false),
  ('experience', 'Experience', NULL, 'experience', NULL, 8, true, false),
  ('id', 'ID', NULL, 'id', NULL, 9, true, true),
  ('insurance', 'Insurance', NULL, 'insurance', NULL, 10, true, false),
  ('pricing', 'Pricing', NULL, 'pricing', NULL, 11, true, true),
  ('property', 'Property', NULL, 'property', NULL, 12, true, false),
  ('seasoning', 'Seasoning', NULL, 'seasoning', NULL, 13, true, false),
  ('servicing', 'Servicing', NULL, 'servicing', NULL, 14, true, false),
  ('title', 'Title', NULL, 'title', NULL, 15, true, false),
  ('entity', 'Entity', NULL, 'entity', NULL, 16, true, false),
  ('statements', 'Statements', NULL, 'statements', NULL, 20, true, false),
  ('payments', 'Payments', NULL, 'payments', NULL, 21, true, false),
  ('agreements', 'Agreements', NULL, 'agreements', NULL, 22, true, false),
  ('draw_requests', 'Draw Requests', NULL, 'draw-requests', NULL, 23, true, false),
  ('internal_notes', 'Internal Notes', NULL, 'internal-notes', NULL, 99, true, true)
ON CONFLICT (code) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  storage_folder = EXCLUDED.storage_folder,
  default_display_order = EXCLUDED.default_display_order,
  is_active = EXCLUDED.is_active,
  is_internal_only = EXCLUDED.is_internal_only;

-- Reset sequence to continue from the highest ID
SELECT setval('document_categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.document_categories));

-- Add comment
COMMENT ON TABLE public.document_categories IS 'Document categories for organizing and controlling access to loan documents';
