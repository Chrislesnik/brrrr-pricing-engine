-- =====================================================
-- Migration: Seed proper Liveblocks deal room policies with room_scope
-- Date: 2026-02-24
-- Description:
--   1. Deactivate the global room:deal ALL/ALL seed (it overrides all scoped policies)
--   2. Add room_scope to existing org-specific broker policies so sync functions work
--   3. Create global scoped policies for the 4 core deal room use cases
-- =====================================================

BEGIN;

-- ─────────────────────────────────────────────────────
-- STEP 1: Deactivate the overly permissive global deal room seed.
-- With Org Role = * and action = all, it gives everyone full write
-- access and makes all scoped policies redundant.
-- ─────────────────────────────────────────────────────
UPDATE public.organization_policies
SET is_active = false
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:deal'
  AND action = 'all'
  AND org_id IS NULL;

-- ─────────────────────────────────────────────────────
-- STEP 2: Add room_scope to existing org-specific broker policies.
-- These were created before room_scope existed and are currently
-- ignored by syncDealRoomPermissions / syncOrgAdminDealRoomPermissions.
-- ─────────────────────────────────────────────────────

-- Broker ROOM_PRESENCE_WRITE → user-level scope (deals where the broker holds a deal role)
UPDATE public.organization_policies
SET
  definition_json = definition_json || '{"room_scope": {"level": "user", "deal_role_type_ids": null}}'::jsonb,
  compiled_config = compiled_config || '{"room_scope": {"level": "user", "deal_role_type_ids": null}}'::jsonb
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:deal'
  AND action = 'room_presence_write'
  AND org_id IS NOT NULL
  AND definition_json->'conditions' @> '[{"field": "member_role", "values": ["broker"]}]'::jsonb
  AND (definition_json->'room_scope') IS NULL;

-- Broker ROOM_READ → org-level scope (deals where any org member holds a deal role)
UPDATE public.organization_policies
SET
  definition_json = definition_json || '{"room_scope": {"level": "org", "deal_role_type_ids": null}}'::jsonb,
  compiled_config = compiled_config || '{"room_scope": {"level": "org", "deal_role_type_ids": null}}'::jsonb
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:deal'
  AND action = 'room_read'
  AND org_id IS NOT NULL
  AND definition_json->'conditions' @> '[{"field": "member_role", "values": ["broker"]}]'::jsonb
  AND (definition_json->'room_scope') IS NULL;

-- ─────────────────────────────────────────────────────
-- STEP 3: Create global scoped policies (org_id IS NULL) for deal rooms.
-- These act as sensible defaults that any org can override.
-- ─────────────────────────────────────────────────────

-- 3a. Internal admin/owner → ROOM_WRITE on all deal rooms (org-level)
-- Use case: Internal org admins need full write access to all deal rooms.
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_write', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"org","deal_role_type_ids":null}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"room_scope":{"level":"org","deal_role_type_ids":null}}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"org","deal_role_type_ids":null}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- 3b. Internal member → ROOM_READ on deals where they hold the Account Executive role (user-level)
-- deal_role_type_ids = [6] (Account Executive)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_read', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["member"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":[6]}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["member"]}],"room_scope":{"level":"user","deal_role_type_ids":[6]}}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["member"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":[6]}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- 3c. Internal member → ROOM_PRESENCE_WRITE on deals where they hold the Account Executive role (user-level)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_presence_write', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["member"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":[6]}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["member"]}],"room_scope":{"level":"user","deal_role_type_ids":[6]}}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["member"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":[6]}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- 3d. External broker → ROOM_READ on deals where they hold any deal role (user-level)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_read', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin","member"]},{"field":"member_role","operator":"is","values":["broker"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":null}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin","member"]},{"field":"member_role","operator":"is","values":["broker"]}],"room_scope":{"level":"user","deal_role_type_ids":null}}],"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin","member"]},{"field":"member_role","operator":"is","values":["broker"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":null}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- 3e. External broker → ROOM_PRESENCE_WRITE on deals where they hold any deal role (user-level)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_presence_write', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin","member"]},{"field":"member_role","operator":"is","values":["broker"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":null}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin","member"]},{"field":"member_role","operator":"is","values":["broker"]}],"room_scope":{"level":"user","deal_role_type_ids":null}}],"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin","member"]},{"field":"member_role","operator":"is","values":["broker"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"user","deal_role_type_ids":null}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- 3f. External admin/owner → ROOM_READ on all deal rooms where any org member holds a deal role (org-level)
-- Use case: External org admins want oversight of all deals involving their org's members.
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_read', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"org","deal_role_type_ids":null}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"room_scope":{"level":"org","deal_role_type_ids":null}}],"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"org","deal_role_type_ids":null}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- 3g. External admin/owner → ROOM_PRESENCE_WRITE on all deal rooms where any org member holds a deal role (org-level)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'liveblocks', 'room:deal', 'room_presence_write', 'all', 'ALLOW', true, false, 1,
   '{"version":3,"effect":"ALLOW","connector":"AND","scope":"all","allow_internal_users":false,"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"org","deal_role_type_ids":null}}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"room_scope":{"level":"org","deal_role_type_ids":null}}],"conditions":[{"field":"org_type","operator":"is","values":["external"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR","room_scope":{"level":"org","deal_role_type_ids":null}}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

COMMIT;
