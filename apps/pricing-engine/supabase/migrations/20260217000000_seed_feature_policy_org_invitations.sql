-- =====================================================
-- Migration: Extend organization_policies for feature resources + seed default
-- Date: 2026-02-17
-- Description:
--   1. Widen the resource_type CHECK constraint to allow 'feature'
--   2. Widen the action CHECK constraint to allow 'submit' and 'view'
--   3. Add a unique partial index for global default policies (org_id IS NULL)
--   4. Seed a global default ALLOW policy for feature:organization_invitations/submit
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Widen resource_type CHECK to include 'feature' and 'route'
-- =====================================================
ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_resource_type_check;

ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS org_policies_resource_type_check;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_resource_type_check
    CHECK (resource_type = ANY (ARRAY[
      'table'::text,
      'storage_bucket'::text,
      'feature'::text,
      'route'::text
    ]));

-- =====================================================
-- Step 2: Widen action CHECK to include 'submit' and 'view'
-- =====================================================
ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_action_check;

ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS org_policies_action_check;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_action_check
    CHECK (action = ANY (ARRAY[
      'select'::text,
      'insert'::text,
      'update'::text,
      'delete'::text,
      'all'::text,
      'submit'::text,
      'view'::text
    ]));

-- =====================================================
-- Step 3: Create unique partial index for global defaults (org_id IS NULL)
--   Standard UNIQUE constraints treat NULLs as distinct, so we need this
--   partial index to prevent duplicate global defaults.
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_policies_global_unique
  ON public.organization_policies (resource_type, resource_name, action)
  WHERE org_id IS NULL;

-- =====================================================
-- Step 4: Seed global default policy for organization_invitations / submit
-- =====================================================
INSERT INTO public.organization_policies (
  id,
  org_id,
  resource_type,
  resource_name,
  action,
  definition_json,
  compiled_config,
  scope,
  effect,
  version,
  is_active,
  created_by_clerk_sub
)
SELECT
  gen_random_uuid(),
  NULL,
  'feature',
  'organization_invitations',
  'submit',
  jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', true,
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    ),
    'connector', 'OR',
    'scope', 'all'
  ),
  jsonb_build_object(
    'version', 2,
    'allow_internal_users', true,
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    ),
    'connector', 'OR',
    'scope', 'all'
  ),
  'all',
  'ALLOW',
  1,
  true,
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'organization_invitations'
    AND action = 'submit'
);

-- =====================================================
-- Step 5: Seed global default policy for organization_invitations / view
--   Broader access: all authenticated roles can view invitation-related data
-- =====================================================
INSERT INTO public.organization_policies (
  id,
  org_id,
  resource_type,
  resource_name,
  action,
  definition_json,
  compiled_config,
  scope,
  effect,
  version,
  is_active,
  created_by_clerk_sub
)
SELECT
  gen_random_uuid(),
  NULL,
  'feature',
  'organization_invitations',
  'view',
  jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', true,
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner', 'member')
      )
    ),
    'connector', 'OR',
    'scope', 'all'
  ),
  jsonb_build_object(
    'version', 2,
    'allow_internal_users', true,
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner', 'member')
      )
    ),
    'connector', 'OR',
    'scope', 'all'
  ),
  'all',
  'ALLOW',
  1,
  true,
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_policies
  WHERE org_id IS NULL
    AND resource_type = 'feature'
    AND resource_name = 'organization_invitations'
    AND action = 'view'
);

COMMIT;

-- =====================================================
-- Notes:
-- - The global default (org_id IS NULL) grants submit access to
--   admin/owner org roles and all internal users.
-- - Organizations can override by creating org-specific policies
--   via the Settings > Policies UI.
-- - The unique partial index prevents duplicate global defaults.
-- =====================================================
