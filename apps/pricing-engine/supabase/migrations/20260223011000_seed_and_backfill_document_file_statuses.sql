BEGIN;

-- Seed global defaults.
INSERT INTO public.document_statuses (
  organization_id,
  code,
  label,
  color,
  display_order,
  is_active,
  is_terminal
)
VALUES
  (NULL, 'draft', 'Draft', '#6B7280', 10, true, false),
  (NULL, 'pending', 'Pending', '#F59E0B', 20, true, false),
  (NULL, 'approved', 'Approved', '#10B981', 30, true, true),
  (NULL, 'rejected', 'Rejected', '#EF4444', 40, true, true),
  (NULL, 'archived', 'Archived', '#374151', 50, true, true)
ON CONFLICT DO NOTHING;

-- Backfill from legacy document_files.document_status enum into org-scoped assignments.
WITH doc_orgs AS (
  SELECT dfco.document_file_id, dfco.clerk_org_id AS organization_id
  FROM public.document_files_clerk_orgs dfco

  UNION

  SELECT dfd.document_file_id, d.organization_id
  FROM public.document_files_deals dfd
  JOIN public.deals d ON d.id = dfd.deal_id
  WHERE d.organization_id IS NOT NULL
)
INSERT INTO public.document_file_statuses (
  document_file_id,
  organization_id,
  document_status_id,
  created_at,
  updated_at
)
SELECT
  dox.document_file_id,
  dox.organization_id,
  ds.id,
  now(),
  now()
FROM doc_orgs dox
JOIN public.document_files df ON df.id = dox.document_file_id
JOIN public.document_statuses ds
  ON ds.organization_id IS NULL
 AND ds.code = df.document_status::text
WHERE df.document_status IS NOT NULL
ON CONFLICT (document_file_id, organization_id) DO UPDATE
SET
  document_status_id = EXCLUDED.document_status_id,
  updated_at = now();

COMMIT;
