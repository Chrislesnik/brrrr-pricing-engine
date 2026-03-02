-- =====================================================
-- Migration: Seed Liveblocks room:appraisal scoped policies
-- Date: 2026-02-25
-- Description:
--   Creates global scoped policies (org_id IS NULL) for appraisal rooms
--   following the same pattern used for room:deal, room:deal_task, and
--   room:email_template.
--
--   Policies:
--     room_write          — internal admin/owner, org-level
--     room_read           — internal member (user-level), external broker
--                           (user-level), external admin/owner (org-level)
--     room_presence_write — same tiers as room_read
-- =====================================================

BEGIN;

-- room_write: internal admin/owner → full editor access on all appraisal rooms (org-level)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:appraisal', 'room_write', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["owner","admin"]}
    ],"room_scope":{"level":"org","deal_role_type_ids":null}}
  ]}'::jsonb)
ON CONFLICT (resource_type, resource_name, action, effect) WHERE org_id IS NULL DO NOTHING;

-- room_read: 3 rules
--   R1: Internal member → user-level (appraisals where user holds a role)
--   R2: External broker → user-level
--   R3: External admin/owner → org-level (all appraisals involving org members)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:appraisal', 'room_read', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["member"]}
    ],"room_scope":{"level":"user","deal_role_type_ids":null}},
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
ON CONFLICT (resource_type, resource_name, action, effect) WHERE org_id IS NULL DO NOTHING;

-- room_presence_write: 3 rules (same tiers as room_read)
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES (NULL, 'liveblocks', 'room:appraisal', 'room_presence_write', 'all', 'ALLOW', true, false, 1,
  '{"version":3,"effect":"ALLOW","allow_internal_users":false,"scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb,
  '{"version":3,"allow_internal_users":false,"rules":[
    {"connector":"AND","scope":"all","conditions":[
      {"field":"org_type","operator":"is","values":["internal"]},
      {"field":"org_role","operator":"is","values":["member"]}
    ],"room_scope":{"level":"user","deal_role_type_ids":null}},
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
ON CONFLICT (resource_type, resource_name, action, effect) WHERE org_id IS NULL DO NOTHING;

COMMIT;
