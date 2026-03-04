-- Backfill: copy deal role assignments to linked appraisals (deal assignments take priority)
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 'appraisal', a.id::text, ra.role_type_id, ra.user_id, ra.organization_id
FROM public.appraisal a
JOIN public.role_assignments ra
  ON ra.resource_type = 'deal' AND ra.resource_id = a.deal_id::text
WHERE a.deal_id IS NOT NULL
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;

-- Backfill: assign creator as Account Executive only when no deal_id
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 'appraisal', a.id::text, 6, a.created_by, a.organization_id
FROM public.appraisal a
WHERE a.created_by IS NOT NULL
  AND a.deal_id IS NULL
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;

-- Backfill: assign creator as Account Executive when deal_id exists but creator is not
-- on the deal AND the deal has no other assignments (avoids duplicates when deal provides coverage)
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 'appraisal', a.id::text, 6, a.created_by, a.organization_id
FROM public.appraisal a
WHERE a.created_by IS NOT NULL
  AND a.deal_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.role_assignments ra2
    WHERE ra2.resource_type = 'deal'
      AND ra2.resource_id = a.deal_id::text
  )
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;
