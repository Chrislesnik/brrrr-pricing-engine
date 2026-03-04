-- =====================================================
-- Migration: Seed default org policies + auto-creation trigger
-- Date: 2026-02-10
-- Description:
--   1. Seed global default policies (org_id IS NULL) as baseline
--   2. Create trigger function to auto-create per-org defaults on org insert
--   3. Backfill existing organizations with default policies
--
-- Default Policy Rules:
--   A) Internal org + Admin/Owner   → full CRUD
--   B) Internal org + Non-admin     → CRU (no Delete)
--   C) External org + Admin/Owner   → CRU (no Delete)
--   D) External org + Non-admin     → CRU (no Delete)
--
-- NOTE: Row-level scoping (C: org+user records, D: user records only)
-- is a future enhancement requiring per-table column awareness.
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Compiled configs for each default policy type
-- =====================================================

-- CRU policy: All org members get select/insert/update
-- Matches org_role in (owner, admin, member, broker)
-- This covers the CRU part of rules A, B, C, D

-- Delete policy: Only internal admins/owners
-- Matches org_type=internal AND org_role in (admin, owner)
-- This covers rule A only

-- =====================================================
-- PART 2: Trigger function for auto-creating defaults
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
  -- CRU compiled config (matches all org members)
  v_cru_compiled := jsonb_build_object(
    'version', 2,
    'allow_internal_users', false,
    'connector', 'OR',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('owner', 'admin', 'member', 'broker')
      )
    )
  );

  v_cru_definition := jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', false,
    'connector', 'OR',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('owner', 'admin', 'member', 'broker')
      )
    )
  );

  -- Delete compiled config (internal admins/owners only)
  v_del_compiled := jsonb_build_object(
    'version', 2,
    'allow_internal_users', false,
    'connector', 'AND',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_type',
        'operator', 'is',
        'values', jsonb_build_array('internal')
      ),
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    )
  );

  v_del_definition := jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', false,
    'connector', 'AND',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_type',
        'operator', 'is',
        'values', jsonb_build_array('internal')
      ),
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    )
  );

  -- Create policies for both resource types
  FOREACH v_resource_type IN ARRAY ARRAY['table', 'storage_bucket']
  LOOP
    -- CRU policies (select, insert, update)
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update']
    LOOP
      INSERT INTO public.organization_policies (
        org_id, resource_type, resource_name, action,
        definition_json, compiled_config, version, is_active,
        created_by_clerk_sub
      ) VALUES (
        NEW.id, v_resource_type, '*', v_action,
        v_cru_definition, v_cru_compiled, 1, true,
        'system'
      )
      ON CONFLICT (org_id, resource_type, resource_name, action)
      DO NOTHING;
    END LOOP;

    -- Delete policy (internal admins/owners only)
    INSERT INTO public.organization_policies (
      org_id, resource_type, resource_name, action,
      definition_json, compiled_config, version, is_active,
      created_by_clerk_sub
    ) VALUES (
      NEW.id, v_resource_type, '*', 'delete',
      v_del_definition, v_del_compiled, 1, true,
      'system'
    )
    ON CONFLICT (org_id, resource_type, resource_name, action)
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 3: Attach trigger to organizations table
-- =====================================================
DROP TRIGGER IF EXISTS trg_create_default_org_policies ON public.organizations;

CREATE TRIGGER trg_create_default_org_policies
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_org_policies();

-- =====================================================
-- PART 4: Seed global defaults (org_id IS NULL)
-- These serve as fallback for orgs that somehow have
-- no org-specific policies.
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
  v_cru_compiled := jsonb_build_object(
    'version', 2,
    'allow_internal_users', false,
    'connector', 'OR',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('owner', 'admin', 'member', 'broker')
      )
    )
  );

  v_cru_definition := jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', false,
    'connector', 'OR',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('owner', 'admin', 'member', 'broker')
      )
    )
  );

  v_del_compiled := jsonb_build_object(
    'version', 2,
    'allow_internal_users', false,
    'connector', 'AND',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_type',
        'operator', 'is',
        'values', jsonb_build_array('internal')
      ),
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    )
  );

  v_del_definition := jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', false,
    'connector', 'AND',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_type',
        'operator', 'is',
        'values', jsonb_build_array('internal')
      ),
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    )
  );

  FOREACH v_resource_type IN ARRAY ARRAY['table', 'storage_bucket']
  LOOP
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update']
    LOOP
      INSERT INTO public.organization_policies (
        org_id, resource_type, resource_name, action,
        definition_json, compiled_config, version, is_active,
        created_by_clerk_sub
      ) VALUES (
        NULL, v_resource_type, '*', v_action,
        v_cru_definition, v_cru_compiled, 1, true,
        'system'
      );
    END LOOP;

    INSERT INTO public.organization_policies (
      org_id, resource_type, resource_name, action,
      definition_json, compiled_config, version, is_active,
      created_by_clerk_sub
    ) VALUES (
      NULL, v_resource_type, '*', 'delete',
      v_del_definition, v_del_compiled, 1, true,
      'system'
    );
  END LOOP;
END $$;

-- =====================================================
-- PART 5: Backfill existing organizations
-- Create default policies for orgs that don't have any
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
  v_cru_compiled := jsonb_build_object(
    'version', 2,
    'allow_internal_users', false,
    'connector', 'OR',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('owner', 'admin', 'member', 'broker')
      )
    )
  );

  v_cru_definition := jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', false,
    'connector', 'OR',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('owner', 'admin', 'member', 'broker')
      )
    )
  );

  v_del_compiled := jsonb_build_object(
    'version', 2,
    'allow_internal_users', false,
    'connector', 'AND',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_type',
        'operator', 'is',
        'values', jsonb_build_array('internal')
      ),
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    )
  );

  v_del_definition := jsonb_build_object(
    'version', 2,
    'effect', 'ALLOW',
    'allow_internal_users', false,
    'connector', 'AND',
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'org_type',
        'operator', 'is',
        'values', jsonb_build_array('internal')
      ),
      jsonb_build_object(
        'field', 'org_role',
        'operator', 'is',
        'values', jsonb_build_array('admin', 'owner')
      )
    )
  );

  FOR v_org IN
    SELECT o.id
    FROM public.organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organization_policies p
      WHERE p.org_id = o.id
    )
  LOOP
    FOREACH v_resource_type IN ARRAY ARRAY['table', 'storage_bucket']
    LOOP
      FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update']
      LOOP
        INSERT INTO public.organization_policies (
          org_id, resource_type, resource_name, action,
          definition_json, compiled_config, version, is_active,
          created_by_clerk_sub
        ) VALUES (
          v_org.id, v_resource_type, '*', v_action,
          v_cru_definition, v_cru_compiled, 1, true,
          'system'
        )
        ON CONFLICT (org_id, resource_type, resource_name, action)
        DO NOTHING;
      END LOOP;

      INSERT INTO public.organization_policies (
        org_id, resource_type, resource_name, action,
        definition_json, compiled_config, version, is_active,
        created_by_clerk_sub
      ) VALUES (
        v_org.id, v_resource_type, '*', 'delete',
        v_del_definition, v_del_compiled, 1, true,
        'system'
      )
      ON CONFLICT (org_id, resource_type, resource_name, action)
      DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

COMMIT;

-- =====================================================
-- Summary of what this migration creates:
--
-- Global defaults (org_id IS NULL): 8 rows
--   - table * select:  CRU for all org members
--   - table * insert:  CRU for all org members
--   - table * update:  CRU for all org members
--   - table * delete:  Internal admins/owners only
--   - storage_bucket * select:  CRU for all org members
--   - storage_bucket * insert:  CRU for all org members
--   - storage_bucket * update:  CRU for all org members
--   - storage_bucket * delete:  Internal admins/owners only
--
-- Per-org defaults (created via trigger): 8 rows per org
--   Same structure as global defaults
--
-- Trigger: trg_create_default_org_policies
--   Fires AFTER INSERT on organizations
--   Creates 8 default policy rows for the new org
--
-- NOTE: Row-level scoping for external orgs (policy C/D)
-- is a future enhancement. Currently:
--   C (external admin)     → CRU at table level
--   D (external non-admin) → CRU at table level
-- Future: C scopes to org_id + user_id rows, D scopes to user_id only
-- =====================================================
