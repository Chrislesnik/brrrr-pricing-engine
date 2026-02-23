-- Add 'appraisal' to the role_assignments resource_type CHECK constraint
ALTER TABLE public.role_assignments
  DROP CONSTRAINT IF EXISTS role_assignments_resource_type_check;
ALTER TABLE public.role_assignments
  ADD CONSTRAINT role_assignments_resource_type_check
  CHECK (resource_type IN ('deal', 'loan', 'borrower', 'entity', 'deal_task', 'appraisal'));
