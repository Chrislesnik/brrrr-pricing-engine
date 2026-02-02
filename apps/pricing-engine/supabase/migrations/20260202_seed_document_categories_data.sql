-- Seed document_categories table with categories from reference database
-- Exact data from production including storage folders and internal flags

INSERT INTO public.document_categories (id, code, name, description, storage_folder, icon, default_display_order, is_active, is_internal_only)
VALUES
  (1, 'application', 'Application', NULL, 'application', NULL, 1, true, false),
  (2, 'appraisal', 'Appraisal', NULL, 'appraisal', NULL, 2, true, false),
  (3, 'assets', 'Assets', NULL, 'assets', NULL, 3, true, false),
  (4, 'closing', 'Closing', NULL, 'closing', NULL, 4, true, false),
  (5, 'credit_and_background', 'Credit & Background', NULL, 'credit-and-background', NULL, 5, true, true),
  (6, 'construction', 'Construction', NULL, 'construction', NULL, 6, true, false),
  (7, 'environmental', 'Environmental', NULL, 'environmental', NULL, 7, true, false),
  (8, 'experience', 'Experience', NULL, 'experience', NULL, 8, true, false),
  (9, 'id', 'ID', NULL, 'id', NULL, 9, true, true),
  (10, 'insurance', 'Insurance', NULL, 'insurance', NULL, 10, true, false),
  (11, 'pricing', 'Pricing', NULL, 'pricing', NULL, 11, true, true),
  (12, 'property', 'Property', NULL, 'property', NULL, 12, true, false),
  (13, 'seasoning', 'Seasoning', NULL, 'seasoning', NULL, 13, true, false),
  (14, 'servicing', 'Servicing', NULL, 'servicing', NULL, 14, true, false),
  (15, 'title', 'Title', NULL, 'title', NULL, 15, true, false),
  (16, 'entity', 'Entity', NULL, 'entity', NULL, 16, true, false),
  (17, 'statements', 'Statements', NULL, 'statements', NULL, 20, true, false),
  (18, 'payments', 'Payments', NULL, 'payments', NULL, 21, true, false),
  (19, 'agreements', 'Agreements', NULL, 'agreements', NULL, 22, true, false),
  (20, 'draw_requests', 'Draw Requests', NULL, 'draw-requests', NULL, 23, true, false),
  (21, 'internal_notes', 'Internal Notes', NULL, 'internal-notes', NULL, 99, true, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  storage_folder = EXCLUDED.storage_folder,
  default_display_order = EXCLUDED.default_display_order,
  is_active = EXCLUDED.is_active,
  is_internal_only = EXCLUDED.is_internal_only;

-- Reset sequence to continue from the highest ID
SELECT setval('document_categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.document_categories));

-- Add comment
COMMENT ON TABLE public.document_categories IS 'Document categories for organizing and controlling access to loan documents';
