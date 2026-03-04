-- Add support for condition_groups in check_org_access.
-- Each V3 rule can now contain a "condition_groups" array alongside "conditions".
-- A condition_group has its own connector and conditions, evaluated as a single
-- boolean that participates in the rule's top-level connector logic.
--
-- Example: org_role=member AND org_type=internal AND (member_role=AE OR member_role=LP)
-- is stored as:
--   conditions: [{field:"org_role",...}, {field:"org_type",...}]
--   condition_groups: [{connector:"OR", conditions:[{field:"member_role",...},{field:"member_role",...}]}]

CREATE OR REPLACE FUNCTION public.check_org_access(
  p_resource_type text,
  p_resource_name text,
  p_action text
)
RETURNS public.org_access_result
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id uuid;
  v_user_id text;
  v_org_role text;
  v_member_role text;
  v_is_internal boolean;
  v_is_internal_org boolean;
  v_policy record;
  v_rule jsonb;
  v_condition jsonb;
  v_all_match boolean;
  v_any_match boolean;
  v_field_val text;
  v_cond_match boolean;
  v_connector text;
  v_result public.org_access_result;
  v_deny_matched boolean := false;
  -- condition group evaluation
  v_group jsonb;
  v_group_connector text;
  v_group_all_match boolean;
  v_group_any_match boolean;
  v_group_condition jsonb;
  v_group_result boolean;
BEGIN
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  IF v_org_id IS NULL THEN
    v_result.allowed := false;
    v_result.scope := 'none';
    RETURN v_result;
  END IF;

  IF auth.role() = 'service_role' THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

  IF public.is_org_owner(v_org_id) THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

  v_org_role := COALESCE(auth.jwt() ->> 'org_role', auth.jwt() ->> 'orgRole');
  v_member_role := COALESCE(auth.jwt() ->> 'org_member_role', auth.jwt() ->> 'orgMemberRole');
  v_is_internal := COALESCE(
    (auth.jwt() ->> 'is_internal')::boolean,
    (auth.jwt() ->> 'isInternal')::boolean
  );

  IF v_org_role IS NULL OR v_member_role IS NULL THEN
    SELECT m.clerk_org_role, m.clerk_member_role
    INTO v_org_role, v_member_role
    FROM public.organization_members m
    WHERE m.organization_id = v_org_id AND m.user_id = v_user_id
    LIMIT 1;
  END IF;

  IF v_is_internal IS NULL THEN
    SELECT u.is_internal_yn INTO v_is_internal
    FROM public.users u WHERE u.clerk_user_id = v_user_id LIMIT 1;
  END IF;

  SELECT o.is_internal_yn INTO v_is_internal_org
  FROM public.organizations o WHERE o.id = v_org_id;

  v_org_role := lower(replace(coalesce(v_org_role, ''), 'org:', ''));
  v_member_role := lower(replace(coalesce(v_member_role, ''), 'org:', ''));

  -- =====================================================
  -- PHASE 1: Evaluate DENY policies first
  -- =====================================================
  FOR v_policy IN
    SELECT op.compiled_config, op.scope AS policy_scope, op.effect
    FROM public.organization_policies op
    WHERE (op.org_id = v_org_id OR op.org_id IS NULL)
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
      AND op.effect = 'DENY'
    ORDER BY
      CASE WHEN op.org_id IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN op.resource_name <> '*' THEN 0 ELSE 1 END
  LOOP
    IF COALESCE((v_policy.compiled_config ->> 'version')::int, 2) >= 3 THEN
      FOR v_rule IN
        SELECT * FROM jsonb_array_elements(
          COALESCE(v_policy.compiled_config -> 'rules', '[]'::jsonb)
        )
      LOOP
        v_connector := COALESCE(v_rule ->> 'connector', 'AND');
        v_all_match := true;
        v_any_match := false;

        FOR v_condition IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'conditions', '[]'::jsonb))
        LOOP
          CASE v_condition ->> 'field'
            WHEN 'org_role' THEN v_field_val := v_org_role;
            WHEN 'member_role' THEN v_field_val := v_member_role;
            WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
            WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
            ELSE v_field_val := NULL;
          END CASE;

          CASE v_condition ->> 'operator'
            WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
            WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
            ELSE v_cond_match := false;
          END CASE;

          IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        -- Evaluate condition_groups
        FOR v_group IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'condition_groups', '[]'::jsonb))
        LOOP
          v_group_connector := COALESCE(v_group ->> 'connector', 'OR');
          v_group_all_match := true;
          v_group_any_match := false;

          FOR v_group_condition IN
            SELECT * FROM jsonb_array_elements(COALESCE(v_group -> 'conditions', '[]'::jsonb))
          LOOP
            CASE v_group_condition ->> 'field'
              WHEN 'org_role' THEN v_field_val := v_org_role;
              WHEN 'member_role' THEN v_field_val := v_member_role;
              WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
              WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
              ELSE v_field_val := NULL;
            END CASE;

            CASE v_group_condition ->> 'operator'
              WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
              WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val);
              ELSE v_cond_match := false;
            END CASE;

            IF v_cond_match THEN v_group_any_match := true; ELSE v_group_all_match := false; END IF;
          END LOOP;

          v_group_result := (v_group_connector = 'AND' AND v_group_all_match) OR (v_group_connector = 'OR' AND v_group_any_match);
          IF v_group_result THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
          v_deny_matched := true;
        END IF;
      END LOOP;
    ELSE
      v_connector := COALESCE(v_policy.compiled_config ->> 'connector', 'AND');
      v_all_match := true;
      v_any_match := false;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_policy.compiled_config -> 'conditions', '[]'::jsonb))
      LOOP
        CASE v_condition ->> 'field'
          WHEN 'org_role' THEN v_field_val := v_org_role;
          WHEN 'member_role' THEN v_field_val := v_member_role;
          WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
          WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
          ELSE v_field_val := NULL;
        END CASE;

        CASE v_condition ->> 'operator'
          WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
          WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
          ELSE v_cond_match := false;
        END CASE;

        IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
      END LOOP;

      IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
        v_deny_matched := true;
      END IF;
    END IF;

    IF v_deny_matched THEN
      v_result.allowed := false;
      v_result.scope := 'none';
      RETURN v_result;
    END IF;
  END LOOP;

  -- =====================================================
  -- PHASE 2: Evaluate ALLOW policies
  -- =====================================================
  FOR v_policy IN
    SELECT op.compiled_config, op.scope AS policy_scope
    FROM public.organization_policies op
    WHERE (op.org_id = v_org_id OR op.org_id IS NULL)
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
      AND (op.effect = 'ALLOW' OR op.effect IS NULL)
    ORDER BY
      CASE WHEN op.org_id IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN op.resource_name <> '*' THEN 0 ELSE 1 END
  LOOP
    IF COALESCE((v_policy.compiled_config ->> 'allow_internal_users')::boolean, false) = true
       AND v_is_internal = true
    THEN
      v_result.allowed := true;
      v_result.scope := COALESCE(v_policy.policy_scope, 'all');
      RETURN v_result;
    END IF;

    IF COALESCE((v_policy.compiled_config ->> 'version')::int, 2) >= 3 THEN
      FOR v_rule IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_policy.compiled_config -> 'rules', '[]'::jsonb))
      LOOP
        v_connector := COALESCE(v_rule ->> 'connector', 'AND');
        v_all_match := true;
        v_any_match := false;

        FOR v_condition IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'conditions', '[]'::jsonb))
        LOOP
          CASE v_condition ->> 'field'
            WHEN 'org_role' THEN v_field_val := v_org_role;
            WHEN 'member_role' THEN v_field_val := v_member_role;
            WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
            WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
            ELSE v_field_val := NULL;
          END CASE;

          CASE v_condition ->> 'operator'
            WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
            WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
            ELSE v_cond_match := false;
          END CASE;

          IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        -- Evaluate condition_groups
        FOR v_group IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'condition_groups', '[]'::jsonb))
        LOOP
          v_group_connector := COALESCE(v_group ->> 'connector', 'OR');
          v_group_all_match := true;
          v_group_any_match := false;

          FOR v_group_condition IN
            SELECT * FROM jsonb_array_elements(COALESCE(v_group -> 'conditions', '[]'::jsonb))
          LOOP
            CASE v_group_condition ->> 'field'
              WHEN 'org_role' THEN v_field_val := v_org_role;
              WHEN 'member_role' THEN v_field_val := v_member_role;
              WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
              WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
              ELSE v_field_val := NULL;
            END CASE;

            CASE v_group_condition ->> 'operator'
              WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
              WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val);
              ELSE v_cond_match := false;
            END CASE;

            IF v_cond_match THEN v_group_any_match := true; ELSE v_group_all_match := false; END IF;
          END LOOP;

          v_group_result := (v_group_connector = 'AND' AND v_group_all_match) OR (v_group_connector = 'OR' AND v_group_any_match);
          IF v_group_result THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
          v_result.allowed := true;
          v_result.scope := COALESCE(v_rule ->> 'scope', v_policy.policy_scope, 'all');
          RETURN v_result;
        END IF;
      END LOOP;
    ELSE
      v_connector := COALESCE(v_policy.compiled_config ->> 'connector', 'AND');
      v_all_match := true;
      v_any_match := false;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_policy.compiled_config -> 'conditions', '[]'::jsonb))
      LOOP
        CASE v_condition ->> 'field'
          WHEN 'org_role' THEN v_field_val := v_org_role;
          WHEN 'member_role' THEN v_field_val := v_member_role;
          WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
          WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
          ELSE v_field_val := NULL;
        END CASE;

        CASE v_condition ->> 'operator'
          WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
          WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
          ELSE v_cond_match := false;
        END CASE;

        IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
      END LOOP;

      IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
        v_result.allowed := true;
        v_result.scope := COALESCE(v_policy.policy_scope, 'all');
        RETURN v_result;
      END IF;
    END IF;
  END LOOP;

  v_result.allowed := false;
  v_result.scope := 'none';
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_org_access(text, text, text) IS
'Combined access check with DENY support and condition groups. Evaluates DENY policies first (deny wins), then ALLOW policies. Supports nested condition_groups within V3 rules for complex boolean expressions. Service role and org owners bypass both. Returns (allowed, scope).';
