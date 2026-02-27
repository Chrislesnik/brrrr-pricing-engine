-- =====================================================
-- Migration: Seed protected CRUD policies for Settings features
-- Date: 2026-02-24
-- Description:
--   Grant internal org admin/owner full CRUD on all Settings pages.
--   These are protected global defaults — orgs cannot delete them
--   but can override with org-specific policies.
-- =====================================================

BEGIN;

-- Helper: upsert a protected settings feature policy
-- For each settings feature, create one row per action.

-- ─── settings_general: view, update ─────────────────
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'feature', 'settings_general', 'view', 'all', 'ALLOW', true, true, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":false,"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}]}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb),
  (NULL, 'feature', 'settings_general', 'update', 'all', 'ALLOW', true, true, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":false,"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}]}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- ─── settings_themes: view, update ──────────────────
INSERT INTO public.organization_policies
  (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
VALUES
  (NULL, 'feature', 'settings_themes', 'view', 'all', 'ALLOW', true, true, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":false,"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}]}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb),
  (NULL, 'feature', 'settings_themes', 'update', 'all', 'ALLOW', true, true, 1,
   '{"version":3,"effect":"ALLOW","allow_internal_users":false,"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR"}'::jsonb,
   '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}]}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb)
ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;

-- ─── Full CRUD features: view, insert, update, delete ──
-- settings_members, settings_domains, settings_permissions,
-- settings_policies, settings_programs, settings_inputs,
-- settings_documents, settings_tasks, settings_integrations

DO $$
DECLARE
  feature_name text;
  action_name text;
  def jsonb := '{"version":3,"effect":"ALLOW","allow_internal_users":false,"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"scope_conditions":[],"scope_connector":"OR"}'::jsonb;
  comp jsonb := '{"version":3,"allow_internal_users":false,"rules":[{"connector":"AND","scope":"all","conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}]}],"conditions":[{"field":"org_type","operator":"is","values":["internal"]},{"field":"org_role","operator":"is","values":["owner","admin"]}],"connector":"AND","scope":"all","scope_conditions":[],"scope_connector":"OR"}'::jsonb;
BEGIN
  FOREACH feature_name IN ARRAY ARRAY[
    'settings_members', 'settings_domains', 'settings_permissions',
    'settings_policies', 'settings_programs', 'settings_inputs',
    'settings_documents', 'settings_tasks', 'settings_integrations'
  ] LOOP
    FOREACH action_name IN ARRAY ARRAY['view', 'insert', 'update', 'delete'] LOOP
      INSERT INTO public.organization_policies
        (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config)
      VALUES (NULL, 'feature', feature_name, action_name, 'all', 'ALLOW', true, true, 1, def, comp)
      ON CONFLICT (resource_type, resource_name, action) WHERE org_id IS NULL DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
