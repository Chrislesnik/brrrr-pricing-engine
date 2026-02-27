-- =====================================================
-- Migration: Expand deal room R1 deal roles, add deal_task
--            and email_template scoped policies
-- Date: 2026-02-24
-- Description:
--   1. room:deal — update R1 deal_role_type_ids to [6,5,19]
--      (Account Executive, Loan Processor, Loan Opener)
--   2. room:deal_task — deactivate ALL/ALL seed, create scoped policies
--   3. room:email_template — deactivate ALL/ALL seed, create role-based policies
-- =====================================================

BEGIN;

-- ═════════════════════════════════════════════════════
-- SECTION 1: room:deal — expand R1 deal role filter
-- ═════════════════════════════════════════════════════

-- room_read: 3 rules
UPDATE public.organization_policies
SET compiled_config = '{
    "version": 3,
    "allow_internal_users": false,
    "rules": [
      {
        "connector": "AND",
        "scope": "all",
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is", "values": ["member"]}
        ],
        "room_scope": {"level": "user", "deal_role_type_ids": [6, 5, 19]}
      },
      {
        "connector": "AND",
        "scope": "all",
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is", "values": ["owner", "admin", "member"]},
          {"field": "member_role", "operator": "is", "values": ["broker"]}
        ],
        "room_scope": {"level": "user", "deal_role_type_ids": null}
      },
      {
        "connector": "AND",
        "scope": "all",
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is", "values": ["owner", "admin"]}
        ],
        "room_scope": {"level": "org", "deal_role_type_ids": null}
      }
    ]
  }'::jsonb
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:deal'
  AND action = 'room_read'
  AND org_id IS NULL;

-- room_presence_write: 3 rules
UPDATE public.organization_policies
SET compiled_config = '{
    "version": 3,
    "allow_internal_users": false,
    "rules": [
      {
        "connector": "AND",
        "scope": "all",
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is", "values": ["member"]}
        ],
        "room_scope": {"level": "user", "deal_role_type_ids": [6, 5, 19]}
      },
      {
        "connector": "AND",
        "scope": "all",
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is", "values": ["owner", "admin", "member"]},
          {"field": "member_role", "operator": "is", "values": ["broker"]}
        ],
        "room_scope": {"level": "user", "deal_role_type_ids": null}
      },
      {
        "connector": "AND",
        "scope": "all",
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is", "values": ["owner", "admin"]}
        ],
        "room_scope": {"level": "org", "deal_role_type_ids": null}
      }
    ]
  }'::jsonb
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:deal'
  AND action = 'room_presence_write'
  AND org_id IS NULL;

-- ═════════════════════════════════════════════════════
-- SECTION 2: room:deal_task — deactivate seed, create scoped
-- ═════════════════════════════════════════════════════

-- Deactivate the overly permissive ALL/ALL seed
UPDATE public.organization_policies
SET is_active = false
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:deal_task'
  AND action = 'all'
  AND org_id IS NULL;

-- room_write: internal admin/owner, org-level (all deal tasks)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:deal_task', 'room_write', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["owner","admin"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- room_read: 3 rules (same structure as room:deal)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:deal_task', 'room_read', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["member"]}
    ],"room_scope":{"level":"user","deal_role_type_ids":[6,5,19]}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin","member"]},
      {"field":"member_role","operator":"is","values":["broker"]}
    ],"room_scope":{"level":"user","deal_role_type_ids":null}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- room_presence_write: 3 rules (same structure as room:deal)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:deal_task', 'room_presence_write', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["member"]}
    ],"room_scope":{"level":"user","deal_role_type_ids":[6,5,19]}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin","member"]},
      {"field":"member_role","operator":"is","values":["broker"]}
    ],"room_scope":{"level":"user","deal_role_type_ids":null}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- ═════════════════════════════════════════════════════
-- SECTION 3: room:email_template — deactivate seed, create role-based
-- Email templates are org-scoped, not deal-scoped.
-- room_scope.level = "org" for external users means
-- "only templates belonging to the user's org".
-- ═════════════════════════════════════════════════════

-- Deactivate the overly permissive ALL/ALL seed
UPDATE public.organization_policies
SET is_active = false
WHERE resource_type = 'liveblocks'
  AND resource_name = 'room:email_template'
  AND action = 'all'
  AND org_id IS NULL;

-- room_write: 2 rules
--   R1: Internal admin/owner → full editor access
--   R2: External admin/owner (broker member role) → full editor access, org-scoped
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:email_template', 'room_write', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["owner","admin"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin"]},
      {"field":"member_role","operator":"is","values":["admin","owner","broker"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- room_read: 2 rules
--   R1: All internal members → can view any template
--   R2: All external members → can view their org's templates (org-scoped)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:email_template', 'room_read', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["owner","admin","member"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin","member"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- room_presence_write: 2 rules (same as room_read)
--   R1: All internal members
--   R2: All external members, org-scoped
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:email_template', 'room_presence_write', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["owner","admin","member"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}},
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["external"]},
      {"field":"org_role","operator":"is","values":["owner","admin","member"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

COMMIT;
