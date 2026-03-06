-- =============================================================================
-- Phase 1: New Tables (DEV-only, not present in PROD)
-- Extracted from dev_schema.sql
-- Total new tables: 134
-- =============================================================================
SET search_path TO public, extensions;

-- Table: document_files
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

-- Table: automations
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

-- Table: app_settings
CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text"
);

-- Table: application_appraisal
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

-- Table: application_background
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

-- Table: application_credit
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

-- Table: appraisal
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

-- Table: appraisal_amcs
CREATE TABLE IF NOT EXISTS "public"."appraisal_amcs" (
    "id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_borrowers
CREATE TABLE IF NOT EXISTS "public"."appraisal_borrowers" (
    "id" bigint NOT NULL,
    "appraisal_id" bigint NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Table: appraisal_documents
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

-- Table: appraisal_investor_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_investor_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "investor_id" "text",
    "investor_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_lender_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_lender_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "lender_id" "text",
    "lender_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_loan_type_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_loan_type_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "loan_type_id" "text",
    "loan_type_name" "text",
    "other" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_occupancy_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_occupancy_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "occupancy_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_product_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_product_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "product_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_property_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_property_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "property_id" "text",
    "property_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: appraisal_status_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_status_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "status_id" "text",
    "status_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision_requested" boolean DEFAULT false
);

-- Table: appraisal_transaction_type_list
CREATE TABLE IF NOT EXISTS "public"."appraisal_transaction_type_list" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint,
    "transaction_type_name" "text",
    "transaction_type_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: background_person_search_lien
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

-- Table: background_person_search_ucc
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

-- Table: background_person_search
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

-- Table: background_person_search_bankruptcy
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

-- Table: background_person_search_criminal
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

-- Table: background_person_search_litigation
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

-- Table: background_person_search_quick_analysis
CREATE TABLE IF NOT EXISTS "public"."background_person_search_quick_analysis" (
    "id" bigint NOT NULL,
    "background_person_search_id" bigint,
    "record_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: background_report_applications
CREATE TABLE IF NOT EXISTS "public"."background_report_applications" (
    "id" bigint NOT NULL,
    "background_report_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: background_reports
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

-- Table: contact
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

-- Table: credit_report_data_links
CREATE TABLE IF NOT EXISTS "public"."credit_report_data_links" (
    "id" bigint NOT NULL,
    "credit_report_id" "uuid" NOT NULL,
    "aggregator" "text" DEFAULT 'xactus'::"text" NOT NULL,
    "aggregator_data_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: credit_report_data_xactus
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

-- Table: dashboard_widget_chats
CREATE TABLE IF NOT EXISTS "public"."dashboard_widget_chats" (
    "id" bigint NOT NULL,
    "dashboard_widget_id" bigint NOT NULL,
    "name" "text" DEFAULT 'New chat'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: dashboard_widget_conversations
CREATE TABLE IF NOT EXISTS "public"."dashboard_widget_conversations" (
    "id" bigint NOT NULL,
    "dashboard_widget_id" bigint NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dashboard_widget_chat_id" bigint NOT NULL,
    CONSTRAINT "dashboard_widget_conversations_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);

-- Table: dashboard_widgets
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

-- Table: deal_borrower
CREATE TABLE IF NOT EXISTS "public"."deal_borrower" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "vesting_type" "text",
    "deal_entity_id" bigint NOT NULL,
    "deal_guarantor_ids" bigint[] DEFAULT '{}'::bigint[]
);

-- Table: deal_calendar_events
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

-- Table: deal_clerk_orgs
CREATE TABLE IF NOT EXISTS "public"."deal_clerk_orgs" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "clerk_org_id" "uuid" NOT NULL
);

-- Table: deal_comment_mentions
CREATE TABLE IF NOT EXISTS "public"."deal_comment_mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "mentioned_user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: deal_comment_reads
CREATE TABLE IF NOT EXISTS "public"."deal_comment_reads" (
    "deal_id" "text" NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: deal_comments
CREATE TABLE IF NOT EXISTS "public"."deal_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "text" NOT NULL,
    "author_clerk_user_id" "text" NOT NULL,
    "author_name" "text" NOT NULL,
    "author_avatar_url" "text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: deal_document_ai_chat
CREATE TABLE IF NOT EXISTS "public"."deal_document_ai_chat" (
    "id" bigint NOT NULL,
    "deal_document_id" bigint,
    "user_id" "text",
    "user_type" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "citations" "jsonb"
);

-- Table: deal_document_ai_condition
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

-- Table: deal_document_ai_input
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

-- Table: deal_document_overrides
CREATE TABLE IF NOT EXISTS "public"."deal_document_overrides" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "document_type_id" bigint NOT NULL,
    "is_visible_override" boolean,
    "is_required_override" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: deal_documents
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

-- Table: deal_entity
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

-- Table: deal_entity_owners
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

-- Table: deal_guarantors
CREATE TABLE IF NOT EXISTS "public"."deal_guarantors" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "guarantor_id" bigint NOT NULL,
    "is_primary" boolean DEFAULT false,
    "display_order" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Table: deal_inputs
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

-- Table: deal_property
CREATE TABLE IF NOT EXISTS "public"."deal_property" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "property_id" bigint NOT NULL
);

-- Table: deal_role_types
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

-- Table: deal_roles
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

-- Table: deal_signature_requests
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

-- Table: deal_stages
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

-- Table: deal_stepper
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

-- Table: deal_stepper_history
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

-- Table: deal_task_events
CREATE TABLE IF NOT EXISTS "public"."deal_task_events" (
    "id" bigint NOT NULL,
    "deal_task_id" bigint NOT NULL,
    "event_type" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "performed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: deal_tasks
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

-- Table: deal_users
CREATE TABLE IF NOT EXISTS "public"."deal_users" (
    "id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: deals
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

-- Table: document_access_permissions
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

-- Table: document_access_permissions_global
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

-- Table: document_categories
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

-- Table: document_categories_user_order
CREATE TABLE IF NOT EXISTS "public"."document_categories_user_order" (
    "id" bigint NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "document_categories_id" bigint NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Table: document_file_statuses
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

-- Table: document_files_background_reports
CREATE TABLE IF NOT EXISTS "public"."document_files_background_reports" (
    "id" bigint NOT NULL,
    "document_file_id" bigint,
    "background_report_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text"
);

-- Table: document_files_borrowers
CREATE TABLE IF NOT EXISTS "public"."document_files_borrowers" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "borrower_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);

-- Table: document_files_clerk_orgs
CREATE TABLE IF NOT EXISTS "public"."document_files_clerk_orgs" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "clerk_org_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);

-- Table: document_files_clerk_users
CREATE TABLE IF NOT EXISTS "public"."document_files_clerk_users" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "clerk_user_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);

-- Table: document_files_credit_reports
CREATE TABLE IF NOT EXISTS "public"."document_files_credit_reports" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "credit_report_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);

-- Table: document_files_deals
CREATE TABLE IF NOT EXISTS "public"."document_files_deals" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "source_table" "text" DEFAULT 'document_files'::"text" NOT NULL,
    "source_pk" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: document_files_entities
CREATE TABLE IF NOT EXISTS "public"."document_files_entities" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);

-- Table: document_files_tags
CREATE TABLE IF NOT EXISTS "public"."document_files_tags" (
    "id" bigint NOT NULL,
    "document_file_id" bigint NOT NULL,
    "document_tag_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint
);

-- Table: document_logic
CREATE TABLE IF NOT EXISTS "public"."document_logic" (
    "id" bigint NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: document_logic_actions
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

-- Table: document_logic_conditions
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

-- Table: llama_document_parsed
CREATE TABLE IF NOT EXISTS "public"."llama_document_parsed" (
    "id" bigint NOT NULL,
    "document_id" bigint,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "llama_id" "text",
    "llama_project_id" "text"
);

-- Table: document_roles
CREATE TABLE IF NOT EXISTS "public"."document_roles" (
    "id" bigint NOT NULL,
    "role_name" "text" NOT NULL
);

-- Table: document_roles_files
CREATE TABLE IF NOT EXISTS "public"."document_roles_files" (
    "id" bigint NOT NULL,
    "document_files_id" bigint NOT NULL,
    "document_roles_id" bigint NOT NULL
);

-- Table: document_status
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

-- Table: document_tags
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

-- Table: document_template_variables
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

-- Table: document_type_ai_condition
CREATE TABLE IF NOT EXISTS "public"."document_type_ai_condition" (
    "id" bigint NOT NULL,
    "document_type" bigint,
    "condition_label" "text",
    "ai_prompt" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: document_type_ai_input
CREATE TABLE IF NOT EXISTS "public"."document_type_ai_input" (
    "id" bigint NOT NULL,
    "document_type_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ai_prompt" "text",
    "input_id" bigint
);

-- Table: document_type_ai_input_order
CREATE TABLE IF NOT EXISTS "public"."document_type_ai_input_order" (
    "id" bigint NOT NULL,
    "document_type_ai_input_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);

-- Table: document_types
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

-- Table: email_templates
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

-- Table: guarantor
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

-- Table: input_categories
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

-- Table: input_logic
CREATE TABLE IF NOT EXISTS "public"."input_logic" (
    "id" bigint NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: input_logic_actions
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

-- Table: input_logic_conditions
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

-- Table: input_stepper
CREATE TABLE IF NOT EXISTS "public"."input_stepper" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "step_order" "text"[],
    "input_id" bigint
);

-- Table: inputs
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

-- Table: integration_settings
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

-- Table: integration_setup
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

-- Table: integration_tags
CREATE TABLE IF NOT EXISTS "public"."integration_tags" (
    "id" bigint NOT NULL,
    "integration_settings_id" bigint NOT NULL,
    "tag" "text" NOT NULL
);

-- Table: landing_page_templates
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

-- Table: llama_document_chunks_vs
CREATE TABLE IF NOT EXISTS "public"."llama_document_chunks_vs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: loan_scenario_inputs
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

-- Table: notifications
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

-- Table: organization_account_managers
CREATE TABLE IF NOT EXISTS "public"."organization_account_managers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "account_manager_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: organization_member_roles
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

-- Table: organization_policies
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

-- Table: organization_policies_column_filters
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

-- Table: organization_policy_named_scope_tables
CREATE TABLE IF NOT EXISTS "public"."organization_policy_named_scope_tables" (
    "scope_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "fk_column" "text" NOT NULL,
    "notes" "text"
);

-- Table: organization_policy_named_scopes
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

-- Table: pe_input_logic
CREATE TABLE IF NOT EXISTS "public"."pe_input_logic" (
    "id" bigint NOT NULL,
    "type" "text" DEFAULT 'AND'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: pe_input_logic_actions
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

-- Table: pe_input_logic_conditions
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

-- Table: pe_section_button_actions
CREATE TABLE IF NOT EXISTS "public"."pe_section_button_actions" (
    "id" integer NOT NULL,
    "button_id" integer NOT NULL,
    "action_type" "text" NOT NULL,
    "action_uuid" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_section_button_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['google_maps'::"text", 'workflow'::"text"])))
);

-- Table: pe_section_buttons
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

-- Table: pe_term_sheet_conditions
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

-- Table: pe_term_sheet_rules
CREATE TABLE IF NOT EXISTS "public"."pe_term_sheet_rules" (
    "id" bigint NOT NULL,
    "pe_term_sheet_id" bigint NOT NULL,
    "logic_type" "text" DEFAULT 'AND'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_term_sheet_rules_logic_type_check" CHECK (("logic_type" = ANY (ARRAY['AND'::"text", 'OR'::"text"])))
);

-- Table: pe_term_sheets
CREATE TABLE IF NOT EXISTS "public"."pe_term_sheets" (
    "id" bigint NOT NULL,
    "document_template_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pe_term_sheets_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);

-- Table: pricing_engine_input_categories
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

-- Table: pricing_engine_inputs
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

-- Table: program_conditions
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

-- Table: program_rows_ids
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

-- Table: property
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

-- Table: rbac_permissions
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

-- Table: role_assignments
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

-- Table: scenario_program_results
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

-- Table: scenario_rate_options
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

-- Table: task_logic
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

-- Table: task_logic_actions
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

-- Table: task_logic_conditions
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

-- Table: task_priorities
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

-- Table: task_statuses
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

-- Table: task_template_roles
CREATE TABLE IF NOT EXISTS "public"."task_template_roles" (
    "id" bigint NOT NULL,
    "task_template_id" bigint NOT NULL,
    "deal_role_type_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: task_templates
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

-- Table: user_deal_access
CREATE TABLE IF NOT EXISTS "public"."user_deal_access" (
    "clerk_user_id" "text" NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "granted_via" "text" DEFAULT 'deal_roles'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Table: workflow_execution_logs
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

-- Table: workflow_executions
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

-- Table: workflow_nodes
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

-- ============================================================================
-- TABLES ADDED FROM TASK 5.0 PRE-FLIGHT (drift since 2026-03-03 snapshot)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."input_linked_rules" (
    "id" bigint NOT NULL,
    "input_id" bigint NOT NULL,
    "rule_order" integer DEFAULT 0 NOT NULL,
    "conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "logic_type" text DEFAULT 'AND'::text NOT NULL,
    "linked_table" text NOT NULL,
    "linked_column" text DEFAULT ''::text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."input_linked_rules" ADD CONSTRAINT "input_linked_rules_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."input_linked_rules" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;

CREATE TABLE IF NOT EXISTS "public"."input_autofill_rules" (
    "id" bigint NOT NULL,
    "target_input_id" bigint NOT NULL,
    "source_input_id" bigint NOT NULL,
    "source_linked_rule_id" bigint,
    "rule_order" integer DEFAULT 0 NOT NULL,
    "conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "logic_type" text DEFAULT 'AND'::text NOT NULL,
    "expression" text DEFAULT ''::text NOT NULL,
    "locked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."input_autofill_rules" ADD CONSTRAINT "input_autofill_rules_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."input_autofill_rules" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;

-- ============================================================================
-- DEFERRED SEQUENCE OWNED BY LINKAGES (from 02_sequences.sql)
-- These must run AFTER the tables above are created.
-- ============================================================================

ALTER SEQUENCE "public"."dashboard_widget_chats_id_seq" OWNED BY "public"."dashboard_widget_chats"."id";
ALTER SEQUENCE "public"."dashboard_widget_conversations_id_seq" OWNED BY "public"."dashboard_widget_conversations"."id";
ALTER SEQUENCE "public"."dashboard_widgets_id_seq" OWNED BY "public"."dashboard_widgets"."id";
ALTER SEQUENCE "public"."inputs_id_seq" OWNED BY "public"."inputs"."id";
ALTER SEQUENCE "public"."pe_section_button_actions_id_seq" OWNED BY "public"."pe_section_button_actions"."id";
ALTER SEQUENCE "public"."pe_section_buttons_id_seq" OWNED BY "public"."pe_section_buttons"."id";
ALTER SEQUENCE "public"."scenario_program_results_id_seq" OWNED BY "public"."scenario_program_results"."id";
ALTER SEQUENCE "public"."scenario_rate_options_id_seq" OWNED BY "public"."scenario_rate_options"."id";

