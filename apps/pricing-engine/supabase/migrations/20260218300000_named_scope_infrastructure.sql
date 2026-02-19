-- ============================================================
-- Migration: Named Scope Infrastructure (Options B + C)
-- Date: 2026-02-18
--
-- Implements a two-layer named scope system for complex multi-hop
-- authorization predicates that cannot be expressed as simple
-- column ownership conditions.
--
-- Option B — check_named_scope() dispatcher:
--   A centralized function that evaluates any named scope by name.
--   New scope types require only adding a WHEN branch — no new
--   function, no new RLS policy signature.
--
-- Option C — user_deal_access precomputed table:
--   Materializes deal_roles membership so check_named_scope()
--   can resolve 'deal_participant' via an index lookup instead
--   of a join traversal. Maintained by trigger on deal_roles.
--
-- Tier 4 — External Broker member_role:
--   SELECT/INSERT/UPDATE on table:* via 'named:deal_participant'
--   scope. Added as a 4th rule to the existing global wildcard
--   table policies.
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: Named scope registry tables
-- ============================================================

-- Registry of all named scopes in the system.
-- Each row represents one named scope that can be selected in the
-- policy builder and evaluated by check_named_scope().
CREATE TABLE IF NOT EXISTS public.organization_policy_named_scopes (
  name              text PRIMARY KEY,
  label             text NOT NULL,
  description       text,
  uses_precomputed  boolean NOT NULL DEFAULT false,
  precomputed_table text,      -- 'user_deal_access'
  precomputed_user_col text,   -- 'clerk_user_id'
  precomputed_pk_col   text,   -- 'deal_id'
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_policy_named_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "named_scopes_read" ON public.organization_policy_named_scopes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "named_scopes_service" ON public.organization_policy_named_scopes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.organization_policy_named_scopes IS
  'Registry of named scope predicates available for use in organization policies.
   The name field is used in compiled_config rules as scope: ''named:<name>''.';

-- Per-table FK mapping for each named scope.
-- Tells the policy builder and RLS generation which column on each table
-- provides the anchor ID to pass to check_named_scope().
--   fk_column = 'id'      → for the anchor table itself (deals.id)
--   fk_column = 'deal_id' → for child tables (deal_inputs.deal_id)
CREATE TABLE IF NOT EXISTS public.organization_policy_named_scope_tables (
  scope_name  text NOT NULL REFERENCES public.organization_policy_named_scopes(name) ON DELETE CASCADE,
  table_name  text NOT NULL,
  fk_column   text NOT NULL,  -- column on this table that provides the anchor ID
  notes       text,
  PRIMARY KEY (scope_name, table_name)
);

ALTER TABLE public.organization_policy_named_scope_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "named_scope_tables_read" ON public.organization_policy_named_scope_tables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "named_scope_tables_service" ON public.organization_policy_named_scope_tables
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- PART 2: user_deal_access — precomputed permission table (Option C)
-- ============================================================

-- Materializes deal_roles membership for fast index lookups.
-- Maintained by trigger on deal_roles (INSERT / DELETE / UPDATE of archived_at).
-- Seeded from existing deal_roles on first run.
CREATE TABLE IF NOT EXISTS public.user_deal_access (
  clerk_user_id  text    NOT NULL,
  deal_id        uuid    NOT NULL,
  granted_via    text    NOT NULL DEFAULT 'deal_roles',
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clerk_user_id, deal_id, granted_via)
);

CREATE INDEX IF NOT EXISTS idx_user_deal_access_lookup
  ON public.user_deal_access (deal_id, clerk_user_id);

ALTER TABLE public.user_deal_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_deal_access_service" ON public.user_deal_access
  FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Users can read only their own rows (used by the engine via service role anyway)
CREATE POLICY "user_deal_access_self" ON public.user_deal_access
  FOR SELECT TO authenticated
  USING (clerk_user_id = auth.jwt()->>'sub');

-- ============================================================
-- PART 3: Trigger to maintain user_deal_access from deal_roles
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_user_deal_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clerk_id text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Resolve clerk_user_id from users table
    SELECT u.clerk_user_id INTO v_clerk_id
    FROM public.users u WHERE u.id = NEW.users_id LIMIT 1;

    IF v_clerk_id IS NOT NULL THEN
      INSERT INTO public.user_deal_access (clerk_user_id, deal_id, granted_via)
      VALUES (v_clerk_id, NEW.deal_id, 'deal_roles')
      ON CONFLICT (clerk_user_id, deal_id, granted_via) DO NOTHING;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT u.clerk_user_id INTO v_clerk_id
    FROM public.users u WHERE u.id = OLD.users_id LIMIT 1;

    IF v_clerk_id IS NOT NULL THEN
      DELETE FROM public.user_deal_access
      WHERE clerk_user_id = v_clerk_id
        AND deal_id = OLD.deal_id
        AND granted_via = 'deal_roles';
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle user reassignment on a role row (rare)
    IF NEW.users_id <> OLD.users_id THEN
      -- Revoke from old user
      SELECT u.clerk_user_id INTO v_clerk_id
      FROM public.users u WHERE u.id = OLD.users_id LIMIT 1;
      IF v_clerk_id IS NOT NULL THEN
        DELETE FROM public.user_deal_access
        WHERE clerk_user_id = v_clerk_id
          AND deal_id = OLD.deal_id
          AND granted_via = 'deal_roles';
      END IF;

      -- Grant to new user
      SELECT u.clerk_user_id INTO v_clerk_id
      FROM public.users u WHERE u.id = NEW.users_id LIMIT 1;
      IF v_clerk_id IS NOT NULL THEN
        INSERT INTO public.user_deal_access (clerk_user_id, deal_id, granted_via)
        VALUES (v_clerk_id, NEW.deal_id, 'deal_roles')
        ON CONFLICT (clerk_user_id, deal_id, granted_via) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_deal_access ON public.deal_roles;
CREATE TRIGGER trg_sync_user_deal_access
  AFTER INSERT OR UPDATE OR DELETE ON public.deal_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_deal_access();

-- ============================================================
-- PART 4: Backfill user_deal_access from existing deal_roles
-- ============================================================

INSERT INTO public.user_deal_access (clerk_user_id, deal_id, granted_via)
SELECT DISTINCT u.clerk_user_id, dr.deal_id, 'deal_roles'
FROM public.deal_roles dr
JOIN public.users u ON u.id = dr.users_id
WHERE u.clerk_user_id IS NOT NULL
ON CONFLICT (clerk_user_id, deal_id, granted_via) DO NOTHING;

-- ============================================================
-- PART 5: check_named_scope() dispatcher (Option B)
-- ============================================================

-- Evaluates any named scope predicate for the current authenticated user.
-- p_scope_name: the registered name (e.g. 'deal_participant')
-- p_anchor_id:  the ID to check against (always the "top-level" entity ID —
--               pass deals.id for 'deals', deal_inputs.deal_id for 'deal_inputs')
--
-- Performance note: 'deal_participant' uses the precomputed user_deal_access
-- table (Option C) for O(1) index lookup instead of join traversal.
-- Future scopes that don't yet have a precomputed table use live subqueries
-- inside a new WHEN branch.
CREATE OR REPLACE FUNCTION public.check_named_scope(
  p_scope_name text,
  p_anchor_id  uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user text := auth.jwt()->>'sub';
BEGIN
  IF v_user IS NULL THEN RETURN false; END IF;

  CASE p_scope_name

    -- deal_participant: user has an active role on the deal via deal_roles.
    -- Uses precomputed user_deal_access table (Option C) for fast index lookup.
    WHEN 'deal_participant' THEN
      RETURN EXISTS (
        SELECT 1 FROM public.user_deal_access
        WHERE deal_id = p_anchor_id
          AND clerk_user_id = v_user
      );

    -- Future named scopes are added as new WHEN branches here.
    -- Example (before precomputed table exists):
    -- WHEN 'borrower_entity_member' THEN
    --   RETURN EXISTS (
    --     SELECT 1 FROM public.entity_owners eo
    --     JOIN public.users u ON eo.user_id = u.clerk_user_id
    --     WHERE eo.entity_id = p_anchor_id
    --       AND u.clerk_user_id = v_user
    --   );

    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- ============================================================
-- PART 6: Update organization_policies_column_filters
--         Add named_scopes column
-- ============================================================

ALTER TABLE public.organization_policies_column_filters
  ADD COLUMN IF NOT EXISTS named_scopes text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.organization_policies_column_filters.named_scopes IS
  'Array of named scope names (from organization_policy_named_scopes) that apply
   to this table. Shown in the policy builder WHERE section as toggleable predicates.';

-- ============================================================
-- PART 7: Seed named scopes registry
-- ============================================================

INSERT INTO public.organization_policy_named_scopes
  (name, label, description, uses_precomputed, precomputed_table, precomputed_user_col, precomputed_pk_col)
VALUES (
  'deal_participant',
  'Deals I''m a participant on',
  'User has an active role on this deal via deal_roles. '
    'Uses precomputed user_deal_access table for fast lookup.',
  true,
  'user_deal_access',
  'clerk_user_id',
  'deal_id'
)
ON CONFLICT (name) DO NOTHING;

-- Per-table FK mappings for deal_participant
-- fk_column = the column on each table that provides the deal_id anchor
INSERT INTO public.organization_policy_named_scope_tables (scope_name, table_name, fk_column, notes)
VALUES
  ('deal_participant', 'deals',                 'id',       'Anchor table — deals.id IS the deal id'),
  ('deal_participant', 'deal_roles',             'deal_id',  NULL),
  ('deal_participant', 'deal_inputs',            'deal_id',  NULL),
  ('deal_participant', 'deal_borrower',          'deal_id',  NULL),
  ('deal_participant', 'deal_entity',            'deal_id',  NULL),
  ('deal_participant', 'deal_entity_owners',     'deal_id',  NULL),
  ('deal_participant', 'deal_guarantors',        'deal_id',  NULL),
  ('deal_participant', 'deal_property',          'deal_id',  NULL),
  ('deal_participant', 'deal_comments',          'deal_id',  NULL),
  ('deal_participant', 'deal_signature_requests','deal_id',  NULL),
  ('deal_participant', 'appraisal',              'deal_id',  NULL),
  ('deal_participant', 'loan_scenarios',         'deal_id',  'Assumes loan_scenarios.deal_id FK'),
  ('deal_participant', 'applications',           'deal_id',  'Assumes applications.deal_id FK')
ON CONFLICT (scope_name, table_name) DO NOTHING;

-- Update column_filters named_scopes for all deal-related tables
UPDATE public.organization_policies_column_filters
SET named_scopes = ARRAY['deal_participant']
WHERE table_name IN (
  'deals', 'deal_roles', 'deal_inputs', 'deal_borrower', 'deal_entity',
  'deal_entity_owners', 'deal_guarantors', 'deal_property', 'deal_comments',
  'deal_signature_requests', 'appraisal', 'loan_scenarios', 'applications'
);

-- ============================================================
-- PART 8: Add Tier 4 rule to global table wildcard policies
--         External Org Broker → named:deal_participant scope
--         SELECT, INSERT, UPDATE only (no DELETE for brokers)
-- ============================================================

DO $$
DECLARE
  v_rule_t4 JSONB := jsonb_build_object(
    'connector', 'AND',
    'scope', 'named:deal_participant',
    'conditions', jsonb_build_array(
      jsonb_build_object('field', 'org_type', 'operator', 'is', 'values', jsonb_build_array('external')),
      jsonb_build_object('field', 'member_role', 'operator', 'is', 'values', jsonb_build_array('broker'))
    ),
    'named_scope_conditions', jsonb_build_array(
      jsonb_build_object('name', 'deal_participant')
    )
  );
BEGIN
  -- Append Tier 4 rule to SELECT / INSERT / UPDATE (not DELETE)
  UPDATE public.organization_policies SET
    compiled_config = jsonb_set(
      compiled_config,
      '{rules}',
      (compiled_config->'rules') || jsonb_build_array(v_rule_t4)
    ),
    definition_json = CASE
      WHEN definition_json ? 'rules' THEN
        jsonb_set(
          definition_json,
          '{rules}',
          (definition_json->'rules') || jsonb_build_array(v_rule_t4 || jsonb_build_object('effect', 'ALLOW'))
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

-- ============================================================
-- Summary:
--
-- organization_policy_named_scopes   — registry (1 row: deal_participant)
-- organization_policy_named_scope_tables — FK mappings (13 tables)
-- user_deal_access                   — precomputed (backfilled from deal_roles)
-- sync_user_deal_access()            — trigger function on deal_roles
-- check_named_scope(name, id)        — Option B dispatcher
-- organization_policies_column_filters.named_scopes — per-table named scope list
-- table:* SELECT/INSERT/UPDATE       — updated with 4th rule (Tier 4 broker)
-- ============================================================
