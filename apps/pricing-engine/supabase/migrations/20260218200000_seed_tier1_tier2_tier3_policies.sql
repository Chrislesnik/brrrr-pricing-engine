-- ============================================================
-- Migration: Tier 1–3 Permission Policy Implementation
-- Date: 2026-02-18
--
-- TIER 1 — Internal Org Admin/Owner: full CRUD on everything
-- TIER 2 — Internal Org Member:      SELECT/INSERT/UPDATE, org-scoped (no delete)
-- TIER 3 — External Org Admin/Owner: SELECT/INSERT/UPDATE, org-scoped (no delete)
--
-- REVISED POLICY 3B: permanent_delete is INTERNAL ADMIN/OWNER ONLY.
-- External orgs never receive permanent_delete permission.
--
-- Architecture notes:
--   • The partial unique index (idx_organization_policies_global_unique) allows
--     only ONE global row (org_id IS NULL) per (resource_type, resource_name, action).
--     All tiers are therefore encoded as V3 "rules" within that single row.
--   • The policy engine evaluates rules top-to-bottom and returns on first ALLOW match.
--     More-privileged tiers are listed first (Tier 1 → Tier 2 → Tier 3).
--   • Existing global wildcard rows are UPDATEd (not replaced) to inherit their IDs.
--   • is_protected_policy is set to FALSE so admins can manage these from the UI.
-- ============================================================

BEGIN;

DO $$
DECLARE
  -- --------------------------------------------------------
  -- Shared condition fragments
  -- --------------------------------------------------------
  v_cond_internal  JSONB := jsonb_build_object('field','org_type','operator','is','values',jsonb_build_array('internal'));
  v_cond_external  JSONB := jsonb_build_object('field','org_type','operator','is','values',jsonb_build_array('external'));
  v_cond_admin_own JSONB := jsonb_build_object('field','org_role','operator','is','values',jsonb_build_array('admin','owner'));
  v_cond_member    JSONB := jsonb_build_object('field','org_role','operator','is','values',jsonb_build_array('member'));

  -- --------------------------------------------------------
  -- Rule groups (used inside "rules" arrays)
  -- --------------------------------------------------------
  -- Tier 1: internal org admin/owner → full scope
  v_rule_t1 JSONB := jsonb_build_object(
    'connector','AND','scope','all',
    'conditions', jsonb_build_array(v_cond_internal, v_cond_admin_own)
  );
  -- Tier 2: internal org member → org-scoped
  v_rule_t2 JSONB := jsonb_build_object(
    'connector','AND','scope','org_records',
    'conditions', jsonb_build_array(v_cond_internal, v_cond_member)
  );
  -- Tier 3: external org admin/owner → org-scoped
  v_rule_t3 JSONB := jsonb_build_object(
    'connector','AND','scope','org_records',
    'conditions', jsonb_build_array(v_cond_external, v_cond_admin_own)
  );

  -- --------------------------------------------------------
  -- Full compiled_config blobs (no "effect" field)
  -- --------------------------------------------------------

  -- CRU (SELECT/INSERT/UPDATE): Tiers 1 + 2 + 3
  v_cru_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t2, v_rule_t3)
  );

  -- DELETE on data tables: Tier 1 only (internal admin/owner)
  v_del_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1)
  );

  -- Storage buckets: Tier 1 only
  v_storage_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1)
  );

  -- feature:permanent_delete (DELETE): Tier 1 only — INTERNAL ADMIN/OWNER ONLY
  v_permdelete_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1)
  );

  -- feature:organization_invitations SUBMIT: Tier 1 (scope=all) + Tier 3 (scope=org_records)
  v_inv_submit_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t3)
  );

  -- feature:organization_invitations VIEW: Tiers 1 + 2 + 3
  v_inv_view_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t2, v_rule_t3)
  );

  -- Settings features: Tier 1 (all) + Tier 3 (org_records, limited)
  -- Internal members (Tier 2) can view settings_general and settings_members only
  v_settings_full_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t2, v_rule_t3)
  );
  -- Settings restricted to admin/owner tiers only (Tier 1 + Tier 3)
  v_settings_admin_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1, v_rule_t3)
  );
  -- Settings internal-only (policies, programs, inputs, documents, tasks)
  v_settings_internal_cc JSONB := jsonb_build_object(
    'version',3,'allow_internal_users',false,
    'rules', jsonb_build_array(v_rule_t1)
  );

BEGIN

  -- ============================================================
  -- SECTION A: UPDATE existing global table wildcard policies
  -- (These rows already exist and are protected; we update in-place)
  -- ============================================================

  -- table:* SELECT — Tiers 1+2+3
  UPDATE public.organization_policies SET
    definition_json     = v_cru_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_cru_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='table' AND resource_name='*' AND action='select';

  -- table:* INSERT — Tiers 1+2+3
  UPDATE public.organization_policies SET
    definition_json     = v_cru_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_cru_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='table' AND resource_name='*' AND action='insert';

  -- table:* UPDATE — Tiers 1+2+3
  UPDATE public.organization_policies SET
    definition_json     = v_cru_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_cru_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='table' AND resource_name='*' AND action='update';

  -- table:* DELETE — Tier 1 only (internal admin/owner; no delete for external or members)
  UPDATE public.organization_policies SET
    definition_json     = v_del_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_del_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='table' AND resource_name='*' AND action='delete';

  -- ============================================================
  -- SECTION B: UPDATE existing global storage_bucket wildcard policies
  -- ============================================================

  UPDATE public.organization_policies SET
    definition_json     = v_storage_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_storage_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='storage_bucket' AND resource_name='*'
    AND action IN ('select','insert','update','delete');

  -- ============================================================
  -- SECTION C: INSERT feature policies (global, org_id IS NULL)
  -- Uses WHERE NOT EXISTS to respect the partial unique index.
  -- ============================================================

  -- feature:permanent_delete / delete — Tier 1 ONLY (revised Policy 3B)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'permanent_delete', 'delete',
    v_permdelete_cc || jsonb_build_object('effect','ALLOW'),
    v_permdelete_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='permanent_delete' AND action='delete'
  );

  -- feature:organization_invitations / submit
  -- Overwrites existing seeded policy (update compiled_config to V3 multi-tier)
  UPDATE public.organization_policies SET
    definition_json     = v_inv_submit_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_inv_submit_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='feature'
    AND resource_name='organization_invitations' AND action='submit';

  -- Fallback insert if it somehow doesn't exist yet
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'organization_invitations', 'submit',
    v_inv_submit_cc || jsonb_build_object('effect','ALLOW'),
    v_inv_submit_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='organization_invitations' AND action='submit'
  );

  -- feature:organization_invitations / view
  UPDATE public.organization_policies SET
    definition_json     = v_inv_view_cc || jsonb_build_object('effect','ALLOW'),
    compiled_config     = v_inv_view_cc,
    scope               = 'all',
    version             = version + 1,
    is_protected_policy = false
  WHERE org_id IS NULL AND resource_type='feature'
    AND resource_name='organization_invitations' AND action='view';

  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'organization_invitations', 'view',
    v_inv_view_cc || jsonb_build_object('effect','ALLOW'),
    v_inv_view_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='organization_invitations' AND action='view'
  );

  -- ---- Settings features -----------------------------------------------
  -- settings_general: Tier 1 + 2 + 3 (broad access)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_general', 'view',
    v_settings_full_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_full_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_general' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_members: Tier 1 + 2 + 3
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_members', 'view',
    v_settings_full_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_full_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_members' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_themes: Tier 1 + 3 (external admins can see themes)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_themes', 'view',
    v_settings_admin_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_admin_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_themes' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_domains: Tier 1 + 3
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_domains', 'view',
    v_settings_admin_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_admin_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_domains' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_permissions: internal admin/owner only (Tier 1)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_permissions', 'view',
    v_settings_internal_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_internal_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_permissions' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_policies: internal admin/owner only (Tier 1)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_policies', 'view',
    v_settings_internal_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_internal_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_policies' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_programs: internal admin/owner only (Tier 1)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_programs', 'view',
    v_settings_internal_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_internal_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_programs' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_inputs: internal admin/owner only (Tier 1)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_inputs', 'view',
    v_settings_internal_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_internal_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_inputs' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_documents: internal admin/owner only (Tier 1)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_documents', 'view',
    v_settings_internal_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_internal_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_documents' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- settings_tasks: internal admin/owner only (Tier 1)
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'feature', 'settings_tasks', 'view',
    v_settings_internal_cc || jsonb_build_object('effect','ALLOW'),
    v_settings_internal_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='feature'
      AND resource_name='settings_tasks' AND action='view'
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SECTION D: INSERT global route wildcard policies (Tier 1 only)
  -- Routes are internal-admin-only by default.
  -- ============================================================
  INSERT INTO public.organization_policies
    (id, org_id, resource_type, resource_name, action,
     definition_json, compiled_config, scope, effect, version, is_active, is_protected_policy, created_by_clerk_sub)
  SELECT gen_random_uuid(), NULL, 'route', '*', unnest(ARRAY['select','insert','update','delete']),
    v_storage_cc || jsonb_build_object('effect','ALLOW'),
    v_storage_cc,
    'all', 'ALLOW', 1, true, false, 'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type='route' AND resource_name='*'
  )
  ON CONFLICT DO NOTHING;

END $$;

COMMIT;

-- ============================================================
-- Summary of what this migration does:
-- ============================================================
--
-- SECTION A — Updates existing global table:* wildcard rows (UPDATE, not INSERT):
--   SELECT/INSERT/UPDATE: V3 multi-rule — Tier 1 (all), Tier 2 (org_records), Tier 3 (org_records)
--   DELETE:               V3 single-rule — Tier 1 only (internal admin/owner)
--
-- SECTION B — Updates existing global storage_bucket:* rows:
--   All actions:          V3 single-rule — Tier 1 only (internal admin/owner, full scope)
--
-- SECTION C — Inserts new global feature policies:
--   permanent_delete/delete:              Tier 1 ONLY (revised Policy 3B)
--   organization_invitations/submit:      Tier 1 (scope=all) + Tier 3 (scope=org_records)
--   organization_invitations/view:        Tiers 1+2+3
--   settings_general, settings_members:  Tiers 1+2+3 (broad internal + external admin)
--   settings_themes, settings_domains:   Tier 1 + Tier 3 (admin/owner only)
--   settings_permissions, _policies,     Tier 1 only (internal admin/owner)
--     _programs, _inputs, _documents, _tasks
--
-- SECTION D — Inserts new global route:* policies:
--   All actions:          Tier 1 only (internal admin/owner)
-- ============================================================
