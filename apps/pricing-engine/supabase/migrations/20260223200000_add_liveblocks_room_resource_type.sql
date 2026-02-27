-- =====================================================
-- Migration: Add liveblocks resource type
-- Date: 2026-02-23
-- Description:
--   1. Add 'liveblocks' to resource_type CHECK constraint
--   2. Seed global default policies for Liveblocks room types
-- =====================================================

BEGIN;

-- STEP 1: Expand resource_type CHECK constraint
ALTER TABLE public.organization_policies
  DROP CONSTRAINT IF EXISTS organization_policies_resource_type_check;

ALTER TABLE public.organization_policies
  ADD CONSTRAINT organization_policies_resource_type_check
  CHECK (resource_type = ANY (ARRAY[
    'table'::text,
    'storage_bucket'::text,
    'feature'::text,
    'route'::text,
    'liveblocks'::text
  ])) NOT VALID;

ALTER TABLE public.organization_policies
  VALIDATE CONSTRAINT organization_policies_resource_type_check;

-- STEP 2: Seed global default ALLOW policies for Liveblocks room types.
-- org_id IS NULL → applies to every organization as a baseline.
-- Org admins can override with org-specific or DENY policies.
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  -- Deal rooms: all org members get full access by default
  (NULL, 'liveblocks', 'room:deal', 'all', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":true,"conditions":[{"field":"org_role","operator":"is","values":["*"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":true,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_role","operator":"is","values":["*"]}]}],"conditions":[{"field":"org_role","operator":"is","values":["*"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb),

  -- Deal task rooms: all org members get full access by default
  (NULL, 'liveblocks', 'room:deal_task', 'all', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":true,"conditions":[{"field":"org_role","operator":"is","values":["*"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":true,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_role","operator":"is","values":["*"]}]}],"conditions":[{"field":"org_role","operator":"is","values":["*"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb),

  -- Email template rooms: all org members get full access by default
  (NULL, 'liveblocks', 'room:email_template', 'all', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":true,"conditions":[{"field":"org_role","operator":"is","values":["*"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":true,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_role","operator":"is","values":["*"]}]}],"conditions":[{"field":"org_role","operator":"is","values":["*"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL
DO NOTHING;

COMMIT;
