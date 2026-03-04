


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



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


CREATE TYPE "public"."entity_type" AS ENUM (
    'general_partnership',
    'limited_liability_company',
    'limited_liability_partnership',
    'limited_partnership',
    'corp',
    'c-corp',
    's_corp',
    'sole_proprietorship',
    'other'
);


ALTER TYPE "public"."entity_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."entity_type" IS 'company tax classification';



CREATE TYPE "public"."org_access_result" AS (
	"allowed" boolean,
	"scope" "text"
);


ALTER TYPE "public"."org_access_result" OWNER TO "postgres";


CREATE TYPE "public"."us_states" AS ENUM (
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
    'DC',
    'PR'
);


ALTER TYPE "public"."us_states" OWNER TO "postgres";


CREATE TYPE "public"."us_states_long" AS ENUM (
    'alabama',
    'alaska',
    'arizona',
    'arkansas',
    'california',
    'colorado',
    'connecticut',
    'delaware',
    'district_of_columbia',
    'florida',
    'georgia',
    'hawaii',
    'idaho',
    'illinois',
    'indiana',
    'iowa',
    'kansas',
    'kentucky',
    'louisiana',
    'maine',
    'maryland',
    'massachusetts',
    'michigan',
    'minnesota',
    'mississippi',
    'missouri',
    'montana',
    'nebraska',
    'nevada',
    'new_hampshire',
    'new_jersey',
    'new_mexico',
    'new_york',
    'north_carolina',
    'north_dakota',
    'ohio',
    'oklahoma',
    'oregon',
    'pennsylvania',
    'rhode_island',
    'south_carolina',
    'south_dakota',
    'tennessee',
    'texas',
    'utah',
    'vermont',
    'virginia',
    'washington',
    'west_virginia',
    'wisconsin',
    'wyoming'
);


ALTER TYPE "public"."us_states_long" OWNER TO "postgres";


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


ALTER FUNCTION "public"."auto_create_ai_input_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_populate_guarantor_emails"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE ids uuid[]; emails text[];
BEGIN
  IF TG_TABLE_NAME = 'loan_scenarios' THEN ids := NEW.guarantor_borrower_ids;
  ELSE ids := NEW.guarantor_ids; END IF;
  IF ids IS NULL OR array_length(ids, 1) IS NULL THEN
    NEW.guarantor_emails := NULL; RETURN NEW;
  END IF;
  SELECT array_agg(b.email ORDER BY idx) INTO emails
  FROM unnest(ids) WITH ORDINALITY AS u(id, idx)
  LEFT JOIN borrowers b ON b.id = u.id;
  NEW.guarantor_emails := emails;
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."auto_populate_guarantor_emails"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."borrowers_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."borrowers_set_updated_at"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."can_access_deal_document"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_deal_document"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_action" "text") IS 'Checks deal-level document access using org membership, deal-org mapping, and RBAC permissions matrix.';



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


ALTER FUNCTION "public"."can_access_deal_document_by_code"("p_deal_id" "uuid", "p_document_category_code" "text", "p_action" "text") OWNER TO "postgres";


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


ALTER FUNCTION "public"."can_access_document"("p_document_file_id" bigint, "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_document"("p_document_file_id" bigint, "p_action" "text") IS 'Checks if current user can access a document file. Resolves access via multiple paths: internal admin, org admin, uploader, direct link, org link, or deal-derived RBAC permissions.';



CREATE OR REPLACE FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (public.check_org_access(p_resource_type, p_resource_name, p_action)).allowed;
$$;


ALTER FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") IS 'Thin boolean wrapper around check_org_access(). Returns true if the action is allowed. For row-level scope, use check_org_access() directly.';



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


ALTER FUNCTION "public"."cascade_archive"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."check_named_scope"("p_scope_name" "text", "p_anchor_id" "uuid") OWNER TO "postgres";


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


ALTER FUNCTION "public"."check_named_scope_from_scope_string"("p_scope" "text", "p_anchor_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_named_scope_from_scope_string"("p_scope" "text", "p_anchor_id" "uuid") IS 'Dispatches any ''named:<scope>'' string to check_named_scope(name, anchor_id).
   Used in the ELSE arm of RLS policy CASE blocks so that any named scope
   registered in check_named_scope() is automatically enforced at the DB level
   without further RLS policy changes.';



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


ALTER FUNCTION "public"."check_org_access"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_org_access"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") IS 'Combined access check with DENY support. DENY evaluated first (deny wins, even for org owners). Then org owner fallback. Then ALLOW evaluation. Service role bypasses all. Returns (allowed, scope).';



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


ALTER FUNCTION "public"."create_default_org_policies"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."create_default_org_theme"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."create_document_with_deal_link"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_file_type" "text", "p_file_size" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_document_with_deal_link"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_file_type" "text", "p_file_size" bigint) IS 'Creates a document record with deal link and returns upload path';



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


ALTER FUNCTION "public"."create_document_with_subject_link"("p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_subject_type" "text", "p_subject_id" "uuid", "p_file_type" "text", "p_file_size" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_document_with_subject_link"("p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_subject_type" "text", "p_subject_id" "uuid", "p_file_type" "text", "p_file_size" bigint) IS 'Creates a document record with optional subject (borrower/guarantor) link for pre-deal uploads';



CREATE OR REPLACE FUNCTION "public"."delete_orphaned_credit_report_chat"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Check if there are any remaining mappings for this chat_id
  if not exists (
    select 1 from credit_report_user_chats where chat_id = OLD.chat_id
  ) then
    -- No more mappings exist, delete the chat (which will cascade to messages)
    delete from credit_report_chats where id = OLD.chat_id;
  end if;
  return OLD;
end; $$;


ALTER FUNCTION "public"."delete_orphaned_credit_report_chat"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) RETURNS TABLE("deal_id" "uuid")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT dfd.deal_id
  FROM public.document_files_deals dfd
  WHERE dfd.document_file_id = p_document_file_id;
$$;


ALTER FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) IS 'Returns all deal IDs linked to a document file';



CREATE OR REPLACE FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_chat_id uuid;
begin
  if p_report_id is null or p_user_id is null then
    return;
  end if;

  -- If mapping already exists, nothing to do
  select chat_id into v_chat_id
  from public.credit_report_user_chats
  where report_id = p_report_id and user_id = p_user_id;

  if v_chat_id is not null then
    return;
  end if;

  -- Reuse most recent chat for this user/org, otherwise create one
  select id into v_chat_id
  from public.credit_report_chats
  where user_id = p_user_id and organization_id = p_org_id
  order by created_at desc
  limit 1;

  if v_chat_id is null then
    insert into public.credit_report_chats (user_id, organization_id, name)
    values (p_user_id, p_org_id, 'Credit report chat')
    returning id into v_chat_id;
  end if;

  insert into public.credit_report_user_chats (report_id, user_id, chat_id)
  values (p_report_id, p_user_id, v_chat_id)
  on conflict (report_id, user_id) do update
  set chat_id = excluded.chat_id;
end;
$$;


ALTER FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."entities_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."entities_set_updated_at"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."exec_sql"("query" "text", "params" "jsonb") OWNER TO "postgres";


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


ALTER FUNCTION "public"."fail_stale_llama_document_parsed"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."finalize_document_upload"("p_document_file_id" bigint, "p_file_size" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."finalize_document_upload"("p_document_file_id" bigint, "p_file_size" bigint) IS 'Finalizes a document upload by setting uploaded_at timestamp. Only uploader can finalize.';



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


ALTER FUNCTION "public"."generate_application_display_id"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."generate_loan_display_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_tag_slug"("tag_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  RETURN lower(regexp_replace(regexp_replace(trim(tag_name), '\s+', '-', 'g'), '[^a-z0-9\-]', '', 'g'));
END;
$$;


ALTER FUNCTION "public"."generate_tag_slug"("tag_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_tag_slug"("tag_name" "text") IS 'Generates a URL-safe slug from a tag name';



CREATE OR REPLACE FUNCTION "public"."get_active_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Clerk stores the active org in 'org_id' claim when user switches orgs
  SELECT co.id
  FROM public.organizations co
  WHERE co.clerk_organization_id = (auth.jwt() ->> 'org_id')
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_active_org_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_org_id"() IS 'Returns the active organization ID (UUID) from JWT org_id claim';



CREATE OR REPLACE FUNCTION "public"."get_clerk_user_id"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT auth.jwt() ->> 'sub';
$$;


ALTER FUNCTION "public"."get_clerk_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_clerk_user_id"() IS 'Returns the Clerk user ID from the JWT sub claim. Uses auth.jwt()->>sub for Clerk compatibility.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT id
  FROM public.users
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_current_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_id"() IS 'Returns the internal user ID (bigint) for the current authenticated user';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."document_files" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "public_notes" "text",
    "private_notes" "text",
    "effective_date" "date",
    "expiration_date" "date",
    "is_required" boolean,
    "uploaded_by" "text",
    "uploaded_at" timestamp with time zone,
    "file_size" bigint,
    "file_type" "text",
    "document_name" "text",
    "storage_bucket" "text",
    "storage_path" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "period_start" "date",
    "period_end" "date",
    "document_category_id" bigint,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "document_status_id" bigint
);


ALTER TABLE "public"."document_files" OWNER TO "postgres";


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


ALTER FUNCTION "public"."get_deal_documents"("p_deal_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_deal_documents"("p_deal_id" "uuid") IS 'Returns all document files linked to a specific deal';



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


ALTER FUNCTION "public"."get_node_last_output"("p_workflow_id" "uuid", "p_node_id" "text") OWNER TO "postgres";


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


ALTER FUNCTION "public"."get_primary_key_column"("p_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_table_names"() RETURNS TABLE("table_name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT tablename::text AS table_name
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;


ALTER FUNCTION "public"."get_public_table_names"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_property_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_property_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_default_integrations_for_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO integrations (organization_id, user_id, type, status)
  SELECT new.organization_id, new.user_id::text, t.type, false
  FROM (VALUES ('floify'), ('xactus'), ('clear')) AS t(type)
  ON CONFLICT (organization_id, user_id, type) DO NOTHING;

  INSERT INTO workflow_integrations (organization_id, user_id, type, name, config)
  SELECT new.organization_id, new.user_id::text, t.type, NULL, '{}'::jsonb
  FROM (VALUES ('floify'), ('xactus'), ('clear'), ('nadlan')) AS t(type)
  ON CONFLICT (organization_id, user_id, type, name) DO NOTHING;

  RETURN new;
END; $$;


ALTER FUNCTION "public"."insert_default_integrations_for_member"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."is_internal_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_internal_admin"() IS 'Returns true if current user is an internal user AND their active organization is internal. Prevents internal user bypass when operating in an external org context.';



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


ALTER FUNCTION "public"."is_org_admin"("p_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") IS 'Returns true if the current user is an admin or owner of the specified organization. Uses auth.jwt()->>sub for Clerk compatibility.';



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


ALTER FUNCTION "public"."is_org_owner"("p_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_org_owner"("p_org_id" "uuid") IS 'Returns true if the current user is the owner of the specified organization. Uses auth.jwt()->>sub for Clerk compatibility.';



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


ALTER FUNCTION "public"."list_public_functions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_public_tables"() RETURNS TABLE("table_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;


ALTER FUNCTION "public"."list_public_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_table_columns"("p_table_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT c.column_name::text, c.data_type::text, (c.is_nullable = 'YES')
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$$;


ALTER FUNCTION "public"."list_table_columns"("p_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
DECLARE
  normalized_filter jsonb := filter;
BEGIN
  -- Route to llama_document_chunks_vs when filtering by docId (deal documents)
  IF filter ? 'docId' THEN
    -- Normalize string docId to number for JSONB containment matching
    IF jsonb_typeof(filter->'docId') = 'string' THEN
      normalized_filter := filter || jsonb_build_object(
        'docId', (filter->>'docId')::int
      );
    END IF;

    RETURN QUERY
    SELECT
      0::bigint as id,
      content,
      metadata,
      1 - (llama_document_chunks_vs.embedding <=> query_embedding) AS similarity
    FROM llama_document_chunks_vs
    WHERE metadata @> normalized_filter
    ORDER BY llama_document_chunks_vs.embedding <=> query_embedding
    LIMIT match_count;
  ELSE
    -- Default: query program_documents_chunks_vs (AI agent docs)
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
  END IF;
END;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


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


ALTER FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


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


ALTER FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer DEFAULT 8, "p_min_cosine_sim" double precision DEFAULT 0) RETURNS TABLE("document_id" "uuid", "chunk_index" integer, "content" "text", "cosine_sim" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <-> p_query_embedding) as cosine_sim  -- vector_cosine_ops makes <-> = cosine distance
  from public.document_chunks dc
  join public.program_documents d on d.id = dc.document_id
  where d.program_id = p_program_id
  order by dc.embedding <-> p_query_embedding
  limit greatest(p_match_count, 1)
$$;


ALTER FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) OWNER TO "postgres";


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


ALTER FUNCTION "public"."match_program_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


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


ALTER FUNCTION "public"."notify_background_report_created"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."notify_n8n_on_document_file_insert"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."register_integration_feature_policy"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."seed_custom_broker_settings_on_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end; $$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_programs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end$$;


ALTER FUNCTION "public"."set_programs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
begin
  -- Ensure an application row exists for this loan
  INSERT INTO public.applications (loan_id, organization_id, borrower_name, status)
  SELECT l.id, l.organization_id, null, 'draft'
  FROM public.loans l
  WHERE l.id = p_loan_id
    AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.loan_id = p_loan_id);

  -- Build source data from the primary scenario's normalized inputs
  WITH primary_scenario AS (
    SELECT ls.id AS scenario_id
    FROM public.loan_scenarios ls
    WHERE ls.loan_id = p_loan_id
      AND COALESCE(ls.primary, false) = true
    ORDER BY ls.created_at DESC NULLS LAST, ls.id DESC
    LIMIT 1
  ),
  -- Join scenario inputs with PE input definitions to get linked_table and input_code
  enriched_inputs AS (
    SELECT
      lsi.linked_record_id,
      lsi.value_text,
      pei.input_code,
      pei.linked_table
    FROM public.loan_scenario_inputs lsi
    JOIN public.pricing_engine_inputs pei ON pei.id = lsi.pricing_engine_input_id
    WHERE lsi.loan_scenario_id = (SELECT scenario_id FROM primary_scenario)
  ),
  -- Autodetect entity link (linked_table = 'entities')
  entity_link AS (
    SELECT
      linked_record_id::uuid AS entity_id,
      value_text AS borrower_name
    FROM enriched_inputs
    WHERE linked_table = 'entities' AND linked_record_id IS NOT NULL
    LIMIT 1
  ),
  -- Autodetect borrower links (linked_table = 'borrowers') — aggregate into arrays
  borrower_links AS (
    SELECT
      array_agg(linked_record_id::uuid) AS guarantor_ids,
      array_agg(value_text) FILTER (WHERE value_text IS NOT NULL) AS guarantor_names
    FROM enriched_inputs
    WHERE linked_table = 'borrowers' AND linked_record_id IS NOT NULL
  ),
  -- Extract address fields by input_code
  address_data AS (
    SELECT
      MAX(CASE WHEN input_code = 'address_street' THEN value_text END) AS property_street,
      MAX(CASE WHEN input_code = 'address_city'   THEN value_text END) AS property_city,
      MAX(CASE WHEN input_code = 'address_state'  THEN value_text END) AS property_state,
      MAX(CASE WHEN input_code = 'address_zip'    THEN value_text END) AS property_zip
    FROM enriched_inputs
    WHERE input_code IN ('address_street','address_city','address_state','address_zip')
  ),
  -- Fallback borrower_name from input_code if no entity link
  borrower_name_input AS (
    SELECT value_text AS borrower_name
    FROM enriched_inputs
    WHERE input_code = 'borrower_name'
    LIMIT 1
  ),
  src AS (
    SELECT
      el.entity_id,
      bl.guarantor_ids,
      bl.guarantor_names,
      ad.property_street,
      ad.property_city,
      ad.property_state,
      ad.property_zip,
      COALESCE(el.borrower_name, bn.borrower_name) AS borrower_name
    FROM (SELECT 1) AS _dummy
    LEFT JOIN entity_link el ON true
    LEFT JOIN borrower_links bl ON true
    LEFT JOIN address_data ad ON true
    LEFT JOIN borrower_name_input bn ON true
    WHERE EXISTS (SELECT 1 FROM primary_scenario)
    UNION ALL
    SELECT
      null::uuid,
      null::uuid[],
      null::text[],
      null::text,
      null::text,
      null::text,
      null::text,
      null::text
    WHERE NOT EXISTS (SELECT 1 FROM primary_scenario)
    LIMIT 1
  )
  UPDATE public.applications a
  SET entity_id       = src.entity_id,
      guarantor_ids   = src.guarantor_ids,
      guarantor_names = src.guarantor_names,
      property_street = src.property_street,
      property_city   = src.property_city,
      property_state  = src.property_state,
      property_zip    = src.property_zip,
      borrower_name   = src.borrower_name
  FROM src
  WHERE a.loan_id = p_loan_id;
end;
$$;


ALTER FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_assigned_from_viewers_del"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.credit_reports r
  set assigned_to = array_remove(r.assigned_to, OLD.user_id)
  where r.id = OLD.report_id;
  return OLD;
end;
$$;


ALTER FUNCTION "public"."sync_assigned_from_viewers_del"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_assigned_from_viewers_ins"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.credit_reports r
  set assigned_to = (
    select array_agg(distinct x)
    from unnest(coalesce(r.assigned_to, '{}'::text[]) || array[NEW.user_id]) as t(x)
  )
  where r.id = NEW.report_id;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_assigned_from_viewers_ins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_borrower_to_entity_owners"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.entity_owners eo
  set
    name = new.first_name || ' ' || coalesce(new.last_name, ''),
    ssn_last4 = coalesce(new.ssn_last4, eo.ssn_last4),
    address = coalesce(
      nullif(trim(concat_ws(', ',
        new.address_line1,
        concat_ws(' ', new.city, new.state),
        new.zip
      )), ''),
      eo.address
    )
  where eo.borrower_id = new.id;
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_borrower_to_entity_owners"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_scenario_id uuid;
  v_app record;
  v_entity_pe_id bigint;
  v_guarantors_pe_id bigint;
begin
  -- Recursion guard: if already syncing, bail out to prevent
  -- loan_scenario_inputs trigger → forward sync → applications trigger → reverse sync loop
  IF current_setting('app.sync_in_progress', true) = 'true' THEN
    RETURN;
  END IF;
  PERFORM set_config('app.sync_in_progress', 'true', true);

  -- Find the primary scenario for this loan
  SELECT ls.id INTO v_scenario_id
  FROM public.loan_scenarios ls
  WHERE ls.loan_id = p_loan_id
    AND COALESCE(ls.primary, false) = true
  ORDER BY ls.created_at DESC NULLS LAST, ls.id DESC
  LIMIT 1;

  IF v_scenario_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_app FROM public.applications WHERE loan_id = p_loan_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Look up PE input IDs
  SELECT id INTO v_entity_pe_id
  FROM public.pricing_engine_inputs
  WHERE input_code = 'borrower_name' AND archived_at IS NULL
  LIMIT 1;

  SELECT id INTO v_guarantors_pe_id
  FROM public.pricing_engine_inputs
  WHERE input_code = 'guarantors' AND archived_at IS NULL
  LIMIT 1;

  -- Sync entity (borrower_name) from application → scenario input
  IF v_entity_pe_id IS NOT NULL AND v_app.borrower_name IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.loan_scenario_inputs
      WHERE loan_scenario_id = v_scenario_id AND pricing_engine_input_id = v_entity_pe_id
    ) THEN
      UPDATE public.loan_scenario_inputs
      SET value_text = v_app.borrower_name,
          linked_record_id = CASE
            WHEN v_app.entity_id IS NOT NULL THEN v_app.entity_id::text
            ELSE linked_record_id
          END
      WHERE loan_scenario_id = v_scenario_id
        AND pricing_engine_input_id = v_entity_pe_id;
    ELSE
      INSERT INTO public.loan_scenario_inputs
        (loan_scenario_id, pricing_engine_input_id, input_type, value_text, linked_record_id)
      VALUES (
        v_scenario_id,
        v_entity_pe_id,
        'text',
        v_app.borrower_name,
        CASE WHEN v_app.entity_id IS NOT NULL THEN v_app.entity_id::text ELSE NULL END
      );
    END IF;
  END IF;

  -- Sync guarantors from application → scenario input
  IF v_guarantors_pe_id IS NOT NULL AND v_app.guarantor_names IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.loan_scenario_inputs
      WHERE loan_scenario_id = v_scenario_id AND pricing_engine_input_id = v_guarantors_pe_id
    ) THEN
      UPDATE public.loan_scenario_inputs
      SET value_array = to_jsonb(v_app.guarantor_names)
      WHERE loan_scenario_id = v_scenario_id
        AND pricing_engine_input_id = v_guarantors_pe_id;
    ELSE
      INSERT INTO public.loan_scenario_inputs
        (loan_scenario_id, pricing_engine_input_id, input_type, value_array)
      VALUES (
        v_scenario_id,
        v_guarantors_pe_id,
        'tags',
        to_jsonb(v_app.guarantor_names)
      );
    END IF;
  END IF;
end;
$$;


ALTER FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") OWNER TO "postgres";


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


ALTER FUNCTION "public"."sync_stepper_on_dropdown_change"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."sync_user_deal_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_viewers_from_credit_reports"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- insert missing viewers for each assigned user
  insert into public.credit_report_viewers (report_id, user_id)
  select NEW.id, t.user_id
  from unnest(coalesce(NEW.assigned_to, '{}'::text[])) as t(user_id)
  on conflict (report_id, user_id) do nothing;

  -- delete viewers that are no longer assigned
  delete from public.credit_report_viewers v
  where v.report_id = NEW.id
    and not (v.user_id = any(coalesce(NEW.assigned_to, '{}'::text[])));

  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_viewers_from_credit_reports"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_ai_chat_last_used"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.ai_chats
     set last_used_at = now()
   where id = new.ai_chat_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_ai_chat_last_used"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_credit_report_chat_last_used"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.credit_report_chats
     set last_used_at = now()
   where id = new.credit_report_chat_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_credit_report_chat_last_used"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_applications_sync_from_primary_scenario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.loan_id is not null then
    perform public.sync_application_from_primary_scenario(new.loan_id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_applications_sync_from_primary_scenario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_applications_sync_primary_scenario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.loan_id is not null then
    perform public.sync_primary_scenario_from_application(new.loan_id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_applications_sync_primary_scenario"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."trg_ddp_from_deal_guarantors"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."trg_ddp_from_deal_property"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_loan_scenarios_sync_applications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  affected_old uuid;
  affected_new uuid;
  needs_new boolean := false;
  needs_old boolean := false;
begin
  if tg_op = 'INSERT' then
    affected_new := new.loan_id;
    needs_new := true;
  elsif tg_op = 'UPDATE' then
    affected_new := new.loan_id;
    affected_old := old.loan_id;

    if affected_new is distinct from affected_old then
      needs_old := affected_old is not null;
      needs_new := affected_new is not null;
    end if;

    if coalesce(new.primary, false) is distinct from coalesce(old.primary, false) then
      needs_new := true;
    end if;
  elsif tg_op = 'DELETE' then
    affected_old := old.loan_id;
    needs_old := affected_old is not null;
  end if;

  if needs_old then
    perform public.sync_application_from_primary_scenario(affected_old);
  end if;
  if needs_new then
    perform public.sync_application_from_primary_scenario(affected_new);
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;


ALTER FUNCTION "public"."trg_loan_scenarios_sync_applications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return NEW;
end
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_deal_signature_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_deal_signature_requests_updated_at"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."validate_deal_guarantors_array"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."validate_document_file_status_assignment"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automations" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "workflow_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "trigger_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "webhook_type" "text",
    CONSTRAINT "actions_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['webhook'::"text", 'manual'::"text", 'cron'::"text"])))
);


ALTER TABLE "public"."automations" OWNER TO "postgres";


ALTER TABLE "public"."automations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."actions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ai_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ai_chat_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_chat_messages_user_type_check" CHECK (("user_type" = ANY (ARRAY['user'::"text", 'agent'::"text"])))
);


ALTER TABLE "public"."ai_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT 'New chat'::"text" NOT NULL,
    "loan_type" "text",
    "program_id" "uuid"
);


ALTER TABLE "public"."ai_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_settings" IS 'Global key-value store for application-wide settings (e.g. deal heading/subheading expressions)';



CREATE TABLE IF NOT EXISTS "public"."application_appraisal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "lender" "text",
    "investor" "text",
    "transaction_type" "text",
    "loan_type" "text",
    "loan_type_other" "text",
    "loan_number" "text",
    "priority" "text",
    "borrower_name" "text",
    "borrower_email" "text",
    "borrower_phone" "text",
    "borrower_alt_phone" "text",
    "property_type" "text",
    "occupancy_type" "text",
    "property_address" "text",
    "property_city" "text",
    "property_state" "text",
    "property_zip" "text",
    "property_county" "text",
    "contact_person" "text",
    "contact_name" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "other_access_info" "text",
    "product" "text",
    "loan_amount" "text",
    "sales_price" "text",
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "amc_id" "uuid"
);


ALTER TABLE "public"."application_appraisal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_background" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_id" "uuid",
    "borrower_id" "uuid",
    "party_index" integer DEFAULT 0 NOT NULL,
    "is_entity" boolean DEFAULT false NOT NULL,
    "glb" "text",
    "dppa" "text",
    "voter" "text",
    "entity_name" "text",
    "entity_type" "text",
    "ein" "text",
    "state_of_formation" "text",
    "date_of_formation" "date",
    "first_name" "text",
    "middle_initial" "text",
    "last_name" "text",
    "date_of_birth" "date",
    "email" "text",
    "phone" "text",
    "street" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "province" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."application_background" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_credit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "borrower_id" "uuid",
    "guarantor_index" integer DEFAULT 0 NOT NULL,
    "pull_type" "text" DEFAULT 'soft'::"text",
    "include_tu" boolean DEFAULT true,
    "include_ex" boolean DEFAULT true,
    "include_eq" boolean DEFAULT true,
    "first_name" "text",
    "last_name" "text",
    "date_of_birth" "date",
    "street" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "prev_street" "text",
    "prev_city" "text",
    "prev_state" "text",
    "prev_zip" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."application_credit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_signings" (
    "id" bigint NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "signer_email" "text" NOT NULL,
    "documenso_document_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."application_signings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."application_signings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."application_signings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."application_signings_id_seq" OWNED BY "public"."application_signings"."id";



CREATE TABLE IF NOT EXISTS "public"."applications" (
    "loan_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "property_street" "text",
    "property_city" "text",
    "property_state" "text",
    "property_zip" "text",
    "entity_id" "uuid",
    "borrower_name" "text",
    "guarantor_ids" "uuid"[],
    "guarantor_names" "text"[],
    "documenso_document_id" "text",
    "application_url" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "guarantor_emails" "text"[],
    "form_data" "jsonb" DEFAULT '{}'::"jsonb",
    "external_defaults" "jsonb" DEFAULT '{}'::"jsonb",
    "merged_data" "jsonb" DEFAULT '{}'::"jsonb",
    "display_id" "text" NOT NULL
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications_emails_sent" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "initial" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."applications_emails_sent" OWNER TO "postgres";


ALTER TABLE "public"."applications_emails_sent" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."applications_emails_sent_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "date_report_effective" "date",
    "date_report_expiration" "date",
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "property_id" bigint,
    "deal_id" "uuid",
    "document_id" bigint,
    "date_report_ordered" "date",
    "date_report_received" "date",
    "date_inspection_completed" "date",
    "date_inspection_scheduled" "date",
    "value_conclusion_as_is" numeric,
    "value_conclusion_as_repaired" numeric,
    "value_conclusion_fair_market_rent" numeric,
    "file_number_amc" "text",
    "file_number" "text",
    "co_appraisal" "uuid",
    "co_amc" "uuid",
    "appraiser_id" bigint,
    "date_amc_vendor_assign" timestamp with time zone,
    "date_amc_vendor_accept" timestamp with time zone,
    "order_type" "text",
    "order_status" "text",
    "organization_id" "uuid",
    "borrower_id" "uuid",
    "borrower_name" "text",
    "loan_number" "text",
    "property_address" "text",
    "property_city" "text",
    "property_state" "text",
    "property_zip" "text",
    "amc_id" "uuid",
    "date_due" "date",
    "created_by" "text"
);


ALTER TABLE "public"."appraisal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appraisal_amcs" (
    "id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_amcs" OWNER TO "postgres";


COMMENT ON TABLE "public"."appraisal_amcs" IS 'Lookup table for Appraisal Management Companies per org';



ALTER TABLE "public"."appraisal_amcs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_amcs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_borrowers" (
    "id" bigint NOT NULL,
    "appraisal_id" bigint NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."appraisal_borrowers" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_borrowers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_borrowers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_documents" (
    "id" bigint NOT NULL,
    "appraisal_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text",
    "uploaded_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_documents" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_documents" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."appraisal" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_investor_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "investor_id" "text",
    "investor_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_investor_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_investor_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_investor_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_lender_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "lender_id" "text",
    "lender_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_lender_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_lender_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_lender_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_loan_type_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "loan_type_id" "text",
    "loan_type_name" "text",
    "other" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_loan_type_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_loan_type_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_loan_type_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_occupancy_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "occupancy_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_occupancy_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_occupancy_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_occupancy_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_product_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "product_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_product_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_product_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_product_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_property_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "property_id" "text",
    "property_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_property_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_property_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_property_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_status_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "status_id" "text",
    "status_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision_requested" boolean DEFAULT false
);


ALTER TABLE "public"."appraisal_status_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_status_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_status_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appraisal_transaction_type_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "transaction_type_name" "text",
    "transaction_type_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appraisal_transaction_type_list" OWNER TO "postgres";


ALTER TABLE "public"."appraisal_transaction_type_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."appraisal_transaction_type_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_person_search_lien" (
    "id" bigint NOT NULL,
    "background_person_search_id" bigint,
    "amount" "text",
    "file_date" "text",
    "filing_type" "text",
    "creditor_name" "text",
    "debtor_name" "text",
    "filing_county" "text",
    "filing_state" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."background_person_search_lien" OWNER TO "postgres";


ALTER TABLE "public"."background_person_search_lien" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_people_search_lien_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_person_search_ucc" (
    "id" bigint NOT NULL,
    "background_person_search_id" bigint,
    "filing_type" "text",
    "filing_date" "text",
    "filing_number" "text",
    "debtor_name" "text",
    "secured_party" "text",
    "collateral_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."background_person_search_ucc" OWNER TO "postgres";


ALTER TABLE "public"."background_person_search_ucc" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_people_search_ucc_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_person_search" (
    "id" bigint NOT NULL,
    "background_report_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "glb" "text",
    "dppa" integer,
    "voter" integer,
    "entity_id" "text",
    "group_id" "text"
);


ALTER TABLE "public"."background_person_search" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."background_person_search_bankruptcy" (
    "id" bigint NOT NULL,
    "background_person_report_id" "text",
    "bk_case_number" "text",
    "bk_chapter" "text",
    "bk_filing_date" "text",
    "bk_discharged_date" "text",
    "bk_court_state" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."background_person_search_bankruptcy" OWNER TO "postgres";


ALTER TABLE "public"."background_person_search_bankruptcy" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_person_search_bankruptcy_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_person_search_criminal" (
    "id" bigint NOT NULL,
    "background_person_search_id" bigint,
    "cr_case_info" "text",
    "cr_filed_date" "text",
    "cr_offense" "text",
    "cr_severity" "text",
    "cr_disposition" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb",
    "cr_case_status" "text"
);


ALTER TABLE "public"."background_person_search_criminal" OWNER TO "postgres";


ALTER TABLE "public"."background_person_search_criminal" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_person_search_criminal_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."background_person_search" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_person_search_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_person_search_litigation" (
    "id" bigint NOT NULL,
    "background_person_search_id" bigint,
    "lit_case_number" "text",
    "lit_filing_date" "text",
    "lit_case_type" "text",
    "lit_status" "text",
    "lit_disposition_date" "text",
    "lit_judgement_amount" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."background_person_search_litigation" OWNER TO "postgres";


ALTER TABLE "public"."background_person_search_litigation" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_person_search_litigation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_person_search_quick_analysis" (
    "id" bigint NOT NULL,
    "background_person_search_id" bigint,
    "record_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."background_person_search_quick_analysis" OWNER TO "postgres";


ALTER TABLE "public"."background_person_search_quick_analysis" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_person_search_quick_analysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_report_applications" (
    "id" bigint NOT NULL,
    "background_report_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."background_report_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."background_report_applications" IS 'Junction table linking background reports to applications (many-to-many)';



ALTER TABLE "public"."background_report_applications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."background_report_applications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."background_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "borrower_id" "uuid",
    "entity_id" "uuid",
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."background_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."background_reports" IS 'Standalone background check reports linked to borrowers or entities';



CREATE TABLE IF NOT EXISTS "public"."borrower_entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "role" "text",
    "guarantor" boolean,
    "ownership_percent" numeric,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."borrower_entities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."borrowers_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."borrowers_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."borrowers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_id" "text" DEFAULT ('BRW-'::"text" || "lpad"(("nextval"('"public"."borrowers_seq"'::"regclass"))::"text", 5, '0'::"text")) NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "date_of_birth" "date",
    "fico_score" integer,
    "organization_id" "uuid" NOT NULL,
    "assigned_to" "text"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ssn_encrypted" "bytea",
    "ssn_last4" "text",
    "primary_phone" "text",
    "alt_phone" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "citizenship" "text",
    "green_card" boolean,
    "visa" boolean,
    "visa_type" "text",
    "rentals_owned" integer,
    "fix_flips_3yrs" integer,
    "groundups_3yrs" integer,
    "real_estate_licensed" boolean,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    CONSTRAINT "borrowers_citizenship_check" CHECK (("citizenship" = ANY (ARRAY['U.S. Citizen'::"text", 'Permanent Resident'::"text", 'Non-Permanent Resident'::"text", 'Foreign National'::"text"]))),
    CONSTRAINT "borrowers_ssn_last4_check" CHECK (("ssn_last4" ~ '^[0-9]{4}$'::"text")),
    CONSTRAINT "borrowers_zip_check" CHECK (("zip" ~ '^[0-9]{5}$'::"text"))
);


ALTER TABLE "public"."borrowers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brokers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_member_id" "uuid",
    "clerk_user_id" "text",
    "clerk_invitation_id" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_at" timestamp with time zone,
    "email" "text",
    "account_manager_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "company_name" "text",
    "company_logo_url" "text",
    CONSTRAINT "brokers_status_chk" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."brokers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact" (
    "id" bigint NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email_address" "text",
    "cell_phone" "text",
    "home_phone" "text",
    "office_phone" "text",
    "portal_access" boolean DEFAULT false,
    "profile_picture" "text",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "middle_name" "text",
    "name" "text" GENERATED ALWAYS AS (
CASE
    WHEN (("middle_name" IS NOT NULL) AND ("middle_name" <> ''::"text")) THEN (((("first_name" || ' '::"text") || "middle_name") || ' '::"text") || "last_name")
    ELSE (("first_name" || ' '::"text") || "last_name")
END) STORED
);


ALTER TABLE "public"."contact" OWNER TO "postgres";


ALTER TABLE "public"."contact" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contact_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."credit_report_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_report_chat_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_report_chat_messages_user_type_check" CHECK (("user_type" = ANY (ARRAY['user'::"text", 'agent'::"text"])))
);


ALTER TABLE "public"."credit_report_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT 'Credit report chat'::"text" NOT NULL,
    "active_guarantor_id" "uuid"
);


ALTER TABLE "public"."credit_report_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_data_links" (
    "id" bigint NOT NULL,
    "credit_report_id" "uuid" NOT NULL,
    "aggregator" "text" DEFAULT 'xactus'::"text" NOT NULL,
    "aggregator_data_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_report_data_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_report_data_links" IS 'Links credit_reports to aggregator-specific data tables (xactus, etc.)';



ALTER TABLE "public"."credit_report_data_links" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."credit_report_data_links_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."credit_report_data_xactus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "borrower_id" "uuid",
    "cleaned_data" json,
    "pull_type" "text",
    "transunion_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "experian_score" numeric,
    "equifax_score" numeric,
    "uploaded_by" "text",
    "report_id" "text",
    "date_ordered" "date",
    "guarantor_id" bigint,
    "organization_id" "uuid",
    "credit_report_id" "uuid",
    "mid_score" numeric,
    "report_date" "date",
    "aggregator" "text",
    "tradelines" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "liabilities" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "public_records" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "inquiries" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."credit_report_data_xactus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_user_chats" (
    "report_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_report_user_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_report_viewers" (
    "report_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "added_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_report_viewers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assigned_to" "text"[] NOT NULL,
    "status" "text" DEFAULT 'stored'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "borrower_id" "uuid",
    "organization_id" "uuid",
    "aggregator" "text",
    "report_id" "text",
    "data" "jsonb",
    "transunion_score" integer,
    "experian_score" integer,
    "equifax_score" integer,
    "mid_score" integer,
    "pull_type" "text",
    "report_date" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."credit_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_broker_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "organization_member_id" "uuid" NOT NULL,
    "broker_org_id" "uuid" NOT NULL,
    "allow_ysp" boolean DEFAULT false NOT NULL,
    "allow_buydown_rate" boolean DEFAULT false NOT NULL,
    "program_visibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "rates" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "default" boolean DEFAULT true,
    "allow_white_labeling" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."custom_broker_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_widget_chats" (
    "id" bigint NOT NULL,
    "dashboard_widget_id" bigint NOT NULL,
    "name" "text" DEFAULT 'New chat'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboard_widget_chats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dashboard_widget_chats_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dashboard_widget_chats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dashboard_widget_chats_id_seq" OWNED BY "public"."dashboard_widget_chats"."id";



CREATE TABLE IF NOT EXISTS "public"."dashboard_widget_conversations" (
    "id" bigint NOT NULL,
    "dashboard_widget_id" bigint NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dashboard_widget_chat_id" bigint NOT NULL,
    CONSTRAINT "dashboard_widget_conversations_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."dashboard_widget_conversations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dashboard_widget_conversations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dashboard_widget_conversations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dashboard_widget_conversations_id_seq" OWNED BY "public"."dashboard_widget_conversations"."id";



CREATE TABLE IF NOT EXISTS "public"."dashboard_widgets" (
    "id" bigint NOT NULL,
    "slot" "text" NOT NULL,
    "widget_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "trend_label" "text",
    "trend_description" "text",
    "value_format" "text",
    "value_prefix" "text",
    "value_suffix" "text",
    "chart_type" "text" DEFAULT 'area'::"text",
    "x_axis_key" "text" DEFAULT 'date'::"text",
    "y_axis_key" "text" DEFAULT 'value'::"text",
    "sql_query" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "text",
    "icon" "text",
    CONSTRAINT "dashboard_widgets_chart_type_check" CHECK (("chart_type" = ANY (ARRAY['area'::"text", 'bar'::"text", 'line'::"text"]))),
    CONSTRAINT "dashboard_widgets_slot_check" CHECK (("slot" = ANY (ARRAY['kpi_1'::"text", 'kpi_2'::"text", 'kpi_3'::"text", 'kpi_4'::"text", 'chart_1'::"text"]))),
    CONSTRAINT "dashboard_widgets_value_format_check" CHECK (("value_format" = ANY (ARRAY['currency'::"text", 'number'::"text", 'percentage'::"text", 'integer'::"text"]))),
    CONSTRAINT "dashboard_widgets_widget_type_check" CHECK (("widget_type" = ANY (ARRAY['kpi'::"text", 'chart'::"text"])))
);


ALTER TABLE "public"."dashboard_widgets" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."dashboard_widgets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dashboard_widgets_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dashboard_widgets_id_seq" OWNED BY "public"."dashboard_widgets"."id";



CREATE TABLE IF NOT EXISTS "public"."deal_borrower" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "vesting_type" "text",
    "deal_entity_id" bigint NOT NULL,
    "deal_guarantor_ids" bigint[] DEFAULT '{}'::bigint[]
);


ALTER TABLE "public"."deal_borrower" OWNER TO "postgres";


ALTER TABLE "public"."deal_borrower" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."deal_borrower_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_calendar_events" (
    "id" bigint NOT NULL,
    "deal_id" "uuid",
    "event_title" "text",
    "event_description" "text",
    "all_day" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "etiquette" "text",
    "event_date" "date" NOT NULL,
    "event_time" time without time zone,
    "deal_input_id" bigint
);


ALTER TABLE "public"."deal_calendar_events" OWNER TO "postgres";


ALTER TABLE "public"."deal_calendar_events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_calendar_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_clerk_orgs" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "clerk_org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."deal_clerk_orgs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_comment_mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "mentioned_user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_comment_mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_comment_reads" (
    "deal_id" "text" NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_comment_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "text" NOT NULL,
    "author_clerk_user_id" "text" NOT NULL,
    "author_name" "text" NOT NULL,
    "author_avatar_url" "text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_document_ai_chat" (
    "id" bigint NOT NULL,
    "deal_document_id" bigint,
    "user_id" "text",
    "user_type" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "citations" "jsonb"
);


ALTER TABLE "public"."deal_document_ai_chat" OWNER TO "postgres";


COMMENT ON COLUMN "public"."deal_document_ai_chat"."citations" IS 'Stores citation data for agent messages: [{page, bbox: {x,y,w,h}, snippet, docId, chunkId, whyRelevant}]';



ALTER TABLE "public"."deal_document_ai_chat" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_document_ai_chat_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_document_ai_condition" (
    "id" bigint NOT NULL,
    "document_type_ai_condition" bigint,
    "deal_document_id" bigint,
    "response" json,
    "ai_value" boolean,
    "approved_value" boolean,
    "rejected" boolean,
    "user_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_document_ai_condition" OWNER TO "postgres";


ALTER TABLE "public"."deal_document_ai_condition" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_document_ai_condition_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_document_ai_input" (
    "id" bigint NOT NULL,
    "document_type_ai_input_id" bigint,
    "deal_document_id" bigint,
    "response" json,
    "ai_value" "text",
    "approved_value" "text",
    "rejected" boolean,
    "user_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_document_ai_input" OWNER TO "postgres";


ALTER TABLE "public"."deal_document_ai_input" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_document_ai_input_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_document_overrides" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "document_type_id" bigint NOT NULL,
    "is_visible_override" boolean,
    "is_required_override" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_document_overrides" OWNER TO "postgres";


ALTER TABLE "public"."deal_document_overrides" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_document_overrides_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_documents" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "document_type_id" bigint,
    "file_name" "text" NOT NULL,
    "file_size" bigint,
    "file_type" "text",
    "storage_path" "text",
    "uploaded_by" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "document_file_id" bigint,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."deal_documents" OWNER TO "postgres";


ALTER TABLE "public"."deal_documents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_entity" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deal_id" "uuid",
    "entity_id" "uuid",
    "entity_name" "text",
    "entity_type" "text",
    "ein" "text",
    "date_formed" "date",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "state_formed" "text",
    "members" integer
);


ALTER TABLE "public"."deal_entity" OWNER TO "postgres";


ALTER TABLE "public"."deal_entity" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_entity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_entity_owners" (
    "id" bigint NOT NULL,
    "deal_id" "uuid",
    "entity_id" "uuid",
    "borrower_id" "uuid",
    "entity_owner_id" "uuid",
    "name" "text",
    "title" "text",
    "member_type" "text",
    "ownership_percent" numeric,
    "address" "text",
    "ssn_encrypted" "text",
    "ssn_last4" "text",
    "ein" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_entity_owners" OWNER TO "postgres";


ALTER TABLE "public"."deal_entity_owners" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_entity_owners_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_guarantors" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "guarantor_id" bigint NOT NULL,
    "is_primary" boolean DEFAULT false,
    "display_order" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deal_guarantors" OWNER TO "postgres";


ALTER TABLE "public"."deal_guarantors" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_guarantors_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_inputs" (
    "id" bigint NOT NULL,
    "deal_id" "uuid",
    "input_type" "text",
    "value_text" "text",
    "value_numeric" numeric,
    "value_date" "date",
    "value_array" json,
    "value_bool" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "input_id" bigint,
    "linked_record_id" "text"
);


ALTER TABLE "public"."deal_inputs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."deal_inputs"."linked_record_id" IS 'PK of the selected record in the linked table';



ALTER TABLE "public"."deal_inputs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_inputs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_property" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "property_id" bigint NOT NULL
);


ALTER TABLE "public"."deal_property" OWNER TO "postgres";


ALTER TABLE "public"."deal_property" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_property_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_role_types" (
    "id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "allows_multiple" boolean DEFAULT true,
    "display_order" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deal_role_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."deal_role_types" IS 'Defines roles that can be assigned to users on deals for document access control and workflow';



ALTER TABLE "public"."deal_role_types" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_role_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_roles" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "contact_id" bigint,
    "deal_role_types_id" bigint NOT NULL,
    "users_id" bigint,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entities_id" "uuid",
    "guarantor_id" bigint,
    CONSTRAINT "deal_roles_has_party" CHECK (((((
CASE
    WHEN ("users_id" IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN ("contact_id" IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN ("entities_id" IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN ("guarantor_id" IS NOT NULL) THEN 1
    ELSE 0
END) = 1))
);


ALTER TABLE "public"."deal_roles" OWNER TO "postgres";


ALTER TABLE "public"."deal_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_signature_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "documenso_document_id" "text" NOT NULL,
    "document_name" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "recipients" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by_user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deal_signature_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'signed'::"text", 'declined'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."deal_signature_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_stages" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."deal_stages" OWNER TO "postgres";


ALTER TABLE "public"."deal_stages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_stages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_stepper" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "input_stepper_id" bigint NOT NULL,
    "current_step" "text" NOT NULL,
    "step_order" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "is_frozen" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."deal_stepper" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_stepper_history" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "deal_stepper_id" bigint NOT NULL,
    "previous_step" "text",
    "new_step" "text" NOT NULL,
    "changed_by" "text",
    "change_source" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reached_final_step" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."deal_stepper_history" OWNER TO "postgres";


ALTER TABLE "public"."deal_stepper_history" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_stepper_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."deal_stepper" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_stepper_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_task_events" (
    "id" bigint NOT NULL,
    "deal_task_id" bigint NOT NULL,
    "event_type" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "performed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_task_events" OWNER TO "postgres";


ALTER TABLE "public"."deal_task_events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_task_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_tasks" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "task_template_id" bigint,
    "title" "text" NOT NULL,
    "description" "text",
    "task_status_id" bigint,
    "task_priority_id" bigint,
    "assigned_to_user_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "due_date_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "display_order" integer DEFAULT 0,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "deal_stage_id" bigint
);


ALTER TABLE "public"."deal_tasks" OWNER TO "postgres";


ALTER TABLE "public"."deal_tasks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deal_tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deal_users" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_users" OWNER TO "postgres";


ALTER TABLE "public"."deal_users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."deal_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "assigned_to_user_id" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "primary_user_id" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


ALTER TABLE "public"."deal_clerk_orgs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deals_clerk_orgs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."default_broker_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "organization_member_id" "uuid" NOT NULL,
    "allow_ysp" boolean DEFAULT false NOT NULL,
    "allow_buydown_rate" boolean DEFAULT false NOT NULL,
    "program_visibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "rates" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "allow_white_labeling" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."default_broker_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_access_permissions" (
    "id" bigint NOT NULL,
    "clerk_org_id" "uuid" NOT NULL,
    "deal_role_types_id" bigint NOT NULL,
    "document_categories_id" bigint NOT NULL,
    "can_view" boolean DEFAULT false NOT NULL,
    "can_insert" boolean DEFAULT false NOT NULL,
    "can_upload" boolean DEFAULT false NOT NULL,
    "can_delete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by_user_id" bigint,
    "updated_by_clerk_sub" "text"
);


ALTER TABLE "public"."document_access_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_access_permissions_global" (
    "id" bigint NOT NULL,
    "deal_role_types_id" bigint NOT NULL,
    "document_categories_id" bigint NOT NULL,
    "can_view" boolean DEFAULT false,
    "can_insert" boolean DEFAULT false,
    "can_upload" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_access_permissions_global" OWNER TO "postgres";


ALTER TABLE "public"."document_access_permissions_global" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_access_permissions_global_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."document_access_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_access_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_categories" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "storage_folder" "text" NOT NULL,
    "icon" "text",
    "default_display_order" integer,
    "is_active" boolean DEFAULT true,
    "is_internal_only" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_categories" IS 'Document categories for organizing and controlling access to loan documents';



ALTER TABLE "public"."document_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_categories_user_order" (
    "id" bigint NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "document_categories_id" bigint NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_categories_user_order" OWNER TO "postgres";


ALTER TABLE "public"."document_categories_user_order" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_categories_user_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_file_statuses" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "document_status_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" bigint,
    "updated_by" bigint,
    "note" "text"
);


ALTER TABLE "public"."document_file_statuses" OWNER TO "postgres";


ALTER TABLE "public"."document_file_statuses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_file_statuses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_background_reports" (
    "id" bigint NOT NULL,
    "document_file_id" bigint,
    "background_report_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text"
);


ALTER TABLE "public"."document_files_background_reports" OWNER TO "postgres";


ALTER TABLE "public"."document_files_background_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_background_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_borrowers" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."document_files_borrowers" OWNER TO "postgres";


ALTER TABLE "public"."document_files_borrowers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_borrowers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_clerk_orgs" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "clerk_org_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."document_files_clerk_orgs" OWNER TO "postgres";


ALTER TABLE "public"."document_files_clerk_orgs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_clerk_orgs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_clerk_users" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "clerk_user_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."document_files_clerk_users" OWNER TO "postgres";


ALTER TABLE "public"."document_files_clerk_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_clerk_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_credit_reports" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "credit_report_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."document_files_credit_reports" OWNER TO "postgres";


ALTER TABLE "public"."document_files_credit_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_credit_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_deals" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "source_table" "text" DEFAULT 'document_files'::"text" NOT NULL,
    "source_pk" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_files_deals" OWNER TO "postgres";


ALTER TABLE "public"."document_files_deals" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_deals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_entities" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."document_files_entities" OWNER TO "postgres";


ALTER TABLE "public"."document_files_entities" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."document_files" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_files_tags" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "document_tag_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint
);


ALTER TABLE "public"."document_files_tags" OWNER TO "postgres";


ALTER TABLE "public"."document_files_tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_files_tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_logic" (
    "id" bigint NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_logic" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_logic" IS 'This is a duplicate of input_logic';



CREATE TABLE IF NOT EXISTS "public"."document_logic_actions" (
    "id" bigint NOT NULL,
    "document_logic_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value_type" "text",
    "value_visible" boolean,
    "value_required" boolean,
    "document_type_id" bigint,
    "category_id" bigint
);


ALTER TABLE "public"."document_logic_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_logic_actions" IS 'This is a duplicate of input_logic_actions';



ALTER TABLE "public"."document_logic_actions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_logic_actions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_logic_conditions" (
    "id" bigint NOT NULL,
    "document_logic_id" bigint,
    "operator" "text",
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value_type" "text" DEFAULT 'value'::"text",
    "value_expression" "text",
    "field" bigint,
    "value_field" bigint
);


ALTER TABLE "public"."document_logic_conditions" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_logic_conditions" IS 'This is a duplicate of input_logic_conditions';



ALTER TABLE "public"."document_logic_conditions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_logic_conditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."document_logic" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_logic_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."llama_document_parsed" (
    "id" bigint NOT NULL,
    "document_id" bigint,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "llama_id" "text",
    "llama_project_id" "text"
);


ALTER TABLE "public"."llama_document_parsed" OWNER TO "postgres";


ALTER TABLE "public"."llama_document_parsed" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_parsed_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_roles" (
    "id" bigint NOT NULL,
    "role_name" "text" NOT NULL
);


ALTER TABLE "public"."document_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_roles_files" (
    "id" bigint NOT NULL,
    "document_files_id" bigint NOT NULL,
    "document_roles_id" bigint NOT NULL
);


ALTER TABLE "public"."document_roles_files" OWNER TO "postgres";


ALTER TABLE "public"."document_roles_files" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_roles_files_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."document_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_status" (
    "id" bigint NOT NULL,
    "organization_id" "uuid",
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "color" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_terminal" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."document_status" OWNER TO "postgres";


ALTER TABLE "public"."document_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_statuses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_tags" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_tags" OWNER TO "postgres";


ALTER TABLE "public"."document_tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_template_variables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "variable_type" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "path" "text"
);


ALTER TABLE "public"."document_template_variables" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_template_variables" IS 'Stores custom fields for document templates with their types, required status, and display order';



CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "html_content" "text" DEFAULT ''::"text" NOT NULL,
    "gjs_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."document_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_templates" IS 'Stores term sheet templates with HTML content and GrapesJS editor data';



CREATE TABLE IF NOT EXISTS "public"."document_type_ai_condition" (
    "id" bigint NOT NULL,
    "document_type" bigint,
    "condition_label" "text",
    "ai_prompt" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_type_ai_condition" OWNER TO "postgres";


ALTER TABLE "public"."document_type_ai_condition" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_type_ai_condition_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_type_ai_input" (
    "id" bigint NOT NULL,
    "document_type_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ai_prompt" "text",
    "input_id" bigint
);


ALTER TABLE "public"."document_type_ai_input" OWNER TO "postgres";


ALTER TABLE "public"."document_type_ai_input" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_type_ai_input_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_type_ai_input_order" (
    "id" bigint NOT NULL,
    "document_type_ai_input_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."document_type_ai_input_order" OWNER TO "postgres";


ALTER TABLE "public"."document_type_ai_input_order" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_type_ai_input_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_types" (
    "id" bigint NOT NULL,
    "document_category_id" bigint,
    "document_name" "text",
    "document_description" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."document_types" OWNER TO "postgres";


ALTER TABLE "public"."document_types" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."document_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."program_documents_chunks_vs" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."program_documents_chunks_vs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."program_documents_chunks_vs"."id";



CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Untitled Template'::"text" NOT NULL,
    "subject" "text" DEFAULT ''::"text" NOT NULL,
    "preview_text" "text" DEFAULT ''::"text" NOT NULL,
    "from_address" "text",
    "reply_to" "text",
    "liveblocks_room_id" "text",
    "editor_json" "jsonb" DEFAULT "jsonb_build_object"('type', 'doc', 'content', "jsonb_build_array"("jsonb_build_object"('type', 'paragraph'))) NOT NULL,
    "email_output_html" "text",
    "email_output_text" "text",
    "styles" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "schema_version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "blocknote_document" "jsonb",
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "email_templates_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


COMMENT ON COLUMN "public"."email_templates"."blocknote_document" IS 'BlockNote Block[] document (used when editor engine = blocknote). Null when Tiptap is the active engine.';



ALTER TABLE "public"."email_templates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."email_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."entities_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."entities_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_id" "text" DEFAULT ('ENT-'::"text" || "lpad"(("nextval"('"public"."entities_seq"'::"regclass"))::"text", 5, '0'::"text")) NOT NULL,
    "entity_name" "text" NOT NULL,
    "entity_type" "text",
    "ein" "text",
    "date_formed" "date",
    "organization_id" "uuid" NOT NULL,
    "assigned_to" "text"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "county" "text",
    "state_formed" "text",
    "members" integer,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "clerk_org_role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text" DEFAULT ''::"text",
    "last_name" "text" DEFAULT ''::"text",
    "clerk_member_role" "text"
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."entities_view" WITH ("security_invoker"='on') AS
 SELECT "id",
    "display_id",
    "entity_name",
    "entity_type",
    "ein",
    "date_formed",
    "organization_id",
    "assigned_to",
    "created_at",
    "updated_at",
    COALESCE(( SELECT "array_agg"(TRIM(BOTH FROM ((COALESCE("om"."first_name", ''::"text") || ' '::"text") || COALESCE("om"."last_name", ''::"text")))) AS "array_agg"
           FROM "public"."organization_members" "om"
          WHERE ("om"."user_id" = ANY ("e"."assigned_to"))), '{}'::"text"[]) AS "assigned_to_names"
   FROM "public"."entities" "e";


ALTER VIEW "public"."entities_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "name" "text",
    "title" "text",
    "member_type" "text",
    "ownership_percent" numeric,
    "address" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "borrower_id" "uuid",
    "entity_owner_id" "uuid",
    "ssn_encrypted" "text",
    "ssn_last4" "text",
    "ein" "text",
    CONSTRAINT "entity_owners_member_type_check" CHECK (("member_type" = ANY (ARRAY['Individual'::"text", 'Entity'::"text"])))
);


ALTER TABLE "public"."entity_owners" OWNER TO "postgres";


COMMENT ON COLUMN "public"."entity_owners"."ssn_encrypted" IS 'Encrypted SSN for individual owners (same scheme as borrowers)';



COMMENT ON COLUMN "public"."entity_owners"."ssn_last4" IS 'Last 4 digits of SSN for masked display';



COMMENT ON COLUMN "public"."entity_owners"."ein" IS 'EIN for entity-type owners (stored in plain text)';



CREATE TABLE IF NOT EXISTS "public"."guarantor" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "borrower_id" "text",
    "first_name" "text",
    "middle_name" "text",
    "last_name" "text",
    "email_address" "text",
    "cell_phone" "text",
    "home_phone" "text",
    "office_phone" "text",
    "primary_residence_address_street" "text",
    "primary_residence_address_suite_apt" "text",
    "primary_residence_address_city" "text",
    "primary_residence_address_state" "text",
    "primary_residence_address_state_long" "text",
    "primary_residence_address_postal_code" "text",
    "primary_residence_address_country" "text",
    "primary_residence_occupancy_start_date" "date",
    "primary_residence_ownership" "text",
    "previous_residence_address_street" "text",
    "previous_residence_address_suite_apt" "text",
    "previous_residence_address_city" "text",
    "previous_residence_address_state" "text",
    "previous_residence_address_state_long" "text",
    "previous_residence_address_postal_code" "text",
    "previous_residence_address_country" "text",
    "mailing_address_is_primary_residence" boolean,
    "mailing_address_street" "text",
    "mailing_address_suite_apt" "text",
    "mailing_address_po_box" "text",
    "mailing_address_city" "text",
    "mailing_address_state" "text",
    "mailing_address_state_long" "text",
    "mailing_address_postal_code" "text",
    "mailing_address_country" "text",
    "date_of_birth" "date",
    "social_security_number" "text",
    "citizenship" "text",
    "marital_status" "text",
    "name" "text" GENERATED ALWAYS AS (
CASE
    WHEN (("middle_name" IS NOT NULL) AND ("middle_name" <> ''::"text")) THEN (((("first_name" || ' '::"text") || "middle_name") || ' '::"text") || "last_name")
    ELSE (("first_name" || ' '::"text") || "last_name")
END) STORED,
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."guarantor" OWNER TO "postgres";


ALTER TABLE "public"."guarantor" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."guarantor_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."input_categories" (
    "id" bigint NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "organization_id" "uuid",
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "default_open" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."input_categories" OWNER TO "postgres";


ALTER TABLE "public"."input_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."input_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."input_logic" (
    "id" bigint NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."input_logic" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."input_logic_actions" (
    "id" bigint NOT NULL,
    "input_logic_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value_type" "text",
    "value_visible" boolean,
    "value_required" boolean,
    "value_text" "text",
    "value_expression" "text",
    "input_id" bigint,
    "value_field" bigint,
    "category_id" bigint
);


ALTER TABLE "public"."input_logic_actions" OWNER TO "postgres";


ALTER TABLE "public"."input_logic_actions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."input_logic_actions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."input_logic_conditions" (
    "id" bigint NOT NULL,
    "input_logic_id" bigint,
    "operator" "text",
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value_type" "text" DEFAULT 'value'::"text",
    "value_expression" "text",
    "field" bigint,
    "value_field" bigint
);


ALTER TABLE "public"."input_logic_conditions" OWNER TO "postgres";


ALTER TABLE "public"."input_logic_conditions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."input_logic_conditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."input_logic" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."input_logic_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."input_stepper" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "step_order" "text"[],
    "input_id" bigint
);


ALTER TABLE "public"."input_stepper" OWNER TO "postgres";


COMMENT ON COLUMN "public"."input_stepper"."step_order" IS 'Ordered array of dropdown option values defining step sequence';



ALTER TABLE "public"."input_stepper" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."input_stepper_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inputs" (
    "category_id" bigint,
    "category" "text",
    "input_label" "text",
    "input_type" "text",
    "dropdown_options" json,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "input_code" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "starred" boolean DEFAULT false NOT NULL,
    "id" bigint NOT NULL,
    "linked_table" "text",
    "linked_column" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "tooltip" "text",
    "require_recalculate" boolean DEFAULT false NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "placeholder" "text",
    "default_value" "text"
);


ALTER TABLE "public"."inputs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."inputs"."linked_table" IS 'Source table for database-linked inputs (e.g. borrowers, entities, property)';



COMMENT ON COLUMN "public"."inputs"."linked_column" IS 'Source column for database-linked inputs (e.g. fico_score, entity_name)';



CREATE SEQUENCE IF NOT EXISTS "public"."inputs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."inputs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."inputs_id_seq" OWNED BY "public"."inputs"."id";



CREATE TABLE IF NOT EXISTS "public"."integration_settings" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "icon_url" "text",
    "active" boolean DEFAULT true NOT NULL,
    "level_global" boolean DEFAULT false NOT NULL,
    "level_org" boolean DEFAULT false NOT NULL,
    "level_individual" boolean DEFAULT false NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "integration_settings_type_check" CHECK (("type" = ANY (ARRAY['system'::"text", 'workflow'::"text"])))
);


ALTER TABLE "public"."integration_settings" OWNER TO "postgres";


ALTER TABLE "public"."integration_settings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."integration_settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."integration_setup" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "integration_settings_id" bigint
);


ALTER TABLE "public"."integration_setup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_tags" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint NOT NULL,
    "tag" "text" NOT NULL
);


ALTER TABLE "public"."integration_tags" OWNER TO "postgres";


ALTER TABLE "public"."integration_tags" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."integration_tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."landing_page_templates" (
    "id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "name" "text" DEFAULT 'Untitled Landing Page'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "html_content" "text" DEFAULT ''::"text" NOT NULL,
    "gjs_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "slug" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "landing_page_templates_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."landing_page_templates" OWNER TO "postgres";


ALTER TABLE "public"."landing_page_templates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."landing_page_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."llama_document_chunks_vs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."llama_document_chunks_vs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loan_scenario_inputs" (
    "id" bigint NOT NULL,
    "loan_scenario_id" "uuid" NOT NULL,
    "pricing_engine_input_id" bigint NOT NULL,
    "input_type" "text",
    "value_text" "text",
    "value_numeric" numeric,
    "value_date" "date",
    "value_array" json,
    "value_bool" boolean,
    "linked_record_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."loan_scenario_inputs" OWNER TO "postgres";


ALTER TABLE "public"."loan_scenario_inputs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."loan_scenario_inputs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."loan_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "primary" boolean,
    "created_by" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "selected_rate_option_id" bigint
);


ALTER TABLE "public"."loan_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "primary_user_id" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "display_id" "text" NOT NULL,
    CONSTRAINT "loans_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."loans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."n8n_chat_histories" (
    "id" integer NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL
);


ALTER TABLE "public"."n8n_chat_histories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."n8n_chat_histories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNED BY "public"."n8n_chat_histories"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_account_managers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "account_manager_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_account_managers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_member_roles" (
    "id" bigint NOT NULL,
    "organization_id" "uuid",
    "role_code" "text" NOT NULL,
    "role_name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "archived_at" timestamp with time zone,
    "archived_by" "text"
);


ALTER TABLE "public"."organization_member_roles" OWNER TO "postgres";


ALTER TABLE "public"."organization_member_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_member_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."organization_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "resource_type" "text" NOT NULL,
    "resource_name" "text" DEFAULT '*'::"text" NOT NULL,
    "action" "text" NOT NULL,
    "definition_json" "jsonb" NOT NULL,
    "compiled_config" "jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by_user_id" bigint,
    "created_by_clerk_sub" "text",
    "scope" "text" DEFAULT 'all'::"text" NOT NULL,
    "effect" "text" DEFAULT 'ALLOW'::"text" NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "is_protected_policy" boolean DEFAULT false NOT NULL,
    CONSTRAINT "organization_policies_action_check" CHECK (("action" = ANY (ARRAY['select'::"text", 'insert'::"text", 'update'::"text", 'delete'::"text", 'all'::"text", 'submit'::"text", 'view'::"text", 'room_write'::"text", 'room_read'::"text", 'room_presence_write'::"text", 'room_private'::"text"]))),
    CONSTRAINT "organization_policies_effect_check" CHECK (("effect" = ANY (ARRAY['ALLOW'::"text", 'DENY'::"text"]))),
    CONSTRAINT "organization_policies_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['table'::"text", 'storage_bucket'::"text", 'feature'::"text", 'route'::"text", 'liveblocks'::"text", 'api_key'::"text"]))),
    CONSTRAINT "organization_policies_scope_check" CHECK (("scope" = ANY (ARRAY['all'::"text", 'org_records'::"text", 'user_records'::"text", 'org_and_user'::"text"])))
);


ALTER TABLE "public"."organization_policies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organization_policies"."is_protected_policy" IS 'When true, the policy is protected and cannot be edited, disabled, or archived through the UI without elevated approval.';



CREATE TABLE IF NOT EXISTS "public"."organization_policies_column_filters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "schema_name" "text" DEFAULT 'public'::"text" NOT NULL,
    "org_column" "text",
    "user_column" "text",
    "user_column_type" "text" DEFAULT 'clerk_id'::"text" NOT NULL,
    "join_path" "text",
    "is_excluded" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "named_scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "organization_policies_column_filters_user_column_type_check" CHECK (("user_column_type" = ANY (ARRAY['clerk_id'::"text", 'pk'::"text"])))
);


ALTER TABLE "public"."organization_policies_column_filters" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organization_policies_column_filters"."named_scopes" IS 'Array of named scope names (from organization_policy_named_scopes) that apply
   to this table. Shown in the policy builder WHERE section as toggleable predicates.';



CREATE TABLE IF NOT EXISTS "public"."organization_policy_named_scope_tables" (
    "scope_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "fk_column" "text" NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."organization_policy_named_scope_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_policy_named_scopes" (
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "uses_precomputed" boolean DEFAULT false NOT NULL,
    "precomputed_table" "text",
    "precomputed_user_col" "text",
    "precomputed_pk_col" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_policy_named_scopes" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_policy_named_scopes" IS 'Registry of named scope predicates available for use in organization policies.
   The name field is used in compiled_config rules as scope: ''named:<name>''.';



CREATE TABLE IF NOT EXISTS "public"."organization_themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "theme_light" "jsonb" NOT NULL,
    "theme_dark" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_themes" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_themes" IS 'Stores custom theme CSS variables (light and dark mode) for each organization';



CREATE SEQUENCE IF NOT EXISTS "public"."organizations_org_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."organizations_org_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "clerk_organization_id" "text",
    "is_internal_yn" boolean,
    "org_id" bigint DEFAULT "nextval"('"public"."organizations_org_id_seq"'::"regclass") NOT NULL,
    "whitelabel_logo_url" "text",
    "whitelabel_logo_light_url" "text",
    "whitelabel_logo_dark_url" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pe_input_logic" (
    "id" bigint NOT NULL,
    "type" "text" DEFAULT 'AND'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pe_input_logic" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pe_input_logic_actions" (
    "id" bigint NOT NULL,
    "pe_input_logic_id" bigint NOT NULL,
    "input_id" bigint,
    "value_type" "text",
    "value_visible" boolean,
    "value_required" boolean,
    "value_text" "text",
    "value_field" bigint,
    "value_expression" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" bigint,
    "value_recalculate" boolean
);


ALTER TABLE "public"."pe_input_logic_actions" OWNER TO "postgres";


ALTER TABLE "public"."pe_input_logic_actions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pe_input_logic_actions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pe_input_logic_conditions" (
    "id" bigint NOT NULL,
    "pe_input_logic_id" bigint NOT NULL,
    "field" bigint,
    "operator" "text",
    "value_type" "text" DEFAULT 'value'::"text",
    "value" "text",
    "value_field" bigint,
    "value_expression" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pe_input_logic_conditions" OWNER TO "postgres";


ALTER TABLE "public"."pe_input_logic_conditions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pe_input_logic_conditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."pe_input_logic" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pe_input_logic_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pe_section_button_actions" (
    "id" integer NOT NULL,
    "button_id" integer NOT NULL,
    "action_type" "text" NOT NULL,
    "action_uuid" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_section_button_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['google_maps'::"text", 'workflow'::"text"])))
);


ALTER TABLE "public"."pe_section_button_actions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pe_section_button_actions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pe_section_button_actions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pe_section_button_actions_id_seq" OWNED BY "public"."pe_section_button_actions"."id";



CREATE TABLE IF NOT EXISTS "public"."pe_section_buttons" (
    "id" integer NOT NULL,
    "category_id" integer NOT NULL,
    "label" "text" NOT NULL,
    "icon" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "signal_color" "text",
    "required_inputs" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."pe_section_buttons" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pe_section_buttons_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pe_section_buttons_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pe_section_buttons_id_seq" OWNED BY "public"."pe_section_buttons"."id";



CREATE TABLE IF NOT EXISTS "public"."pe_term_sheet_conditions" (
    "id" bigint NOT NULL,
    "pe_term_sheet_rule_id" bigint NOT NULL,
    "field" bigint,
    "operator" "text",
    "value_type" "text" DEFAULT 'value'::"text",
    "value" "text",
    "value_field" bigint,
    "value_expression" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_term_sheet_conditions_value_type_check" CHECK (("value_type" = ANY (ARRAY['value'::"text", 'field'::"text", 'expression'::"text"])))
);


ALTER TABLE "public"."pe_term_sheet_conditions" OWNER TO "postgres";


ALTER TABLE "public"."pe_term_sheet_conditions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pe_term_sheet_conditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pe_term_sheet_rules" (
    "id" bigint NOT NULL,
    "pe_term_sheet_id" bigint NOT NULL,
    "logic_type" "text" DEFAULT 'AND'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_term_sheet_rules_logic_type_check" CHECK (("logic_type" = ANY (ARRAY['AND'::"text", 'OR'::"text"])))
);


ALTER TABLE "public"."pe_term_sheet_rules" OWNER TO "postgres";


ALTER TABLE "public"."pe_term_sheet_rules" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pe_term_sheet_rules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pe_term_sheets" (
    "id" bigint NOT NULL,
    "document_template_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_term_sheets_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."pe_term_sheets" OWNER TO "postgres";


ALTER TABLE "public"."pe_term_sheets" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pe_term_sheets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pricing_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "scenario_id" "uuid",
    "activity_type" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "inputs" "jsonb",
    "outputs" "jsonb",
    "selected" "jsonb",
    "term_sheet_original_path" "text",
    "term_sheet_edit_path" "text",
    "assigned_to_changes" "text"[],
    CONSTRAINT "pricing_activity_log_action_check" CHECK (("action" = ANY (ARRAY['changed'::"text", 'added'::"text", 'deleted'::"text", 'downloaded'::"text", 'shared'::"text", 'archived'::"text", 'restored'::"text"]))),
    CONSTRAINT "pricing_activity_log_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['input_changes'::"text", 'selection_changed'::"text", 'user_assignment'::"text", 'term_sheet'::"text", 'status_change'::"text"])))
);


ALTER TABLE "public"."pricing_activity_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."pricing_activity_log" IS 'Tracks activity on pricing pages including input changes, user assignments, and term sheet actions';



COMMENT ON COLUMN "public"."pricing_activity_log"."activity_type" IS 'Type of activity: input_changes, user_assignment, or term_sheet';



COMMENT ON COLUMN "public"."pricing_activity_log"."action" IS 'Action performed: changed, added, deleted, downloaded, or shared';



CREATE TABLE IF NOT EXISTS "public"."pricing_engine_input_categories" (
    "id" bigint NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "default_open" boolean DEFAULT true NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."pricing_engine_input_categories" OWNER TO "postgres";


ALTER TABLE "public"."pricing_engine_input_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pricing_engine_input_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pricing_engine_inputs" (
    "id" bigint NOT NULL,
    "category_id" bigint,
    "category" "text",
    "input_label" "text",
    "input_type" "text",
    "input_code" "text" NOT NULL,
    "dropdown_options" json,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "display_order" integer DEFAULT 0 NOT NULL,
    "starred" boolean DEFAULT false NOT NULL,
    "linked_table" "text",
    "linked_column" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "tooltip" "text",
    "placeholder" "text",
    "default_value" "text",
    "layout_row" integer DEFAULT 0 NOT NULL,
    "layout_width" "text" DEFAULT '50'::"text" NOT NULL,
    "require_recalculate" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."pricing_engine_inputs" OWNER TO "postgres";


ALTER TABLE "public"."pricing_engine_inputs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pricing_engine_inputs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."program_conditions" (
    "id" bigint NOT NULL,
    "program_id" "uuid" NOT NULL,
    "logic_type" "text" DEFAULT 'AND'::"text" NOT NULL,
    "field" bigint,
    "operator" "text",
    "value_type" "text" DEFAULT 'value'::"text",
    "value" "text",
    "value_field" bigint,
    "value_expression" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."program_conditions" OWNER TO "postgres";


ALTER TABLE "public"."program_conditions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."program_conditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."program_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "title" "text",
    "mime_type" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "program_documents_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'indexed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."program_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_rows_ids" (
    "id" bigint NOT NULL,
    "program_id" "uuid",
    "rent_spreadsheet_id" "text",
    "rent_table_id" "text",
    "compute_spreadsheet_id" "text",
    "compute_table_id" "text",
    "rows_order" "text",
    "primary" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text",
    "rate_sheet_date" "date"
);


ALTER TABLE "public"."program_rows_ids" OWNER TO "postgres";


ALTER TABLE "public"."program_rows_ids" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."program_rows_ids_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "internal_name" "text" NOT NULL,
    "external_name" "text" NOT NULL,
    "webhook_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "user_id" "text" NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    CONSTRAINT "programs_status_chk" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property" (
    "id" bigint NOT NULL,
    "property_type" "text",
    "year_built" bigint,
    "sq_footage_gla_aiv" bigint,
    "address_street" "text",
    "address_suite_apt" "text",
    "address_city" "text",
    "address_state" "text",
    "address_postal_code" "text",
    "address_country" "text" DEFAULT 'United States'::"text",
    "units" smallint,
    "expense_annual_property_tax" numeric,
    "expense_annual_insurance_hoi" numeric,
    "expense_annual_insurance_flood" numeric,
    "expense_annual_management" numeric,
    "expense_annual_association_hoa" numeric,
    "purchase_price" numeric,
    "renovation_cost" numeric,
    "renovation_completed" "date",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "address" "text",
    "short_term_rental" "text",
    "declining_market" "text",
    "rural" "text",
    "flood_zone" "text",
    "recently_renovated" "text",
    "purchase_date" "date",
    "rehab_completed_post_acquisition" numeric,
    "value_aiv_estimate" numeric,
    "hoa_contact_phone" "text",
    "hoa_contact_person" "text",
    "hoa_contact_email" "text",
    "inspection" "text",
    "sq_footage_lot_aiv" bigint,
    "value_aiv_appraised" numeric,
    "value_arv_estimate" numeric,
    "value_arv_appraised" numeric,
    "warrantability" "text",
    "latitude" numeric,
    "longitude" numeric,
    "hoa_contact" bigint,
    "address_state_long" "text",
    "bedrooms_aiv" numeric,
    "bedrooms_arv" numeric,
    "bathrooms_aiv" numeric,
    "bathrooms_arv" numeric,
    "sq_footage_gla_arv" bigint,
    "sq_footage_lot_arv" bigint,
    "address_county" "text",
    "hoa_name" "text",
    "occupancy" "text",
    "income_monthly_gross_rent" numeric,
    "income_monthly_fair_market_rent" numeric,
    "sale_price" numeric,
    "sale_date" "date",
    "photo_url" "text"
);


ALTER TABLE "public"."property" OWNER TO "postgres";


ALTER TABLE "public"."property" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."property_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rbac_permissions" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_name" "text" NOT NULL,
    "can_select" boolean DEFAULT false,
    "can_insert" boolean DEFAULT false,
    "can_update" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "scope_type" "text",
    "scope_filter" "text",
    "description" "text",
    "priority" integer DEFAULT 100,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rbac_permissions_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['table'::"text", 'storage_bucket'::"text", 'api_endpoint'::"text"]))),
    CONSTRAINT "rbac_permissions_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['all'::"text", 'own'::"text", 'org'::"text", 'deal'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."rbac_permissions" OWNER TO "postgres";


ALTER TABLE "public"."rbac_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rbac_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."role_assignments" (
    "id" bigint NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text" NOT NULL,
    "role_type_id" bigint NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    CONSTRAINT "role_assignments_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['deal'::"text", 'loan'::"text", 'borrower'::"text", 'entity'::"text", 'deal_task'::"text", 'appraisal'::"text"])))
);


ALTER TABLE "public"."role_assignments" OWNER TO "postgres";


ALTER TABLE "public"."role_assignments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."role_assignments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."scenario_program_results" (
    "id" bigint NOT NULL,
    "loan_scenario_id" "uuid" NOT NULL,
    "program_id" "uuid",
    "program_name" "text",
    "pass" boolean,
    "loan_amount" "text",
    "ltv" "text",
    "validations" "text"[],
    "warnings" "text"[],
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "raw_response" "jsonb",
    "program_version_id" bigint
);


ALTER TABLE "public"."scenario_program_results" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."scenario_program_results_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."scenario_program_results_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."scenario_program_results_id_seq" OWNED BY "public"."scenario_program_results"."id";



CREATE TABLE IF NOT EXISTS "public"."scenario_rate_options" (
    "id" bigint NOT NULL,
    "scenario_program_result_id" bigint NOT NULL,
    "row_index" integer NOT NULL,
    "loan_price" "text",
    "interest_rate" "text",
    "pitia" "text",
    "dscr" "text",
    "initial_loan_amount" "text",
    "rehab_holdback" "text",
    "total_loan_amount" "text",
    "initial_pitia" "text",
    "funded_pitia" "text"
);


ALTER TABLE "public"."scenario_rate_options" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."scenario_rate_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."scenario_rate_options_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."scenario_rate_options_id_seq" OWNED BY "public"."scenario_rate_options"."id";



CREATE TABLE IF NOT EXISTS "public"."task_logic" (
    "id" bigint NOT NULL,
    "task_template_id" bigint NOT NULL,
    "name" "text",
    "description" "text",
    "type" "text" DEFAULT 'AND'::"text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "execution_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_logic" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_logic_actions" (
    "id" bigint NOT NULL,
    "task_logic_id" bigint NOT NULL,
    "action_type" "text" NOT NULL,
    "target_task_template_id" bigint,
    "value_type" "text" DEFAULT 'value'::"text",
    "value_text" "text",
    "value_visible" boolean,
    "value_required" boolean,
    "value_field" "text",
    "value_expression" "text",
    "required_status_id" bigint,
    "required_for_stage_id" bigint
);


ALTER TABLE "public"."task_logic_actions" OWNER TO "postgres";


ALTER TABLE "public"."task_logic_actions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_logic_actions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."task_logic_conditions" (
    "id" bigint NOT NULL,
    "task_logic_id" bigint NOT NULL,
    "field" "text",
    "operator" "text",
    "value" "text",
    "value_type" "text" DEFAULT 'value'::"text",
    "value_field" "text",
    "value_expression" "text",
    "source_type" "text" DEFAULT 'input'::"text" NOT NULL,
    "db_table" "text",
    "db_column" "text",
    "db_match_type" "text",
    "sql_expression" "text",
    CONSTRAINT "task_logic_conditions_db_match_type_check" CHECK ((("db_match_type" IS NULL) OR ("db_match_type" = ANY (ARRAY['any'::"text", 'all'::"text"])))),
    CONSTRAINT "task_logic_conditions_source_type_check" CHECK (("source_type" = ANY (ARRAY['input'::"text", 'sql'::"text"])))
);


ALTER TABLE "public"."task_logic_conditions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."task_logic_conditions"."source_type" IS 'Condition source: input (form field) or database (table lookup)';



COMMENT ON COLUMN "public"."task_logic_conditions"."db_table" IS 'Table name for database conditions';



COMMENT ON COLUMN "public"."task_logic_conditions"."db_column" IS 'Column name for database conditions';



COMMENT ON COLUMN "public"."task_logic_conditions"."db_match_type" IS 'For one-to-many: any (OR) or all (AND)';



COMMENT ON COLUMN "public"."task_logic_conditions"."sql_expression" IS 'Raw SQL query for SQL-type conditions';



ALTER TABLE "public"."task_logic_conditions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_logic_conditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."task_logic" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_logic_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."task_priorities" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_priorities" OWNER TO "postgres";


ALTER TABLE "public"."task_priorities" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_priorities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."task_statuses" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_statuses" OWNER TO "postgres";


ALTER TABLE "public"."task_statuses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_statuses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."task_template_roles" (
    "id" bigint NOT NULL,
    "task_template_id" bigint NOT NULL,
    "deal_role_type_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_template_roles" OWNER TO "postgres";


ALTER TABLE "public"."task_template_roles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."task_template_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."task_templates" (
    "id" bigint NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_stage_id" bigint,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "default_status_id" bigint,
    "default_priority_id" bigint,
    "due_offset_days" integer,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "button_enabled" boolean DEFAULT false NOT NULL,
    "button_automation_id" bigint,
    "button_label" "text"
);


ALTER TABLE "public"."task_templates" OWNER TO "postgres";


ALTER TABLE "public"."task_templates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."task_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."term_sheets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "pdf_url" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."term_sheets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_deal_access" (
    "clerk_user_id" "text" NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "granted_via" "text" DEFAULT 'deal_roles'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_deal_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "clerk_user_id" "text",
    "first_name" "text",
    "last_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" character varying(255),
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "clerk_username" "text",
    "avatar_url" "text",
    "website" "text",
    "phone_number" "text",
    "cell_phone" "text",
    "office_phone" "text",
    "office_phone_extension" "text",
    "personal_role" "text",
    "is_active_yn" boolean DEFAULT true,
    "is_internal_yn" boolean DEFAULT false NOT NULL,
    "is_locked" boolean DEFAULT false,
    "is_banned" boolean DEFAULT false,
    "has_image" boolean DEFAULT false,
    "email_verified" boolean DEFAULT false,
    "deactivation_date" "date",
    "invitation_date" "date",
    "activated_date" "date",
    "last_active_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "legal_accepted_at" timestamp with time zone,
    "email_verified_at" timestamp with time zone,
    "create_organization_enabled" boolean DEFAULT false,
    "delete_self_enabled" boolean DEFAULT false,
    "image_url" "text",
    "contact_id" bigint,
    "full_name" "text" GENERATED ALWAYS AS (TRIM(BOTH FROM ((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text")))) STORED,
    CONSTRAINT "clerk_username_length" CHECK (("char_length"("clerk_username") >= 3))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."v_brokers_with_manager_names" WITH ("security_invoker"='on') AS
 SELECT "b"."id",
    "b"."organization_id",
    "b"."organization_member_id",
    "b"."email",
    "b"."joined_at",
    COALESCE("string_agg"(TRIM(BOTH FROM (("m"."first_name" || ' '::"text") || "m"."last_name")), ', '::"text" ORDER BY "m"."first_name", "m"."last_name"), ''::"text") AS "manager_names"
   FROM ("public"."brokers" "b"
     LEFT JOIN "public"."organization_members" "m" ON (("m"."id" = ANY ("b"."account_manager_ids"))))
  GROUP BY "b"."id", "b"."organization_id", "b"."organization_member_id", "b"."email", "b"."joined_at";


ALTER VIEW "public"."v_brokers_with_manager_names" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_execution_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_id" "uuid" NOT NULL,
    "node_id" "text" NOT NULL,
    "node_name" "text",
    "node_type" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "input" "jsonb",
    "output" "jsonb",
    "error" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "duration" "text",
    "workflow_node_id" "uuid"
);


ALTER TABLE "public"."workflow_execution_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "input" "jsonb",
    "output" "jsonb",
    "error" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "duration" "text"
);


ALTER TABLE "public"."workflow_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "flow_node_id" "text" NOT NULL,
    "node_type" "text" NOT NULL,
    "label" "text",
    "action_type" "text",
    "position" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_nodes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."application_signings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."application_signings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dashboard_widget_chats" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."dashboard_widget_chats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dashboard_widget_conversations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."dashboard_widget_conversations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dashboard_widgets" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."dashboard_widgets_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."inputs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."inputs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."n8n_chat_histories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."n8n_chat_histories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pe_section_button_actions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pe_section_button_actions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pe_section_buttons" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pe_section_buttons_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."program_documents_chunks_vs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."scenario_program_results" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."scenario_program_results_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."scenario_rate_options" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."scenario_rate_options_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "actions_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."application_appraisal"
    ADD CONSTRAINT "application_appraisal_application_id_key" UNIQUE ("application_id");



ALTER TABLE ONLY "public"."application_appraisal"
    ADD CONSTRAINT "application_appraisal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_background"
    ADD CONSTRAINT "application_background_application_id_party_index_key" UNIQUE ("application_id", "party_index");



ALTER TABLE ONLY "public"."application_background"
    ADD CONSTRAINT "application_background_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_credit"
    ADD CONSTRAINT "application_credit_application_id_guarantor_index_key" UNIQUE ("application_id", "guarantor_index");



ALTER TABLE ONLY "public"."application_credit"
    ADD CONSTRAINT "application_credit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_signings"
    ADD CONSTRAINT "application_signings_documenso_document_id_signer_email_key" UNIQUE ("documenso_document_id", "signer_email");



ALTER TABLE ONLY "public"."application_signings"
    ADD CONSTRAINT "application_signings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications_emails_sent"
    ADD CONSTRAINT "applications_emails_sent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("loan_id");



ALTER TABLE ONLY "public"."appraisal_amcs"
    ADD CONSTRAINT "appraisal_amcs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_borrowers"
    ADD CONSTRAINT "appraisal_borrowers_appraisal_id_borrower_id_key" UNIQUE ("appraisal_id", "borrower_id");



ALTER TABLE ONLY "public"."appraisal_borrowers"
    ADD CONSTRAINT "appraisal_borrowers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_documents"
    ADD CONSTRAINT "appraisal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_investor_list"
    ADD CONSTRAINT "appraisal_investor_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_lender_list"
    ADD CONSTRAINT "appraisal_lender_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_lender_list"
    ADD CONSTRAINT "appraisal_lender_list_settings_name_unique" UNIQUE ("integration_settings_id", "lender_name");



ALTER TABLE ONLY "public"."appraisal_loan_type_list"
    ADD CONSTRAINT "appraisal_loan_type_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_occupancy_list"
    ADD CONSTRAINT "appraisal_occupancy_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_product_list"
    ADD CONSTRAINT "appraisal_product_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_property_list"
    ADD CONSTRAINT "appraisal_property_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_status_list"
    ADD CONSTRAINT "appraisal_status_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisal_transaction_type_list"
    ADD CONSTRAINT "appraisal_transaction_type_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search_lien"
    ADD CONSTRAINT "background_people_search_lien_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search_ucc"
    ADD CONSTRAINT "background_people_search_ucc_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search_bankruptcy"
    ADD CONSTRAINT "background_person_search_bankruptcy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search_criminal"
    ADD CONSTRAINT "background_person_search_criminal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search_litigation"
    ADD CONSTRAINT "background_person_search_litigation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search"
    ADD CONSTRAINT "background_person_search_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_person_search_quick_analysis"
    ADD CONSTRAINT "background_person_search_quick_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_report_applications"
    ADD CONSTRAINT "background_report_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_report_applications"
    ADD CONSTRAINT "background_report_applications_unique" UNIQUE ("background_report_id", "application_id");



ALTER TABLE ONLY "public"."background_reports"
    ADD CONSTRAINT "background_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_borrower_entity_uid" UNIQUE ("borrower_id", "entity_id");



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_display_id_key" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_org_member_uniq" UNIQUE ("organization_id", "organization_member_id");



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact"
    ADD CONSTRAINT "contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_chat_messages"
    ADD CONSTRAINT "credit_report_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_chats"
    ADD CONSTRAINT "credit_report_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_data_links"
    ADD CONSTRAINT "credit_report_data_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_data_links"
    ADD CONSTRAINT "credit_report_data_links_unique" UNIQUE ("credit_report_id", "aggregator");



ALTER TABLE ONLY "public"."credit_report_user_chats"
    ADD CONSTRAINT "credit_report_user_chats_pkey" PRIMARY KEY ("report_id", "user_id");



ALTER TABLE ONLY "public"."credit_report_viewers"
    ADD CONSTRAINT "credit_report_viewers_pkey" PRIMARY KEY ("report_id", "user_id");



ALTER TABLE ONLY "public"."credit_reports"
    ADD CONSTRAINT "credit_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_org_broker_org_key" UNIQUE ("organization_id", "broker_org_id");



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widget_chats"
    ADD CONSTRAINT "dashboard_widget_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widget_conversations"
    ADD CONSTRAINT "dashboard_widget_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widgets"
    ADD CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widgets"
    ADD CONSTRAINT "dashboard_widgets_slot_key" UNIQUE ("slot");



ALTER TABLE ONLY "public"."deal_borrower"
    ADD CONSTRAINT "deal_borrower_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_calendar_events"
    ADD CONSTRAINT "deal_calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_clerk_orgs"
    ADD CONSTRAINT "deal_clerk_orgs_deal_id_clerk_org_id_key" UNIQUE ("deal_id", "clerk_org_id");



ALTER TABLE ONLY "public"."deal_comment_mentions"
    ADD CONSTRAINT "deal_comment_mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_comment_reads"
    ADD CONSTRAINT "deal_comment_reads_pkey" PRIMARY KEY ("deal_id", "clerk_user_id");



ALTER TABLE ONLY "public"."deal_comments"
    ADD CONSTRAINT "deal_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_document_ai_chat"
    ADD CONSTRAINT "deal_document_ai_chat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_document_ai_condition"
    ADD CONSTRAINT "deal_document_ai_condition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_document_ai_input"
    ADD CONSTRAINT "deal_document_ai_input_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_document_overrides"
    ADD CONSTRAINT "deal_document_overrides_deal_id_document_type_id_key" UNIQUE ("deal_id", "document_type_id");



ALTER TABLE ONLY "public"."deal_document_overrides"
    ADD CONSTRAINT "deal_document_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_documents"
    ADD CONSTRAINT "deal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_entity_owners"
    ADD CONSTRAINT "deal_entity_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_entity"
    ADD CONSTRAINT "deal_entity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_guarantors"
    ADD CONSTRAINT "deal_guarantors_unique" UNIQUE ("deal_id", "guarantor_id");



ALTER TABLE ONLY "public"."deal_inputs"
    ADD CONSTRAINT "deal_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_clerk_orgs"
    ADD CONSTRAINT "deal_orgs_deal_id_clerk_org_id_key" UNIQUE ("deal_id", "clerk_org_id");



ALTER TABLE ONLY "public"."deal_clerk_orgs"
    ADD CONSTRAINT "deal_orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_property"
    ADD CONSTRAINT "deal_property_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_role_types"
    ADD CONSTRAINT "deal_role_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."deal_role_types"
    ADD CONSTRAINT "deal_role_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_roles"
    ADD CONSTRAINT "deal_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_signature_requests"
    ADD CONSTRAINT "deal_signature_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_stages"
    ADD CONSTRAINT "deal_stages_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."deal_stages"
    ADD CONSTRAINT "deal_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_stages"
    ADD CONSTRAINT "deal_stages_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."deal_stepper"
    ADD CONSTRAINT "deal_stepper_deal_id_key" UNIQUE ("deal_id");



ALTER TABLE ONLY "public"."deal_stepper_history"
    ADD CONSTRAINT "deal_stepper_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_stepper"
    ADD CONSTRAINT "deal_stepper_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_task_events"
    ADD CONSTRAINT "deal_task_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."deal_users"
    ADD CONSTRAINT "deal_users_deal_id_user_id_key" UNIQUE ("deal_id", "user_id");



ALTER TABLE ONLY "public"."deal_users"
    ADD CONSTRAINT "deal_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_guarantors"
    ADD CONSTRAINT "deals_guarantors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_org_member_unique" UNIQUE ("organization_id", "organization_member_id");



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_access_permissions_global"
    ADD CONSTRAINT "document_access_permissions_global_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_access_permissions_global"
    ADD CONSTRAINT "document_access_permissions_global_unique" UNIQUE ("deal_role_types_id", "document_categories_id");



ALTER TABLE ONLY "public"."document_access_permissions"
    ADD CONSTRAINT "document_access_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_access_permissions"
    ADD CONSTRAINT "document_access_permissions_unique" UNIQUE ("clerk_org_id", "deal_role_types_id", "document_categories_id");



ALTER TABLE ONLY "public"."document_categories"
    ADD CONSTRAINT "document_categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."document_categories"
    ADD CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_doc_org_uniq" UNIQUE ("document_file_id", "organization_id");



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_background_reports"
    ADD CONSTRAINT "document_files_background_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_borrowers"
    ADD CONSTRAINT "document_files_borrowers_document_file_id_borrower_id_key" UNIQUE ("document_file_id", "borrower_id");



ALTER TABLE ONLY "public"."document_files_borrowers"
    ADD CONSTRAINT "document_files_borrowers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_clerk_orgs"
    ADD CONSTRAINT "document_files_clerk_orgs_document_file_id_clerk_org_id_key" UNIQUE ("document_file_id", "clerk_org_id");



ALTER TABLE ONLY "public"."document_files_clerk_orgs"
    ADD CONSTRAINT "document_files_clerk_orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_clerk_users"
    ADD CONSTRAINT "document_files_clerk_users_document_file_id_clerk_user_id_key" UNIQUE ("document_file_id", "clerk_user_id");



ALTER TABLE ONLY "public"."document_files_clerk_users"
    ADD CONSTRAINT "document_files_clerk_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_credit_reports"
    ADD CONSTRAINT "document_files_credit_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_credit_reports"
    ADD CONSTRAINT "document_files_credit_reports_unique" UNIQUE ("document_file_id", "credit_report_id");



ALTER TABLE ONLY "public"."document_files_deals"
    ADD CONSTRAINT "document_files_deals_doc_deal_uq" UNIQUE ("document_file_id", "deal_id");



ALTER TABLE ONLY "public"."document_files_deals"
    ADD CONSTRAINT "document_files_deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files_entities"
    ADD CONSTRAINT "document_files_entities_document_file_id_entity_id_key" UNIQUE ("document_file_id", "entity_id");



ALTER TABLE ONLY "public"."document_files_entities"
    ADD CONSTRAINT "document_files_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files"
    ADD CONSTRAINT "document_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_files"
    ADD CONSTRAINT "document_files_storage_bucket_storage_path_key" UNIQUE ("storage_bucket", "storage_path");



ALTER TABLE ONLY "public"."document_files_tags"
    ADD CONSTRAINT "document_files_tags_document_file_id_document_tag_id_key" UNIQUE ("document_file_id", "document_tag_id");



ALTER TABLE ONLY "public"."document_files_tags"
    ADD CONSTRAINT "document_files_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_logic_actions"
    ADD CONSTRAINT "document_logic_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_logic_conditions"
    ADD CONSTRAINT "document_logic_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_logic"
    ADD CONSTRAINT "document_logic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llama_document_parsed"
    ADD CONSTRAINT "document_parsed_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_roles_files"
    ADD CONSTRAINT "document_roles_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_roles"
    ADD CONSTRAINT "document_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_roles"
    ADD CONSTRAINT "document_roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."document_status"
    ADD CONSTRAINT "document_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_tags"
    ADD CONSTRAINT "document_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_tags"
    ADD CONSTRAINT "document_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."document_template_variables"
    ADD CONSTRAINT "document_template_variables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_type_ai_condition"
    ADD CONSTRAINT "document_type_ai_condition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_type_ai_input_order"
    ADD CONSTRAINT "document_type_ai_input_order_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_type_ai_input"
    ADD CONSTRAINT "document_type_ai_input_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_documents_chunks_vs"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_liveblocks_room_id_key" UNIQUE ("liveblocks_room_id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_display_id_key" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guarantor"
    ADD CONSTRAINT "guarantor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."input_categories"
    ADD CONSTRAINT "input_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."input_logic_actions"
    ADD CONSTRAINT "input_logic_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."input_logic_conditions"
    ADD CONSTRAINT "input_logic_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."input_logic"
    ADD CONSTRAINT "input_logic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."input_stepper"
    ADD CONSTRAINT "input_stepper_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inputs"
    ADD CONSTRAINT "inputs_input_code_unique" UNIQUE ("input_code");



ALTER TABLE ONLY "public"."inputs"
    ADD CONSTRAINT "inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_settings"
    ADD CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_settings"
    ADD CONSTRAINT "integration_settings_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."integration_setup"
    ADD CONSTRAINT "integration_setup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_setup"
    ADD CONSTRAINT "integration_setup_unique_per_user" UNIQUE ("organization_id", "user_id", "type", "name");



ALTER TABLE ONLY "public"."integration_tags"
    ADD CONSTRAINT "integration_tags_integration_settings_id_tag_key" UNIQUE ("integration_settings_id", "tag");



ALTER TABLE ONLY "public"."integration_tags"
    ADD CONSTRAINT "integration_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landing_page_templates"
    ADD CONSTRAINT "landing_page_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llama_document_chunks_vs"
    ADD CONSTRAINT "llama_document_chunks_vs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loan_scenario_inputs"
    ADD CONSTRAINT "loan_scenario_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."n8n_chat_histories"
    ADD CONSTRAINT "n8n_chat_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_policies"
    ADD CONSTRAINT "org_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_account_managers"
    ADD CONSTRAINT "organization_account_managers_organization_id_account_manag_key" UNIQUE ("organization_id", "account_manager_id");



ALTER TABLE ONLY "public"."organization_account_managers"
    ADD CONSTRAINT "organization_account_managers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_member_roles"
    ADD CONSTRAINT "organization_member_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_policies_column_filters"
    ADD CONSTRAINT "organization_policies_column_filters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_policies_column_filters"
    ADD CONSTRAINT "organization_policies_column_filters_table_name_key" UNIQUE ("table_name");



ALTER TABLE ONLY "public"."organization_policies"
    ADD CONSTRAINT "organization_policies_unique" UNIQUE ("org_id", "resource_type", "resource_name", "action");



ALTER TABLE ONLY "public"."organization_policy_named_scope_tables"
    ADD CONSTRAINT "organization_policy_named_scope_tables_pkey" PRIMARY KEY ("scope_name", "table_name");



ALTER TABLE ONLY "public"."organization_policy_named_scopes"
    ADD CONSTRAINT "organization_policy_named_scopes_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_org_id_key" UNIQUE ("org_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."pe_input_logic_actions"
    ADD CONSTRAINT "pe_input_logic_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_input_logic_conditions"
    ADD CONSTRAINT "pe_input_logic_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_input_logic"
    ADD CONSTRAINT "pe_input_logic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_section_button_actions"
    ADD CONSTRAINT "pe_section_button_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_section_buttons"
    ADD CONSTRAINT "pe_section_buttons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_term_sheet_conditions"
    ADD CONSTRAINT "pe_term_sheet_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_term_sheet_rules"
    ADD CONSTRAINT "pe_term_sheet_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pe_term_sheets"
    ADD CONSTRAINT "pe_term_sheets_document_template_id_key" UNIQUE ("document_template_id");



ALTER TABLE ONLY "public"."pe_term_sheets"
    ADD CONSTRAINT "pe_term_sheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_activity_log"
    ADD CONSTRAINT "pricing_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_engine_input_categories"
    ADD CONSTRAINT "pricing_engine_input_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_engine_inputs"
    ADD CONSTRAINT "pricing_engine_inputs_input_code_key" UNIQUE ("input_code");



ALTER TABLE ONLY "public"."pricing_engine_inputs"
    ADD CONSTRAINT "pricing_engine_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("clerk_username");



ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_documents"
    ADD CONSTRAINT "program_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_rows_ids"
    ADD CONSTRAINT "program_rows_ids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property"
    ADD CONSTRAINT "property_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rbac_permissions"
    ADD CONSTRAINT "rbac_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rbac_permissions"
    ADD CONSTRAINT "rbac_permissions_unique" UNIQUE ("role", "resource_type", "resource_name");



ALTER TABLE ONLY "public"."role_assignments"
    ADD CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_assignments"
    ADD CONSTRAINT "role_assignments_resource_type_resource_id_role_type_id_use_key" UNIQUE ("resource_type", "resource_id", "role_type_id", "user_id");



ALTER TABLE ONLY "public"."scenario_program_results"
    ADD CONSTRAINT "scenario_program_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenario_rate_options"
    ADD CONSTRAINT "scenario_rate_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_logic_actions"
    ADD CONSTRAINT "task_logic_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_logic_conditions"
    ADD CONSTRAINT "task_logic_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_logic"
    ADD CONSTRAINT "task_logic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_priorities"
    ADD CONSTRAINT "task_priorities_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."task_priorities"
    ADD CONSTRAINT "task_priorities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_priorities"
    ADD CONSTRAINT "task_priorities_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."task_template_roles"
    ADD CONSTRAINT "task_template_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_template_roles"
    ADD CONSTRAINT "task_template_roles_task_template_id_deal_role_type_id_key" UNIQUE ("task_template_id", "deal_role_type_id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "term_sheet_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."term_sheets"
    ADD CONSTRAINT "term_sheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_document_ai_condition"
    ADD CONSTRAINT "uq_deal_doc_ai_condition" UNIQUE ("deal_document_id", "document_type_ai_condition");



ALTER TABLE ONLY "public"."deal_document_ai_input"
    ADD CONSTRAINT "uq_deal_doc_ai_input" UNIQUE ("deal_document_id", "document_type_ai_input_id");



ALTER TABLE ONLY "public"."deal_inputs"
    ADD CONSTRAINT "uq_deal_inputs_deal_id_input_id" UNIQUE ("deal_id", "input_id");



ALTER TABLE ONLY "public"."workflow_nodes"
    ADD CONSTRAINT "uq_workflow_nodes_workflow_flow" UNIQUE ("workflow_id", "flow_node_id");



ALTER TABLE ONLY "public"."user_deal_access"
    ADD CONSTRAINT "user_deal_access_pkey" PRIMARY KEY ("clerk_user_id", "deal_id", "granted_via");



ALTER TABLE ONLY "public"."document_categories_user_order"
    ADD CONSTRAINT "user_pref_document_categories_order_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_categories_user_order"
    ADD CONSTRAINT "userpref_doc_category_order_unique" UNIQUE ("clerk_user_id", "document_categories_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_execution_logs"
    ADD CONSTRAINT "workflow_execution_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_nodes"
    ADD CONSTRAINT "workflow_nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "xactus_reports_pkey" PRIMARY KEY ("id");



CREATE INDEX "actions_trigger_type_idx" ON "public"."automations" USING "btree" ("trigger_type");



CREATE INDEX "ai_chats_last_used_at_desc_idx" ON "public"."ai_chats" USING "btree" ("last_used_at" DESC);



CREATE INDEX "ai_chats_org_id_idx" ON "public"."ai_chats" USING "btree" ("organization_id");



CREATE INDEX "ai_chats_user_id_idx" ON "public"."ai_chats" USING "btree" ("user_id");



CREATE INDEX "applications_documenso_idx" ON "public"."applications" USING "btree" ("documenso_document_id");



CREATE INDEX "applications_emails_sent_email_idx" ON "public"."applications_emails_sent" USING "btree" ("email");



CREATE UNIQUE INDEX "applications_emails_sent_initial_uidx" ON "public"."applications_emails_sent" USING "btree" ("loan_id", "email", "type") WHERE "initial";



CREATE INDEX "applications_emails_sent_loan_id_idx" ON "public"."applications_emails_sent" USING "btree" ("loan_id");



CREATE INDEX "applications_emails_sent_type_idx" ON "public"."applications_emails_sent" USING "btree" ("type");



CREATE INDEX "applications_org_idx" ON "public"."applications" USING "btree" ("organization_id");



CREATE INDEX "applications_updated_idx" ON "public"."applications" USING "btree" ("updated_at" DESC);



CREATE INDEX "borrower_entities_borrower_idx" ON "public"."borrower_entities" USING "btree" ("borrower_id");



CREATE INDEX "borrower_entities_entity_idx" ON "public"."borrower_entities" USING "btree" ("entity_id");



CREATE INDEX "borrower_entities_org_idx" ON "public"."borrower_entities" USING "btree" ("organization_id");



CREATE INDEX "borrowers_assigned_to_idx" ON "public"."borrowers" USING "gin" ("assigned_to");



CREATE INDEX "borrowers_org_idx" ON "public"."borrowers" USING "btree" ("organization_id");



CREATE INDEX "borrowers_zip_idx" ON "public"."borrowers" USING "btree" ("zip");



CREATE INDEX "brokers_org_member_idx" ON "public"."brokers" USING "btree" ("organization_id", "organization_member_id");



CREATE INDEX "credit_report_chats_last_used_desc_idx" ON "public"."credit_report_chats" USING "btree" ("last_used_at" DESC);



CREATE INDEX "credit_report_chats_org_id_idx" ON "public"."credit_report_chats" USING "btree" ("organization_id");



CREATE INDEX "credit_report_chats_user_id_idx" ON "public"."credit_report_chats" USING "btree" ("user_id");



CREATE INDEX "credit_report_user_chats_chat_idx" ON "public"."credit_report_user_chats" USING "btree" ("chat_id");



CREATE INDEX "credit_report_viewers_user_idx" ON "public"."credit_report_viewers" USING "btree" ("user_id");



CREATE INDEX "credit_reports_owner_idx" ON "public"."credit_reports" USING "gin" ("assigned_to");



CREATE INDEX "deal_comment_mentions_comment_id_idx" ON "public"."deal_comment_mentions" USING "btree" ("comment_id");



CREATE INDEX "deal_comment_mentions_user_id_idx" ON "public"."deal_comment_mentions" USING "btree" ("mentioned_user_id");



CREATE INDEX "deal_comment_reads_user_idx" ON "public"."deal_comment_reads" USING "btree" ("clerk_user_id");



CREATE INDEX "deal_comments_deal_id_idx" ON "public"."deal_comments" USING "btree" ("deal_id");



CREATE INDEX "deal_guarantors_deal_id_idx" ON "public"."deal_guarantors" USING "btree" ("deal_id");



CREATE INDEX "deal_guarantors_guarantor_id_idx" ON "public"."deal_guarantors" USING "btree" ("guarantor_id");



CREATE INDEX "deal_roles_contact_id_idx" ON "public"."deal_roles" USING "btree" ("contact_id") WHERE ("contact_id" IS NOT NULL);



CREATE INDEX "deal_roles_deal_id_idx" ON "public"."deal_roles" USING "btree" ("deal_id");



CREATE INDEX "deal_roles_entities_id_idx" ON "public"."deal_roles" USING "btree" ("entities_id") WHERE ("entities_id" IS NOT NULL);



CREATE INDEX "deal_roles_guarantor_id_idx" ON "public"."deal_roles" USING "btree" ("guarantor_id") WHERE ("guarantor_id" IS NOT NULL);



CREATE INDEX "deal_roles_role_types_id_idx" ON "public"."deal_roles" USING "btree" ("deal_role_types_id");



CREATE UNIQUE INDEX "deal_roles_unique_contact_role" ON "public"."deal_roles" USING "btree" ("deal_id", "deal_role_types_id", "contact_id") WHERE ("contact_id" IS NOT NULL);



CREATE UNIQUE INDEX "deal_roles_unique_entity_role" ON "public"."deal_roles" USING "btree" ("deal_id", "deal_role_types_id", "entities_id") WHERE ("entities_id" IS NOT NULL);



CREATE UNIQUE INDEX "deal_roles_unique_guarantor_role" ON "public"."deal_roles" USING "btree" ("deal_id", "deal_role_types_id", "guarantor_id") WHERE ("guarantor_id" IS NOT NULL);



CREATE UNIQUE INDEX "deal_roles_unique_user_role" ON "public"."deal_roles" USING "btree" ("deal_id", "deal_role_types_id", "users_id") WHERE ("users_id" IS NOT NULL);



CREATE INDEX "deal_roles_user_id_idx" ON "public"."deal_roles" USING "btree" ("users_id") WHERE ("users_id" IS NOT NULL);



CREATE INDEX "deal_task_events_deal_task_id_idx" ON "public"."deal_task_events" USING "btree" ("deal_task_id");



CREATE INDEX "deal_tasks_deal_id_idx" ON "public"."deal_tasks" USING "btree" ("deal_id");



CREATE INDEX "deal_tasks_organization_id_idx" ON "public"."deal_tasks" USING "btree" ("organization_id");



CREATE INDEX "deal_tasks_task_status_id_idx" ON "public"."deal_tasks" USING "btree" ("task_status_id");



CREATE INDEX "deals_created_at_idx" ON "public"."deals" USING "btree" ("created_at");



CREATE INDEX "document_file_statuses_doc_idx" ON "public"."document_file_statuses" USING "btree" ("document_file_id");



CREATE INDEX "document_file_statuses_org_status_idx" ON "public"."document_file_statuses" USING "btree" ("organization_id", "document_status_id");



CREATE UNIQUE INDEX "document_status_code_global_uniq" ON "public"."document_status" USING "btree" ("code") WHERE ("organization_id" IS NULL);



CREATE UNIQUE INDEX "document_status_code_org_uniq" ON "public"."document_status" USING "btree" ("organization_id", "code") WHERE ("organization_id" IS NOT NULL);



CREATE INDEX "document_status_org_display_idx" ON "public"."document_status" USING "btree" ("organization_id", "display_order", "label");



CREATE INDEX "email_templates_organization_id_idx" ON "public"."email_templates" USING "btree" ("organization_id");



CREATE INDEX "email_templates_status_idx" ON "public"."email_templates" USING "btree" ("status");



CREATE UNIQUE INDEX "email_templates_uuid_idx" ON "public"."email_templates" USING "btree" ("uuid");



CREATE INDEX "entities_assigned_to_idx" ON "public"."entities" USING "gin" ("assigned_to");



CREATE INDEX "entities_org_idx" ON "public"."entities" USING "btree" ("organization_id");



CREATE INDEX "entity_owners_borrower_idx" ON "public"."entity_owners" USING "btree" ("borrower_id");



CREATE INDEX "entity_owners_entity_idx" ON "public"."entity_owners" USING "btree" ("entity_id");



CREATE UNIQUE INDEX "entity_owners_entity_owner_idx" ON "public"."entity_owners" USING "btree" ("entity_id", "entity_owner_id") WHERE ("entity_owner_id" IS NOT NULL);



CREATE INDEX "entity_owners_org_idx" ON "public"."entity_owners" USING "btree" ("organization_id");



CREATE INDEX "idx_actions_not_archived" ON "public"."automations" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_ai_chat_messages_chat_time" ON "public"."ai_chat_messages" USING "btree" ("ai_chat_id", "created_at");



CREATE INDEX "idx_application_appraisal_app" ON "public"."application_appraisal" USING "btree" ("application_id");



CREATE INDEX "idx_application_background_app" ON "public"."application_background" USING "btree" ("application_id");



CREATE INDEX "idx_application_credit_app" ON "public"."application_credit" USING "btree" ("application_id");



CREATE INDEX "idx_application_signings_loan_id" ON "public"."application_signings" USING "btree" ("loan_id");



CREATE UNIQUE INDEX "idx_applications_display_id" ON "public"."applications" USING "btree" ("display_id");



CREATE INDEX "idx_appraisal_amcs_org" ON "public"."appraisal_amcs" USING "btree" ("organization_id");



CREATE INDEX "idx_appraisal_borrower" ON "public"."appraisal" USING "btree" ("borrower_id");



CREATE INDEX "idx_appraisal_borrowers_appraisal" ON "public"."appraisal_borrowers" USING "btree" ("appraisal_id");



CREATE INDEX "idx_appraisal_borrowers_borrower" ON "public"."appraisal_borrowers" USING "btree" ("borrower_id");



CREATE INDEX "idx_appraisal_deal" ON "public"."appraisal" USING "btree" ("deal_id");



CREATE INDEX "idx_appraisal_doc" ON "public"."appraisal" USING "btree" ("document_id", "deal_id", "property_id");



CREATE INDEX "idx_appraisal_documents_appraisal" ON "public"."appraisal_documents" USING "btree" ("appraisal_id");



CREATE INDEX "idx_appraisal_documents_org" ON "public"."appraisal_documents" USING "btree" ("organization_id");



CREATE INDEX "idx_appraisal_org" ON "public"."appraisal" USING "btree" ("organization_id");



CREATE INDEX "idx_background_reports_borrower" ON "public"."background_reports" USING "btree" ("borrower_id");



CREATE INDEX "idx_background_reports_entity" ON "public"."background_reports" USING "btree" ("entity_id");



CREATE INDEX "idx_background_reports_org" ON "public"."background_reports" USING "btree" ("organization_id");



CREATE INDEX "idx_borrowers_not_archived" ON "public"."borrowers" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_bra_application" ON "public"."background_report_applications" USING "btree" ("application_id");



CREATE INDEX "idx_bra_report" ON "public"."background_report_applications" USING "btree" ("background_report_id");



CREATE INDEX "idx_brokers_mgrs_gin" ON "public"."brokers" USING "gin" ("account_manager_ids");



CREATE INDEX "idx_brokers_org_id" ON "public"."brokers" USING "btree" ("organization_id");



CREATE INDEX "idx_brokers_status" ON "public"."brokers" USING "btree" ("status");



CREATE INDEX "idx_crdl_aggregator_data" ON "public"."credit_report_data_links" USING "btree" ("aggregator_data_id");



CREATE INDEX "idx_crdl_credit_report" ON "public"."credit_report_data_links" USING "btree" ("credit_report_id");



CREATE INDEX "idx_credit_report_chat_messages_chat_time" ON "public"."credit_report_chat_messages" USING "btree" ("credit_report_chat_id", "created_at");



CREATE INDEX "idx_credit_report_data_xactus_borrower_id" ON "public"."credit_report_data_xactus" USING "btree" ("borrower_id");



CREATE INDEX "idx_credit_report_data_xactus_credit_report_id" ON "public"."credit_report_data_xactus" USING "btree" ("credit_report_id");



CREATE INDEX "idx_custom_broker_settings_broker_org_id" ON "public"."custom_broker_settings" USING "btree" ("broker_org_id");



CREATE INDEX "idx_custom_broker_settings_org_id" ON "public"."custom_broker_settings" USING "btree" ("organization_id");



CREATE INDEX "idx_deal_borrower_deal_entity_id" ON "public"."deal_borrower" USING "btree" ("deal_entity_id");



CREATE INDEX "idx_deal_borrower_deal_id" ON "public"."deal_borrower" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_borrower_guarantors_gin" ON "public"."deal_borrower" USING "gin" ("deal_guarantor_ids");



CREATE INDEX "idx_deal_calendar_events_deal_date" ON "public"."deal_calendar_events" USING "btree" ("deal_id", "event_date");



CREATE INDEX "idx_deal_calendar_events_deal_id" ON "public"."deal_calendar_events" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_calendar_events_deal_input_id" ON "public"."deal_calendar_events" USING "btree" ("deal_input_id") WHERE ("deal_input_id" IS NOT NULL);



CREATE INDEX "idx_deal_document_overrides_deal_id" ON "public"."deal_document_overrides" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_documents_deal_doc_type" ON "public"."deal_documents" USING "btree" ("deal_id", "document_type_id");



CREATE INDEX "idx_deal_documents_deal_id" ON "public"."deal_documents" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_documents_document_file_id" ON "public"."deal_documents" USING "btree" ("document_file_id");



CREATE INDEX "idx_deal_documents_not_archived" ON "public"."deal_documents" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_deal_entity_deal_id" ON "public"."deal_entity" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_entity_owners_deal_id" ON "public"."deal_entity_owners" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_orgs_clerk_org_id" ON "public"."deal_clerk_orgs" USING "btree" ("clerk_org_id");



CREATE INDEX "idx_deal_orgs_deal_id" ON "public"."deal_clerk_orgs" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_signature_requests_deal_id" ON "public"."deal_signature_requests" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_signature_requests_documenso_id" ON "public"."deal_signature_requests" USING "btree" ("documenso_document_id");



CREATE INDEX "idx_deal_signature_requests_org_id" ON "public"."deal_signature_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_deal_stages_not_archived" ON "public"."deal_stages" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_deal_stepper_history_created_at" ON "public"."deal_stepper_history" USING "btree" ("created_at");



CREATE INDEX "idx_deal_stepper_history_deal_id" ON "public"."deal_stepper_history" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_tasks_not_archived" ON "public"."deal_tasks" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_deal_users_deal" ON "public"."deal_users" USING "btree" ("deal_id");



CREATE INDEX "idx_deal_users_user" ON "public"."deal_users" USING "btree" ("user_id");



CREATE INDEX "idx_deals_assigned_gin" ON "public"."deals" USING "gin" ("assigned_to_user_id" "jsonb_path_ops");



CREATE INDEX "idx_deals_not_archived" ON "public"."deals" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_deals_org" ON "public"."deals" USING "btree" ("organization_id");



CREATE INDEX "idx_deals_primary_user" ON "public"."deals" USING "btree" ("primary_user_id");



CREATE INDEX "idx_default_broker_settings_member_id" ON "public"."default_broker_settings" USING "btree" ("organization_member_id");



CREATE INDEX "idx_default_broker_settings_org_id" ON "public"."default_broker_settings" USING "btree" ("organization_id");



CREATE INDEX "idx_dg_guar" ON "public"."deal_guarantors" USING "btree" ("guarantor_id", "deal_id");



CREATE INDEX "idx_doc_access_perm_global_category" ON "public"."document_access_permissions_global" USING "btree" ("document_categories_id");



CREATE INDEX "idx_doc_access_perm_global_role" ON "public"."document_access_permissions_global" USING "btree" ("deal_role_types_id");



CREATE INDEX "idx_doc_access_perm_lookup" ON "public"."document_access_permissions" USING "btree" ("clerk_org_id", "deal_role_types_id", "document_categories_id");



CREATE INDEX "idx_doc_files_credit_reports_cr" ON "public"."document_files_credit_reports" USING "btree" ("credit_report_id");



CREATE INDEX "idx_doc_files_credit_reports_doc" ON "public"."document_files_credit_reports" USING "btree" ("document_file_id");



CREATE INDEX "idx_document_files_borrowers_borrower" ON "public"."document_files_borrowers" USING "btree" ("borrower_id");



CREATE INDEX "idx_document_files_borrowers_doc" ON "public"."document_files_borrowers" USING "btree" ("document_file_id");



CREATE INDEX "idx_document_files_bucket" ON "public"."document_files" USING "btree" ("storage_bucket");



CREATE INDEX "idx_document_files_clerk_orgs_doc" ON "public"."document_files_clerk_orgs" USING "btree" ("document_file_id");



CREATE INDEX "idx_document_files_clerk_orgs_org" ON "public"."document_files_clerk_orgs" USING "btree" ("clerk_org_id");



CREATE INDEX "idx_document_files_clerk_users_doc" ON "public"."document_files_clerk_users" USING "btree" ("document_file_id");



CREATE INDEX "idx_document_files_clerk_users_user" ON "public"."document_files_clerk_users" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_document_files_document_category_id" ON "public"."document_files" USING "btree" ("document_category_id");



CREATE INDEX "idx_document_files_document_status_id" ON "public"."document_files" USING "btree" ("document_status_id");



CREATE INDEX "idx_document_files_entities_doc" ON "public"."document_files_entities" USING "btree" ("document_file_id");



CREATE INDEX "idx_document_files_entities_entity" ON "public"."document_files_entities" USING "btree" ("entity_id");



CREATE INDEX "idx_document_files_not_archived" ON "public"."document_files" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_document_files_period" ON "public"."document_files" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_document_files_storage_location" ON "public"."document_files" USING "btree" ("storage_bucket", "storage_path");



CREATE INDEX "idx_document_files_tags" ON "public"."document_files" USING "gin" ("tags");



CREATE INDEX "idx_document_files_tags_created_by" ON "public"."document_files_tags" USING "btree" ("created_by");



CREATE INDEX "idx_document_files_tags_doc" ON "public"."document_files_tags" USING "btree" ("document_file_id");



CREATE INDEX "idx_document_files_tags_tag" ON "public"."document_files_tags" USING "btree" ("document_tag_id");



CREATE INDEX "idx_document_files_uploaded_by" ON "public"."document_files" USING "btree" ("uploaded_by");



CREATE UNIQUE INDEX "idx_document_status_single_default" ON "public"."document_status" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_document_tags_created_by" ON "public"."document_tags" USING "btree" ("created_by");



CREATE INDEX "idx_document_tags_name" ON "public"."document_tags" USING "btree" ("name");



CREATE INDEX "idx_document_tags_slug" ON "public"."document_tags" USING "btree" ("slug");



CREATE INDEX "idx_document_template_variables_position" ON "public"."document_template_variables" USING "btree" ("template_id", "position");



CREATE INDEX "idx_document_template_variables_template_id" ON "public"."document_template_variables" USING "btree" ("template_id");



CREATE INDEX "idx_document_templates_not_archived" ON "public"."document_templates" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_document_types_not_archived" ON "public"."document_types" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_dp_prop" ON "public"."deal_property" USING "btree" ("property_id", "deal_id");



CREATE INDEX "idx_dwc_chat_id" ON "public"."dashboard_widget_conversations" USING "btree" ("dashboard_widget_chat_id");



CREATE INDEX "idx_dwc_widget_id" ON "public"."dashboard_widget_conversations" USING "btree" ("dashboard_widget_id");



CREATE INDEX "idx_dwch_widget_id" ON "public"."dashboard_widget_chats" USING "btree" ("dashboard_widget_id");



CREATE INDEX "idx_entities_not_archived" ON "public"."entities" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_execution_logs_workflow_node_id" ON "public"."workflow_execution_logs" USING "btree" ("workflow_node_id");



CREATE INDEX "idx_guarantor_not_archived" ON "public"."guarantor" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_input_categories_not_archived" ON "public"."input_categories" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_inputs_input_code" ON "public"."inputs" USING "btree" ("input_code");



CREATE INDEX "idx_inputs_not_archived" ON "public"."inputs" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_integration_settings_active" ON "public"."integration_settings" USING "btree" ("id") WHERE ("active" = true);



CREATE INDEX "idx_integration_settings_slug" ON "public"."integration_settings" USING "btree" ("slug");



CREATE INDEX "idx_integration_settings_type" ON "public"."integration_settings" USING "btree" ("type");



CREATE INDEX "idx_integration_setup_not_archived" ON "public"."integration_setup" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_integration_setup_org_user" ON "public"."integration_setup" USING "btree" ("organization_id", "user_id");



CREATE INDEX "idx_integration_setup_settings_id" ON "public"."integration_setup" USING "btree" ("integration_settings_id");



CREATE INDEX "idx_integration_setup_type" ON "public"."integration_setup" USING "btree" ("type");



CREATE INDEX "idx_integration_tags_tag" ON "public"."integration_tags" USING "btree" ("tag");



CREATE INDEX "idx_loan_scenario_inputs_pe_input" ON "public"."loan_scenario_inputs" USING "btree" ("pricing_engine_input_id");



CREATE INDEX "idx_loan_scenario_inputs_scenario" ON "public"."loan_scenario_inputs" USING "btree" ("loan_scenario_id");



CREATE UNIQUE INDEX "idx_loan_scenario_inputs_unique" ON "public"."loan_scenario_inputs" USING "btree" ("loan_scenario_id", "pricing_engine_input_id");



CREATE INDEX "idx_loan_scenarios_not_archived" ON "public"."loan_scenarios" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE UNIQUE INDEX "idx_loans_display_id" ON "public"."loans" USING "btree" ("display_id");



CREATE INDEX "idx_loans_not_archived" ON "public"."loans" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_loans_org" ON "public"."loans" USING "btree" ("organization_id");



CREATE INDEX "idx_loans_primary_user" ON "public"."loans" USING "btree" ("primary_user_id");



CREATE INDEX "idx_loans_status" ON "public"."loans" USING "btree" ("status");



CREATE INDEX "idx_oam_manager_id" ON "public"."organization_account_managers" USING "btree" ("account_manager_id");



CREATE INDEX "idx_oam_org_id" ON "public"."organization_account_managers" USING "btree" ("organization_id");



CREATE INDEX "idx_org_members_org" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_org_members_user" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organization_member_roles_not_archived" ON "public"."organization_member_roles" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE UNIQUE INDEX "idx_organization_policies_global_unique" ON "public"."organization_policies" USING "btree" ("resource_type", "resource_name", "action", "effect") WHERE ("org_id" IS NULL);



CREATE INDEX "idx_organization_policies_lookup" ON "public"."organization_policies" USING "btree" ("org_id", "resource_type", "resource_name", "action", "is_active");



CREATE INDEX "idx_organization_policies_not_archived" ON "public"."organization_policies" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_organization_themes_organization_id" ON "public"."organization_themes" USING "btree" ("organization_id");



CREATE INDEX "idx_pe_input_categories_not_archived" ON "public"."pricing_engine_input_categories" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_pe_inputs_input_code" ON "public"."pricing_engine_inputs" USING "btree" ("input_code");



CREATE INDEX "idx_pe_inputs_not_archived" ON "public"."pricing_engine_inputs" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_pe_logic_action_input" ON "public"."pe_input_logic_actions" USING "btree" ("input_id");



CREATE INDEX "idx_pe_logic_action_rule" ON "public"."pe_input_logic_actions" USING "btree" ("pe_input_logic_id");



CREATE INDEX "idx_pe_logic_cond_rule" ON "public"."pe_input_logic_conditions" USING "btree" ("pe_input_logic_id");



CREATE INDEX "idx_pe_section_button_actions_button" ON "public"."pe_section_button_actions" USING "btree" ("button_id");



CREATE INDEX "idx_pe_section_buttons_category" ON "public"."pe_section_buttons" USING "btree" ("category_id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_pe_term_sheet_conditions_rule_id" ON "public"."pe_term_sheet_conditions" USING "btree" ("pe_term_sheet_rule_id");



CREATE INDEX "idx_pe_term_sheet_rules_sheet_id" ON "public"."pe_term_sheet_rules" USING "btree" ("pe_term_sheet_id");



CREATE INDEX "idx_pe_term_sheets_display_order" ON "public"."pe_term_sheets" USING "btree" ("display_order");



CREATE INDEX "idx_pricing_activity_log_activity_type" ON "public"."pricing_activity_log" USING "btree" ("activity_type");



CREATE INDEX "idx_pricing_activity_log_created_at" ON "public"."pricing_activity_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pricing_activity_log_loan_id" ON "public"."pricing_activity_log" USING "btree" ("loan_id");



CREATE INDEX "idx_pricing_activity_log_scenario_id" ON "public"."pricing_activity_log" USING "btree" ("scenario_id");



CREATE INDEX "idx_pricing_activity_log_user_id" ON "public"."pricing_activity_log" USING "btree" ("user_id");



CREATE INDEX "idx_program_conditions_program" ON "public"."program_conditions" USING "btree" ("program_id");



CREATE INDEX "idx_program_documents_program_id" ON "public"."program_documents" USING "btree" ("program_id");



CREATE INDEX "idx_programs_not_archived" ON "public"."programs" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_rbac_permissions_lookup" ON "public"."rbac_permissions" USING "btree" ("role", "resource_type", "resource_name") WHERE ("is_active" = true);



CREATE INDEX "idx_rbac_permissions_resource" ON "public"."rbac_permissions" USING "btree" ("resource_type", "resource_name") WHERE ("is_active" = true);



CREATE INDEX "idx_rbac_permissions_role" ON "public"."rbac_permissions" USING "btree" ("role") WHERE ("is_active" = true);



CREATE INDEX "idx_role_assignments_org" ON "public"."role_assignments" USING "btree" ("organization_id");



CREATE INDEX "idx_role_assignments_resource" ON "public"."role_assignments" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_role_assignments_user" ON "public"."role_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_scenario_program_results_program" ON "public"."scenario_program_results" USING "btree" ("program_id");



CREATE INDEX "idx_scenario_program_results_scenario" ON "public"."scenario_program_results" USING "btree" ("loan_scenario_id");



CREATE INDEX "idx_scenario_rate_options_result" ON "public"."scenario_rate_options" USING "btree" ("scenario_program_result_id");



CREATE INDEX "idx_scenarios_loan" ON "public"."loan_scenarios" USING "btree" ("loan_id");



CREATE INDEX "idx_task_templates_not_archived" ON "public"."task_templates" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_term_sheet_templates_organization_id" ON "public"."document_templates" USING "btree" ("organization_id");



CREATE INDEX "idx_term_sheet_templates_user_id" ON "public"."document_templates" USING "btree" ("user_id");



CREATE INDEX "idx_term_sheets_loan" ON "public"."term_sheets" USING "btree" ("loan_id");



CREATE UNIQUE INDEX "idx_term_sheets_loan_version" ON "public"."term_sheets" USING "btree" ("loan_id", "version");



CREATE INDEX "idx_user_deal_access_lookup" ON "public"."user_deal_access" USING "btree" ("deal_id", "clerk_user_id");



CREATE INDEX "idx_user_pref_doc_cat_order_clerk_user" ON "public"."document_categories_user_order" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_users_clerk_username" ON "public"."users" USING "btree" ("clerk_username");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active_yn" ON "public"."users" USING "btree" ("is_active_yn");



CREATE INDEX "idx_users_is_banned" ON "public"."users" USING "btree" ("is_banned");



CREATE INDEX "idx_users_is_internal_yn" ON "public"."users" USING "btree" ("is_internal_yn");



CREATE INDEX "idx_users_is_locked" ON "public"."users" USING "btree" ("is_locked");



CREATE INDEX "idx_users_last_active_at" ON "public"."users" USING "btree" ("last_active_at");



CREATE INDEX "idx_users_last_sign_in_at" ON "public"."users" USING "btree" ("last_sign_in_at");



CREATE INDEX "idx_users_legal_accepted_at" ON "public"."users" USING "btree" ("legal_accepted_at");



CREATE INDEX "idx_workflow_execution_logs_execution_id" ON "public"."workflow_execution_logs" USING "btree" ("execution_id");



CREATE INDEX "idx_workflow_executions_user_id" ON "public"."workflow_executions" USING "btree" ("user_id");



CREATE INDEX "idx_workflow_executions_workflow_id" ON "public"."workflow_executions" USING "btree" ("workflow_id");



CREATE INDEX "idx_workflow_nodes_workflow_id" ON "public"."workflow_nodes" USING "btree" ("workflow_id");



CREATE UNIQUE INDEX "landing_page_templates_org_slug_idx" ON "public"."landing_page_templates" USING "btree" ("organization_id", "slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "landing_page_templates_organization_id_idx" ON "public"."landing_page_templates" USING "btree" ("organization_id");



CREATE INDEX "landing_page_templates_status_idx" ON "public"."landing_page_templates" USING "btree" ("status");



CREATE INDEX "llama_chunks_embedding_hnsw_idx" ON "public"."llama_document_chunks_vs" USING "hnsw" ("embedding" "public"."vector_cosine_ops");



CREATE INDEX "llama_chunks_metadata_gin_idx" ON "public"."llama_document_chunks_vs" USING "gin" ("metadata");



CREATE INDEX "llama_document_parsed_status_idx" ON "public"."llama_document_parsed" USING "btree" ("status");



CREATE INDEX "loan_scenarios_selected_rate_option_id_idx" ON "public"."loan_scenarios" USING "btree" ("selected_rate_option_id");



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "notifications_read_idx" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE UNIQUE INDEX "organization_member_roles_unique_global" ON "public"."organization_member_roles" USING "btree" ("role_code") WHERE ("organization_id" IS NULL);



CREATE UNIQUE INDEX "organization_member_roles_unique_per_org" ON "public"."organization_member_roles" USING "btree" ("organization_id", "role_code") WHERE ("organization_id" IS NOT NULL);



CREATE UNIQUE INDEX "organization_themes_organization_id_unique" ON "public"."organization_themes" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "organizations_clerk_organization_id_key" ON "public"."organizations" USING "btree" ("clerk_organization_id");



CREATE INDEX "pricing_engine_input_categories_display_order_idx" ON "public"."pricing_engine_input_categories" USING "btree" ("display_order");



CREATE INDEX "program_documents_chunks_vs_embedding_idx" ON "public"."program_documents_chunks_vs" USING "hnsw" ("embedding" "public"."vector_cosine_ops");



CREATE INDEX "programs_status_idx" ON "public"."programs" USING "btree" ("status");



CREATE INDEX "programs_user_id_idx" ON "public"."programs" USING "btree" ("user_id");



CREATE INDEX "role_assignments_resource_type_idx" ON "public"."role_assignments" USING "btree" ("resource_type");



CREATE INDEX "scenario_rate_options_funded_pitia_idx" ON "public"."scenario_rate_options" USING "btree" ("funded_pitia");



CREATE INDEX "task_logic_actions_task_logic_id_idx" ON "public"."task_logic_actions" USING "btree" ("task_logic_id");



CREATE INDEX "task_logic_conditions_task_logic_id_idx" ON "public"."task_logic_conditions" USING "btree" ("task_logic_id");



CREATE INDEX "task_logic_task_template_id_idx" ON "public"."task_logic" USING "btree" ("task_template_id");



CREATE OR REPLACE TRIGGER "actions_updated_at" BEFORE UPDATE ON "public"."automations" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "background_reports_updated_at" BEFORE UPDATE ON "public"."background_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "borrowers_set_updated_at" BEFORE UPDATE ON "public"."borrowers" FOR EACH ROW EXECUTE FUNCTION "public"."borrowers_set_updated_at"();



CREATE OR REPLACE TRIGGER "deal_signature_requests_updated_at" BEFORE UPDATE ON "public"."deal_signature_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_deal_signature_requests_updated_at"();



CREATE OR REPLACE TRIGGER "deal_stages_updated_at" BEFORE UPDATE ON "public"."deal_stages" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "deal_tasks_updated_at" BEFORE UPDATE ON "public"."deal_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "email_templates_updated_at" BEFORE UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "entities_set_updated_at" BEFORE UPDATE ON "public"."entities" FOR EACH ROW EXECUTE FUNCTION "public"."entities_set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."contact" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."property" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_users_updated_at"();



CREATE OR REPLACE TRIGGER "integration_settings_updated_at" BEFORE UPDATE ON "public"."integration_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "integration_setup_updated_at" BEFORE UPDATE ON "public"."integration_setup" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "landing_page_templates_updated_at" BEFORE UPDATE ON "public"."landing_page_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "loans_set_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "loans_set_updated_at" BEFORE UPDATE ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "on_document_file_inserted" AFTER INSERT ON "public"."document_files" FOR EACH ROW EXECUTE FUNCTION "public"."notify_n8n_on_document_file_insert"();



CREATE OR REPLACE TRIGGER "on_org_created_create_theme" AFTER INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_org_theme"();



CREATE OR REPLACE TRIGGER "organizations_set_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "programs_set_updated_at" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_document_template_variables_updated_at" BEFORE UPDATE ON "public"."document_template_variables" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_organization_themes_updated_at" BEFORE UPDATE ON "public"."organization_themes" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_term_sheet_templates_updated_at" BEFORE UPDATE ON "public"."document_templates" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_on_brokers" BEFORE UPDATE ON "public"."brokers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_on_custom_broker_settings" BEFORE UPDATE ON "public"."custom_broker_settings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_on_default_broker_settings" BEFORE UPDATE ON "public"."default_broker_settings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."application_appraisal" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."application_background" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."application_credit" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "task_priorities_updated_at" BEFORE UPDATE ON "public"."task_priorities" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "task_statuses_updated_at" BEFORE UPDATE ON "public"."task_statuses" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "task_templates_updated_at" BEFORE UPDATE ON "public"."task_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ai_chat_messages_touch_chat" AFTER INSERT ON "public"."ai_chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."touch_ai_chat_last_used"();



CREATE OR REPLACE TRIGGER "trg_applications_auto_emails" BEFORE INSERT OR UPDATE OF "guarantor_ids" ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_guarantor_emails"();



CREATE OR REPLACE TRIGGER "trg_applications_set_updated" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_applications_sync_from_primary_scenario" AFTER INSERT OR UPDATE OF "loan_id" ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trg_applications_sync_from_primary_scenario"();



CREATE OR REPLACE TRIGGER "trg_applications_sync_primary_scenario" AFTER INSERT OR UPDATE OF "entity_id", "borrower_name", "guarantor_ids", "guarantor_names", "guarantor_emails" ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."trg_applications_sync_primary_scenario"();



CREATE OR REPLACE TRIGGER "trg_auto_create_ai_input_order" AFTER INSERT ON "public"."document_type_ai_input" FOR EACH ROW EXECUTE FUNCTION "public"."auto_create_ai_input_order"();



CREATE OR REPLACE TRIGGER "trg_background_report_created" AFTER INSERT ON "public"."background_reports" FOR EACH ROW EXECUTE FUNCTION "public"."notify_background_report_created"();



CREATE OR REPLACE TRIGGER "trg_cascade_archive_borrowers" AFTER UPDATE OF "archived_at" ON "public"."borrowers" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_archive"();



CREATE OR REPLACE TRIGGER "trg_cascade_archive_deals" AFTER UPDATE OF "archived_at" ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_archive"();



CREATE OR REPLACE TRIGGER "trg_cascade_archive_loans" AFTER UPDATE OF "archived_at" ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_archive"();



CREATE OR REPLACE TRIGGER "trg_create_default_org_policies" AFTER INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_org_policies"();



CREATE OR REPLACE TRIGGER "trg_credit_report_chat_messages_touch_chat" AFTER INSERT ON "public"."credit_report_chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."touch_credit_report_chat_last_used"();



CREATE OR REPLACE TRIGGER "trg_ddp_deal_guarantors" AFTER INSERT OR DELETE ON "public"."deal_guarantors" FOR EACH ROW EXECUTE FUNCTION "public"."trg_ddp_from_deal_guarantors"();



CREATE OR REPLACE TRIGGER "trg_ddp_deal_property" AFTER INSERT OR DELETE ON "public"."deal_property" FOR EACH ROW EXECUTE FUNCTION "public"."trg_ddp_from_deal_property"();



CREATE OR REPLACE TRIGGER "trg_delete_orphaned_chat" AFTER DELETE ON "public"."credit_report_user_chats" FOR EACH ROW EXECUTE FUNCTION "public"."delete_orphaned_credit_report_chat"();



CREATE OR REPLACE TRIGGER "trg_insert_default_integrations_for_member" AFTER INSERT ON "public"."organization_members" FOR EACH ROW EXECUTE FUNCTION "public"."insert_default_integrations_for_member"();



CREATE OR REPLACE TRIGGER "trg_loan_scenario_inputs_sync" AFTER INSERT OR DELETE OR UPDATE ON "public"."loan_scenario_inputs" FOR EACH ROW EXECUTE FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"();



CREATE OR REPLACE TRIGGER "trg_loan_scenarios_sync_applications" AFTER INSERT OR DELETE OR UPDATE ON "public"."loan_scenarios" FOR EACH ROW EXECUTE FUNCTION "public"."trg_loan_scenarios_sync_applications"();



CREATE OR REPLACE TRIGGER "trg_programs_set_updated_at" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."set_programs_updated_at"();



CREATE OR REPLACE TRIGGER "trg_register_integration_feature_policy" AFTER INSERT ON "public"."integration_settings" FOR EACH ROW EXECUTE FUNCTION "public"."register_integration_feature_policy"();



CREATE OR REPLACE TRIGGER "trg_seed_custom_on_account_manager_assign" AFTER INSERT ON "public"."organization_account_managers" FOR EACH ROW EXECUTE FUNCTION "public"."seed_custom_broker_settings_on_assignment"();



CREATE OR REPLACE TRIGGER "trg_set_application_display_id" BEFORE INSERT ON "public"."applications" FOR EACH ROW WHEN (("new"."display_id" IS NULL)) EXECUTE FUNCTION "public"."generate_application_display_id"();



CREATE OR REPLACE TRIGGER "trg_set_loan_display_id" BEFORE INSERT ON "public"."loans" FOR EACH ROW WHEN (("new"."display_id" IS NULL)) EXECUTE FUNCTION "public"."generate_loan_display_id"();



CREATE OR REPLACE TRIGGER "trg_sync_assigned_from_viewers_del" AFTER DELETE ON "public"."credit_report_viewers" FOR EACH ROW EXECUTE FUNCTION "public"."sync_assigned_from_viewers_del"();



CREATE OR REPLACE TRIGGER "trg_sync_assigned_from_viewers_ins" AFTER INSERT ON "public"."credit_report_viewers" FOR EACH ROW EXECUTE FUNCTION "public"."sync_assigned_from_viewers_ins"();



CREATE OR REPLACE TRIGGER "trg_sync_borrower_to_entity_owners" AFTER UPDATE OF "first_name", "last_name", "ssn_last4", "address_line1", "city", "state", "zip" ON "public"."borrowers" FOR EACH ROW WHEN (("new"."id" IS NOT NULL)) EXECUTE FUNCTION "public"."sync_borrower_to_entity_owners"();



CREATE OR REPLACE TRIGGER "trg_sync_deal_clerk_orgs_delete" AFTER DELETE ON "public"."role_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."sync_deal_clerk_orgs_on_delete"();



CREATE OR REPLACE TRIGGER "trg_sync_deal_clerk_orgs_insert" AFTER INSERT ON "public"."role_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."sync_deal_clerk_orgs_on_insert"();



CREATE OR REPLACE TRIGGER "trg_sync_stepper_on_dropdown_change" AFTER UPDATE OF "dropdown_options" ON "public"."inputs" FOR EACH ROW EXECUTE FUNCTION "public"."sync_stepper_on_dropdown_change"();



CREATE OR REPLACE TRIGGER "trg_sync_user_deal_access" AFTER INSERT OR DELETE OR UPDATE ON "public"."deal_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_deal_access"();



CREATE OR REPLACE TRIGGER "trg_sync_viewers_from_credit_reports" AFTER INSERT OR UPDATE ON "public"."credit_reports" FOR EACH ROW EXECUTE FUNCTION "public"."sync_viewers_from_credit_reports"();



CREATE OR REPLACE TRIGGER "trg_validate_deal_guarantors_array" BEFORE INSERT OR UPDATE ON "public"."deal_borrower" FOR EACH ROW EXECUTE FUNCTION "public"."validate_deal_guarantors_array"();



CREATE OR REPLACE TRIGGER "trg_validate_document_file_status_assignment" BEFORE INSERT OR UPDATE ON "public"."document_file_statuses" FOR EACH ROW EXECUTE FUNCTION "public"."validate_document_file_status_assignment"();



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_ai_chat_id_fkey" FOREIGN KEY ("ai_chat_id") REFERENCES "public"."ai_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chats"
    ADD CONSTRAINT "ai_chats_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_appraisal"
    ADD CONSTRAINT "application_appraisal_amc_id_fkey" FOREIGN KEY ("amc_id") REFERENCES "public"."integration_setup"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_appraisal"
    ADD CONSTRAINT "application_appraisal_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("loan_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_appraisal"
    ADD CONSTRAINT "application_appraisal_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."application_background"
    ADD CONSTRAINT "application_background_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("loan_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_background"
    ADD CONSTRAINT "application_background_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_background"
    ADD CONSTRAINT "application_background_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_background"
    ADD CONSTRAINT "application_background_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."application_credit"
    ADD CONSTRAINT "application_credit_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("loan_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_credit"
    ADD CONSTRAINT "application_credit_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."application_credit"
    ADD CONSTRAINT "application_credit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."application_signings"
    ADD CONSTRAINT "application_signings_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_amc_id_fkey" FOREIGN KEY ("amc_id") REFERENCES "public"."integration_setup"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal_amcs"
    ADD CONSTRAINT "appraisal_amcs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_appraiser_id_fkey" FOREIGN KEY ("appraiser_id") REFERENCES "public"."contact"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal_borrowers"
    ADD CONSTRAINT "appraisal_borrowers_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_borrowers"
    ADD CONSTRAINT "appraisal_borrowers_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_co_amc_fkey" FOREIGN KEY ("co_amc") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_co_appraisal_fkey" FOREIGN KEY ("co_appraisal") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."document_files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal_documents"
    ADD CONSTRAINT "appraisal_documents_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_investor_list"
    ADD CONSTRAINT "appraisal_investor_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_lender_list"
    ADD CONSTRAINT "appraisal_lender_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_loan_type_list"
    ADD CONSTRAINT "appraisal_loan_type_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_occupancy_list"
    ADD CONSTRAINT "appraisal_occupancy_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."appraisal_product_list"
    ADD CONSTRAINT "appraisal_product_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal"
    ADD CONSTRAINT "appraisal_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisal_property_list"
    ADD CONSTRAINT "appraisal_property_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_status_list"
    ADD CONSTRAINT "appraisal_status_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_transaction_type_list"
    ADD CONSTRAINT "appraisal_transaction_type_list_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_person_search_lien"
    ADD CONSTRAINT "background_people_search_lien_background_people_search_id_fkey" FOREIGN KEY ("background_person_search_id") REFERENCES "public"."background_person_search"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_person_search_ucc"
    ADD CONSTRAINT "background_people_search_ucc_background_people_search_id_fkey" FOREIGN KEY ("background_person_search_id") REFERENCES "public"."background_person_search"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_person_search"
    ADD CONSTRAINT "background_person_search_background_report_id_fkey" FOREIGN KEY ("background_report_id") REFERENCES "public"."background_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_person_search_criminal"
    ADD CONSTRAINT "background_person_search_crimi_background_person_search_id_fkey" FOREIGN KEY ("background_person_search_id") REFERENCES "public"."background_person_search"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_person_search_litigation"
    ADD CONSTRAINT "background_person_search_litig_background_person_search_id_fkey" FOREIGN KEY ("background_person_search_id") REFERENCES "public"."background_person_search"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_person_search_quick_analysis"
    ADD CONSTRAINT "background_person_search_quick_background_person_search_id_fkey" FOREIGN KEY ("background_person_search_id") REFERENCES "public"."background_person_search"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_report_applications"
    ADD CONSTRAINT "background_report_applications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("loan_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_report_applications"
    ADD CONSTRAINT "background_report_applications_background_report_id_fkey" FOREIGN KEY ("background_report_id") REFERENCES "public"."background_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."background_reports"
    ADD CONSTRAINT "background_reports_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."background_reports"
    ADD CONSTRAINT "background_reports_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."background_reports"
    ADD CONSTRAINT "background_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."borrower_entities"
    ADD CONSTRAINT "borrower_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."borrowers"
    ADD CONSTRAINT "borrowers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brokers"
    ADD CONSTRAINT "brokers_org_member_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_chat_messages"
    ADD CONSTRAINT "credit_report_chat_messages_credit_report_chat_id_fkey" FOREIGN KEY ("credit_report_chat_id") REFERENCES "public"."credit_report_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_chat_messages"
    ADD CONSTRAINT "credit_report_chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_chats"
    ADD CONSTRAINT "credit_report_chats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_data_links"
    ADD CONSTRAINT "credit_report_data_links_credit_report_id_fkey" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "credit_report_data_xactus_credit_report_id_fkey" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "credit_report_data_xactus_guarantor_id_fkey" FOREIGN KEY ("guarantor_id") REFERENCES "public"."guarantor"("id");



ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "credit_report_data_xactus_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."credit_report_user_chats"
    ADD CONSTRAINT "credit_report_user_chats_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."credit_report_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_user_chats"
    ADD CONSTRAINT "credit_report_user_chats_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_viewers"
    ADD CONSTRAINT "credit_report_viewers_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_reports"
    ADD CONSTRAINT "credit_reports_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_reports"
    ADD CONSTRAINT "credit_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_broker_org_fk" FOREIGN KEY ("broker_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_org_member_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboard_widget_chats"
    ADD CONSTRAINT "dashboard_widget_chats_dashboard_widget_id_fkey" FOREIGN KEY ("dashboard_widget_id") REFERENCES "public"."dashboard_widgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboard_widget_conversations"
    ADD CONSTRAINT "dashboard_widget_conversations_dashboard_widget_chat_id_fkey" FOREIGN KEY ("dashboard_widget_chat_id") REFERENCES "public"."dashboard_widget_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboard_widget_conversations"
    ADD CONSTRAINT "dashboard_widget_conversations_dashboard_widget_id_fkey" FOREIGN KEY ("dashboard_widget_id") REFERENCES "public"."dashboard_widgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_borrower"
    ADD CONSTRAINT "deal_borrower_deal_entity_id_fkey" FOREIGN KEY ("deal_entity_id") REFERENCES "public"."deal_entity"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."deal_borrower"
    ADD CONSTRAINT "deal_borrower_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_calendar_events"
    ADD CONSTRAINT "deal_calendar_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_calendar_events"
    ADD CONSTRAINT "deal_calendar_events_deal_input_id_fkey" FOREIGN KEY ("deal_input_id") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."deal_clerk_orgs"
    ADD CONSTRAINT "deal_clerk_orgs_clerk_org_id_fkey" FOREIGN KEY ("clerk_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_clerk_orgs"
    ADD CONSTRAINT "deal_clerk_orgs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE ONLY "public"."deal_comment_mentions"
    ADD CONSTRAINT "deal_comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."deal_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_document_ai_chat"
    ADD CONSTRAINT "deal_document_ai_chat_deal_document_id_fkey" FOREIGN KEY ("deal_document_id") REFERENCES "public"."deal_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_document_ai_condition"
    ADD CONSTRAINT "deal_document_ai_condition_deal_document_id_fkey" FOREIGN KEY ("deal_document_id") REFERENCES "public"."deal_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_document_ai_condition"
    ADD CONSTRAINT "deal_document_ai_condition_document_type_ai_condition_fkey" FOREIGN KEY ("document_type_ai_condition") REFERENCES "public"."document_type_ai_condition"("id");



ALTER TABLE ONLY "public"."deal_document_ai_input"
    ADD CONSTRAINT "deal_document_ai_input_deal_document_id_fkey" FOREIGN KEY ("deal_document_id") REFERENCES "public"."deal_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_document_ai_input"
    ADD CONSTRAINT "deal_document_ai_input_document_type_ai_input_id_fkey" FOREIGN KEY ("document_type_ai_input_id") REFERENCES "public"."document_type_ai_input"("id");



ALTER TABLE ONLY "public"."deal_document_overrides"
    ADD CONSTRAINT "deal_document_overrides_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_document_overrides"
    ADD CONSTRAINT "deal_document_overrides_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_documents"
    ADD CONSTRAINT "deal_documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_documents"
    ADD CONSTRAINT "deal_documents_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deal_documents"
    ADD CONSTRAINT "deal_documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_entity"
    ADD CONSTRAINT "deal_entity_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_entity"
    ADD CONSTRAINT "deal_entity_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id");



ALTER TABLE ONLY "public"."deal_entity_owners"
    ADD CONSTRAINT "deal_entity_owners_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id");



ALTER TABLE ONLY "public"."deal_entity_owners"
    ADD CONSTRAINT "deal_entity_owners_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_entity_owners"
    ADD CONSTRAINT "deal_entity_owners_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id");



ALTER TABLE ONLY "public"."deal_entity_owners"
    ADD CONSTRAINT "deal_entity_owners_entity_owner_id_fkey" FOREIGN KEY ("entity_owner_id") REFERENCES "public"."entities"("id");



ALTER TABLE ONLY "public"."deal_inputs"
    ADD CONSTRAINT "deal_inputs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_inputs"
    ADD CONSTRAINT "deal_inputs_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."deal_roles"
    ADD CONSTRAINT "deal_roles_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_roles"
    ADD CONSTRAINT "deal_roles_deal_role_types_id_fkey" FOREIGN KEY ("deal_role_types_id") REFERENCES "public"."deal_role_types"("id");



ALTER TABLE ONLY "public"."deal_roles"
    ADD CONSTRAINT "deal_roles_entities_id_fkey" FOREIGN KEY ("entities_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_roles"
    ADD CONSTRAINT "deal_roles_guarantor_id_fkey" FOREIGN KEY ("guarantor_id") REFERENCES "public"."guarantor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_roles"
    ADD CONSTRAINT "deal_roles_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_signature_requests"
    ADD CONSTRAINT "deal_signature_requests_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_signature_requests"
    ADD CONSTRAINT "deal_signature_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."deal_stepper"
    ADD CONSTRAINT "deal_stepper_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_stepper_history"
    ADD CONSTRAINT "deal_stepper_history_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_stepper_history"
    ADD CONSTRAINT "deal_stepper_history_deal_stepper_id_fkey" FOREIGN KEY ("deal_stepper_id") REFERENCES "public"."deal_stepper"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_stepper"
    ADD CONSTRAINT "deal_stepper_input_stepper_id_fkey" FOREIGN KEY ("input_stepper_id") REFERENCES "public"."input_stepper"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_task_events"
    ADD CONSTRAINT "deal_task_events_deal_task_id_fkey" FOREIGN KEY ("deal_task_id") REFERENCES "public"."deal_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_deal_stage_id_fkey" FOREIGN KEY ("deal_stage_id") REFERENCES "public"."deal_stages"("id");



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_task_priority_id_fkey" FOREIGN KEY ("task_priority_id") REFERENCES "public"."task_priorities"("id");



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_task_status_id_fkey" FOREIGN KEY ("task_status_id") REFERENCES "public"."task_statuses"("id");



ALTER TABLE ONLY "public"."deal_tasks"
    ADD CONSTRAINT "deal_tasks_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deal_users"
    ADD CONSTRAINT "deal_users_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_guarantors"
    ADD CONSTRAINT "deals_guarantors_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_guarantors"
    ADD CONSTRAINT "deals_guarantors_guarantor_id_fkey" FOREIGN KEY ("guarantor_id") REFERENCES "public"."guarantor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."default_broker_settings"
    ADD CONSTRAINT "default_broker_settings_org_member_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_permissions"
    ADD CONSTRAINT "document_access_permissions_clerk_org_id_fkey" FOREIGN KEY ("clerk_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_permissions"
    ADD CONSTRAINT "document_access_permissions_deal_role_types_id_fkey" FOREIGN KEY ("deal_role_types_id") REFERENCES "public"."deal_role_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_permissions"
    ADD CONSTRAINT "document_access_permissions_document_categories_id_fkey" FOREIGN KEY ("document_categories_id") REFERENCES "public"."document_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_permissions_global"
    ADD CONSTRAINT "document_access_permissions_global_deal_role_types_id_fkey" FOREIGN KEY ("deal_role_types_id") REFERENCES "public"."deal_role_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_permissions_global"
    ADD CONSTRAINT "document_access_permissions_global_document_categories_id_fkey" FOREIGN KEY ("document_categories_id") REFERENCES "public"."document_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_access_permissions"
    ADD CONSTRAINT "document_access_permissions_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_document_status_fkey" FOREIGN KEY ("document_status_id") REFERENCES "public"."document_status"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_file_statuses"
    ADD CONSTRAINT "document_file_statuses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_files_background_reports"
    ADD CONSTRAINT "document_files_background_reports_background_report_id_fkey" FOREIGN KEY ("background_report_id") REFERENCES "public"."background_reports"("id");



ALTER TABLE ONLY "public"."document_files_background_reports"
    ADD CONSTRAINT "document_files_background_reports_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id");



ALTER TABLE ONLY "public"."document_files_borrowers"
    ADD CONSTRAINT "document_files_borrowers_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_borrowers"
    ADD CONSTRAINT "document_files_borrowers_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_clerk_orgs"
    ADD CONSTRAINT "document_files_clerk_orgs_clerk_org_id_fkey" FOREIGN KEY ("clerk_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_clerk_orgs"
    ADD CONSTRAINT "document_files_clerk_orgs_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_clerk_users"
    ADD CONSTRAINT "document_files_clerk_users_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_clerk_users"
    ADD CONSTRAINT "document_files_clerk_users_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_credit_reports"
    ADD CONSTRAINT "document_files_credit_reports_cr_fkey" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_credit_reports"
    ADD CONSTRAINT "document_files_credit_reports_doc_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_deals"
    ADD CONSTRAINT "document_files_deals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_deals"
    ADD CONSTRAINT "document_files_deals_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files"
    ADD CONSTRAINT "document_files_document_category_id_fkey" FOREIGN KEY ("document_category_id") REFERENCES "public"."document_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_files"
    ADD CONSTRAINT "document_files_document_status_id_fkey" FOREIGN KEY ("document_status_id") REFERENCES "public"."document_status"("id");



ALTER TABLE ONLY "public"."document_files_entities"
    ADD CONSTRAINT "document_files_entities_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_entities"
    ADD CONSTRAINT "document_files_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_tags"
    ADD CONSTRAINT "document_files_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_files_tags"
    ADD CONSTRAINT "document_files_tags_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_files_tags"
    ADD CONSTRAINT "document_files_tags_document_tag_id_fkey" FOREIGN KEY ("document_tag_id") REFERENCES "public"."document_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_logic_actions"
    ADD CONSTRAINT "document_logic_actions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."document_categories"("id");



ALTER TABLE ONLY "public"."document_logic_actions"
    ADD CONSTRAINT "document_logic_actions_document_logic_id_fkey" FOREIGN KEY ("document_logic_id") REFERENCES "public"."document_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_logic_actions"
    ADD CONSTRAINT "document_logic_actions_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id");



ALTER TABLE ONLY "public"."document_logic_conditions"
    ADD CONSTRAINT "document_logic_conditions_document_logic_id_fkey" FOREIGN KEY ("document_logic_id") REFERENCES "public"."document_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_logic_conditions"
    ADD CONSTRAINT "document_logic_conditions_field_fkey" FOREIGN KEY ("field") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."document_logic_conditions"
    ADD CONSTRAINT "document_logic_conditions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."llama_document_parsed"
    ADD CONSTRAINT "document_parsed_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."document_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_roles_files"
    ADD CONSTRAINT "document_roles_files_document_files_id_fkey" FOREIGN KEY ("document_files_id") REFERENCES "public"."document_files"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_roles_files"
    ADD CONSTRAINT "document_roles_files_document_roles_id_fkey" FOREIGN KEY ("document_roles_id") REFERENCES "public"."document_roles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_status"
    ADD CONSTRAINT "document_statuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_tags"
    ADD CONSTRAINT "document_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_template_variables"
    ADD CONSTRAINT "document_template_variables_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_type_ai_condition"
    ADD CONSTRAINT "document_type_ai_condition_document_type_fkey" FOREIGN KEY ("document_type") REFERENCES "public"."document_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_type_ai_input"
    ADD CONSTRAINT "document_type_ai_input_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_type_ai_input"
    ADD CONSTRAINT "document_type_ai_input_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."document_type_ai_input_order"
    ADD CONSTRAINT "document_type_ai_input_order_document_type_ai_input_id_fkey" FOREIGN KEY ("document_type_ai_input_id") REFERENCES "public"."document_type_ai_input"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_document_category_id_fkey" FOREIGN KEY ("document_category_id") REFERENCES "public"."document_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_entity_owner_id_fkey" FOREIGN KEY ("entity_owner_id") REFERENCES "public"."entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_owners"
    ADD CONSTRAINT "entity_owners_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_execution_logs"
    ADD CONSTRAINT "fk_execution_logs_workflow_node" FOREIGN KEY ("workflow_node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "fk_selected_rate_option" FOREIGN KEY ("selected_rate_option_id") REFERENCES "public"."scenario_rate_options"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "fk_workflow_executions_workflow" FOREIGN KEY ("workflow_id") REFERENCES "public"."automations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_nodes"
    ADD CONSTRAINT "fk_workflow_nodes_workflow" FOREIGN KEY ("workflow_id") REFERENCES "public"."automations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guarantor"
    ADD CONSTRAINT "guarantor_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("display_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."input_logic_actions"
    ADD CONSTRAINT "input_logic_actions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."input_categories"("id");



ALTER TABLE ONLY "public"."input_logic_actions"
    ADD CONSTRAINT "input_logic_actions_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."input_logic_actions"
    ADD CONSTRAINT "input_logic_actions_input_logic_id_fkey" FOREIGN KEY ("input_logic_id") REFERENCES "public"."input_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."input_logic_actions"
    ADD CONSTRAINT "input_logic_actions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."input_logic_conditions"
    ADD CONSTRAINT "input_logic_conditions_field_fkey" FOREIGN KEY ("field") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."input_logic_conditions"
    ADD CONSTRAINT "input_logic_conditions_input_logic_id_fkey" FOREIGN KEY ("input_logic_id") REFERENCES "public"."input_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."input_logic_conditions"
    ADD CONSTRAINT "input_logic_conditions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."input_stepper"
    ADD CONSTRAINT "input_stepper_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "public"."inputs"("id");



ALTER TABLE ONLY "public"."inputs"
    ADD CONSTRAINT "inputs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."input_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_setup"
    ADD CONSTRAINT "integration_setup_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."integration_setup"
    ADD CONSTRAINT "integration_setup_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_tags"
    ADD CONSTRAINT "integration_tags_integration_settings_id_fkey" FOREIGN KEY ("integration_settings_id") REFERENCES "public"."integration_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landing_page_templates"
    ADD CONSTRAINT "landing_page_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."loan_scenario_inputs"
    ADD CONSTRAINT "loan_scenario_inputs_loan_scenario_id_fkey" FOREIGN KEY ("loan_scenario_id") REFERENCES "public"."loan_scenarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_scenario_inputs"
    ADD CONSTRAINT "loan_scenario_inputs_pricing_engine_input_id_fkey" FOREIGN KEY ("pricing_engine_input_id") REFERENCES "public"."pricing_engine_inputs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_scenarios"
    ADD CONSTRAINT "loan_scenarios_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_account_managers"
    ADD CONSTRAINT "organization_account_managers_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_account_managers"
    ADD CONSTRAINT "organization_account_managers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_member_roles"
    ADD CONSTRAINT "organization_member_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_policies"
    ADD CONSTRAINT "organization_policies_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_policies"
    ADD CONSTRAINT "organization_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_policy_named_scope_tables"
    ADD CONSTRAINT "organization_policy_named_scope_tables_scope_name_fkey" FOREIGN KEY ("scope_name") REFERENCES "public"."organization_policy_named_scopes"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_input_logic_actions"
    ADD CONSTRAINT "pe_input_logic_actions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."pricing_engine_input_categories"("id");



ALTER TABLE ONLY "public"."pe_input_logic_actions"
    ADD CONSTRAINT "pe_input_logic_actions_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "public"."pricing_engine_inputs"("id");



ALTER TABLE ONLY "public"."pe_input_logic_actions"
    ADD CONSTRAINT "pe_input_logic_actions_pe_input_logic_id_fkey" FOREIGN KEY ("pe_input_logic_id") REFERENCES "public"."pe_input_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_input_logic_actions"
    ADD CONSTRAINT "pe_input_logic_actions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."pricing_engine_inputs"("id");



ALTER TABLE ONLY "public"."pe_input_logic_conditions"
    ADD CONSTRAINT "pe_input_logic_conditions_field_fkey" FOREIGN KEY ("field") REFERENCES "public"."pricing_engine_inputs"("id");



ALTER TABLE ONLY "public"."pe_input_logic_conditions"
    ADD CONSTRAINT "pe_input_logic_conditions_pe_input_logic_id_fkey" FOREIGN KEY ("pe_input_logic_id") REFERENCES "public"."pe_input_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_input_logic_conditions"
    ADD CONSTRAINT "pe_input_logic_conditions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."pricing_engine_inputs"("id");



ALTER TABLE ONLY "public"."pe_section_button_actions"
    ADD CONSTRAINT "pe_section_button_actions_button_id_fkey" FOREIGN KEY ("button_id") REFERENCES "public"."pe_section_buttons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_section_buttons"
    ADD CONSTRAINT "pe_section_buttons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."pricing_engine_input_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_term_sheet_conditions"
    ADD CONSTRAINT "pe_term_sheet_conditions_pe_term_sheet_rule_id_fkey" FOREIGN KEY ("pe_term_sheet_rule_id") REFERENCES "public"."pe_term_sheet_rules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_term_sheet_rules"
    ADD CONSTRAINT "pe_term_sheet_rules_pe_term_sheet_id_fkey" FOREIGN KEY ("pe_term_sheet_id") REFERENCES "public"."pe_term_sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pe_term_sheets"
    ADD CONSTRAINT "pe_term_sheets_document_template_id_fkey" FOREIGN KEY ("document_template_id") REFERENCES "public"."document_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pricing_activity_log"
    ADD CONSTRAINT "pricing_activity_log_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pricing_activity_log"
    ADD CONSTRAINT "pricing_activity_log_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."loan_scenarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pricing_engine_inputs"
    ADD CONSTRAINT "pricing_engine_inputs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."pricing_engine_input_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_field_fkey" FOREIGN KEY ("field") REFERENCES "public"."pricing_engine_inputs"("id");



ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."pricing_engine_inputs"("id");



ALTER TABLE ONLY "public"."program_documents"
    ADD CONSTRAINT "program_documents_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_rows_ids"
    ADD CONSTRAINT "program_rows_ids_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property"
    ADD CONSTRAINT "property_hoa_contact_fkey" FOREIGN KEY ("hoa_contact") REFERENCES "public"."contact"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deal_property"
    ADD CONSTRAINT "public_deal_property_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_property"
    ADD CONSTRAINT "public_deal_property_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id");



ALTER TABLE ONLY "public"."role_assignments"
    ADD CONSTRAINT "role_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."role_assignments"
    ADD CONSTRAINT "role_assignments_role_type_id_fkey" FOREIGN KEY ("role_type_id") REFERENCES "public"."deal_role_types"("id");



ALTER TABLE ONLY "public"."scenario_program_results"
    ADD CONSTRAINT "scenario_program_results_loan_scenario_id_fkey" FOREIGN KEY ("loan_scenario_id") REFERENCES "public"."loan_scenarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenario_program_results"
    ADD CONSTRAINT "scenario_program_results_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."scenario_program_results"
    ADD CONSTRAINT "scenario_program_results_program_version_id_fkey" FOREIGN KEY ("program_version_id") REFERENCES "public"."program_rows_ids"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scenario_rate_options"
    ADD CONSTRAINT "scenario_rate_options_scenario_program_result_id_fkey" FOREIGN KEY ("scenario_program_result_id") REFERENCES "public"."scenario_program_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logic_actions"
    ADD CONSTRAINT "task_logic_actions_required_for_stage_id_fkey" FOREIGN KEY ("required_for_stage_id") REFERENCES "public"."deal_stages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_logic_actions"
    ADD CONSTRAINT "task_logic_actions_required_status_id_fkey" FOREIGN KEY ("required_status_id") REFERENCES "public"."task_statuses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_logic_actions"
    ADD CONSTRAINT "task_logic_actions_target_template_fkey" FOREIGN KEY ("target_task_template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_logic_actions"
    ADD CONSTRAINT "task_logic_actions_task_logic_id_fkey" FOREIGN KEY ("task_logic_id") REFERENCES "public"."task_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logic_conditions"
    ADD CONSTRAINT "task_logic_conditions_task_logic_id_fkey" FOREIGN KEY ("task_logic_id") REFERENCES "public"."task_logic"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logic"
    ADD CONSTRAINT "task_logic_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "public"."task_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_template_roles"
    ADD CONSTRAINT "task_template_roles_deal_role_type_id_fkey" FOREIGN KEY ("deal_role_type_id") REFERENCES "public"."deal_role_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_template_roles"
    ADD CONSTRAINT "task_template_roles_task_template_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "public"."task_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_button_action_id_fkey" FOREIGN KEY ("button_automation_id") REFERENCES "public"."automations"("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_deal_stage_id_fkey" FOREIGN KEY ("deal_stage_id") REFERENCES "public"."deal_stages"("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_default_priority_id_fkey" FOREIGN KEY ("default_priority_id") REFERENCES "public"."task_priorities"("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_default_status_id_fkey" FOREIGN KEY ("default_status_id") REFERENCES "public"."task_statuses"("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "term_sheet_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."term_sheets"
    ADD CONSTRAINT "term_sheets_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_categories_user_order"
    ADD CONSTRAINT "user_pref_document_categories_order_document_categories_id_fkey" FOREIGN KEY ("document_categories_id") REFERENCES "public"."document_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_execution_logs"
    ADD CONSTRAINT "workflow_execution_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "xactus_reports_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE CASCADE;



CREATE POLICY "All authenticated users can view active categories" ON "public"."document_categories" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Allow anon to read deal_users for realtime" ON "public"."deal_users" FOR SELECT USING (true);



CREATE POLICY "Allow anon to read llama_document_parsed" ON "public"."llama_document_parsed" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow authenticated users to read deal_role_types" ON "public"."deal_role_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read document_categories" ON "public"."document_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public read for theme lookup" ON "public"."organization_members" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Internal admins can manage categories" ON "public"."document_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "Internal admins can manage permissions" ON "public"."rbac_permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "Internal admins can view all organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ("public"."is_internal_admin"());



CREATE POLICY "Internal admins have full access to documents" ON "public"."document_files" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "Org admins can manage all template variables" ON "public"."document_template_variables" USING (("template_id" IN ( SELECT "tst"."id"
   FROM ("public"."document_templates" "tst"
     JOIN "public"."organization_members" "om" ON (("tst"."organization_id" = "om"."organization_id")))
  WHERE (("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("om"."clerk_org_role" = 'admin'::"text"))))) WITH CHECK (("template_id" IN ( SELECT "tst"."id"
   FROM ("public"."document_templates" "tst"
     JOIN "public"."organization_members" "om" ON (("tst"."organization_id" = "om"."organization_id")))
  WHERE (("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("om"."clerk_org_role" = 'admin'::"text")))));



CREATE POLICY "Org admins can manage all templates" ON "public"."document_templates" TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE (("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("om"."clerk_org_role" = 'admin'::"text"))))) WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE (("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("om"."clerk_org_role" = 'admin'::"text")))));



CREATE POLICY "Org admins can manage permissions" ON "public"."document_access_permissions" TO "authenticated" USING ((("clerk_org_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("auth"."jwt"() -> 'org_id'::"text"))::"text"))) AND "public"."is_org_admin"("clerk_org_id"))) WITH CHECK ((("clerk_org_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("auth"."jwt"() -> 'org_id'::"text"))::"text"))) AND "public"."is_org_admin"("clerk_org_id")));



CREATE POLICY "Org admins can manage themes" ON "public"."organization_themes" TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE (("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("om"."clerk_org_role" = 'admin'::"text"))))) WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE (("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("om"."clerk_org_role" = 'admin'::"text")))));



CREATE POLICY "Public can read organization themes" ON "public"."organization_themes" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Service role full access to deal_role_types" ON "public"."deal_role_types" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to document_access_permissions" ON "public"."document_access_permissions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to document_categories" ON "public"."document_categories" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to document_template_variables" ON "public"."document_template_variables" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to organization_themes" ON "public"."organization_themes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to organizations" ON "public"."organizations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to term_sheet_templates" ON "public"."document_templates" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create mentions" ON "public"."deal_comment_mentions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert activity logs for accessible loans" ON "public"."pricing_activity_log" FOR INSERT WITH CHECK (("loan_id" IN ( SELECT "deals"."id"
   FROM "public"."deals"
  WHERE ("deals"."organization_id" IN ( SELECT "organizations"."id"
           FROM "public"."organizations"
          WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'org_id'::"text")))))));



CREATE POLICY "Users can manage own templates" ON "public"."document_templates" TO "authenticated" USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))) WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can manage variables for own templates" ON "public"."document_template_variables" USING (("template_id" IN ( SELECT "document_templates"."id"
   FROM "public"."document_templates"
  WHERE ("document_templates"."user_id" = ("auth"."jwt"() ->> 'sub'::"text"))))) WITH CHECK (("template_id" IN ( SELECT "document_templates"."id"
   FROM "public"."document_templates"
  WHERE ("document_templates"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can read org permissions" ON "public"."document_access_permissions" FOR SELECT TO "authenticated" USING (("clerk_org_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("auth"."jwt"() -> 'org_id'::"text"))::"text"))));



CREATE POLICY "Users can read org templates" ON "public"."document_templates" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can read their org themes" ON "public"."organization_themes" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can read variables for org templates" ON "public"."document_template_variables" FOR SELECT USING (("template_id" IN ( SELECT "tst"."id"
   FROM ("public"."document_templates" "tst"
     JOIN "public"."organization_members" "om" ON (("tst"."organization_id" = "om"."organization_id")))
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))) WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view mentions on accessible comments" ON "public"."deal_comment_mentions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."deal_comments" "dc"
  WHERE ("dc"."id" = "deal_comment_mentions"."comment_id"))));



CREATE POLICY "Users can view their organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "organizations"."id") AND ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Users can view their own activity logs" ON "public"."pricing_activity_log" FOR SELECT USING ((("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")) OR ("loan_id" IN ( SELECT "deals"."id"
   FROM "public"."deals"
  WHERE ("deals"."assigned_to_user_id" ? (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text"))))));



CREATE POLICY "Users can view their own documents (placeholder)" ON "public"."document_files" FOR SELECT TO "authenticated" USING (("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "actions_select_authenticated" ON "public"."automations" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



ALTER TABLE "public"."ai_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_chats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_read_organizations" ON "public"."organizations" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select" ON "public"."deal_stepper" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select" ON "public"."input_stepper" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select" ON "public"."llama_document_chunks_vs" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_appraisal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_background" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_credit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."application_signings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications_emails_sent" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "applications_modify_org" ON "public"."applications" USING (true) WITH CHECK (true);



CREATE POLICY "applications_select_org" ON "public"."applications" FOR SELECT USING (true);



ALTER TABLE "public"."appraisal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_amcs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisal_amcs_delete" ON "public"."appraisal_amcs" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "appraisal_amcs_insert" ON "public"."appraisal_amcs" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "appraisal_amcs_select" ON "public"."appraisal_amcs" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "appraisal_amcs_update" ON "public"."appraisal_amcs" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



ALTER TABLE "public"."appraisal_borrowers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisal_delete" ON "public"."appraisal" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



ALTER TABLE "public"."appraisal_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisal_insert" ON "public"."appraisal" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."get_active_org_id"()));



ALTER TABLE "public"."appraisal_investor_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_lender_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_loan_type_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_occupancy_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_product_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_property_list" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisal_select" ON "public"."appraisal" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



ALTER TABLE "public"."appraisal_status_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisal_transaction_type_list" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisal_update" ON "public"."appraisal" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "authenticated_all" ON "public"."deal_stepper" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all" ON "public"."input_stepper" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search_bankruptcy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search_criminal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search_lien" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search_litigation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search_quick_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_person_search_ucc" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_report_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."background_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "background_reports_delete" ON "public"."background_reports" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "background_reports_insert" ON "public"."background_reports" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "background_reports_select" ON "public"."background_reports" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "background_reports_update" ON "public"."background_reports" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));



ALTER TABLE "public"."borrower_entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."borrowers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bra_delete" ON "public"."background_report_applications" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."background_reports" "br"
  WHERE (("br"."id" = "background_report_applications"."background_report_id") AND ("br"."organization_id" = "public"."get_active_org_id"())))));



CREATE POLICY "bra_insert" ON "public"."background_report_applications" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."background_reports" "br"
  WHERE (("br"."id" = "background_report_applications"."background_report_id") AND ("br"."organization_id" = "public"."get_active_org_id"())))));



CREATE POLICY "bra_select" ON "public"."background_report_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."background_reports" "br"
  WHERE (("br"."id" = "background_report_applications"."background_report_id") AND ("br"."organization_id" = "public"."get_active_org_id"())))));



ALTER TABLE "public"."brokers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "column_filters_read" ON "public"."organization_policies_column_filters" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "column_filters_service_role" ON "public"."organization_policies_column_filters" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."contact" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crdl_delete" ON "public"."credit_report_data_links" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_data_links"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));



CREATE POLICY "crdl_insert" ON "public"."credit_report_data_links" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_data_links"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));



CREATE POLICY "crdl_select" ON "public"."credit_report_data_links" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_data_links"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));



ALTER TABLE "public"."credit_report_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_report_chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_report_data_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_report_data_xactus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_report_user_chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_report_viewers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credit_report_viewers readable by owner/viewer" ON "public"."credit_report_viewers" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'service_role'::"text") OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")) OR ("added_by" = ("auth"."jwt"() ->> 'sub'::"text")) OR (EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_viewers"."report_id") AND (("auth"."jwt"() ->> 'sub'::"text") = ANY ("cr"."assigned_to")))))));



CREATE POLICY "credit_report_viewers service role all" ON "public"."credit_report_viewers" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."credit_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credit_reports owner or viewer select" ON "public"."credit_reports" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."jwt"() ->> 'sub'::"text") = ANY ("assigned_to")) OR (EXISTS ( SELECT 1
   FROM "public"."credit_report_viewers" "v"
  WHERE (("v"."report_id" = "credit_reports"."id") AND ("v"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "credit_reports service role all" ON "public"."credit_reports" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."custom_broker_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_widget_chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_widget_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_widgets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard_widgets_insert" ON "public"."dashboard_widgets" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



CREATE POLICY "dashboard_widgets_select" ON "public"."dashboard_widgets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard_widgets_update" ON "public"."dashboard_widgets" FOR UPDATE TO "authenticated" USING (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



ALTER TABLE "public"."deal_borrower" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_clerk_orgs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_comment_mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_comment_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_document_ai_chat" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_document_ai_condition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_document_ai_input" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_document_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_entity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_entity_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_guarantors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_inputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_property" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_role_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_signature_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deal_stages_select_authenticated" ON "public"."deal_stages" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



ALTER TABLE "public"."deal_stepper" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_stepper_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_task_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deal_task_events_select_authenticated" ON "public"."deal_task_events" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."deal_tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deal_tasks_select_authenticated" ON "public"."deal_tasks" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



ALTER TABLE "public"."deal_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."default_broker_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dfcr_delete" ON "public"."document_files_credit_reports" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "document_files_credit_reports"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));



CREATE POLICY "dfcr_insert" ON "public"."document_files_credit_reports" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "document_files_credit_reports"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));



CREATE POLICY "dfcr_select" ON "public"."document_files_credit_reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "document_files_credit_reports"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));



ALTER TABLE "public"."document_access_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_access_permissions_global" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_categories_user_order" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_file_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_background_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_borrowers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_clerk_orgs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_clerk_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_credit_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_files_deals_authenticated_select" ON "public"."document_files_deals" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "document_files_deals_internal_admin_delete" ON "public"."document_files_deals" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_files_deals_internal_admin_insert" ON "public"."document_files_deals" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_files_deals_internal_admin_update" ON "public"."document_files_deals" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_files_deals_service_role_all" ON "public"."document_files_deals" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."document_files_entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_files_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_logic" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_logic_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_logic_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_roles_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_template_variables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_type_ai_condition" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_type_ai_condition_authenticated_select" ON "public"."document_type_ai_condition" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "document_type_ai_condition_internal_admin_delete" ON "public"."document_type_ai_condition" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_type_ai_condition_internal_admin_insert" ON "public"."document_type_ai_condition" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_type_ai_condition_internal_admin_update" ON "public"."document_type_ai_condition" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."document_type_ai_input" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_type_ai_input_authenticated_select" ON "public"."document_type_ai_input" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "document_type_ai_input_internal_admin_delete" ON "public"."document_type_ai_input" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_type_ai_input_internal_admin_insert" ON "public"."document_type_ai_input" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_type_ai_input_internal_admin_update" ON "public"."document_type_ai_input" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."document_type_ai_input_order" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_type_ai_input_order_authenticated_select" ON "public"."document_type_ai_input_order" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "document_type_ai_input_order_internal_admin_delete" ON "public"."document_type_ai_input_order" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_type_ai_input_order_internal_admin_insert" ON "public"."document_type_ai_input_order" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_type_ai_input_order_internal_admin_update" ON "public"."document_type_ai_input_order" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."document_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_types_authenticated_select" ON "public"."document_types" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



CREATE POLICY "document_types_internal_admin_delete" ON "public"."document_types" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_types_internal_admin_insert" ON "public"."document_types" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "document_types_internal_admin_update" ON "public"."document_types" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "dwc_delete" ON "public"."dashboard_widget_conversations" FOR DELETE TO "authenticated" USING (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



CREATE POLICY "dwc_insert" ON "public"."dashboard_widget_conversations" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



CREATE POLICY "dwc_select" ON "public"."dashboard_widget_conversations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dwch_delete" ON "public"."dashboard_widget_chats" FOR DELETE TO "authenticated" USING (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



CREATE POLICY "dwch_insert" ON "public"."dashboard_widget_chats" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



CREATE POLICY "dwch_select" ON "public"."dashboard_widget_chats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dwch_update" ON "public"."dashboard_widget_chats" FOR UPDATE TO "authenticated" USING (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"])))) WITH CHECK (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));



ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guarantor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."input_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "input_categories_authenticated_select" ON "public"."input_categories" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



CREATE POLICY "input_categories_internal_admin_delete" ON "public"."input_categories" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "input_categories_internal_admin_insert" ON "public"."input_categories" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "input_categories_internal_admin_update" ON "public"."input_categories" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."input_logic" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."input_logic_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."input_logic_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."input_stepper" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inputs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inputs_authenticated_select" ON "public"."inputs" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



CREATE POLICY "inputs_internal_admin_delete" ON "public"."inputs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "inputs_internal_admin_insert" ON "public"."inputs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "inputs_internal_admin_update" ON "public"."inputs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."integration_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_settings_admin_delete" ON "public"."integration_settings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("u"."is_internal_yn" = true)))));



CREATE POLICY "integration_settings_admin_insert" ON "public"."integration_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("u"."is_internal_yn" = true)))));



CREATE POLICY "integration_settings_admin_update" ON "public"."integration_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("u"."is_internal_yn" = true)))));



CREATE POLICY "integration_settings_select" ON "public"."integration_settings" FOR SELECT USING (true);



ALTER TABLE "public"."integration_setup" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_setup_delete" ON "public"."integration_setup" FOR DELETE USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "integration_setup_insert" ON "public"."integration_setup" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "integration_setup_select" ON "public"."integration_setup" FOR SELECT USING (((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")) AND ("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "integration_setup_update" ON "public"."integration_setup" FOR UPDATE USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



ALTER TABLE "public"."integration_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_tags_admin_delete" ON "public"."integration_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("u"."is_internal_yn" = true)))));



CREATE POLICY "integration_tags_admin_insert" ON "public"."integration_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("u"."is_internal_yn" = true)))));



CREATE POLICY "integration_tags_admin_update" ON "public"."integration_tags" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("u"."is_internal_yn" = true)))));



CREATE POLICY "integration_tags_select" ON "public"."integration_tags" FOR SELECT USING (true);



ALTER TABLE "public"."landing_page_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llama_document_chunks_vs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llama_document_parsed" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loan_scenario_inputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loan_scenarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "members_internal_admins" ON "public"."organization_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "members_service_role" ON "public"."organization_members" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "members_view_own" ON "public"."organization_members" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



ALTER TABLE "public"."n8n_chat_histories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "named_scope_tables_read" ON "public"."organization_policy_named_scope_tables" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "named_scope_tables_service" ON "public"."organization_policy_named_scope_tables" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "named_scopes_read" ON "public"."organization_policy_named_scopes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "named_scopes_service" ON "public"."organization_policy_named_scopes" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_delete" ON "public"."application_appraisal" FOR DELETE USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_delete" ON "public"."application_background" FOR DELETE USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_delete" ON "public"."application_credit" FOR DELETE USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_insert" ON "public"."application_appraisal" FOR INSERT WITH CHECK (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_insert" ON "public"."application_background" FOR INSERT WITH CHECK (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_insert" ON "public"."application_credit" FOR INSERT WITH CHECK (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_policy_delete" ON "public"."ai_chat_messages" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."ai_chats" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."application_signings" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."applications" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'applications'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'applications'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."applications_emails_sent" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'applications_emails_sent'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."appraisal" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."borrower_entities" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."borrowers" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."brokers" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'brokers'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'brokers'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."contact" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'contact'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."credit_report_chat_messages" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."credit_report_chats" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."credit_report_data_xactus" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."credit_report_user_chats" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."credit_report_viewers" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."credit_reports" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."custom_broker_settings" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_borrower" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_clerk_orgs" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_comment_mentions" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_comment_reads" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_comments" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_entity" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_entity_owners" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_guarantors" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_inputs" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_property" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_role_types" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'deal_role_types'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."deal_roles" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1)))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deal_signature_requests" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."deals" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deals'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deals'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."default_broker_settings" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_access_permissions" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_access_permissions_global" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_access_permissions_global'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."document_categories" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_categories'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."document_categories_user_order" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_files" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_files_borrowers" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_files_clerk_orgs" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_files_clerk_users" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_files_entities" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_files_tags" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_roles" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_roles'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."document_roles_files" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_roles_files'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."document_tags" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."document_template_variables" FOR DELETE USING (("public"."check_org_access"('table'::"text", 'document_template_variables'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."document_templates" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."entities" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'entities'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entities'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."entity_owners" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."guarantor" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'guarantor'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."llama_document_chunks_vs" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'llama_document_chunks_vs'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."loan_scenarios" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."loans" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'loans'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loans'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."n8n_chat_histories" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'n8n_chat_histories'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."notifications" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'notifications'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'notifications'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."organization_themes" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."pricing_activity_log" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."program_documents" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'program_documents'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."program_documents_chunks_vs" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'program_documents_chunks_vs'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."programs" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'programs'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'programs'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_delete" ON "public"."property" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'property'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."rbac_permissions" FOR DELETE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'rbac_permissions'::"text", 'delete'::"text"))."allowed");



CREATE POLICY "org_policy_delete" ON "public"."term_sheets" FOR DELETE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'delete'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'delete'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."ai_chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."ai_chats" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."application_signings" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'applications'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'applications'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."applications_emails_sent" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'applications_emails_sent'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."appraisal" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."borrower_entities" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."borrowers" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."brokers" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'brokers'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'brokers'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."contact" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'contact'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."credit_report_chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."credit_report_chats" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."credit_report_data_xactus" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."credit_report_user_chats" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."credit_report_viewers" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."credit_reports" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."custom_broker_settings" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_borrower" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_clerk_orgs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_comment_mentions" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_comment_reads" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_comments" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'insert'::"text"))."scope", ("deal_id")::"uuid")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_entity" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_entity_owners" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_guarantors" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_inputs" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_property" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_role_types" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'deal_role_types'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."deal_roles" FOR INSERT WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1)))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'insert'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_insert" ON "public"."deal_signature_requests" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."deals" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'deals'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deals'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."default_broker_settings" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_access_permissions" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_access_permissions_global" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'document_access_permissions_global'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."document_categories" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'document_categories'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."document_categories_user_order" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_files" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_files_borrowers" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_files_clerk_orgs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_files_clerk_users" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_files_entities" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_files_tags" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_roles" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'document_roles'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."document_roles_files" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'document_roles_files'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."document_tags" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."document_template_variables" FOR INSERT WITH CHECK (("public"."check_org_access"('table'::"text", 'document_template_variables'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."document_templates" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."entities" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'entities'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entities'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."entity_owners" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."guarantor" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'guarantor'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."llama_document_chunks_vs" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'llama_document_chunks_vs'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."loan_scenarios" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."loans" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'loans'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loans'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."n8n_chat_histories" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'n8n_chat_histories'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'notifications'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'notifications'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."organization_themes" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."pricing_activity_log" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."program_documents" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'program_documents'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."program_documents_chunks_vs" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'program_documents_chunks_vs'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."programs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'programs'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'programs'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_insert" ON "public"."property" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'property'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."rbac_permissions" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_org_access"('table'::"text", 'rbac_permissions'::"text", 'insert'::"text"))."allowed");



CREATE POLICY "org_policy_insert" ON "public"."term_sheets" FOR INSERT TO "authenticated" WITH CHECK ((("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'insert'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'insert'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."ai_chat_messages" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."ai_chats" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."application_signings" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."applications" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'applications'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'applications'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."applications_emails_sent" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'applications_emails_sent'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."appraisal" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."borrower_entities" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."borrowers" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."brokers" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'brokers'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'brokers'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."contact" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'contact'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."credit_report_chat_messages" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."credit_report_chats" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."credit_report_data_xactus" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."credit_report_user_chats" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."credit_report_viewers" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."credit_reports" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."custom_broker_settings" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."deal_borrower" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_clerk_orgs" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."deal_comment_mentions" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."deal_comment_reads" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."deal_comments" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'select'::"text"))."scope", ("deal_id")::"uuid")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_entity" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_entity_owners" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_guarantors" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_inputs" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_property" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_role_types" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'deal_role_types'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."deal_roles" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1)))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'select'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_select" ON "public"."deal_signature_requests" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."deals" FOR SELECT USING ((("public"."check_org_access"('table'::"text", 'deals'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deals'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deals'::"text", 'select'::"text"))."scope", "id")
END));



CREATE POLICY "org_policy_select" ON "public"."default_broker_settings" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_access_permissions" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_access_permissions_global" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_access_permissions_global'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."document_categories" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_categories'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."document_categories_user_order" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_files" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_files_borrowers" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_files_clerk_orgs" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_files_clerk_users" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_files_entities" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_files_tags" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_roles" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_roles'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."document_roles_files" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_roles_files'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."document_tags" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."document_template_variables" FOR SELECT USING (("public"."check_org_access"('table'::"text", 'document_template_variables'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."document_templates" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."entities" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'entities'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entities'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."entity_owners" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."guarantor" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'guarantor'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."llama_document_chunks_vs" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'llama_document_chunks_vs'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."loan_scenarios" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."loans" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'loans'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loans'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."n8n_chat_histories" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'n8n_chat_histories'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'notifications'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'notifications'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."organization_themes" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."pricing_activity_log" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."program_documents" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'program_documents'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."program_documents_chunks_vs" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'program_documents_chunks_vs'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."programs" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'programs'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'programs'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_select" ON "public"."property" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'property'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."rbac_permissions" FOR SELECT TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'rbac_permissions'::"text", 'select'::"text"))."allowed");



CREATE POLICY "org_policy_select" ON "public"."term_sheets" FOR SELECT TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'select'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'select'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."ai_chat_messages" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chat_messages'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."ai_chats" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'ai_chats'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."application_signings" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'application_signings'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "application_signings"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."applications" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'applications'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'applications'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'applications'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'applications'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."applications_emails_sent" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'applications_emails_sent'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'applications_emails_sent'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."appraisal" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "appraisal"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'appraisal'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."borrower_entities" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrower_entities'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."borrowers" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'borrowers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."brokers" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'brokers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'brokers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'brokers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'brokers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."contact" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'contact'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'contact'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."credit_report_chat_messages" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chat_messages'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."credit_report_chats" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_chats'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."credit_report_data_xactus" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_data_xactus'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."credit_report_user_chats" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_user_chats'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_user_chats"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."credit_report_viewers" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_report_viewers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."credit_reports"
      WHERE (("credit_reports"."id" = "credit_report_viewers"."report_id") AND ("credit_reports"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."credit_reports" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'credit_reports'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."custom_broker_settings" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'custom_broker_settings'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."deal_borrower" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_borrower"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_borrower'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_clerk_orgs" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_clerk_orgs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."deal_comment_mentions" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_mentions'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("mentioned_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."deal_comment_reads" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comment_reads'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."deal_comments" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = ("deal_comments"."deal_id")::"uuid") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("author_clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_comments'::"text", 'update'::"text"))."scope", ("deal_id")::"uuid")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_entity" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_entity'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_entity_owners" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_entity_owners"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_entity_owners'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_guarantors" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_guarantors"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_guarantors'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_inputs" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_inputs"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_inputs'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_property" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_property"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_property'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_role_types" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'deal_role_types'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'deal_role_types'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."deal_roles" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."deals"
      WHERE (("deals"."id" = "deal_roles"."deal_id") AND ("deals"."organization_id" = "public"."get_active_org_id"())))) OR ("users_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1)))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deal_roles'::"text", 'update'::"text"))."scope", "deal_id")
END));



CREATE POLICY "org_policy_update" ON "public"."deal_signature_requests" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deal_signature_requests'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."deals" FOR UPDATE USING ((("public"."check_org_access"('table'::"text", 'deals'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'deals'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE "public"."check_named_scope_from_scope_string"(("public"."check_org_access"('table'::"text", 'deals'::"text", 'update'::"text"))."scope", "id")
END));



CREATE POLICY "org_policy_update" ON "public"."default_broker_settings" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'default_broker_settings'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_access_permissions" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_access_permissions'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("updated_by_clerk_sub" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_access_permissions_global" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_access_permissions_global'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'document_access_permissions_global'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."document_categories" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_categories'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'document_categories'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."document_categories_user_order" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_categories_user_order'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_files" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("uploaded_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_files_borrowers" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_borrowers'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_files_clerk_orgs" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_orgs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("clerk_org_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("clerk_org_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_files_clerk_users" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_clerk_users'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("clerk_user_id" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_files_entities" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_entities'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_files_tags" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_files_tags'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_roles" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_roles'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'document_roles'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."document_roles_files" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'document_roles_files'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'document_roles_files'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."document_tags" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'document_tags'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    WHEN 'org_and_user'::"text" THEN ("created_by" = ( SELECT "users"."id"
       FROM "public"."users"
      WHERE ("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
     LIMIT 1))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."document_template_variables" FOR UPDATE USING (("public"."check_org_access"('table'::"text", 'document_template_variables'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'document_template_variables'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."document_templates" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheet_templates'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."entities" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'entities'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entities'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'entities'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entities'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."entity_owners" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'entity_owners'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."guarantor" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'guarantor'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'guarantor'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."llama_document_chunks_vs" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'llama_document_chunks_vs'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'llama_document_chunks_vs'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."loan_scenarios" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loan_scenarios'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("created_by" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("created_by" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."loans" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'loans'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loans'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'loans'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'loans'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN (("organization_id" = "public"."get_active_org_id"()) OR ("primary_user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."n8n_chat_histories" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'n8n_chat_histories'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'n8n_chat_histories'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'notifications'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'notifications'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'notifications'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'notifications'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."organization_themes" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'organization_themes'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'user_records'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    WHEN 'org_and_user'::"text" THEN ("organization_id" = "public"."get_active_org_id"())
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."pricing_activity_log" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'pricing_activity_log'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ((EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "pricing_activity_log"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"())))) OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."program_documents" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'program_documents'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'program_documents'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."program_documents_chunks_vs" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'program_documents_chunks_vs'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'program_documents_chunks_vs'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."programs" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'programs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'programs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'programs'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'programs'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN true
    WHEN 'user_records'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    WHEN 'org_and_user'::"text" THEN ("user_id" = ("auth"."jwt"() ->> 'sub'::"text"))
    ELSE false
END));



CREATE POLICY "org_policy_update" ON "public"."property" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'property'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'property'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."rbac_permissions" FOR UPDATE TO "authenticated" USING (("public"."check_org_access"('table'::"text", 'rbac_permissions'::"text", 'update'::"text"))."allowed") WITH CHECK (("public"."check_org_access"('table'::"text", 'rbac_permissions'::"text", 'update'::"text"))."allowed");



CREATE POLICY "org_policy_update" ON "public"."term_sheets" FOR UPDATE TO "authenticated" USING ((("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END)) WITH CHECK ((("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'update'::"text"))."allowed" AND
CASE ("public"."check_org_access"('table'::"text", 'term_sheets'::"text", 'update'::"text"))."scope"
    WHEN 'all'::"text" THEN true
    WHEN 'org_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'user_records'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    WHEN 'org_and_user'::"text" THEN (EXISTS ( SELECT 1
       FROM "public"."loans"
      WHERE (("loans"."id" = "term_sheets"."loan_id") AND ("loans"."organization_id" = "public"."get_active_org_id"()))))
    ELSE false
END));



CREATE POLICY "org_select" ON "public"."application_appraisal" FOR SELECT USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_select" ON "public"."application_background" FOR SELECT USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_select" ON "public"."application_credit" FOR SELECT USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_update" ON "public"."application_appraisal" FOR UPDATE USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_update" ON "public"."application_background" FOR UPDATE USING (("organization_id" = "public"."get_active_org_id"()));



CREATE POLICY "org_update" ON "public"."application_credit" FOR UPDATE USING (("organization_id" = "public"."get_active_org_id"()));



ALTER TABLE "public"."organization_account_managers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_member_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_policies_column_filters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organization_policies_delete_admin_or_owner" ON "public"."organization_policies" FOR DELETE TO "authenticated" USING ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"()))));



CREATE POLICY "organization_policies_insert_admin_or_owner" ON "public"."organization_policies" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"()))));



CREATE POLICY "organization_policies_read_own_org" ON "public"."organization_policies" FOR SELECT TO "authenticated" USING (((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")) AND (("org_id" = "public"."get_active_org_id"()) OR ("org_id" IS NULL))));



CREATE POLICY "organization_policies_update_admin_or_owner" ON "public"."organization_policies" FOR UPDATE TO "authenticated" USING ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"())))) WITH CHECK ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"()))));



ALTER TABLE "public"."organization_policy_named_scope_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_policy_named_scopes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgs_internal_admins" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "orgs_service_role" ON "public"."organizations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "orgs_view_where_member" ON "public"."organizations" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "pe_input_categories_authenticated_select" ON "public"."pricing_engine_input_categories" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



CREATE POLICY "pe_input_categories_internal_admin_delete" ON "public"."pricing_engine_input_categories" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "pe_input_categories_internal_admin_insert" ON "public"."pricing_engine_input_categories" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "pe_input_categories_internal_admin_update" ON "public"."pricing_engine_input_categories" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."pe_input_logic" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pe_input_logic_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pe_input_logic_conditions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pe_inputs_authenticated_select" ON "public"."pricing_engine_inputs" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



CREATE POLICY "pe_inputs_internal_admin_delete" ON "public"."pricing_engine_inputs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "pe_inputs_internal_admin_insert" ON "public"."pricing_engine_inputs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



CREATE POLICY "pe_inputs_internal_admin_update" ON "public"."pricing_engine_inputs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));



ALTER TABLE "public"."pe_section_button_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pe_section_buttons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pe_term_sheet_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pe_term_sheet_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pe_term_sheets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_engine_input_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_engine_inputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_documents_chunks_vs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_rows_ids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rbac_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenario_program_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenario_rate_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_logic" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_logic_actions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_logic_actions_select_authenticated" ON "public"."task_logic_actions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."task_logic_conditions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_logic_conditions_select_authenticated" ON "public"."task_logic_conditions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "task_logic_select_authenticated" ON "public"."task_logic" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."task_priorities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_priorities_select_authenticated" ON "public"."task_priorities" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."task_statuses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_statuses_select_authenticated" ON "public"."task_statuses" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."task_template_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_templates_select_authenticated" ON "public"."task_templates" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));



ALTER TABLE "public"."term_sheets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_deal_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_deal_access_self" ON "public"."user_deal_access" FOR SELECT TO "authenticated" USING (("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "user_deal_access_service" ON "public"."user_deal_access" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_execution_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflow_execution_logs_select" ON "public"."workflow_execution_logs" FOR SELECT TO "authenticated" USING (("execution_id" IN ( SELECT "workflow_executions"."id"
   FROM "public"."workflow_executions"
  WHERE ("workflow_executions"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflow_executions_select" ON "public"."workflow_executions" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



ALTER TABLE "public"."workflow_nodes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_create_ai_input_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_create_ai_input_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_create_ai_input_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_guarantor_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_guarantor_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_guarantor_emails"() TO "service_role";



GRANT ALL ON FUNCTION "public"."borrowers_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."borrowers_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."borrowers_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_deal_document"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_deal_document"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_deal_document"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_deal_document_by_code"("p_deal_id" "uuid", "p_document_category_code" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_deal_document_by_code"("p_deal_id" "uuid", "p_document_category_code" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_deal_document_by_code"("p_deal_id" "uuid", "p_document_category_code" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_document"("p_document_file_id" bigint, "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_document"("p_document_file_id" bigint, "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_document"("p_document_file_id" bigint, "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_org_resource"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cascade_archive"() TO "anon";
GRANT ALL ON FUNCTION "public"."cascade_archive"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cascade_archive"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_named_scope"("p_scope_name" "text", "p_anchor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_named_scope"("p_scope_name" "text", "p_anchor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_named_scope"("p_scope_name" "text", "p_anchor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_named_scope_from_scope_string"("p_scope" "text", "p_anchor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_named_scope_from_scope_string"("p_scope" "text", "p_anchor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_named_scope_from_scope_string"("p_scope" "text", "p_anchor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_org_access"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_org_access"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_org_access"("p_resource_type" "text", "p_resource_name" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_org_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_org_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_org_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_org_theme"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_org_theme"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_org_theme"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_document_with_deal_link"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_file_type" "text", "p_file_size" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_document_with_deal_link"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_file_type" "text", "p_file_size" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_document_with_deal_link"("p_deal_id" "uuid", "p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_file_type" "text", "p_file_size" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_document_with_subject_link"("p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_subject_type" "text", "p_subject_id" "uuid", "p_file_type" "text", "p_file_size" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_document_with_subject_link"("p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_subject_type" "text", "p_subject_id" "uuid", "p_file_type" "text", "p_file_size" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_document_with_subject_link"("p_document_category_id" bigint, "p_document_name" "text", "p_original_filename" "text", "p_storage_bucket" "text", "p_subject_type" "text", "p_subject_id" "uuid", "p_file_type" "text", "p_file_size" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_orphaned_credit_report_chat"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_orphaned_credit_report_chat"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_orphaned_credit_report_chat"() TO "service_role";



GRANT ALL ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_chat"("p_report_id" "uuid", "p_org_id" "uuid", "p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."entities_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."entities_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."entities_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("query" "text", "params" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("query" "text", "params" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("query" "text", "params" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fail_stale_llama_document_parsed"() TO "anon";
GRANT ALL ON FUNCTION "public"."fail_stale_llama_document_parsed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fail_stale_llama_document_parsed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_document_upload"("p_document_file_id" bigint, "p_file_size" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_document_upload"("p_document_file_id" bigint, "p_file_size" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_document_upload"("p_document_file_id" bigint, "p_file_size" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_application_display_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_application_display_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_application_display_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_loan_display_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_loan_display_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_loan_display_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_tag_slug"("tag_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_tag_slug"("tag_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_tag_slug"("tag_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_clerk_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_clerk_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_clerk_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "service_role";



GRANT ALL ON TABLE "public"."document_files" TO "anon";
GRANT ALL ON TABLE "public"."document_files" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_deal_documents"("p_deal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_deal_documents"("p_deal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_deal_documents"("p_deal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_node_last_output"("p_workflow_id" "uuid", "p_node_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_node_last_output"("p_workflow_id" "uuid", "p_node_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_node_last_output"("p_workflow_id" "uuid", "p_node_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_primary_key_column"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_primary_key_column"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_primary_key_column"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_table_names"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_table_names"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_table_names"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_property_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_property_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_property_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_default_integrations_for_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_default_integrations_for_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_default_integrations_for_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_internal_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_internal_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_internal_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_owner"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_owner"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_owner"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_public_functions"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_public_functions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_public_functions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."list_public_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_public_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_public_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."list_table_columns"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."list_table_columns"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_table_columns"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_program_chunks"("p_program_id" "uuid", "p_query_embedding" "public"."vector", "p_match_count" integer, "p_min_cosine_sim" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_program_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_program_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_program_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_background_report_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_background_report_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_background_report_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_n8n_on_document_file_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_n8n_on_document_file_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_n8n_on_document_file_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."register_integration_feature_policy"() TO "anon";
GRANT ALL ON FUNCTION "public"."register_integration_feature_policy"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_integration_feature_policy"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_on_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_on_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_custom_broker_settings_on_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_programs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_programs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_programs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_application_from_primary_scenario"("p_loan_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_del"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_del"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_del"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_ins"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_ins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_assigned_from_viewers_ins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_borrower_to_entity_owners"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_borrower_to_entity_owners"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_borrower_to_entity_owners"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_primary_scenario_from_application"("p_loan_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_stepper_on_dropdown_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_stepper_on_dropdown_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_stepper_on_dropdown_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_deal_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_deal_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_deal_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_viewers_from_credit_reports"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_viewers_from_credit_reports"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_viewers_from_credit_reports"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_ai_chat_last_used"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_ai_chat_last_used"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_ai_chat_last_used"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_credit_report_chat_last_used"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_credit_report_chat_last_used"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_credit_report_chat_last_used"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_applications_sync_from_primary_scenario"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_from_primary_scenario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_from_primary_scenario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_applications_sync_primary_scenario"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_primary_scenario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_applications_sync_primary_scenario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_guarantors"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_guarantors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_guarantors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_property"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_property"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_property"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_loan_scenarios_sync_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_loan_scenarios_sync_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_loan_scenarios_sync_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_deal_signature_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_deal_signature_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_deal_signature_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_deal_guarantors_array"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_deal_guarantors_array"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_deal_guarantors_array"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_document_file_status_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_document_file_status_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_document_file_status_assignment"() TO "service_role";



GRANT ALL ON TABLE "public"."automations" TO "anon";
GRANT ALL ON TABLE "public"."automations" TO "authenticated";
GRANT ALL ON TABLE "public"."automations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_chats" TO "anon";
GRANT ALL ON TABLE "public"."ai_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chats" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."application_appraisal" TO "anon";
GRANT ALL ON TABLE "public"."application_appraisal" TO "authenticated";
GRANT ALL ON TABLE "public"."application_appraisal" TO "service_role";



GRANT ALL ON TABLE "public"."application_background" TO "anon";
GRANT ALL ON TABLE "public"."application_background" TO "authenticated";
GRANT ALL ON TABLE "public"."application_background" TO "service_role";



GRANT ALL ON TABLE "public"."application_credit" TO "anon";
GRANT ALL ON TABLE "public"."application_credit" TO "authenticated";
GRANT ALL ON TABLE "public"."application_credit" TO "service_role";



GRANT ALL ON TABLE "public"."application_signings" TO "anon";
GRANT ALL ON TABLE "public"."application_signings" TO "authenticated";
GRANT ALL ON TABLE "public"."application_signings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."application_signings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."application_signings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."application_signings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."applications_emails_sent" TO "anon";
GRANT ALL ON TABLE "public"."applications_emails_sent" TO "authenticated";
GRANT ALL ON TABLE "public"."applications_emails_sent" TO "service_role";



GRANT ALL ON SEQUENCE "public"."applications_emails_sent_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."applications_emails_sent_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."applications_emails_sent_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal" TO "anon";
GRANT ALL ON TABLE "public"."appraisal" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_amcs" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_amcs" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_amcs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_amcs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_amcs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_amcs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_borrowers" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_borrowers" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_borrowers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_borrowers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_borrowers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_borrowers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_documents" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_documents_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_investor_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_investor_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_investor_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_investor_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_investor_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_investor_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_lender_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_lender_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_lender_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_lender_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_lender_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_lender_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_loan_type_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_loan_type_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_loan_type_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_loan_type_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_loan_type_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_loan_type_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_occupancy_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_occupancy_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_occupancy_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_occupancy_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_occupancy_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_occupancy_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_product_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_product_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_product_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_product_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_product_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_product_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_property_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_property_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_property_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_property_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_property_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_property_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_status_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_status_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_status_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_status_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_status_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_status_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appraisal_transaction_type_list" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_transaction_type_list" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_transaction_type_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appraisal_transaction_type_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appraisal_transaction_type_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appraisal_transaction_type_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search_lien" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search_lien" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search_lien" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_people_search_lien_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_people_search_lien_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_people_search_lien_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search_ucc" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search_ucc" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search_ucc" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_people_search_ucc_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_people_search_ucc_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_people_search_ucc_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search_bankruptcy" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search_bankruptcy" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search_bankruptcy" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_person_search_bankruptcy_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_person_search_bankruptcy_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_person_search_bankruptcy_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search_criminal" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search_criminal" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search_criminal" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_person_search_criminal_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_person_search_criminal_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_person_search_criminal_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_person_search_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_person_search_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_person_search_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search_litigation" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search_litigation" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search_litigation" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_person_search_litigation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_person_search_litigation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_person_search_litigation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_person_search_quick_analysis" TO "anon";
GRANT ALL ON TABLE "public"."background_person_search_quick_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."background_person_search_quick_analysis" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_person_search_quick_analysis_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_person_search_quick_analysis_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_person_search_quick_analysis_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_report_applications" TO "anon";
GRANT ALL ON TABLE "public"."background_report_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."background_report_applications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."background_report_applications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."background_report_applications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."background_report_applications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."background_reports" TO "anon";
GRANT ALL ON TABLE "public"."background_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."background_reports" TO "service_role";



GRANT ALL ON TABLE "public"."borrower_entities" TO "anon";
GRANT ALL ON TABLE "public"."borrower_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."borrower_entities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."borrowers_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."borrowers_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."borrowers_seq" TO "service_role";



GRANT ALL ON TABLE "public"."borrowers" TO "anon";
GRANT ALL ON TABLE "public"."borrowers" TO "authenticated";
GRANT ALL ON TABLE "public"."borrowers" TO "service_role";



GRANT ALL ON TABLE "public"."brokers" TO "anon";
GRANT ALL ON TABLE "public"."brokers" TO "authenticated";
GRANT ALL ON TABLE "public"."brokers" TO "service_role";



GRANT ALL ON TABLE "public"."contact" TO "anon";
GRANT ALL ON TABLE "public"."contact" TO "authenticated";
GRANT ALL ON TABLE "public"."contact" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contact_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contact_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contact_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_chats" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_chats" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_data_links" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_data_links" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_data_links" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_report_data_links_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_report_data_links_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_report_data_links_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_data_xactus" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_data_xactus" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_data_xactus" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_user_chats" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_user_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_user_chats" TO "service_role";



GRANT ALL ON TABLE "public"."credit_report_viewers" TO "anon";
GRANT ALL ON TABLE "public"."credit_report_viewers" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_report_viewers" TO "service_role";



GRANT ALL ON TABLE "public"."credit_reports" TO "anon";
GRANT ALL ON TABLE "public"."credit_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_reports" TO "service_role";



GRANT ALL ON TABLE "public"."custom_broker_settings" TO "anon";
GRANT ALL ON TABLE "public"."custom_broker_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_broker_settings" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_widget_chats" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_widget_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_widget_chats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dashboard_widget_chats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dashboard_widget_chats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dashboard_widget_chats_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_widget_conversations" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_widget_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_widget_conversations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dashboard_widget_conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dashboard_widget_conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dashboard_widget_conversations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_widgets" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_widgets" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_widgets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dashboard_widgets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dashboard_widgets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dashboard_widgets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_borrower" TO "anon";
GRANT ALL ON TABLE "public"."deal_borrower" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_borrower" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_borrower_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_borrower_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_borrower_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."deal_calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_calendar_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_calendar_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_calendar_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_calendar_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_clerk_orgs" TO "anon";
GRANT ALL ON TABLE "public"."deal_clerk_orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_clerk_orgs" TO "service_role";



GRANT ALL ON TABLE "public"."deal_comment_mentions" TO "anon";
GRANT ALL ON TABLE "public"."deal_comment_mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_comment_mentions" TO "service_role";



GRANT ALL ON TABLE "public"."deal_comment_reads" TO "anon";
GRANT ALL ON TABLE "public"."deal_comment_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_comment_reads" TO "service_role";



GRANT ALL ON TABLE "public"."deal_comments" TO "anon";
GRANT ALL ON TABLE "public"."deal_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_comments" TO "service_role";



GRANT ALL ON TABLE "public"."deal_document_ai_chat" TO "anon";
GRANT ALL ON TABLE "public"."deal_document_ai_chat" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_document_ai_chat" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_document_ai_chat_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_document_ai_chat_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_document_ai_chat_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_document_ai_condition" TO "anon";
GRANT ALL ON TABLE "public"."deal_document_ai_condition" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_document_ai_condition" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_document_ai_condition_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_document_ai_condition_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_document_ai_condition_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_document_ai_input" TO "anon";
GRANT ALL ON TABLE "public"."deal_document_ai_input" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_document_ai_input" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_document_ai_input_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_document_ai_input_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_document_ai_input_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_document_overrides" TO "anon";
GRANT ALL ON TABLE "public"."deal_document_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_document_overrides" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_document_overrides_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_document_overrides_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_document_overrides_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_documents" TO "anon";
GRANT ALL ON TABLE "public"."deal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_entity" TO "anon";
GRANT ALL ON TABLE "public"."deal_entity" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_entity" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_entity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_entity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_entity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_entity_owners" TO "anon";
GRANT ALL ON TABLE "public"."deal_entity_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_entity_owners" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_entity_owners_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_entity_owners_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_entity_owners_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_guarantors" TO "anon";
GRANT ALL ON TABLE "public"."deal_guarantors" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_guarantors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_guarantors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_guarantors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_guarantors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_inputs" TO "anon";
GRANT ALL ON TABLE "public"."deal_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_inputs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_inputs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_inputs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_inputs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_property" TO "anon";
GRANT ALL ON TABLE "public"."deal_property" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_property" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_property_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_property_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_property_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_role_types" TO "anon";
GRANT ALL ON TABLE "public"."deal_role_types" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_role_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_role_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_role_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_role_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_roles" TO "anon";
GRANT ALL ON TABLE "public"."deal_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_signature_requests" TO "anon";
GRANT ALL ON TABLE "public"."deal_signature_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_signature_requests" TO "service_role";



GRANT ALL ON TABLE "public"."deal_stages" TO "anon";
GRANT ALL ON TABLE "public"."deal_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_stages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_stages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_stages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_stages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_stepper" TO "anon";
GRANT ALL ON TABLE "public"."deal_stepper" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_stepper" TO "service_role";



GRANT ALL ON TABLE "public"."deal_stepper_history" TO "anon";
GRANT ALL ON TABLE "public"."deal_stepper_history" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_stepper_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_stepper_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_stepper_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_stepper_history_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_stepper_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_stepper_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_stepper_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_task_events" TO "anon";
GRANT ALL ON TABLE "public"."deal_task_events" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_task_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_task_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_task_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_task_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_tasks" TO "anon";
GRANT ALL ON TABLE "public"."deal_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_tasks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deal_users" TO "anon";
GRANT ALL ON TABLE "public"."deal_users" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deal_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deal_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deal_users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deals_clerk_orgs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deals_clerk_orgs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deals_clerk_orgs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."default_broker_settings" TO "anon";
GRANT ALL ON TABLE "public"."default_broker_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."default_broker_settings" TO "service_role";



GRANT ALL ON TABLE "public"."document_access_permissions" TO "anon";
GRANT ALL ON TABLE "public"."document_access_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_access_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."document_access_permissions_global" TO "anon";
GRANT ALL ON TABLE "public"."document_access_permissions_global" TO "authenticated";
GRANT ALL ON TABLE "public"."document_access_permissions_global" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_access_permissions_global_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_access_permissions_global_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_access_permissions_global_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_access_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_access_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_access_permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_categories" TO "anon";
GRANT ALL ON TABLE "public"."document_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."document_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_categories_user_order" TO "anon";
GRANT ALL ON TABLE "public"."document_categories_user_order" TO "authenticated";
GRANT ALL ON TABLE "public"."document_categories_user_order" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_categories_user_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_categories_user_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_categories_user_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_file_statuses" TO "anon";
GRANT ALL ON TABLE "public"."document_file_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."document_file_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_file_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_file_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_file_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_background_reports" TO "anon";
GRANT ALL ON TABLE "public"."document_files_background_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_background_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_background_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_background_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_background_reports_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_borrowers" TO "anon";
GRANT ALL ON TABLE "public"."document_files_borrowers" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_borrowers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_borrowers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_borrowers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_borrowers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_clerk_orgs" TO "anon";
GRANT ALL ON TABLE "public"."document_files_clerk_orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_clerk_orgs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_clerk_orgs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_clerk_orgs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_clerk_orgs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_clerk_users" TO "anon";
GRANT ALL ON TABLE "public"."document_files_clerk_users" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_clerk_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_clerk_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_clerk_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_clerk_users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_credit_reports" TO "anon";
GRANT ALL ON TABLE "public"."document_files_credit_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_credit_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_credit_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_credit_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_credit_reports_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_deals" TO "anon";
GRANT ALL ON TABLE "public"."document_files_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_deals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_deals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_deals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_deals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_entities" TO "anon";
GRANT ALL ON TABLE "public"."document_files_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_entities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_entities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_entities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_entities_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_files_tags" TO "anon";
GRANT ALL ON TABLE "public"."document_files_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."document_files_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_files_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_files_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_files_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_logic" TO "anon";
GRANT ALL ON TABLE "public"."document_logic" TO "authenticated";
GRANT ALL ON TABLE "public"."document_logic" TO "service_role";



GRANT ALL ON TABLE "public"."document_logic_actions" TO "anon";
GRANT ALL ON TABLE "public"."document_logic_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_logic_actions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_logic_actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_logic_actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_logic_actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_logic_conditions" TO "anon";
GRANT ALL ON TABLE "public"."document_logic_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_logic_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_logic_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_logic_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_logic_conditions_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_logic_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_logic_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_logic_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."llama_document_parsed" TO "anon";
GRANT ALL ON TABLE "public"."llama_document_parsed" TO "authenticated";
GRANT ALL ON TABLE "public"."llama_document_parsed" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_parsed_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_parsed_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_parsed_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_roles" TO "anon";
GRANT ALL ON TABLE "public"."document_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."document_roles" TO "service_role";



GRANT ALL ON TABLE "public"."document_roles_files" TO "anon";
GRANT ALL ON TABLE "public"."document_roles_files" TO "authenticated";
GRANT ALL ON TABLE "public"."document_roles_files" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_roles_files_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_roles_files_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_roles_files_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_status" TO "anon";
GRANT ALL ON TABLE "public"."document_status" TO "authenticated";
GRANT ALL ON TABLE "public"."document_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_tags" TO "anon";
GRANT ALL ON TABLE "public"."document_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."document_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_template_variables" TO "anon";
GRANT ALL ON TABLE "public"."document_template_variables" TO "authenticated";
GRANT ALL ON TABLE "public"."document_template_variables" TO "service_role";



GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."document_type_ai_condition" TO "anon";
GRANT ALL ON TABLE "public"."document_type_ai_condition" TO "authenticated";
GRANT ALL ON TABLE "public"."document_type_ai_condition" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_type_ai_condition_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_type_ai_condition_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_type_ai_condition_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_type_ai_input" TO "anon";
GRANT ALL ON TABLE "public"."document_type_ai_input" TO "authenticated";
GRANT ALL ON TABLE "public"."document_type_ai_input" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_type_ai_input_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_type_ai_input_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_type_ai_input_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_type_ai_input_order" TO "anon";
GRANT ALL ON TABLE "public"."document_type_ai_input_order" TO "authenticated";
GRANT ALL ON TABLE "public"."document_type_ai_input_order" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_type_ai_input_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_type_ai_input_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_type_ai_input_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_types" TO "anon";
GRANT ALL ON TABLE "public"."document_types" TO "authenticated";
GRANT ALL ON TABLE "public"."document_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."program_documents_chunks_vs" TO "anon";
GRANT ALL ON TABLE "public"."program_documents_chunks_vs" TO "authenticated";
GRANT ALL ON TABLE "public"."program_documents_chunks_vs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."email_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."email_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."email_templates_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."entities_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."entities_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."entities_seq" TO "service_role";



GRANT ALL ON TABLE "public"."entities" TO "anon";
GRANT ALL ON TABLE "public"."entities" TO "authenticated";
GRANT ALL ON TABLE "public"."entities" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."entities_view" TO "anon";
GRANT ALL ON TABLE "public"."entities_view" TO "authenticated";
GRANT ALL ON TABLE "public"."entities_view" TO "service_role";



GRANT ALL ON TABLE "public"."entity_owners" TO "anon";
GRANT ALL ON TABLE "public"."entity_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_owners" TO "service_role";



GRANT ALL ON TABLE "public"."guarantor" TO "anon";
GRANT ALL ON TABLE "public"."guarantor" TO "authenticated";
GRANT ALL ON TABLE "public"."guarantor" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guarantor_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guarantor_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guarantor_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."input_categories" TO "anon";
GRANT ALL ON TABLE "public"."input_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."input_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."input_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."input_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."input_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."input_logic" TO "anon";
GRANT ALL ON TABLE "public"."input_logic" TO "authenticated";
GRANT ALL ON TABLE "public"."input_logic" TO "service_role";



GRANT ALL ON TABLE "public"."input_logic_actions" TO "anon";
GRANT ALL ON TABLE "public"."input_logic_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."input_logic_actions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."input_logic_actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."input_logic_actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."input_logic_actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."input_logic_conditions" TO "anon";
GRANT ALL ON TABLE "public"."input_logic_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."input_logic_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."input_logic_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."input_logic_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."input_logic_conditions_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."input_logic_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."input_logic_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."input_logic_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."input_stepper" TO "anon";
GRANT ALL ON TABLE "public"."input_stepper" TO "authenticated";
GRANT ALL ON TABLE "public"."input_stepper" TO "service_role";



GRANT ALL ON SEQUENCE "public"."input_stepper_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."input_stepper_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."input_stepper_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inputs" TO "anon";
GRANT ALL ON TABLE "public"."inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."inputs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inputs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inputs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inputs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integration_settings" TO "anon";
GRANT ALL ON TABLE "public"."integration_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integration_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integration_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integration_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integration_setup" TO "anon";
GRANT ALL ON TABLE "public"."integration_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_setup" TO "service_role";



GRANT ALL ON TABLE "public"."integration_tags" TO "anon";
GRANT ALL ON TABLE "public"."integration_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integration_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integration_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integration_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."landing_page_templates" TO "anon";
GRANT ALL ON TABLE "public"."landing_page_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."landing_page_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."landing_page_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."landing_page_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."landing_page_templates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."llama_document_chunks_vs" TO "anon";
GRANT ALL ON TABLE "public"."llama_document_chunks_vs" TO "authenticated";
GRANT ALL ON TABLE "public"."llama_document_chunks_vs" TO "service_role";



GRANT ALL ON TABLE "public"."loan_scenario_inputs" TO "anon";
GRANT ALL ON TABLE "public"."loan_scenario_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."loan_scenario_inputs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."loan_scenario_inputs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."loan_scenario_inputs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."loan_scenario_inputs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."loan_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."loan_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."loan_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."loans" TO "anon";
GRANT ALL ON TABLE "public"."loans" TO "authenticated";
GRANT ALL ON TABLE "public"."loans" TO "service_role";



GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "anon";
GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "authenticated";
GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organization_account_managers" TO "anon";
GRANT ALL ON TABLE "public"."organization_account_managers" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_account_managers" TO "service_role";



GRANT ALL ON TABLE "public"."organization_member_roles" TO "anon";
GRANT ALL ON TABLE "public"."organization_member_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_member_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."organization_member_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_member_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_member_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organization_policies" TO "anon";
GRANT ALL ON TABLE "public"."organization_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_policies" TO "service_role";



GRANT ALL ON TABLE "public"."organization_policies_column_filters" TO "anon";
GRANT ALL ON TABLE "public"."organization_policies_column_filters" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_policies_column_filters" TO "service_role";



GRANT ALL ON TABLE "public"."organization_policy_named_scope_tables" TO "anon";
GRANT ALL ON TABLE "public"."organization_policy_named_scope_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_policy_named_scope_tables" TO "service_role";



GRANT ALL ON TABLE "public"."organization_policy_named_scopes" TO "anon";
GRANT ALL ON TABLE "public"."organization_policy_named_scopes" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_policy_named_scopes" TO "service_role";



GRANT ALL ON TABLE "public"."organization_themes" TO "anon";
GRANT ALL ON TABLE "public"."organization_themes" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_themes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."organizations_org_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organizations_org_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organizations_org_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."pe_input_logic" TO "anon";
GRANT ALL ON TABLE "public"."pe_input_logic" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_input_logic" TO "service_role";



GRANT ALL ON TABLE "public"."pe_input_logic_actions" TO "anon";
GRANT ALL ON TABLE "public"."pe_input_logic_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_input_logic_actions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_input_logic_actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_input_logic_actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_input_logic_actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pe_input_logic_conditions" TO "anon";
GRANT ALL ON TABLE "public"."pe_input_logic_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_input_logic_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_input_logic_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_input_logic_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_input_logic_conditions_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_input_logic_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_input_logic_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_input_logic_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pe_section_button_actions" TO "anon";
GRANT ALL ON TABLE "public"."pe_section_button_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_section_button_actions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_section_button_actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_section_button_actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_section_button_actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pe_section_buttons" TO "anon";
GRANT ALL ON TABLE "public"."pe_section_buttons" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_section_buttons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_section_buttons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_section_buttons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_section_buttons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pe_term_sheet_conditions" TO "anon";
GRANT ALL ON TABLE "public"."pe_term_sheet_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_term_sheet_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_term_sheet_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_term_sheet_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_term_sheet_conditions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pe_term_sheet_rules" TO "anon";
GRANT ALL ON TABLE "public"."pe_term_sheet_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_term_sheet_rules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_term_sheet_rules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_term_sheet_rules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_term_sheet_rules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pe_term_sheets" TO "anon";
GRANT ALL ON TABLE "public"."pe_term_sheets" TO "authenticated";
GRANT ALL ON TABLE "public"."pe_term_sheets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pe_term_sheets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pe_term_sheets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pe_term_sheets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."pricing_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_engine_input_categories" TO "anon";
GRANT ALL ON TABLE "public"."pricing_engine_input_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_engine_input_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pricing_engine_input_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pricing_engine_input_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pricing_engine_input_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_engine_inputs" TO "anon";
GRANT ALL ON TABLE "public"."pricing_engine_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_engine_inputs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pricing_engine_inputs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pricing_engine_inputs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pricing_engine_inputs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."program_conditions" TO "anon";
GRANT ALL ON TABLE "public"."program_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."program_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."program_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."program_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."program_conditions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."program_documents" TO "anon";
GRANT ALL ON TABLE "public"."program_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."program_documents" TO "service_role";



GRANT ALL ON TABLE "public"."program_rows_ids" TO "anon";
GRANT ALL ON TABLE "public"."program_rows_ids" TO "authenticated";
GRANT ALL ON TABLE "public"."program_rows_ids" TO "service_role";



GRANT ALL ON SEQUENCE "public"."program_rows_ids_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."program_rows_ids_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."program_rows_ids_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."property" TO "anon";
GRANT ALL ON TABLE "public"."property" TO "authenticated";
GRANT ALL ON TABLE "public"."property" TO "service_role";



GRANT ALL ON SEQUENCE "public"."property_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."property_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."property_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rbac_permissions" TO "anon";
GRANT ALL ON TABLE "public"."rbac_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."rbac_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rbac_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rbac_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rbac_permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_assignments" TO "anon";
GRANT ALL ON TABLE "public"."role_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."role_assignments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_assignments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."scenario_program_results" TO "anon";
GRANT ALL ON TABLE "public"."scenario_program_results" TO "authenticated";
GRANT ALL ON TABLE "public"."scenario_program_results" TO "service_role";



GRANT ALL ON SEQUENCE "public"."scenario_program_results_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."scenario_program_results_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scenario_program_results_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."scenario_rate_options" TO "anon";
GRANT ALL ON TABLE "public"."scenario_rate_options" TO "authenticated";
GRANT ALL ON TABLE "public"."scenario_rate_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."scenario_rate_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."scenario_rate_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scenario_rate_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_logic" TO "anon";
GRANT ALL ON TABLE "public"."task_logic" TO "authenticated";
GRANT ALL ON TABLE "public"."task_logic" TO "service_role";



GRANT ALL ON TABLE "public"."task_logic_actions" TO "anon";
GRANT ALL ON TABLE "public"."task_logic_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."task_logic_actions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_logic_actions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_logic_actions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_logic_actions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_logic_conditions" TO "anon";
GRANT ALL ON TABLE "public"."task_logic_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."task_logic_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_logic_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_logic_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_logic_conditions_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_logic_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_logic_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_logic_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_priorities" TO "anon";
GRANT ALL ON TABLE "public"."task_priorities" TO "authenticated";
GRANT ALL ON TABLE "public"."task_priorities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_priorities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_priorities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_priorities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_statuses" TO "anon";
GRANT ALL ON TABLE "public"."task_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."task_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_template_roles" TO "anon";
GRANT ALL ON TABLE "public"."task_template_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."task_template_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_template_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_template_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_template_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_templates" TO "anon";
GRANT ALL ON TABLE "public"."task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_templates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."term_sheets" TO "anon";
GRANT ALL ON TABLE "public"."term_sheets" TO "authenticated";
GRANT ALL ON TABLE "public"."term_sheets" TO "service_role";



GRANT ALL ON TABLE "public"."user_deal_access" TO "anon";
GRANT ALL ON TABLE "public"."user_deal_access" TO "authenticated";
GRANT ALL ON TABLE "public"."user_deal_access" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v_brokers_with_manager_names" TO "anon";
GRANT ALL ON TABLE "public"."v_brokers_with_manager_names" TO "authenticated";
GRANT ALL ON TABLE "public"."v_brokers_with_manager_names" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_execution_logs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_execution_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_execution_logs" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_nodes" TO "anon";
GRANT ALL ON TABLE "public"."workflow_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_nodes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







