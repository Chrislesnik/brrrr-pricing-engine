-- Remove creator-as-AE assignments for appraisals that already have deal-sourced assignments.
-- The deal's role assignments take priority; the creator row is redundant.
DELETE FROM public.role_assignments ra
WHERE ra.resource_type = 'appraisal'
  AND ra.role_type_id = 6
  AND EXISTS (
    SELECT 1 FROM public.appraisal a
    WHERE a.id::text = ra.resource_id
      AND a.created_by = ra.user_id
      AND a.deal_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.role_assignments deal_ra
        WHERE deal_ra.resource_type = 'deal'
          AND deal_ra.resource_id = a.deal_id::text
      )
  );
