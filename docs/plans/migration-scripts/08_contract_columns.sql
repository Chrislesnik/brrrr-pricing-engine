-- ============================================================================
-- PHASE 3: NON-ADDITIVE COLUMN CHANGES ON EXISTING TABLES
-- Column drops, renames, and type changes
-- WARNING: These are destructive operations
-- ============================================================================

-- Table: credit_reports - DROP COLUMNS
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "aggregator_id";
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "bucket";
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "metadata";
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "storage_path";

-- Table: custom_broker_settings - DROP COLUMNS
ALTER TABLE "public"."custom_broker_settings" DROP COLUMN IF EXISTS "broker_id";

-- Table: document_templates - DROP COLUMNS
ALTER TABLE "public"."document_templates" DROP COLUMN IF EXISTS "craft_json";

-- Table: document_templates - COLUMN CHANGES
-- Column: id
--   PROD: "uuid" NOT NULL
--   DEV:  "uuid" DEFAULT "gen_random_uuid"() NOT NULL
ALTER TABLE "public"."document_templates" ALTER COLUMN "id" SET DEFAULT "gen_random_uuid"();

-- Table: entities - DROP COLUMNS
ALTER TABLE "public"."entities" DROP COLUMN IF EXISTS "account_balances";
ALTER TABLE "public"."entities" DROP COLUMN IF EXISTS "bank_name";

-- Table: loan_scenarios - DROP COLUMNS
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "borrower_entity_id";
-- Staging fix: drop trigger that references this column before dropping it
DROP TRIGGER IF EXISTS "trg_validate_borrower_ids" ON "public"."loan_scenarios";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "guarantor_borrower_ids";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "guarantor_emails";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "guarantor_names";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "inputs";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "selected";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "user_id";

-- Table: loans - DROP COLUMNS
-- Staging fix: drop RLS policy that references this column before dropping it  
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loans' AND qual::text LIKE '%assigned_to_user_id%';
  IF FOUND THEN
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident((SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loans' AND qual::text LIKE '%assigned_to_user_id%' LIMIT 1)) || ' ON "public"."loans"';
  END IF;
END $$;
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "assigned_to_user_id";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "borrower_first_name";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "borrower_last_name";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "inputs";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "loan_amount";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "loan_type";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "meta";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "program_id";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "property_address";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "rate";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "selected";
ALTER TABLE "public"."loans" DROP COLUMN IF EXISTS "transaction_type";

-- Table: loans - COLUMN CHANGES
-- Column: status
--   PROD: "text"
--   DEV:  "text" DEFAULT 'active'::"text"
ALTER TABLE "public"."loans" ALTER COLUMN "status" SET DEFAULT 'active'::"text";

-- Table: organization_members - DROP COLUMNS
ALTER TABLE "public"."organization_members" DROP COLUMN IF EXISTS "role";

-- Table: organization_themes - COLUMN CHANGES
-- Column: theme_dark
--   PROD: "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
--   DEV:  "jsonb" NOT NULL
ALTER TABLE "public"."organization_themes" ALTER COLUMN "theme_dark" DROP DEFAULT;
-- Column: theme_light
--   PROD: "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
--   DEV:  "jsonb" NOT NULL
ALTER TABLE "public"."organization_themes" ALTER COLUMN "theme_light" DROP DEFAULT;

-- Table: programs - DROP COLUMNS
ALTER TABLE "public"."programs" DROP COLUMN IF EXISTS "loan_type";
ALTER TABLE "public"."programs" DROP COLUMN IF EXISTS "organization_id";
