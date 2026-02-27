-- Mark pre-existing settings view-only policies as protected
UPDATE public.organization_policies
SET is_protected_policy = true
WHERE resource_type = 'feature'
  AND resource_name LIKE 'settings_%'
  AND action = 'view'
  AND org_id IS NULL
  AND is_protected_policy = false;
