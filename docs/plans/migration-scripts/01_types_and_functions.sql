-- ============================================
-- PHASE 1: Types and Functions (dev-only)
-- ============================================

-- ============================================
-- TYPES
-- ============================================

-- Type: public.country
CREATE TYPE "public"."country" AS ENUM (
    'Bonaire, Sint Eustatius and Saba',
    'Curaçao',
    'Guernsey',
    'Isle of Man',
    'Jersey',
    'Åland Islands',
    'Montenegro',
    'Saint Barthélemy',
    'Saint Martin (French part)',
    'Serbia',
    'Sint Maarten (Dutch part)',
    'South Sudan',
    'Timor-Leste',
    'American Samoa',
    'Andorra',
    'Angola',
    'Anguilla',
    'Antarctica',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Aruba',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bermuda',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Bouvet Island',
    'Brazil',
    'British Indian Ocean Territory',
    'Brunei Darussalam',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Cape Verde',
    'Cayman Islands',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Christmas Island',
    'Cocos (Keeling) Islands',
    'Colombia',
    'Comoros',
    'Congo',
    'Congo, the Democratic Republic of the',
    'Cook Islands',
    'Costa Rica',
    'Cote DIvoire',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Ethiopia',
    'Falkland Islands (Malvinas)',
    'Faroe Islands',
    'Fiji',
    'Finland',
    'France',
    'French Guiana',
    'French Polynesia',
    'French Southern Territories',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Gibraltar',
    'Greece',
    'Greenland',
    'Grenada',
    'Guadeloupe',
    'Guam',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Heard Island and Mcdonald Islands',
    'Holy See (Vatican City State)',
    'Honduras',
    'Hong Kong',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran, Islamic Republic of',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Korea, Democratic People''s Republic of',
    'Korea, Republic of',
    'Kuwait',
    'Kyrgyzstan',
    'Lao People''s Democratic Republic',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Macao',
    'Macedonia, the Former Yugoslav Republic of',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Martinique',
    'Mauritania',
    'Mauritius',
    'Mayotte',
    'Mexico',
    'Micronesia, Federated States of',
    'Moldova, Republic of',
    'Monaco',
    'Mongolia',
    'Albania',
    'Montserrat',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Caledonia',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'Niue',
    'Norfolk Island',
    'Northern Mariana Islands',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Palestine, State of',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Pitcairn',
    'Poland',
    'Portugal',
    'Puerto Rico',
    'Qatar',
    'Reunion',
    'Romania',
    'Russian Federation',
    'Rwanda',
    'Saint Helena, Ascension and Tristan da Cunha',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Pierre and Miquelon',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Georgia and the South Sandwich Islands',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Svalbard and Jan Mayen',
    'Swaziland',
    'Sweden',
    'Switzerland',
    'Syrian Arab Republic',
    'Taiwan (Province of China)',
    'Tajikistan',
    'Tanzania, United Republic of',
    'Thailand',
    'Togo',
    'Tokelau',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Turks and Caicos Islands',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'United States Minor Outlying Islands',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Venezuela',
    'Viet Nam',
    'Virgin Islands (British)',
    'Virgin Islands (U.S.)',
    'Wallis and Futuna',
    'Western Sahara',
    'Yemen',
    'Zambia',
    'Zimbabwe',
    'Afghanistan',
    'Algeria'
);


ALTER TYPE "public"."country" OWNER TO "postgres";


-- Type: public.org_access_result
CREATE TYPE "public"."org_access_result" AS (
	"allowed" boolean,
	"scope" "text"
);


ALTER TYPE "public"."org_access_result" OWNER TO "postgres";



-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: public.auto_create_ai_input_order
CREATE OR REPLACE FUNCTION "public"."auto_create_ai_input_order"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  next_order integer;
BEGIN
  SELECT COALESCE(MAX(o.display_order), 0) + 1
    INTO next_order
    FROM public.document_type_ai_input_order o
    JOIN public.document_type_ai_input ai ON ai.id = o.document_type_ai_input_id
    WHERE ai.input_id = NEW.input_id;

  INSERT INTO public.document_type_ai_input_order (document_type_ai_input_id, display_order)
  VALUES (NEW.id, next_order);

  RETURN NEW;
END;
$$;


-- Function: public.can_access_deal_document
CREATE OR REPLACE FUNCTION "public"."can_access_deal_document"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_action" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_org_id uuid;
  v_user_id text;
BEGIN
  -- Resolve once
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  -- Validate action
  IF p_action NOT IN ('view', 'insert', 'upload', 'delete') THEN
    RETURN false;
  END IF;

  -- Internal admin bypass
  IF public.is_internal_admin() THEN
    RETURN true;
  END IF;

  -- Must have active org
  IF v_org_id IS NULL THEN
    RETURN false;
  END IF;

  -- Must be member of active org
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.user_id = v_user_id
      AND m.organization_id = v_org_id
  ) THEN
    RETURN false;
  END IF;

  -- Deal must belong to active org (if mapping exists)
  IF EXISTS (
    SELECT 1 FROM public.deals_clerk_orgs dorg
    WHERE dorg.deal_id = p_deal_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.deals_clerk_orgs dorg
    WHERE dorg.deal_id = p_deal_id
      AND dorg.clerk_org_id = v_org_id
  ) THEN
    RETURN false;
  END IF;

  -- Org admin bypass (after deal-org validation)
  IF public.is_org_admin(v_org_id) THEN
    RETURN true;
  END IF;

  -- RBAC matrix check: user's deal role + document category + action
  RETURN EXISTS (
    SELECT 1
    FROM public.deal_roles dr
    JOIN public.document_access_permissions dap
      ON dap.clerk_org_id = v_org_id
     AND dap.deal_role_types_id = dr.deal_role_types_id
     AND dap.document_categories_id = p_document_category_id
    WHERE dr.deal_id = p_deal_id
      AND dr.users_id = public.get_current_user_id()
      AND (
        (p_action = 'view'   AND dap.can_view)
        OR (p_action = 'insert' AND dap.can_insert)
        OR (p_action = 'upload' AND dap.can_upload)
        OR (p_action = 'delete' AND dap.can_delete)
      )
  );
END;
$$;


-- Function: public.can_access_deal_document_by_code
CREATE OR REPLACE FUNCTION "public"."can_access_deal_document_by_code"("p_deal_id" "uuid", "p_document_category_code" "text", "p_action" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH cat AS (
    SELECT id
    FROM public.document_categories
    WHERE code = p_document_category_code
  )
  SELECT CASE
    WHEN (SELECT count(*) FROM cat) = 1
      THEN public.can_access_deal_document(p_deal_id, (SELECT id FROM cat), p_action)
    ELSE false
  END;
$$;


-- Function: public.can_access_document
CREATE OR REPLACE FUNCTION "public"."can_access_document"("p_document_file_id" bigint, "p_action" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_org_id uuid;
  v_user_id text;
  v_user_pk bigint;
  v_doc_category_id bigint;
  v_uploaded_by text;
  v_uploaded_at timestamptz;
  v_doc_exists boolean;
BEGIN
  -- Resolve user and org once (performance improvement)
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  -- Resolve user PK (bigint) for tables that reference users.id
  SELECT id INTO v_user_pk
  FROM public.users
  WHERE clerk_user_id = v_user_id
  LIMIT 1;

  -- Validate action
  IF p_action NOT IN ('view', 'insert', 'upload', 'delete') THEN
    RETURN false;
  END IF;

  -- Load document metadata
  SELECT
    true,
    document_category_id,
    uploaded_by,
    uploaded_at
  INTO
    v_doc_exists,
    v_doc_category_id,
    v_uploaded_by,
    v_uploaded_at
  FROM public.document_files
  WHERE id = p_document_file_id;

  -- Early exit: document doesn't exist
  IF NOT COALESCE(v_doc_exists, false) THEN
    RETURN false;
  END IF;

  -- Check 1: Internal admin bypass
  IF public.is_internal_admin() THEN
    RETURN true;
  END IF;

  -- Check 2: Org admin has FULL access to org-linked docs (not just view)
  IF v_org_id IS NOT NULL
    AND public.is_org_admin(v_org_id)
    AND EXISTS (
      SELECT 1
      FROM public.document_files_clerk_orgs dfco
      WHERE dfco.document_file_id = p_document_file_id
        AND dfco.clerk_org_id = v_org_id
    )
  THEN
    RETURN true;
  END IF;

  -- Check 3: Uploader can view their own docs
  IF p_action = 'view' AND v_uploaded_by = v_user_id THEN
    RETURN true;
  END IF;

  -- Check 4: Uploader can delete their own docs
  IF p_action = 'delete' AND v_uploaded_by = v_user_id THEN
    RETURN true;
  END IF;

  -- Check 5: Uploader can upload to their own fresh (unfinalized) doc
  IF p_action = 'upload'
    AND v_uploaded_by = v_user_id
    AND v_uploaded_at IS NULL
  THEN
    RETURN true;
  END IF;

  -- Check 6: Direct user link can view (clerk_user_id is bigint = users.id)
  IF p_action = 'view'
    AND v_user_pk IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.document_files_clerk_users dfcu
      WHERE dfcu.document_file_id = p_document_file_id
        AND dfcu.clerk_user_id = v_user_pk
    )
  THEN
    RETURN true;
  END IF;

  -- Check 7: Org member can view org-linked docs
  IF p_action = 'view'
    AND v_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.document_files_clerk_orgs dfco
      JOIN public.organization_members m
        ON m.organization_id = dfco.clerk_org_id
       AND m.user_id = v_user_id
      WHERE dfco.document_file_id = p_document_file_id
        AND dfco.clerk_org_id = v_org_id
    )
  THEN
    RETURN true;
  END IF;

  -- Check 8: Deal-derived permission via RBAC matrix
  IF v_doc_category_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.document_file_deal_ids(p_document_file_id) d
      WHERE public.can_access_deal_document(d.deal_id, v_doc_category_id, p_action)
    )
  THEN
    RETURN true;
  END IF;

  -- Default: deny
  RETURN false;
END;
$$;


-- Function: public.can_access_org_resource
CREATE OR REPLACE FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (public.check_org_access(p_resource_type, p_resource_name, p_action)).allowed;
$$;


-- Function: public.cascade_archive
CREATE OR REPLACE FUNCTION "public"."cascade_archive"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'loans' THEN
        UPDATE loan_scenarios
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE loan_id = NEW.id AND archived_at IS NULL;
      WHEN 'deals' THEN
        UPDATE deal_tasks
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE deal_id = NEW.id AND archived_at IS NULL;
        UPDATE deal_documents
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE deal_id = NEW.id AND archived_at IS NULL;
      WHEN 'borrowers' THEN
        UPDATE guarantor
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE borrower_id = NEW.display_id AND archived_at IS NULL;
      ELSE
        NULL;
    END CASE;
  END IF;

  IF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'loans' THEN
        UPDATE loan_scenarios
          SET archived_at = NULL, archived_by = NULL
          WHERE loan_id = NEW.id AND archived_at = OLD.archived_at;
      WHEN 'deals' THEN
        UPDATE deal_tasks
          SET archived_at = NULL, archived_by = NULL
          WHERE deal_id = NEW.id AND archived_at = OLD.archived_at;
        UPDATE deal_documents
          SET archived_at = NULL, archived_by = NULL
          WHERE deal_id = NEW.id AND archived_at = OLD.archived_at;
      WHEN 'borrowers' THEN
        UPDATE guarantor
          SET archived_at = NULL, archived_by = NULL
          WHERE borrower_id = NEW.display_id AND archived_at = OLD.archived_at;
      ELSE
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;


-- Function: public.check_named_scope
CREATE OR REPLACE FUNCTION "public"."check_named_scope"("p_scope_name" "text", "p_anchor_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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


-- Function: public.check_named_scope_from_scope_string
CREATE OR REPLACE FUNCTION "public"."check_named_scope_from_scope_string"("p_scope" "text", "p_anchor_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT CASE
    WHEN p_scope LIKE 'named:%'
      THEN public.check_named_scope(substring(p_scope from 7), p_anchor_id)
    ELSE false
  END;
$$;


-- Function: public.check_org_access
CREATE OR REPLACE FUNCTION "public"."check_org_access"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") RETURNS "public"."org_access_result"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

  -- NOTE: is_org_owner check is intentionally BELOW, after DENY evaluation.
  -- This allows DENY policies to restrict even org owners.

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
  -- Owner fallback: after DENY, before ALLOW evaluation
  -- Org owners get full access unless explicitly denied.
  -- =====================================================
  IF public.is_org_owner(v_org_id) THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

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


-- Function: public.create_default_org_policies
CREATE OR REPLACE FUNCTION "public"."create_default_org_policies"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


-- Function: public.create_default_org_theme
CREATE OR REPLACE FUNCTION "public"."create_default_org_theme"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO organization_themes (organization_id, theme_light, theme_dark)
  VALUES (
    NEW.id,
    '{
      "card": "#ffffff",
      "ring": "#020817",
      "input": "#e2e8f0",
      "muted": "#f1f5f9",
      "accent": "#f1f5f9",
      "border": "#e2e8f0",
      "chart-1": "#e57a5a",
      "chart-2": "#2a9d8f",
      "chart-3": "#264653",
      "chart-4": "#e9c46a",
      "chart-5": "#f4a261",
      "popover": "#ffffff",
      "primary": "#000000",
      "sidebar": "#ffffff",
      "secondary": "#f1f5f9",
      "background": "#ffffff",
      "foreground": "#020817",
      "destructive": "#ef4444",
      "sidebar-ring": "#020817",
      "sidebar-accent": "#f1f5f9",
      "sidebar-border": "#e2e8f0",
      "card-foreground": "#020817",
      "sidebar-primary": "#000000",
      "muted-foreground": "#64748b",
      "accent-foreground": "#0f172a",
      "popover-foreground": "#020817",
      "primary-foreground": "#f8fafc",
      "sidebar-foreground": "#020817",
      "secondary-foreground": "#0f172a",
      "destructive-foreground": "#f8fafc",
      "sidebar-accent-foreground": "#0f172a",
      "sidebar-primary-foreground": "#f8fafc"
    }'::jsonb,
    '{
      "card": "#0f0f0f",
      "ring": "#999999",
      "input": "#333333",
      "muted": "#1f1f1f",
      "accent": "#1f1f1f",
      "border": "#333333",
      "chart-1": "#2563eb",
      "chart-2": "#2dd4bf",
      "chart-3": "#ea580c",
      "chart-4": "#a855f7",
      "chart-5": "#ec4899",
      "popover": "#0f0f0f",
      "primary": "#f8fafc",
      "sidebar": "#0f0f0f",
      "secondary": "#1f1f1f",
      "background": "#0f0f0f",
      "foreground": "#fafafa",
      "destructive": "#7f1d1d",
      "sidebar-ring": "#999999",
      "sidebar-accent": "#1f1f1f",
      "sidebar-border": "#333333",
      "card-foreground": "#f8fafc",
      "sidebar-primary": "#f8fafc",
      "muted-foreground": "#a6a6a6",
      "accent-foreground": "#f8fafc",
      "popover-foreground": "#f8fafc",
      "primary-foreground": "#0f172a",
      "sidebar-foreground": "#fafafa",
      "secondary-foreground": "#f8fafc",
      "destructive-foreground": "#f8fafc",
      "sidebar-accent-foreground": "#f8fafc",
      "sidebar-primary-foreground": "#0f172a"
    }'::jsonb
  );
  RETURN NEW;
END;
$$;


-- Function: public.create_document_with_deal_link
CREATE OR REPLACE FUNCTION "public"."create_document_with_deal_link"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_file_type" "text" DEFAULT NULL::"text", "p_file_size" bigint DEFAULT NULL::bigint) RETURNS TABLE("document_id" bigint, "storage_bucket" "text", "storage_path" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_doc_id bigint;
  v_active_org_id uuid;
  v_active_org_clerk_id text;
  v_path text;
BEGIN
  -- 1) Bucket whitelist
  IF p_storage_bucket <> 'documents' THEN
    RAISE EXCEPTION 'Invalid storage_bucket: must be documents';
  END IF;

  -- 2) Validate org context exists
  v_active_org_id := public.get_active_org_id();
  IF v_active_org_id IS NULL THEN
    RAISE EXCEPTION 'No active org context';
  END IF;

  -- 3) Clerk org id string from JWT (adjust claim name if needed)
  v_active_org_clerk_id := (auth.jwt() ->> 'org_id');
  IF v_active_org_clerk_id IS NULL THEN
    RAISE EXCEPTION 'Missing org_id in JWT';
  END IF;

  -- 4) Permission check (insert doc for deal/category)
  IF NOT public.can_access_deal_document(p_deal_id, p_document_category_id, 'insert') THEN
    RAISE EXCEPTION 'Permission denied: cannot insert documents for this deal/category';
  END IF;

  -- 5) Create doc row first (storage_path set after we get id)
  INSERT INTO public.document_files (
    document_name,
    document_category_id,
    storage_bucket,
    storage_path,
    file_type,
    file_size,
    uploaded_by
  ) VALUES (
    p_document_name,
    p_document_category_id,
    p_storage_bucket,
    NULL,  -- set after we have the id
    p_file_type,
    p_file_size,
    public.get_clerk_user_id()
  ) RETURNING id INTO v_doc_id;

  -- 6) Deterministic path: orgs/<clerk_org_id>/df/<doc_id>/<filename>
  v_path := format('orgs/%s/df/%s/%s', v_active_org_clerk_id, v_doc_id, p_original_filename);

  UPDATE public.document_files
  SET storage_path = v_path
  WHERE id = v_doc_id;

  -- 7) Create deal link
  INSERT INTO public.document_files_deals (document_file_id, deal_id)
  VALUES (v_doc_id, p_deal_id);

  -- 8) Return result for client to use for upload
  RETURN QUERY SELECT v_doc_id, p_storage_bucket, v_path;
END;
$$;


-- Function: public.create_document_with_subject_link
CREATE OR REPLACE FUNCTION "public"."create_document_with_subject_link"("p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_subject_type" "text" DEFAULT NULL::"text", "p_subject_id" "uuid" DEFAULT NULL::"uuid", "p_file_type" "text" DEFAULT NULL::"text", "p_file_size" bigint DEFAULT NULL::bigint) RETURNS TABLE("document_id" bigint, "storage_bucket" "text", "storage_path" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_doc_id bigint;
  v_active_org_id uuid;
  v_active_org_clerk_id text;
  v_path text;
BEGIN
  -- 1) Bucket whitelist
  IF p_storage_bucket <> 'documents' THEN
    RAISE EXCEPTION 'Invalid storage_bucket: must be documents';
  END IF;

  -- 2) Validate org context exists
  v_active_org_id := public.get_active_org_id();
  IF v_active_org_id IS NULL THEN
    RAISE EXCEPTION 'No active org context';
  END IF;

  -- 3) Clerk org id string from JWT
  v_active_org_clerk_id := (auth.jwt() ->> 'org_id');
  IF v_active_org_clerk_id IS NULL THEN
    RAISE EXCEPTION 'Missing org_id in JWT';
  END IF;

  -- 4) Permission check: only org admins or internal admins can upload pre-deal docs
  IF NOT (public.is_internal_admin() OR public.is_org_admin(v_active_org_id)) THEN
    RAISE EXCEPTION 'Permission denied: must be org admin or internal admin for pre-deal uploads';
  END IF;

  -- 5) Validate subject type if provided
  IF p_subject_type IS NOT NULL AND p_subject_type NOT IN ('borrower', 'guarantor') THEN
    RAISE EXCEPTION 'Invalid subject_type: must be borrower or guarantor';
  END IF;

  IF p_subject_type IS NOT NULL AND p_subject_id IS NULL THEN
    RAISE EXCEPTION 'subject_id required when subject_type is provided';
  END IF;

  -- 6) Create doc row first (storage_path set after we get id)
  INSERT INTO public.document_files (
    document_name,
    document_category_id,
    storage_bucket,
    storage_path,
    file_type,
    file_size,
    uploaded_by
  ) VALUES (
    p_document_name,
    p_document_category_id,
    p_storage_bucket,
    NULL,
    p_file_type,
    p_file_size,
    public.get_clerk_user_id()
  ) RETURNING id INTO v_doc_id;

  -- 7) Deterministic path: orgs/<clerk_org_id>/df/<doc_id>/<filename>
  v_path := format('orgs/%s/df/%s/%s', v_active_org_clerk_id, v_doc_id, p_original_filename);

  UPDATE public.document_files
  SET storage_path = v_path
  WHERE id = v_doc_id;

  -- 8) Create org ownership link
  INSERT INTO public.document_files_clerk_orgs (document_file_id, clerk_org_id)
  VALUES (v_doc_id, v_active_org_id);

  -- 9) Create subject link if provided
  IF p_subject_type = 'borrower' THEN
    INSERT INTO public.document_files_borrowers (document_file_id, borrower_id)
    VALUES (v_doc_id, p_subject_id);
  ELSIF p_subject_type = 'guarantor' THEN
    INSERT INTO public.document_files_guarantors (document_file_id, guarantor_id)
    VALUES (v_doc_id, p_subject_id);
  END IF;

  -- 10) Return result for client to use for upload
  RETURN QUERY SELECT v_doc_id, p_storage_bucket, v_path;
END;
$$;


-- Function: public.document_file_deal_ids
CREATE OR REPLACE FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) RETURNS TABLE("deal_id" "uuid")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT dfd.deal_id
  FROM public.document_files_deals dfd
  WHERE dfd.document_file_id = p_document_file_id;
$$;


-- Function: public.exec_sql
CREATE OR REPLACE FUNCTION "public"."exec_sql"("query" "text", "params" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


-- Function: public.fail_stale_llama_document_parsed
CREATE OR REPLACE FUNCTION "public"."fail_stale_llama_document_parsed"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE llama_document_parsed
  SET status = 'FAILED'
  WHERE status IN ('PENDING', 'RUNNING')
    AND created_at < NOW() - INTERVAL '15 minutes';
END;
$$;


-- Function: public.finalize_document_upload
CREATE OR REPLACE FUNCTION "public"."finalize_document_upload"("p_document_file_id" bigint, "p_file_size" bigint DEFAULT NULL::bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only the uploader can finalize their own fresh doc
  IF NOT EXISTS (
    SELECT 1 FROM public.document_files
    WHERE id = p_document_file_id
      AND uploaded_by = public.get_clerk_user_id()
      AND uploaded_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permission denied or document already finalized';
  END IF;

  UPDATE public.document_files
  SET uploaded_at = now(),
      file_size = COALESCE(p_file_size, file_size)
  WHERE id = p_document_file_id;

  RETURN true;
END;
$$;


-- Function: public.generate_application_display_id
CREATE OR REPLACE FUNCTION "public"."generate_application_display_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(display_id FROM 'APP-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM applications;

  NEW.display_id := 'APP-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;


-- Function: public.generate_loan_display_id
CREATE OR REPLACE FUNCTION "public"."generate_loan_display_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(display_id FROM 'LOAN-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM loans;

  NEW.display_id := 'LOAN-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;


-- Function: public.generate_tag_slug
CREATE OR REPLACE FUNCTION "public"."generate_tag_slug"("tag_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  RETURN lower(regexp_replace(regexp_replace(trim(tag_name), '\s+', '-', 'g'), '[^a-z0-9\-]', '', 'g'));
END;
$$;


-- Function: public.get_active_org_id
CREATE OR REPLACE FUNCTION "public"."get_active_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Clerk stores the active org in 'org_id' claim when user switches orgs
  SELECT co.id
  FROM public.organizations co
  WHERE co.clerk_organization_id = (auth.jwt() ->> 'org_id')
  LIMIT 1;
$$;


-- Function: public.get_clerk_user_id
CREATE OR REPLACE FUNCTION "public"."get_clerk_user_id"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT auth.jwt() ->> 'sub';
$$;


-- Function: public.get_current_user_id
CREATE OR REPLACE FUNCTION "public"."get_current_user_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT id
  FROM public.users
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;


-- Function: public.get_deal_documents
CREATE OR REPLACE FUNCTION "public"."get_deal_documents"("p_deal_id" "uuid") RETURNS SETOF "public"."document_files"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT df.*
  FROM public.document_files df
  JOIN public.document_files_deals dfd
    ON dfd.document_file_id = df.id
  WHERE dfd.deal_id = p_deal_id
  ORDER BY df.created_at DESC;
$$;


-- Function: public.get_node_last_output
CREATE OR REPLACE FUNCTION "public"."get_node_last_output"("p_workflow_id" "uuid", "p_node_id" "text") RETURNS TABLE("output" "jsonb")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT l.output
  FROM workflow_execution_logs l
  JOIN workflow_executions e ON l.execution_id = e.id
  WHERE e.workflow_id = p_workflow_id
    AND l.node_id = p_node_id
    AND l.status = 'success'
    AND l.output IS NOT NULL
  ORDER BY e.started_at DESC
  LIMIT 1;
$$;


-- Function: public.get_primary_key_column
CREATE OR REPLACE FUNCTION "public"."get_primary_key_column"("p_table_name" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = p_table_name
  LIMIT 1;
$$;


-- Function: public.get_public_table_names
CREATE OR REPLACE FUNCTION "public"."get_public_table_names"() RETURNS TABLE("table_name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT tablename::text AS table_name
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;


-- Function: public.handle_property_changes
CREATE OR REPLACE FUNCTION "public"."handle_property_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- Function: public.handle_users_updated_at
CREATE OR REPLACE FUNCTION "public"."handle_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- Function: public.is_internal_admin
CREATE OR REPLACE FUNCTION "public"."is_internal_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.organization_members m
      ON m.user_id = u.clerk_user_id
    JOIN public.organizations o
      ON o.id = m.organization_id
    WHERE u.clerk_user_id = (auth.jwt() ->> 'sub')
      AND u.is_internal_yn = true
      AND o.is_internal_yn = true
      AND m.organization_id = public.get_active_org_id()
  );
$$;


-- Function: public.is_org_admin
CREATE OR REPLACE FUNCTION "public"."is_org_admin"("p_org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = (auth.jwt() ->> 'sub')
      AND (
        lower(om.clerk_org_role) IN ('admin', 'owner')
        OR
        lower(replace(om.clerk_org_role, 'org:', '')) IN ('admin', 'owner')
      )
  );
END;
$$;


-- Function: public.is_org_owner
CREATE OR REPLACE FUNCTION "public"."is_org_owner"("p_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_org_id
      AND m.user_id = (auth.jwt() ->> 'sub')
      AND lower(replace(coalesce(m.clerk_org_role, ''), 'org:', '')) = 'owner'
  );
$$;


-- Function: public.list_public_functions
CREATE OR REPLACE FUNCTION "public"."list_public_functions"() RETURNS TABLE("function_name" "text", "function_args" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT p.proname::text, pg_get_function_arguments(p.oid)::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
  ORDER BY p.proname
  LIMIT 200;
$$;


-- Function: public.list_public_tables
CREATE OR REPLACE FUNCTION "public"."list_public_tables"() RETURNS TABLE("table_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;


-- Function: public.list_table_columns
CREATE OR REPLACE FUNCTION "public"."list_table_columns"("p_table_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT c.column_name::text, c.data_type::text, (c.is_nullable = 'YES')
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$$;


-- Function: public.match_llama_document_chunks
CREATE OR REPLACE FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer DEFAULT 5, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" "uuid", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
DECLARE
  normalized_filter jsonb := filter;
BEGIN
  -- Normalize string docId to number for JSONB containment matching
  IF filter ? 'docId' AND jsonb_typeof(filter->'docId') = 'string' THEN
    normalized_filter := filter || jsonb_build_object(
      'docId', (filter->>'docId')::int
    );
  END IF;

  RETURN QUERY
  SELECT
    id, content, metadata,
    1 - (llama_document_chunks_vs.embedding <=> query_embedding) AS similarity
  FROM llama_document_chunks_vs
  WHERE metadata @> normalized_filter
  ORDER BY llama_document_chunks_vs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Function: public.match_llama_document_chunks_vs
CREATE OR REPLACE FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer DEFAULT 5, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" "uuid", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
DECLARE
  normalized_filter jsonb := filter;
BEGIN
  -- Normalize string docId to number for JSONB containment matching
  IF filter ? 'docId' AND jsonb_typeof(filter->'docId') = 'string' THEN
    normalized_filter := filter || jsonb_build_object(
      'docId', (filter->>'docId')::int
    );
  END IF;

  RETURN QUERY
  SELECT
    id, content, metadata,
    1 - (llama_document_chunks_vs.embedding <=> query_embedding) AS similarity
  FROM llama_document_chunks_vs
  WHERE metadata @> normalized_filter
  ORDER BY llama_document_chunks_vs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Function: public.match_program_document_chunks
CREATE OR REPLACE FUNCTION "public"."match_program_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (program_documents_chunks_vs.embedding <=> query_embedding) AS similarity
  FROM program_documents_chunks_vs
  WHERE metadata @> filter
  ORDER BY program_documents_chunks_vs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Function: public.notify_background_report_created
CREATE OR REPLACE FUNCTION "public"."notify_background_report_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://n8n.axora.info/webhook/f1987345-8e50-4ecc-a2b9-986bc00fb50b',
    body  := to_jsonb(NEW.*),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$$;


-- Function: public.notify_n8n_on_document_file_insert
CREATE OR REPLACE FUNCTION "public"."notify_n8n_on_document_file_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  request_id bigint;
  payload jsonb;
  file_url text;
BEGIN
  -- Build the authenticated storage download URL
  file_url := 'https://iufoslzvcjmtgsazttkt.supabase.co/storage/v1/object/'
    || COALESCE(NEW.storage_bucket, '')
    || '/'
    || COALESCE(NEW.storage_path, '');

  -- Merge the row data with the download URL
  payload := to_jsonb(NEW) || jsonb_build_object('file_download_url', file_url);

  SELECT net.http_post(
    url := 'https://n8n.axora.info/webhook/3c632f17-df80-4bdf-923f-bf3f13d7ca2f',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json')
  ) INTO request_id;

  RETURN NEW;
END;
$$;


-- Function: public.register_integration_feature_policy
CREATE OR REPLACE FUNCTION "public"."register_integration_feature_policy"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_resource_name text;
  v_policy_json jsonb;
BEGIN
  v_resource_name := 'integration:' || NEW.slug;

  -- Default policy: internal org admin/owner can view
  v_policy_json := jsonb_build_object(
    'version', 3,
    'allow_internal_users', false,
    'effect', 'ALLOW',
    'rules', jsonb_build_array(
      jsonb_build_object(
        'conditions', jsonb_build_array(
          jsonb_build_object('field', 'org_type', 'operator', 'is', 'values', jsonb_build_array('internal')),
          jsonb_build_object('field', 'org_role', 'operator', 'is', 'values', jsonb_build_array('admin', 'owner'))
        ),
        'connector', 'AND',
        'scope', 'all'
      )
    )
  );

  INSERT INTO public.organization_policies (
    org_id, resource_type, resource_name, action,
    definition_json, compiled_config, scope, effect,
    version, is_active, is_protected_policy
  ) VALUES (
    NULL, 'feature', v_resource_name, 'view',
    v_policy_json, v_policy_json, 'all', 'ALLOW',
    3, true, true
  )
  ON CONFLICT (org_id, resource_type, resource_name, action)
  DO NOTHING;

  RETURN NEW;
END;
$$;


-- Function: public.rls_auto_enable
CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


-- Function: public.seed_custom_broker_settings_on_assignment
CREATE OR REPLACE FUNCTION "public"."seed_custom_broker_settings_on_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  d record;
  internal_org_id uuid;
BEGIN
  -- Resolve the internal organization_id from the account manager's membership
  SELECT om.organization_id INTO internal_org_id
  FROM public.organization_members om
  WHERE om.id = NEW.account_manager_id;

  IF internal_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if custom settings already exist for this org + broker_org combo
  IF EXISTS (
    SELECT 1 FROM public.custom_broker_settings c
    WHERE c.organization_id = internal_org_id
      AND c.broker_org_id = NEW.organization_id
  ) THEN
    RETURN NEW;
  END IF;

  -- Try to find the manager's default settings
  SELECT * INTO d
  FROM public.default_broker_settings
  WHERE organization_id = internal_org_id
    AND organization_member_id = NEW.account_manager_id;

  IF d IS NULL THEN
    -- No defaults: seed with blank settings
    INSERT INTO public.custom_broker_settings (
      organization_id, organization_member_id, broker_org_id,
      allow_ysp, allow_buydown_rate, allow_white_labeling,
      program_visibility, rates, created_at, updated_at
    )
    VALUES (
      internal_org_id, NEW.account_manager_id, NEW.organization_id,
      false, false, false,
      '{}'::jsonb, '[]'::jsonb, now(), now()
    )
    ON CONFLICT (organization_id, broker_org_id) DO NOTHING;
  ELSE
    -- Seed from defaults
    INSERT INTO public.custom_broker_settings (
      organization_id, organization_member_id, broker_org_id,
      allow_ysp, allow_buydown_rate, allow_white_labeling,
      program_visibility, rates, created_at, updated_at
    )
    VALUES (
      internal_org_id, NEW.account_manager_id, NEW.organization_id,
      COALESCE(d.allow_ysp, false),
      COALESCE(d.allow_buydown_rate, false),
      COALESCE(d.allow_white_labeling, false),
      COALESCE(d.program_visibility, '{}'::jsonb),
      COALESCE(d.rates, '[]'::jsonb),
      now(), now()
    )
    ON CONFLICT (organization_id, broker_org_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


-- Function: public.sync_deal_clerk_orgs_on_delete
CREATE OR REPLACE FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF OLD.resource_type = 'deal' THEN
    FOR v_org_id IN
      SELECT DISTINCT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = OLD.user_id
        AND om.organization_id IS NOT NULL
    LOOP
      -- Only remove if no other members of this org have roles on this deal
      IF NOT EXISTS (
        SELECT 1
        FROM public.role_assignments ra
        JOIN public.organization_members om2
          ON om2.user_id = ra.user_id
        WHERE ra.resource_type = 'deal'
          AND ra.resource_id = OLD.resource_id
          AND om2.organization_id = v_org_id
          AND ra.id != OLD.id
      ) THEN
        DELETE FROM public.deal_clerk_orgs
        WHERE deal_id = OLD.resource_id::uuid
          AND clerk_org_id = v_org_id;
      END IF;
    END LOOP;
  END IF;
  RETURN OLD;
END;
$$;


-- Function: public.sync_deal_clerk_orgs_on_insert
CREATE OR REPLACE FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.resource_type = 'deal' THEN
    INSERT INTO public.deal_clerk_orgs (deal_id, clerk_org_id)
    SELECT DISTINCT
      NEW.resource_id::uuid,
      om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.user_id
      AND om.organization_id IS NOT NULL
    ON CONFLICT (deal_id, clerk_org_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


-- Function: public.sync_stepper_on_dropdown_change
CREATE OR REPLACE FUNCTION "public"."sync_stepper_on_dropdown_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_steps text[];
BEGIN
  IF NEW.dropdown_options::text IS DISTINCT FROM OLD.dropdown_options::text THEN
    IF NEW.dropdown_options IS NOT NULL THEN
      SELECT ARRAY(SELECT json_array_elements_text(NEW.dropdown_options)) INTO new_steps;
    ELSE
      new_steps := NULL;
    END IF;

    UPDATE input_stepper
    SET step_order = new_steps
    WHERE input_id = NEW.id;

    UPDATE deal_stepper
    SET step_order = new_steps
    WHERE input_stepper_id IN (
      SELECT id FROM input_stepper WHERE input_id = NEW.id
    )
    AND is_frozen = false;
  END IF;

  RETURN NEW;
END;
$$;


-- Function: public.sync_user_deal_access
CREATE OR REPLACE FUNCTION "public"."sync_user_deal_access"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


-- Function: public.trg_ddp_from_deal_guarantors
CREATE OR REPLACE FUNCTION "public"."trg_ddp_from_deal_guarantors"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    -- docs directly linked to this guarantor
    insert into public.deal_document_participants (deal_id, document_file_id, source_table, source_pk)
    select new.deal_id, dfg.document_file_id, 'document_files_guarantors', dfg.id
    from public.document_files_guarantors dfg
    where dfg.guarantor_id = new.guarantor_id
    on conflict do nothing;

    -- docs linked to the borrower of this guarantor
    insert into public.deal_document_participants (deal_id, document_file_id, source_table, source_pk)
    select new.deal_id, dfb.document_file_id, 'document_files_borrowers', dfb.id
    from public.guarantor g
    join public.document_files_borrowers dfb
      on dfb.borrower_id = g.borrower_id
    where g.id = new.guarantor_id
    on conflict do nothing;

    return new;
  elsif tg_op = 'DELETE' then
    -- remove guarantor-linked ddp rows for this deal
    delete from public.deal_document_participants ddp
    where ddp.deal_id = old.deal_id
      and ddp.source_table = 'document_files_guarantors'
      and ddp.source_pk in (
        select dfg.id
        from public.document_files_guarantors dfg
        where dfg.guarantor_id = old.guarantor_id
      );

    -- remove borrower-linked ddp rows for this deal (borrower derived via this guarantor)
    delete from public.deal_document_participants ddp
    where ddp.deal_id = old.deal_id
      and ddp.source_table = 'document_files_borrowers'
      and ddp.source_pk in (
        select dfb.id
        from public.guarantor g
        join public.document_files_borrowers dfb
          on dfb.borrower_id = g.borrower_id
        where g.id = old.guarantor_id
      );

    return old;
  end if;

  return null;
end;
$$;


-- Function: public.trg_ddp_from_deal_property
CREATE OR REPLACE FUNCTION "public"."trg_ddp_from_deal_property"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    insert into public.deal_document_participants (deal_id, document_file_id, source_table, source_pk)
    select new.deal_id, dfp.document_file_id, 'document_files_properties', dfp.id
    from public.document_files_properties dfp
    where dfp.property_id = new.property_id
    on conflict do nothing;

    return new;
  elsif tg_op = 'DELETE' then
    delete from public.deal_document_participants ddp
    where ddp.deal_id = old.deal_id
      and ddp.source_table = 'document_files_properties'
      and ddp.source_pk in (
        select dfp.id
        from public.document_files_properties dfp
        where dfp.property_id = old.property_id
      );

    return old;
  end if;

  return null;
end;
$$;


-- Function: public.trg_loan_scenario_inputs_sync_applications
CREATE OR REPLACE FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_loan_id uuid;
begin
  -- Determine the loan_id from the affected scenario
  SELECT ls.loan_id INTO v_loan_id
  FROM public.loan_scenarios ls
  WHERE ls.id = COALESCE(new.loan_scenario_id, old.loan_scenario_id)
    AND COALESCE(ls.primary, false) = true;

  -- Only sync if this scenario is the primary one
  IF v_loan_id IS NOT NULL THEN
    PERFORM public.sync_application_from_primary_scenario(v_loan_id);
  END IF;

  IF tg_op = 'DELETE' THEN
    RETURN old;
  ELSE
    RETURN new;
  END IF;
end;
$$;


-- Function: public.update_deal_signature_requests_updated_at
CREATE OR REPLACE FUNCTION "public"."update_deal_signature_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- Function: public.validate_deal_guarantors_array
CREATE OR REPLACE FUNCTION "public"."validate_deal_guarantors_array"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  missing_id bigint;
BEGIN
  IF NEW.deal_guarantor_ids IS NULL OR array_length(NEW.deal_guarantor_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT gid
  INTO missing_id
  FROM unnest(NEW.deal_guarantor_ids) AS gid
  LEFT JOIN deal_guarantors dg ON dg.id = gid
  WHERE dg.id IS NULL
  LIMIT 1;

  IF missing_id IS NOT NULL THEN
    RAISE EXCEPTION 'deal_guarantor_ids contains id % that does not exist in deal_guarantors', missing_id
      USING ERRCODE = '23503'; -- foreign_key_violation
  END IF;

  RETURN NEW;
END;
$$;


-- Function: public.validate_document_file_status_assignment
CREATE OR REPLACE FUNCTION "public"."validate_document_file_status_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_status_org_id uuid;
  v_status_is_active boolean;
BEGIN
  SELECT ds.organization_id, ds.is_active
    INTO v_status_org_id, v_status_is_active
  FROM public.document_statuses ds
  WHERE ds.id = NEW.document_status_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid document_status_id: %', NEW.document_status_id;
  END IF;

  IF v_status_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Cannot assign inactive status id=%', NEW.document_status_id;
  END IF;

  IF v_status_org_id IS NOT NULL AND v_status_org_id <> NEW.organization_id THEN
    RAISE EXCEPTION
      'Status org mismatch. status.organization_id=% assignment.organization_id=%',
      v_status_org_id, NEW.organization_id;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


