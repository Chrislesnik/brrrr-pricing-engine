-- =====================================================
-- Migration: Add is_protected_policy column and seed
--            feature policies for permanent_delete and
--            per-tab settings (10 tabs).
-- Date: 2026-02-17
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add is_protected_policy column
-- =====================================================
ALTER TABLE public.organization_policies
  ADD COLUMN IF NOT EXISTS is_protected_policy boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organization_policies.is_protected_policy IS
'When true, the policy is protected and cannot be edited, disabled, or archived through the UI without elevated approval.';

-- Ensure legacy checks allow new feature policy rows in replayed environments.
ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_resource_type_check;

ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_action_check;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_resource_type_check
  CHECK (resource_type = ANY (ARRAY['table'::text, 'storage_bucket'::text, 'route'::text, 'feature'::text])) NOT VALID;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_action_check
  CHECK (char_length(action) > 0) NOT VALID;

-- =====================================================
-- STEP 2: Seed global default feature policies
-- These are org_id IS NULL (global) so they apply to
-- every organization unless overridden by an org-specific
-- policy.
-- =====================================================

-- ── permanent_delete / delete ──
-- Conditions: org_type is internal AND org_role is admin,owner AND member_role is_not Broker
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'permanent_delete', 'delete',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]},{"field":"member_role","operator":"is_not","values":["Broker"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]},{"field":"member_role","operator":"is_not","values":["Broker"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'permanent_delete'
    AND action = 'delete'
);

-- ── settings_general / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_general', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_general'
    AND action = 'view'
);

-- ── settings_members / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_members', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_members'
    AND action = 'view'
);

-- ── settings_domains / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_domains', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_domains'
    AND action = 'view'
);

-- ── settings_permissions / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_permissions', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_permissions'
    AND action = 'view'
);

-- ── settings_policies / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_policies', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_policies'
    AND action = 'view'
);

-- ── settings_programs / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_programs', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_programs'
    AND action = 'view'
);

-- ── settings_inputs / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_inputs', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_inputs'
    AND action = 'view'
);

-- ── settings_documents / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_documents', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_documents'
    AND action = 'view'
);

-- ── settings_tasks / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_tasks', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_tasks'
    AND action = 'view'
);

-- ── settings_themes / view ──
INSERT INTO public.organization_policies (
  id, org_id, resource_type, resource_name, action,
  definition_json, compiled_config,
  scope, effect, version, is_active, is_protected_policy
)
SELECT
  gen_random_uuid(), NULL, 'feature', 'settings_themes', 'view',
  '{"version":2,"effect":"ALLOW","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  '{"version":2,"allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["admin","owner"]}],"connector":"AND","scope":"all"}'::jsonb,
  'all', 'ALLOW', 1, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'settings_themes'
    AND action = 'view'
);

COMMIT;
