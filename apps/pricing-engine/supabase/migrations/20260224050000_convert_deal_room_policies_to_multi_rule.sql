-- =====================================================
-- Migration: Convert global deal room policies to multi-rule
-- Date: 2026-02-24
-- Description:
--   The unique constraint on (resource_type, resource_name, action)
--   WHERE org_id IS NULL means only one global row per action.
--   To support both internal and external use cases, each row's
--   compiled_config.rules[] must contain multiple rules.
--
--   room_read:  3 rules (internal member/AE, external broker, external admin)
--   room_presence_write: 3 rules (internal member/AE, external broker, external admin)
--   room_write: 1 rule (internal admin — unchanged)
-- =====================================================

BEGIN;

-- ─────────────────────────────────────────────────────
-- room_read: 3 rules
--   Rule 1: Internal member → user-level, AE deal role (id=6)
--   Rule 2: External broker (any org role) → user-level, any deal role
--   Rule 3: External admin/owner → org-level, any deal role
-- ─────────────────────────────────────────────────────
UPDATE public.organization_policies
SET
  definition_json = '{
    "version": 3,
    "effect": "ALLOW",
    "allow_internal_users": false,
    "scope": "all",
    "scope_conditions": [],
    "scope_connector": "OR"
  }'::jsonb,
  compiled_config = '{
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
        "room_scope": {"level": "user", "deal_role_type_ids": [6]}
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

-- ─────────────────────────────────────────────────────
-- room_presence_write: 3 rules
--   Rule 1: Internal member → user-level, AE deal role (id=6)
--   Rule 2: External broker (any org role) → user-level, any deal role
--   Rule 3: External admin/owner → org-level, any deal role
-- ─────────────────────────────────────────────────────
UPDATE public.organization_policies
SET
  definition_json = '{
    "version": 3,
    "effect": "ALLOW",
    "allow_internal_users": false,
    "scope": "all",
    "scope_conditions": [],
    "scope_connector": "OR"
  }'::jsonb,
  compiled_config = '{
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
        "room_scope": {"level": "user", "deal_role_type_ids": [6]}
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

COMMIT;
