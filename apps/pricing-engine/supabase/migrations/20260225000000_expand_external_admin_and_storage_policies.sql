-- =====================================================
-- Migration: Expand permissions for external admins and storage access
-- Date: 2026-02-25
-- Description:
--   PART 1 — Feature: Add Tier 3 (external admin/owner) to UPDATE rules
--            for settings_members, settings_domains, settings_themes.
--            Add Tier 3 to DELETE rules for settings_domains, settings_themes.
--   PART 2 — Storage: Add Tier 2 (internal member) and Tier 3 (external
--            admin/owner) to storage_bucket:* SELECT and INSERT.
--
-- Architecture: Each global policy row (org_id IS NULL) encodes multiple
-- tiers as V3 "rules" entries. This migration UPDATEs existing rows to
-- append new rules.
-- =====================================================

BEGIN;

DO $$
DECLARE
  -- ────────────────────────────────────────────────────
  -- Shared condition & rule fragments
  -- ────────────────────────────────────────────────────
  v_cond_internal  JSONB := '{"field":"org_type","operator":"is","values":["internal"]}'::jsonb;
  v_cond_external  JSONB := '{"field":"org_type","operator":"is","values":["external"]}'::jsonb;
  v_cond_admin_own JSONB := '{"field":"org_role","operator":"is","values":["admin","owner"]}'::jsonb;
  v_cond_member    JSONB := '{"field":"org_role","operator":"is","values":["member"]}'::jsonb;

  -- Tier 1: internal admin/owner → scope all
  v_rule_t1 JSONB := jsonb_build_object(
    'connector','AND','scope','all',
    'conditions', jsonb_build_array(v_cond_internal, v_cond_admin_own)
  );
  -- Tier 2: internal member → scope org_records
  v_rule_t2 JSONB := jsonb_build_object(
    'connector','AND','scope','org_records',
    'conditions', jsonb_build_array(v_cond_internal, v_cond_member)
  );
  -- Tier 3: external admin/owner → scope org_records
  v_rule_t3 JSONB := jsonb_build_object(
    'connector','AND','scope','org_records',
    'conditions', jsonb_build_array(v_cond_external, v_cond_admin_own)
  );

  -- ────────────────────────────────────────────────────
  -- Compiled config blobs
  -- ────────────────────────────────────────────────────

  -- Tier 1 + Tier 3 (for UPDATE settings_members, settings_domains, settings_themes)
  v_t1_t3_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t3)
  );
  v_t1_t3_def JSONB := v_t1_t3_cc || '{"effect":"ALLOW"}'::jsonb;

  -- Tier 1 only (unchanged, for reference)
  v_t1_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1)
  );

  -- Tier 1 + Tier 2 + Tier 3 (for storage_bucket:* SELECT and INSERT)
  v_t1_t2_t3_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t2, v_rule_t3)
  );
  v_t1_t2_t3_def JSONB := v_t1_t2_t3_cc || '{"effect":"ALLOW"}'::jsonb;

  feature_name text;
BEGIN

  -- ============================================================
  -- PART 1: Feature settings — expand CRUD for external admins
  -- ============================================================

  -- 1A. UPDATE action for settings_members, settings_domains, settings_themes
  --     Add Tier 3 (external admin/owner) alongside existing Tier 1
  FOREACH feature_name IN ARRAY ARRAY[
    'settings_members', 'settings_domains', 'settings_themes'
  ] LOOP
    UPDATE public.organization_policies SET
      definition_json = v_t1_t3_def,
      compiled_config = v_t1_t3_cc,
      version         = version + 1
    WHERE org_id IS NULL
      AND resource_type = 'feature'
      AND resource_name = feature_name
      AND action = 'update';
  END LOOP;

  -- 1B. DELETE action for settings_domains, settings_themes
  --     Add Tier 3 (external admin/owner) alongside existing Tier 1
  FOREACH feature_name IN ARRAY ARRAY[
    'settings_domains', 'settings_themes'
  ] LOOP
    UPDATE public.organization_policies SET
      definition_json = v_t1_t3_def,
      compiled_config = v_t1_t3_cc,
      version         = version + 1
    WHERE org_id IS NULL
      AND resource_type = 'feature'
      AND resource_name = feature_name
      AND action = 'delete';
  END LOOP;

  -- ============================================================
  -- PART 2: Storage buckets — expand access for Tier 2 & Tier 3
  -- ============================================================

  -- 2A. storage_bucket:* SELECT — add Tier 2 (internal member) + Tier 3 (external admin/owner)
  UPDATE public.organization_policies SET
    definition_json = v_t1_t2_t3_def,
    compiled_config = v_t1_t2_t3_cc,
    version         = version + 1
  WHERE org_id IS NULL
    AND resource_type = 'storage_bucket'
    AND resource_name = '*'
    AND action = 'select';

  -- 2B. storage_bucket:* INSERT — add Tier 2 + Tier 3
  UPDATE public.organization_policies SET
    definition_json = v_t1_t2_t3_def,
    compiled_config = v_t1_t2_t3_cc,
    version         = version + 1
  WHERE org_id IS NULL
    AND resource_type = 'storage_bucket'
    AND resource_name = '*'
    AND action = 'insert';

  -- NOTE: UPDATE and DELETE on storage_bucket remain Tier 1 only (internal admin/owner).
  -- Internal members and external admins can view and upload but not modify or delete files.

END $$;

-- ============================================================
-- PART 3: External member deal-scoped table access
--         Add Tier 5 rule: external member → named:deal_participant
--         SELECT, INSERT, UPDATE only (no DELETE)
-- ============================================================

DO $$
DECLARE
  v_rule_t5 JSONB := jsonb_build_object(
    'connector', 'AND',
    'scope', 'named:deal_participant',
    'conditions', jsonb_build_array(
      jsonb_build_object('field', 'org_type', 'operator', 'is', 'values', jsonb_build_array('external')),
      jsonb_build_object('field', 'org_role', 'operator', 'is', 'values', jsonb_build_array('member'))
    ),
    'named_scope_conditions', jsonb_build_array(
      jsonb_build_object('name', 'deal_participant')
    )
  );
BEGIN
  UPDATE public.organization_policies SET
    compiled_config = jsonb_set(
      compiled_config,
      '{rules}',
      (compiled_config->'rules') || jsonb_build_array(v_rule_t5)
    ),
    definition_json = CASE
      WHEN definition_json ? 'rules' THEN
        jsonb_set(
          definition_json,
          '{rules}',
          (definition_json->'rules') || jsonb_build_array(v_rule_t5 || jsonb_build_object('effect', 'ALLOW'))
        )
      ELSE definition_json
    END,
    version = version + 1
  WHERE org_id IS NULL
    AND resource_type = 'table'
    AND resource_name = '*'
    AND action IN ('select', 'insert', 'update');
END $$;

COMMIT;
