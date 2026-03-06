-- ============================================================================
-- PHASE 1: ADDITIVE COLUMN CHANGES ON EXISTING TABLES
-- These ADD new columns without affecting existing columns
-- ============================================================================

-- Table: ai_chats
ALTER TABLE "public"."ai_chats" ADD COLUMN IF NOT EXISTS "loan_type" "text";
ALTER TABLE "public"."ai_chats" ADD COLUMN IF NOT EXISTS "program_id" "uuid";

-- Table: applications
ALTER TABLE "public"."applications" ADD COLUMN IF NOT EXISTS "display_id" "text";
UPDATE "public"."applications" SET "display_id" = 'APP-' || "loan_id" WHERE "display_id" IS NULL;
ALTER TABLE "public"."applications" ALTER COLUMN "display_id" SET NOT NULL;
ALTER TABLE "public"."applications" ADD COLUMN IF NOT EXISTS "external_defaults" "jsonb" DEFAULT '{}'::"jsonb";
ALTER TABLE "public"."applications" ADD COLUMN IF NOT EXISTS "form_data" "jsonb" DEFAULT '{}'::"jsonb";
ALTER TABLE "public"."applications" ADD COLUMN IF NOT EXISTS "merged_data" "jsonb" DEFAULT '{}'::"jsonb";

-- Table: borrowers
ALTER TABLE "public"."borrowers" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."borrowers" ADD COLUMN IF NOT EXISTS "archived_by" "text";

-- Table: credit_reports
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "archived_by" "text";
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "data" "jsonb";
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "equifax_score" integer;
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "experian_score" integer;
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "mid_score" integer;
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "pull_type" "text";
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "report_date" timestamp with time zone;
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "report_id" "text";
ALTER TABLE "public"."credit_reports" ADD COLUMN IF NOT EXISTS "transunion_score" integer;

-- Table: custom_broker_settings
ALTER TABLE "public"."custom_broker_settings" ADD COLUMN IF NOT EXISTS "broker_org_id" "uuid";
UPDATE "public"."custom_broker_settings" SET "broker_org_id" = "broker_id" WHERE "broker_org_id" IS NULL;
ALTER TABLE "public"."custom_broker_settings" ALTER COLUMN "broker_org_id" SET NOT NULL;

-- Table: document_templates
ALTER TABLE "public"."document_templates" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."document_templates" ADD COLUMN IF NOT EXISTS "archived_by" "text";
ALTER TABLE "public"."document_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT "now"() NOT NULL;
ALTER TABLE "public"."document_templates" ADD COLUMN IF NOT EXISTS "gjs_data" "jsonb";
UPDATE "public"."document_templates" SET "gjs_data" = '{}' WHERE "gjs_data" IS NULL;
ALTER TABLE "public"."document_templates" ALTER COLUMN "gjs_data" SET NOT NULL;
ALTER TABLE "public"."document_templates" ADD COLUMN IF NOT EXISTS "html_content" "text" DEFAULT ''::"text" NOT NULL;
ALTER TABLE "public"."document_templates" ADD COLUMN IF NOT EXISTS "user_id" "text";
UPDATE "public"."document_templates" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "public"."document_templates" ALTER COLUMN "user_id" SET NOT NULL;

-- Table: entities
ALTER TABLE "public"."entities" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."entities" ADD COLUMN IF NOT EXISTS "archived_by" "text";

-- Table: loan_scenarios
ALTER TABLE "public"."loan_scenarios" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."loan_scenarios" ADD COLUMN IF NOT EXISTS "archived_by" "text";
ALTER TABLE "public"."loan_scenarios" ADD COLUMN IF NOT EXISTS "created_by" "text";
ALTER TABLE "public"."loan_scenarios" ADD COLUMN IF NOT EXISTS "selected_rate_option_id" bigint;

-- Table: loans
ALTER TABLE "public"."loans" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."loans" ADD COLUMN IF NOT EXISTS "archived_by" "text";
ALTER TABLE "public"."loans" ADD COLUMN IF NOT EXISTS "display_id" "text";
UPDATE "public"."loans" SET "display_id" = "loan_id" WHERE "display_id" IS NULL;
ALTER TABLE "public"."loans" ALTER COLUMN "display_id" SET NOT NULL;

-- Table: organization_members
ALTER TABLE "public"."organization_members" ADD COLUMN IF NOT EXISTS "clerk_member_role" "text";
ALTER TABLE "public"."organization_members" ADD COLUMN IF NOT EXISTS "clerk_org_role" "text" DEFAULT 'member'::"text" NOT NULL;

-- Table: organizations
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "is_internal_yn" boolean;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "org_id" bigint DEFAULT "nextval"('"public"."organizations_org_id_seq"'::"regclass") NOT NULL;
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "whitelabel_logo_dark_url" "text";
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "whitelabel_logo_light_url" "text";
ALTER TABLE "public"."organizations" ADD COLUMN IF NOT EXISTS "whitelabel_logo_url" "text";

-- Table: programs
ALTER TABLE "public"."programs" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
ALTER TABLE "public"."programs" ADD COLUMN IF NOT EXISTS "archived_by" "text";

-- Table: users
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "activated_date" "date";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "avatar_url" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "cell_phone" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "clerk_username" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "contact_id" bigint;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "create_organization_enabled" boolean DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "deactivation_date" "date";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "delete_self_enabled" boolean DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "email" character varying(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "full_name" "text" GENERATED ALWAYS AS (TRIM(BOTH FROM ((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text")))) STORED;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "has_image" boolean DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "image_url" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "invitation_date" "date";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_active_yn" boolean DEFAULT true;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_banned" boolean DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_internal_yn" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_locked" boolean DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "last_active_at" timestamp with time zone;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "last_sign_in_at" timestamp with time zone;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "legal_accepted_at" timestamp with time zone;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "office_phone" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "office_phone_extension" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "personal_role" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "phone_number" "text";
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text");
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "website" "text";
