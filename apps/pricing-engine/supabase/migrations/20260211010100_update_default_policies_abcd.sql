-- =====================================================
-- Migration: Update default policies to v3 A/B/C/D with scopes
-- Date: 2026-02-11
-- Description:
--   Replace existing default policies with v3 format containing
--   4 rule groups (A/B/C/D) with per-rule scopes.
--
--   CRU policies (select/insert/update):
--     A: internal + admin/owner -> scope=all
--     B: internal + non-admin  -> scope=all
--     C: external + admin/owner -> scope=org_and_user
--     D: external + non-admin  -> scope=user_records
--
--   Delete policy:
--     A only: internal + admin/owner -> scope=all
-- =====================================================

BEGIN;

-- =====================================================
-- Helper: build the v3 compiled configs as variables
-- =====================================================

-- CRU config (4 rules: A, B, C, D)
-- Delete config (1 rule: A only)

-- =====================================================
-- STEP 1: Delete all existing system-seeded policies
-- =====================================================
DELETE FROM public.organization_policies
WHERE created_by_clerk_sub = 'system';

-- =====================================================
-- STEP 2: Replace trigger function with v3 format
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_default_org_policies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cru_compiled jsonb;
  v_cru_definition jsonb;
  v_del_compiled jsonb;
  v_del_definition jsonb;
  v_action text;
  v_resource_type text;
BEGIN
  -- V3 CRU compiled config: 4 rules with scopes
  v_cru_compiled := '{
    "version": 3,
    "rules": [
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "all"
      },
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is_not", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "all"
      },
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "org_and_user"
      },
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is_not", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "user_records"
      }
    ]
  }'::jsonb;

  v_cru_definition := v_cru_compiled || '{"effect": "ALLOW"}'::jsonb;

  -- V3 Delete compiled config: only rule A
  v_del_compiled := '{
    "version": 3,
    "rules": [
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "all"
      }
    ]
  }'::jsonb;

  v_del_definition := v_del_compiled || '{"effect": "ALLOW"}'::jsonb;

  -- Create policies for both resource types
  FOREACH v_resource_type IN ARRAY ARRAY['table', 'storage_bucket']
  LOOP
    -- CRU policies
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update']
    LOOP
      INSERT INTO public.organization_policies (
        org_id, resource_type, resource_name, action,
        definition_json, compiled_config, version, is_active,
        scope, created_by_clerk_sub
      ) VALUES (
        NEW.id, v_resource_type, '*', v_action,
        v_cru_definition, v_cru_compiled, 1, true,
        'all', 'system'
      )
      ON CONFLICT (org_id, resource_type, resource_name, action)
      DO NOTHING;
    END LOOP;

    -- Delete policy
    INSERT INTO public.organization_policies (
      org_id, resource_type, resource_name, action,
      definition_json, compiled_config, version, is_active,
      scope, created_by_clerk_sub
    ) VALUES (
      NEW.id, v_resource_type, '*', 'delete',
      v_del_definition, v_del_compiled, 1, true,
      'all', 'system'
    )
    ON CONFLICT (org_id, resource_type, resource_name, action)
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: Seed global defaults (org_id IS NULL)
-- =====================================================
DO $$
DECLARE
  v_cru_compiled jsonb;
  v_cru_definition jsonb;
  v_del_compiled jsonb;
  v_del_definition jsonb;
  v_action text;
  v_resource_type text;
BEGIN
  v_cru_compiled := '{
    "version": 3,
    "rules": [
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "all"
      },
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is_not", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "all"
      },
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "org_and_user"
      },
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["external"]},
          {"field": "org_role", "operator": "is_not", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "user_records"
      }
    ]
  }'::jsonb;

  v_cru_definition := v_cru_compiled || '{"effect": "ALLOW"}'::jsonb;

  v_del_compiled := '{
    "version": 3,
    "rules": [
      {
        "conditions": [
          {"field": "org_type", "operator": "is", "values": ["internal"]},
          {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}
        ],
        "connector": "AND",
        "scope": "all"
      }
    ]
  }'::jsonb;

  v_del_definition := v_del_compiled || '{"effect": "ALLOW"}'::jsonb;

  FOREACH v_resource_type IN ARRAY ARRAY['table', 'storage_bucket']
  LOOP
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update']
    LOOP
      INSERT INTO public.organization_policies (
        org_id, resource_type, resource_name, action,
        definition_json, compiled_config, version, is_active,
        scope, created_by_clerk_sub
      ) VALUES (
        NULL, v_resource_type, '*', v_action,
        v_cru_definition, v_cru_compiled, 1, true,
        'all', 'system'
      );
    END LOOP;

    INSERT INTO public.organization_policies (
      org_id, resource_type, resource_name, action,
      definition_json, compiled_config, version, is_active,
      scope, created_by_clerk_sub
    ) VALUES (
      NULL, v_resource_type, '*', 'delete',
      v_del_definition, v_del_compiled, 1, true,
      'all', 'system'
    );
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: Backfill existing organizations
-- =====================================================
DO $$
DECLARE
  v_org record;
  v_cru_compiled jsonb;
  v_cru_definition jsonb;
  v_del_compiled jsonb;
  v_del_definition jsonb;
  v_action text;
  v_resource_type text;
BEGIN
  v_cru_compiled := '{
    "version": 3,
    "rules": [
      {"conditions": [{"field": "org_type", "operator": "is", "values": ["internal"]}, {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}], "connector": "AND", "scope": "all"},
      {"conditions": [{"field": "org_type", "operator": "is", "values": ["internal"]}, {"field": "org_role", "operator": "is_not", "values": ["admin", "owner"]}], "connector": "AND", "scope": "all"},
      {"conditions": [{"field": "org_type", "operator": "is", "values": ["external"]}, {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}], "connector": "AND", "scope": "org_and_user"},
      {"conditions": [{"field": "org_type", "operator": "is", "values": ["external"]}, {"field": "org_role", "operator": "is_not", "values": ["admin", "owner"]}], "connector": "AND", "scope": "user_records"}
    ]
  }'::jsonb;
  v_cru_definition := v_cru_compiled || '{"effect": "ALLOW"}'::jsonb;

  v_del_compiled := '{
    "version": 3,
    "rules": [
      {"conditions": [{"field": "org_type", "operator": "is", "values": ["internal"]}, {"field": "org_role", "operator": "is", "values": ["admin", "owner"]}], "connector": "AND", "scope": "all"}
    ]
  }'::jsonb;
  v_del_definition := v_del_compiled || '{"effect": "ALLOW"}'::jsonb;

  FOR v_org IN
    SELECT o.id FROM public.organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organization_policies p WHERE p.org_id = o.id
    )
  LOOP
    FOREACH v_resource_type IN ARRAY ARRAY['table', 'storage_bucket']
    LOOP
      FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update']
      LOOP
        INSERT INTO public.organization_policies (
          org_id, resource_type, resource_name, action,
          definition_json, compiled_config, version, is_active,
          scope, created_by_clerk_sub
        ) VALUES (
          v_org.id, v_resource_type, '*', v_action,
          v_cru_definition, v_cru_compiled, 1, true, 'all', 'system'
        ) ON CONFLICT (org_id, resource_type, resource_name, action) DO NOTHING;
      END LOOP;

      INSERT INTO public.organization_policies (
        org_id, resource_type, resource_name, action,
        definition_json, compiled_config, version, is_active,
        scope, created_by_clerk_sub
      ) VALUES (
        v_org.id, v_resource_type, '*', 'delete',
        v_del_definition, v_del_compiled, 1, true, 'all', 'system'
      ) ON CONFLICT (org_id, resource_type, resource_name, action) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
