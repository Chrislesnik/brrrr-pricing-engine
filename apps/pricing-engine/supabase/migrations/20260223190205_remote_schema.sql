create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "address_standardizer" with schema "extensions";

create extension if not exists "address_standardizer_data_us" with schema "extensions";

create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "pg_jsonschema" with schema "extensions";

create extension if not exists "pg_net" with schema "extensions";

create extension if not exists "tablefunc" with schema "extensions";

create extension if not exists "wrappers" with schema "extensions";

create sequence "public"."pe_section_button_actions_id_seq";

create sequence "public"."pe_section_buttons_id_seq";

create sequence "public"."scenario_program_results_id_seq";

create sequence "public"."scenario_rate_options_id_seq";

drop trigger if exists "workflow_integrations_updated_at" on "public"."workflow_integrations";

drop policy "Authenticated users can insert app_settings" on "public"."app_settings";

drop policy "Authenticated users can read app_settings" on "public"."app_settings";

drop policy "Authenticated users can update app_settings" on "public"."app_settings";

drop policy "org_policy_delete" on "public"."document_template_fields";

drop policy "org_policy_insert" on "public"."document_template_fields";

drop policy "org_policy_select" on "public"."document_template_fields";

drop policy "org_policy_update" on "public"."document_template_fields";

drop policy "workflow_integrations_delete" on "public"."workflow_integrations";

drop policy "workflow_integrations_insert" on "public"."workflow_integrations";

drop policy "workflow_integrations_select" on "public"."workflow_integrations";

drop policy "workflow_integrations_update" on "public"."workflow_integrations";

revoke delete on table "public"."document_template_fields" from "anon";

revoke insert on table "public"."document_template_fields" from "anon";

revoke references on table "public"."document_template_fields" from "anon";

revoke select on table "public"."document_template_fields" from "anon";

revoke trigger on table "public"."document_template_fields" from "anon";

revoke truncate on table "public"."document_template_fields" from "anon";

revoke update on table "public"."document_template_fields" from "anon";

revoke delete on table "public"."document_template_fields" from "authenticated";

revoke insert on table "public"."document_template_fields" from "authenticated";

revoke references on table "public"."document_template_fields" from "authenticated";

revoke select on table "public"."document_template_fields" from "authenticated";

revoke trigger on table "public"."document_template_fields" from "authenticated";

revoke truncate on table "public"."document_template_fields" from "authenticated";

revoke update on table "public"."document_template_fields" from "authenticated";

revoke delete on table "public"."document_template_fields" from "service_role";

revoke insert on table "public"."document_template_fields" from "service_role";

revoke references on table "public"."document_template_fields" from "service_role";

revoke select on table "public"."document_template_fields" from "service_role";

revoke trigger on table "public"."document_template_fields" from "service_role";

revoke truncate on table "public"."document_template_fields" from "service_role";

revoke update on table "public"."document_template_fields" from "service_role";

revoke delete on table "public"."integrations" from "anon";

revoke insert on table "public"."integrations" from "anon";

revoke references on table "public"."integrations" from "anon";

revoke select on table "public"."integrations" from "anon";

revoke trigger on table "public"."integrations" from "anon";

revoke truncate on table "public"."integrations" from "anon";

revoke update on table "public"."integrations" from "anon";

revoke delete on table "public"."integrations" from "authenticated";

revoke insert on table "public"."integrations" from "authenticated";

revoke references on table "public"."integrations" from "authenticated";

revoke select on table "public"."integrations" from "authenticated";

revoke trigger on table "public"."integrations" from "authenticated";

revoke truncate on table "public"."integrations" from "authenticated";

revoke update on table "public"."integrations" from "authenticated";

revoke delete on table "public"."integrations" from "service_role";

revoke insert on table "public"."integrations" from "service_role";

revoke references on table "public"."integrations" from "service_role";

revoke select on table "public"."integrations" from "service_role";

revoke trigger on table "public"."integrations" from "service_role";

revoke truncate on table "public"."integrations" from "service_role";

revoke update on table "public"."integrations" from "service_role";

revoke delete on table "public"."integrations_clear" from "anon";

revoke insert on table "public"."integrations_clear" from "anon";

revoke references on table "public"."integrations_clear" from "anon";

revoke select on table "public"."integrations_clear" from "anon";

revoke trigger on table "public"."integrations_clear" from "anon";

revoke truncate on table "public"."integrations_clear" from "anon";

revoke update on table "public"."integrations_clear" from "anon";

revoke delete on table "public"."integrations_clear" from "authenticated";

revoke insert on table "public"."integrations_clear" from "authenticated";

revoke references on table "public"."integrations_clear" from "authenticated";

revoke select on table "public"."integrations_clear" from "authenticated";

revoke trigger on table "public"."integrations_clear" from "authenticated";

revoke truncate on table "public"."integrations_clear" from "authenticated";

revoke update on table "public"."integrations_clear" from "authenticated";

revoke delete on table "public"."integrations_clear" from "service_role";

revoke insert on table "public"."integrations_clear" from "service_role";

revoke references on table "public"."integrations_clear" from "service_role";

revoke select on table "public"."integrations_clear" from "service_role";

revoke trigger on table "public"."integrations_clear" from "service_role";

revoke truncate on table "public"."integrations_clear" from "service_role";

revoke update on table "public"."integrations_clear" from "service_role";

revoke delete on table "public"."integrations_floify" from "anon";

revoke insert on table "public"."integrations_floify" from "anon";

revoke references on table "public"."integrations_floify" from "anon";

revoke select on table "public"."integrations_floify" from "anon";

revoke trigger on table "public"."integrations_floify" from "anon";

revoke truncate on table "public"."integrations_floify" from "anon";

revoke update on table "public"."integrations_floify" from "anon";

revoke delete on table "public"."integrations_floify" from "authenticated";

revoke insert on table "public"."integrations_floify" from "authenticated";

revoke references on table "public"."integrations_floify" from "authenticated";

revoke select on table "public"."integrations_floify" from "authenticated";

revoke trigger on table "public"."integrations_floify" from "authenticated";

revoke truncate on table "public"."integrations_floify" from "authenticated";

revoke update on table "public"."integrations_floify" from "authenticated";

revoke delete on table "public"."integrations_floify" from "service_role";

revoke insert on table "public"."integrations_floify" from "service_role";

revoke references on table "public"."integrations_floify" from "service_role";

revoke select on table "public"."integrations_floify" from "service_role";

revoke trigger on table "public"."integrations_floify" from "service_role";

revoke truncate on table "public"."integrations_floify" from "service_role";

revoke update on table "public"."integrations_floify" from "service_role";

revoke delete on table "public"."integrations_nadlan" from "anon";

revoke insert on table "public"."integrations_nadlan" from "anon";

revoke references on table "public"."integrations_nadlan" from "anon";

revoke select on table "public"."integrations_nadlan" from "anon";

revoke trigger on table "public"."integrations_nadlan" from "anon";

revoke truncate on table "public"."integrations_nadlan" from "anon";

revoke update on table "public"."integrations_nadlan" from "anon";

revoke delete on table "public"."integrations_nadlan" from "authenticated";

revoke insert on table "public"."integrations_nadlan" from "authenticated";

revoke references on table "public"."integrations_nadlan" from "authenticated";

revoke select on table "public"."integrations_nadlan" from "authenticated";

revoke trigger on table "public"."integrations_nadlan" from "authenticated";

revoke truncate on table "public"."integrations_nadlan" from "authenticated";

revoke update on table "public"."integrations_nadlan" from "authenticated";

revoke delete on table "public"."integrations_nadlan" from "service_role";

revoke insert on table "public"."integrations_nadlan" from "service_role";

revoke references on table "public"."integrations_nadlan" from "service_role";

revoke select on table "public"."integrations_nadlan" from "service_role";

revoke trigger on table "public"."integrations_nadlan" from "service_role";

revoke truncate on table "public"."integrations_nadlan" from "service_role";

revoke update on table "public"."integrations_nadlan" from "service_role";

revoke delete on table "public"."integrations_xactus" from "anon";

revoke insert on table "public"."integrations_xactus" from "anon";

revoke references on table "public"."integrations_xactus" from "anon";

revoke select on table "public"."integrations_xactus" from "anon";

revoke trigger on table "public"."integrations_xactus" from "anon";

revoke truncate on table "public"."integrations_xactus" from "anon";

revoke update on table "public"."integrations_xactus" from "anon";

revoke delete on table "public"."integrations_xactus" from "authenticated";

revoke insert on table "public"."integrations_xactus" from "authenticated";

revoke references on table "public"."integrations_xactus" from "authenticated";

revoke select on table "public"."integrations_xactus" from "authenticated";

revoke trigger on table "public"."integrations_xactus" from "authenticated";

revoke truncate on table "public"."integrations_xactus" from "authenticated";

revoke update on table "public"."integrations_xactus" from "authenticated";

revoke delete on table "public"."integrations_xactus" from "service_role";

revoke insert on table "public"."integrations_xactus" from "service_role";

revoke references on table "public"."integrations_xactus" from "service_role";

revoke select on table "public"."integrations_xactus" from "service_role";

revoke trigger on table "public"."integrations_xactus" from "service_role";

revoke truncate on table "public"."integrations_xactus" from "service_role";

revoke update on table "public"."integrations_xactus" from "service_role";

revoke delete on table "public"."pending_invite_roles" from "anon";

revoke insert on table "public"."pending_invite_roles" from "anon";

revoke references on table "public"."pending_invite_roles" from "anon";

revoke select on table "public"."pending_invite_roles" from "anon";

revoke trigger on table "public"."pending_invite_roles" from "anon";

revoke truncate on table "public"."pending_invite_roles" from "anon";

revoke update on table "public"."pending_invite_roles" from "anon";

revoke delete on table "public"."pending_invite_roles" from "authenticated";

revoke insert on table "public"."pending_invite_roles" from "authenticated";

revoke references on table "public"."pending_invite_roles" from "authenticated";

revoke select on table "public"."pending_invite_roles" from "authenticated";

revoke trigger on table "public"."pending_invite_roles" from "authenticated";

revoke truncate on table "public"."pending_invite_roles" from "authenticated";

revoke update on table "public"."pending_invite_roles" from "authenticated";

revoke delete on table "public"."pending_invite_roles" from "service_role";

revoke insert on table "public"."pending_invite_roles" from "service_role";

revoke references on table "public"."pending_invite_roles" from "service_role";

revoke select on table "public"."pending_invite_roles" from "service_role";

revoke trigger on table "public"."pending_invite_roles" from "service_role";

revoke truncate on table "public"."pending_invite_roles" from "service_role";

revoke update on table "public"."pending_invite_roles" from "service_role";

revoke delete on table "public"."workflow_integrations" from "anon";

revoke insert on table "public"."workflow_integrations" from "anon";

revoke references on table "public"."workflow_integrations" from "anon";

revoke select on table "public"."workflow_integrations" from "anon";

revoke trigger on table "public"."workflow_integrations" from "anon";

revoke truncate on table "public"."workflow_integrations" from "anon";

revoke update on table "public"."workflow_integrations" from "anon";

revoke delete on table "public"."workflow_integrations" from "authenticated";

revoke insert on table "public"."workflow_integrations" from "authenticated";

revoke references on table "public"."workflow_integrations" from "authenticated";

revoke select on table "public"."workflow_integrations" from "authenticated";

revoke trigger on table "public"."workflow_integrations" from "authenticated";

revoke truncate on table "public"."workflow_integrations" from "authenticated";

revoke update on table "public"."workflow_integrations" from "authenticated";

revoke delete on table "public"."workflow_integrations" from "service_role";

revoke insert on table "public"."workflow_integrations" from "service_role";

revoke references on table "public"."workflow_integrations" from "service_role";

revoke select on table "public"."workflow_integrations" from "service_role";

revoke trigger on table "public"."workflow_integrations" from "service_role";

revoke truncate on table "public"."workflow_integrations" from "service_role";

revoke update on table "public"."workflow_integrations" from "service_role";

alter table "public"."custom_broker_settings" drop constraint "custom_broker_settings_broker_fk";

alter table "public"."custom_broker_settings" drop constraint "custom_broker_settings_organization_id_broker_id_key";

alter table "public"."document_template_fields" drop constraint "term_sheet_template_fields_template_id_fkey";

alter table "public"."integrations_clear" drop constraint "integrations_clear_integration_id_fkey";

alter table "public"."integrations_floify" drop constraint "integrations_floify_integration_id_fkey";

alter table "public"."integrations_nadlan" drop constraint "integrations_nadlan_integration_id_fkey";

alter table "public"."integrations_xactus" drop constraint "integrations_xactus_integration_id_fkey";

alter table "public"."loan_scenarios" drop constraint "loan_scenarios_borrower_entity_id_fkey";

alter table "public"."pending_invite_roles" drop constraint "pending_invite_roles_organization_id_email_key";

alter table "public"."pending_invite_roles" drop constraint "pending_invite_roles_organization_id_fkey";

alter table "public"."programs" drop constraint "programs_loan_type_chk";

alter table "public"."workflow_integrations" drop constraint "workflow_integrations_organization_id_fkey";

alter table "public"."workflow_integrations" drop constraint "workflow_integrations_unique_per_user";

alter table "public"."appraisal" drop constraint "appraisal_amc_id_fkey";

alter table "public"."organization_policies" drop constraint "organization_policies_action_check";

alter table "public"."organization_policies" drop constraint "organization_policies_resource_type_check";

alter table "public"."pricing_activity_log" drop constraint "pricing_activity_log_action_check";

alter table "public"."pricing_activity_log" drop constraint "pricing_activity_log_activity_type_check";

drop function if exists "public"."create_xactus_subtable_row"();

drop function if exists "public"."ensure_clear_integration"();

drop function if exists "public"."ensure_floify_integration"();

drop function if exists "public"."ensure_xactus_integration"();

drop function if exists "public"."seed_custom_broker_settings_from_default"();

drop function if exists "public"."seed_custom_broker_settings_on_member_attach"();

drop function if exists "public"."sync_clear_child"();

drop function if exists "public"."sync_nadlan_child"();

drop function if exists "public"."match_documents"(query_embedding public.vector, match_count integer, filter jsonb);

alter table "public"."document_template_fields" drop constraint "term_sheet_template_fields_pkey";

alter table "public"."integrations" drop constraint "integrations_pkey";

alter table "public"."integrations_clear" drop constraint "integrations_clear_pkey";

alter table "public"."integrations_floify" drop constraint "integrations_floify_pkey";

alter table "public"."integrations_nadlan" drop constraint "integrations_nadlan_pkey";

alter table "public"."integrations_xactus" drop constraint "integrations_xactus_pkey";

alter table "public"."pending_invite_roles" drop constraint "pending_invite_roles_pkey";

alter table "public"."workflow_integrations" drop constraint "workflow_integrations_pkey";

drop index if exists "public"."credit_reports_bucket_path_idx";

drop index if exists "public"."custom_broker_settings_organization_id_broker_id_key";

drop index if exists "public"."idx_custom_broker_settings_broker_id";

drop index if exists "public"."idx_integrations_org";

drop index if exists "public"."idx_integrations_type";

drop index if exists "public"."idx_loan_scenarios_inputs_gin";

drop index if exists "public"."idx_loan_scenarios_selected_gin";

drop index if exists "public"."idx_loans_assigned_gin";

drop index if exists "public"."idx_pending_invite_roles_expires_at";

drop index if exists "public"."idx_pending_invite_roles_org_email";

drop index if exists "public"."idx_term_sheet_template_fields_position";

drop index if exists "public"."idx_term_sheet_template_fields_template_id";

drop index if exists "public"."idx_workflow_integrations_not_archived";

drop index if exists "public"."idx_workflow_integrations_org_user";

drop index if exists "public"."idx_workflow_integrations_type";

drop index if exists "public"."integrations_clear_pkey";

drop index if exists "public"."integrations_floify_pkey";

drop index if exists "public"."integrations_nadlan_pkey";

drop index if exists "public"."integrations_pkey";

drop index if exists "public"."integrations_xactus_pkey";

drop index if exists "public"."pending_invite_roles_organization_id_email_key";

drop index if exists "public"."pending_invite_roles_pkey";

drop index if exists "public"."term_sheet_template_fields_pkey";

drop index if exists "public"."uq_integrations_org_user_type";

drop index if exists "public"."workflow_integrations_pkey";

drop index if exists "public"."workflow_integrations_unique_per_user";

drop table "public"."document_template_fields";

drop table "public"."integrations";

drop table "public"."integrations_clear";

drop table "public"."integrations_floify";

drop table "public"."integrations_nadlan";

drop table "public"."integrations_xactus";

drop table "public"."pending_invite_roles";

drop table "public"."workflow_integrations";


  create table "public"."appraisal_investor_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "investor_id" text,
    "investor_name" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_investor_list" enable row level security;


  create table "public"."appraisal_lender_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "lender_id" text,
    "lender_name" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_lender_list" enable row level security;


  create table "public"."appraisal_loan_type_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "loan_type_id" text,
    "loan_type_name" text,
    "other" boolean default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_loan_type_list" enable row level security;


  create table "public"."appraisal_occupancy_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "occupancy_name" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_occupancy_list" enable row level security;


  create table "public"."appraisal_product_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "product_name" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_product_list" enable row level security;


  create table "public"."appraisal_property_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "property_id" text,
    "property_name" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_property_list" enable row level security;


  create table "public"."appraisal_transaction_type_list" (
    "id" bigint generated by default as identity not null,
    "integration_settings_id" bigint,
    "transaction_type_name" text,
    "transaction_type_id" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appraisal_transaction_type_list" enable row level security;


  create table "public"."background_person_search" (
    "id" bigint generated by default as identity not null,
    "background_report_id" uuid,
    "data" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "glb" text,
    "dppa" integer,
    "voter" integer,
    "entity_id" text,
    "group_id" text
      );


alter table "public"."background_person_search" enable row level security;


  create table "public"."background_person_search_bankruptcy" (
    "id" bigint generated by default as identity not null,
    "background_person_report_id" text,
    "bk_case_number" text,
    "bk_chapter" text,
    "bk_filing_date" text,
    "bk_discharged_date" text,
    "bk_court_state" text,
    "created_at" timestamp with time zone not null default now(),
    "data" jsonb
      );


alter table "public"."background_person_search_bankruptcy" enable row level security;


  create table "public"."background_person_search_criminal" (
    "id" bigint generated by default as identity not null,
    "background_person_search_id" bigint,
    "cr_case_info" text,
    "cr_filed_date" text,
    "cr_offense" text,
    "cr_severity" text,
    "cr_disposition" text,
    "created_at" timestamp with time zone not null default now(),
    "data" jsonb,
    "cr_case_status" text
      );


alter table "public"."background_person_search_criminal" enable row level security;


  create table "public"."background_person_search_lien" (
    "id" bigint generated by default as identity not null,
    "background_person_search_id" bigint,
    "amount" text,
    "file_date" text,
    "filing_type" text,
    "creditor_name" text,
    "debtor_name" text,
    "filing_county" text,
    "filing_state" text,
    "created_at" timestamp with time zone not null default now(),
    "data" jsonb
      );


alter table "public"."background_person_search_lien" enable row level security;


  create table "public"."background_person_search_litigation" (
    "id" bigint generated by default as identity not null,
    "background_person_search_id" bigint,
    "lit_case_number" text,
    "lit_filing_date" text,
    "lit_case_type" text,
    "lit_status" text,
    "lit_disposition_date" text,
    "lit_judgement_amount" text,
    "created_at" timestamp with time zone not null default now(),
    "data" jsonb
      );


alter table "public"."background_person_search_litigation" enable row level security;


  create table "public"."background_person_search_quick_analysis" (
    "id" bigint generated by default as identity not null,
    "background_person_search_id" bigint,
    "record_details" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."background_person_search_quick_analysis" enable row level security;


  create table "public"."background_person_search_ucc" (
    "id" bigint generated by default as identity not null,
    "background_person_search_id" bigint,
    "filing_type" text,
    "filing_date" text,
    "filing_number" text,
    "debtor_name" text,
    "secured_party" text,
    "collateral_summary" text,
    "created_at" timestamp with time zone not null default now(),
    "data" jsonb
      );


alter table "public"."background_person_search_ucc" enable row level security;


  create table "public"."deal_users" (
    "id" bigint generated always as identity not null,
    "deal_id" uuid not null,
    "user_id" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."deal_users" enable row level security;


  create table "public"."document_files_background_reports" (
    "id" bigint generated by default as identity not null,
    "document_file_id" bigint,
    "background_report_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "created_by" text
      );


alter table "public"."document_files_background_reports" enable row level security;


  create table "public"."document_template_variables" (
    "id" uuid not null default gen_random_uuid(),
    "template_id" uuid not null,
    "name" text not null,
    "variable_type" text not null,
    "position" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "path" text
      );


alter table "public"."document_template_variables" enable row level security;


  create table "public"."integration_settings" (
    "id" bigint generated always as identity not null,
    "name" text not null,
    "slug" text not null,
    "description" text,
    "icon_url" text,
    "active" boolean not null default true,
    "level_global" boolean not null default false,
    "level_org" boolean not null default false,
    "level_individual" boolean not null default false,
    "type" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."integration_settings" enable row level security;


  create table "public"."integration_setup" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" text not null,
    "type" text not null,
    "name" text,
    "config" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "archived_at" timestamp with time zone,
    "archived_by" text,
    "integration_settings_id" bigint
      );


alter table "public"."integration_setup" enable row level security;


  create table "public"."integration_tags" (
    "id" bigint generated always as identity not null,
    "integration_settings_id" bigint not null,
    "tag" text not null
      );


alter table "public"."integration_tags" enable row level security;


  create table "public"."loan_scenario_inputs" (
    "id" bigint generated always as identity not null,
    "loan_scenario_id" uuid not null,
    "pricing_engine_input_id" bigint not null,
    "input_type" text,
    "value_text" text,
    "value_numeric" numeric,
    "value_date" date,
    "value_array" json,
    "value_bool" boolean,
    "linked_record_id" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."loan_scenario_inputs" enable row level security;


  create table "public"."organization_account_managers" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "account_manager_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."organization_account_managers" enable row level security;


  create table "public"."pe_input_logic" (
    "id" bigint generated always as identity not null,
    "type" text not null default 'AND'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pe_input_logic" enable row level security;


  create table "public"."pe_input_logic_actions" (
    "id" bigint generated always as identity not null,
    "pe_input_logic_id" bigint not null,
    "input_id" bigint,
    "value_type" text,
    "value_visible" boolean,
    "value_required" boolean,
    "value_text" text,
    "value_field" bigint,
    "value_expression" text,
    "created_at" timestamp with time zone not null default now(),
    "category_id" bigint
      );


alter table "public"."pe_input_logic_actions" enable row level security;


  create table "public"."pe_input_logic_conditions" (
    "id" bigint generated always as identity not null,
    "pe_input_logic_id" bigint not null,
    "field" bigint,
    "operator" text,
    "value_type" text default 'value'::text,
    "value" text,
    "value_field" bigint,
    "value_expression" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pe_input_logic_conditions" enable row level security;


  create table "public"."pe_section_button_actions" (
    "id" integer not null default nextval('public.pe_section_button_actions_id_seq'::regclass),
    "button_id" integer not null,
    "action_type" text not null,
    "action_uuid" text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pe_section_button_actions" enable row level security;


  create table "public"."pe_section_buttons" (
    "id" integer not null default nextval('public.pe_section_buttons_id_seq'::regclass),
    "category_id" integer not null,
    "label" text not null,
    "icon" text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "archived_at" timestamp with time zone,
    "archived_by" text,
    "signal_color" text,
    "required_inputs" jsonb default '[]'::jsonb
      );


alter table "public"."pe_section_buttons" enable row level security;


  create table "public"."pe_term_sheet_conditions" (
    "id" bigint generated always as identity not null,
    "pe_term_sheet_rule_id" bigint not null,
    "field" bigint,
    "operator" text,
    "value_type" text default 'value'::text,
    "value" text,
    "value_field" bigint,
    "value_expression" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pe_term_sheet_conditions" enable row level security;


  create table "public"."pe_term_sheet_rules" (
    "id" bigint generated always as identity not null,
    "pe_term_sheet_id" bigint not null,
    "logic_type" text not null default 'AND'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pe_term_sheet_rules" enable row level security;


  create table "public"."pe_term_sheets" (
    "id" bigint generated always as identity not null,
    "document_template_id" uuid not null,
    "status" text not null default 'active'::text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pe_term_sheets" enable row level security;


  create table "public"."pricing_engine_input_categories" (
    "id" bigint generated by default as identity not null,
    "category" text,
    "created_at" timestamp with time zone not null default now(),
    "display_order" integer not null default 0,
    "archived_at" timestamp with time zone,
    "archived_by" text,
    "default_open" boolean not null default true,
    "config" jsonb default '{}'::jsonb
      );


alter table "public"."pricing_engine_input_categories" enable row level security;


  create table "public"."pricing_engine_inputs" (
    "id" bigint generated by default as identity not null,
    "category_id" bigint,
    "category" text,
    "input_label" text,
    "input_type" text,
    "input_code" text not null,
    "dropdown_options" json,
    "config" jsonb default '{}'::jsonb,
    "display_order" integer not null default 0,
    "starred" boolean not null default false,
    "linked_table" text,
    "linked_column" text,
    "created_at" timestamp with time zone not null default now(),
    "archived_at" timestamp with time zone,
    "archived_by" text,
    "tooltip" text,
    "placeholder" text,
    "default_value" text,
    "layout_row" integer not null default 0,
    "layout_width" text not null default '50'::text
      );


alter table "public"."pricing_engine_inputs" enable row level security;


  create table "public"."program_conditions" (
    "id" bigint generated always as identity not null,
    "program_id" uuid not null,
    "logic_type" text not null default 'AND'::text,
    "field" bigint,
    "operator" text,
    "value_type" text default 'value'::text,
    "value" text,
    "value_field" bigint,
    "value_expression" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."program_conditions" enable row level security;


  create table "public"."scenario_program_results" (
    "id" bigint not null default nextval('public.scenario_program_results_id_seq'::regclass),
    "loan_scenario_id" uuid not null,
    "program_id" uuid,
    "program_name" text,
    "pass" boolean,
    "loan_amount" text,
    "ltv" text,
    "validations" text[],
    "warnings" text[],
    "calculated_at" timestamp with time zone not null default now(),
    "raw_response" jsonb
      );


alter table "public"."scenario_program_results" enable row level security;


  create table "public"."scenario_rate_options" (
    "id" bigint not null default nextval('public.scenario_rate_options_id_seq'::regclass),
    "scenario_program_result_id" bigint not null,
    "row_index" integer not null,
    "loan_price" text,
    "interest_rate" text,
    "pitia" text,
    "dscr" text,
    "initial_loan_amount" text,
    "rehab_holdback" text,
    "total_loan_amount" text,
    "initial_pitia" text,
    "funded_pitia" text
      );


alter table "public"."scenario_rate_options" enable row level security;

alter table "public"."ai_chats" add column "loan_type" text;

alter table "public"."ai_chats" add column "program_id" uuid;

alter table "public"."application_appraisal" add column "amc_id" uuid;

alter table "public"."applications" add column "display_id" text not null;

alter table "public"."appraisal" alter column "amc_id" set data type uuid using "amc_id"::uuid;

alter table "public"."automations" add column "webhook_type" text;

alter table "public"."background_reports" drop column "file_name";

alter table "public"."background_reports" drop column "file_size";

alter table "public"."background_reports" drop column "file_type";

alter table "public"."background_reports" drop column "is_entity";

alter table "public"."background_reports" drop column "notes";

alter table "public"."background_reports" drop column "report_date";

alter table "public"."background_reports" drop column "report_type";

alter table "public"."background_reports" drop column "status";

alter table "public"."background_reports" drop column "storage_path";

alter table "public"."background_reports" drop column "updated_at";

alter table "public"."background_reports" add column "archived_at" timestamp with time zone;

alter table "public"."background_reports" add column "archived_by" text;

alter table "public"."background_reports" add column "type" text not null;

alter table "public"."credit_report_data_xactus" drop column "file_size";

alter table "public"."credit_report_data_xactus" drop column "file_type";

alter table "public"."credit_report_data_xactus" drop column "raw_data";

alter table "public"."credit_report_data_xactus" drop column "uploaded_at";

alter table "public"."credit_report_data_xactus" add column "aggregator" text;

alter table "public"."credit_report_data_xactus" add column "credit_report_id" uuid;

alter table "public"."credit_report_data_xactus" add column "inquiries" jsonb not null default '[]'::jsonb;

alter table "public"."credit_report_data_xactus" add column "liabilities" jsonb not null default '{}'::jsonb;

alter table "public"."credit_report_data_xactus" add column "mid_score" numeric;

alter table "public"."credit_report_data_xactus" add column "public_records" jsonb not null default '[]'::jsonb;

alter table "public"."credit_report_data_xactus" add column "report_date" date;

alter table "public"."credit_report_data_xactus" add column "tradelines" jsonb not null default '[]'::jsonb;

alter table "public"."credit_reports" drop column "aggregator_id";

alter table "public"."credit_reports" drop column "bucket";

alter table "public"."credit_reports" drop column "metadata";

alter table "public"."credit_reports" drop column "storage_path";

alter table "public"."credit_reports" add column "archived_at" timestamp with time zone;

alter table "public"."credit_reports" add column "archived_by" text;

alter table "public"."credit_reports" add column "data" jsonb;

alter table "public"."credit_reports" add column "equifax_score" integer;

alter table "public"."credit_reports" add column "experian_score" integer;

alter table "public"."credit_reports" add column "mid_score" integer;

alter table "public"."credit_reports" add column "pull_type" text;

alter table "public"."credit_reports" add column "report_date" timestamp with time zone;

alter table "public"."credit_reports" add column "transunion_score" integer;

alter table "public"."credit_reports" alter column "report_id" set data type text using "report_id"::text;

alter table "public"."custom_broker_settings" drop column "broker_id";

alter table "public"."custom_broker_settings" add column "broker_org_id" uuid not null;

alter table "public"."document_file_statuses" enable row level security;

alter table "public"."document_logic_actions" add column "category_id" bigint;

alter table "public"."document_status" enable row level security;

alter table "public"."input_categories" add column "default_open" boolean not null default true;

alter table "public"."input_logic_actions" add column "category_id" bigint;

alter table "public"."inputs" drop column "config";

alter table "public"."inputs" drop column "organization_id";

alter table "public"."inputs" add column "tooltip" text;

alter table "public"."loan_scenarios" drop column "borrower_entity_id";

alter table "public"."loan_scenarios" drop column "guarantor_borrower_ids";

alter table "public"."loan_scenarios" drop column "guarantor_emails";

alter table "public"."loan_scenarios" drop column "guarantor_names";

alter table "public"."loan_scenarios" drop column "inputs";

alter table "public"."loan_scenarios" drop column "selected";

alter table "public"."loan_scenarios" drop column "user_id";

alter table "public"."loan_scenarios" add column "created_by" text;

alter table "public"."loan_scenarios" add column "selected_rate_option_id" bigint;

alter table "public"."loans" drop column "assigned_to_user_id";

alter table "public"."loans" add column "display_id" text not null;

alter table "public"."organizations" alter column "is_internal_yn" drop default;

alter table "public"."organizations" alter column "is_internal_yn" drop not null;

alter table "public"."programs" drop column "loan_type";

alter table "public"."role_assignments" enable row level security;

alter table "public"."task_template_roles" enable row level security;

alter sequence "public"."pe_section_button_actions_id_seq" owned by "public"."pe_section_button_actions"."id";

alter sequence "public"."pe_section_buttons_id_seq" owned by "public"."pe_section_buttons"."id";

alter sequence "public"."scenario_program_results_id_seq" owned by "public"."scenario_program_results"."id";

alter sequence "public"."scenario_rate_options_id_seq" owned by "public"."scenario_rate_options"."id";

CREATE INDEX actions_trigger_type_idx ON public.automations USING btree (trigger_type);

CREATE UNIQUE INDEX appraisal_investor_list_pkey ON public.appraisal_investor_list USING btree (id);

CREATE UNIQUE INDEX appraisal_lender_list_pkey ON public.appraisal_lender_list USING btree (id);

CREATE UNIQUE INDEX appraisal_lender_list_settings_name_unique ON public.appraisal_lender_list USING btree (integration_settings_id, lender_name);

CREATE UNIQUE INDEX appraisal_loan_type_list_pkey ON public.appraisal_loan_type_list USING btree (id);

CREATE UNIQUE INDEX appraisal_occupancy_list_pkey ON public.appraisal_occupancy_list USING btree (id);

CREATE UNIQUE INDEX appraisal_product_list_pkey ON public.appraisal_product_list USING btree (id);

CREATE UNIQUE INDEX appraisal_property_list_pkey ON public.appraisal_property_list USING btree (id);

CREATE UNIQUE INDEX appraisal_transaction_type_list_pkey ON public.appraisal_transaction_type_list USING btree (id);

CREATE UNIQUE INDEX background_people_search_lien_pkey ON public.background_person_search_lien USING btree (id);

CREATE UNIQUE INDEX background_people_search_ucc_pkey ON public.background_person_search_ucc USING btree (id);

CREATE UNIQUE INDEX background_person_search_bankruptcy_pkey ON public.background_person_search_bankruptcy USING btree (id);

CREATE UNIQUE INDEX background_person_search_criminal_pkey ON public.background_person_search_criminal USING btree (id);

CREATE UNIQUE INDEX background_person_search_litigation_pkey ON public.background_person_search_litigation USING btree (id);

CREATE UNIQUE INDEX background_person_search_pkey ON public.background_person_search USING btree (id);

CREATE UNIQUE INDEX background_person_search_quick_analysis_pkey ON public.background_person_search_quick_analysis USING btree (id);

CREATE UNIQUE INDEX custom_broker_settings_org_broker_org_key ON public.custom_broker_settings USING btree (organization_id, broker_org_id);

CREATE UNIQUE INDEX deal_users_deal_id_user_id_key ON public.deal_users USING btree (deal_id, user_id);

CREATE UNIQUE INDEX deal_users_pkey ON public.deal_users USING btree (id);

CREATE UNIQUE INDEX document_files_background_reports_pkey ON public.document_files_background_reports USING btree (id);

CREATE UNIQUE INDEX document_template_variables_pkey ON public.document_template_variables USING btree (id);

CREATE UNIQUE INDEX idx_applications_display_id ON public.applications USING btree (display_id);

CREATE INDEX idx_credit_report_data_xactus_borrower_id ON public.credit_report_data_xactus USING btree (borrower_id);

CREATE INDEX idx_credit_report_data_xactus_credit_report_id ON public.credit_report_data_xactus USING btree (credit_report_id);

CREATE INDEX idx_custom_broker_settings_broker_org_id ON public.custom_broker_settings USING btree (broker_org_id);

CREATE INDEX idx_deal_users_deal ON public.deal_users USING btree (deal_id);

CREATE INDEX idx_deal_users_user ON public.deal_users USING btree (user_id);

CREATE INDEX idx_document_template_variables_position ON public.document_template_variables USING btree (template_id, "position");

CREATE INDEX idx_document_template_variables_template_id ON public.document_template_variables USING btree (template_id);

CREATE INDEX idx_integration_settings_active ON public.integration_settings USING btree (id) WHERE (active = true);

CREATE INDEX idx_integration_settings_slug ON public.integration_settings USING btree (slug);

CREATE INDEX idx_integration_settings_type ON public.integration_settings USING btree (type);

CREATE INDEX idx_integration_setup_not_archived ON public.integration_setup USING btree (id) WHERE (archived_at IS NULL);

CREATE INDEX idx_integration_setup_org_user ON public.integration_setup USING btree (organization_id, user_id);

CREATE INDEX idx_integration_setup_settings_id ON public.integration_setup USING btree (integration_settings_id);

CREATE INDEX idx_integration_setup_type ON public.integration_setup USING btree (type);

CREATE INDEX idx_integration_tags_tag ON public.integration_tags USING btree (tag);

CREATE INDEX idx_loan_scenario_inputs_pe_input ON public.loan_scenario_inputs USING btree (pricing_engine_input_id);

CREATE INDEX idx_loan_scenario_inputs_scenario ON public.loan_scenario_inputs USING btree (loan_scenario_id);

CREATE UNIQUE INDEX idx_loan_scenario_inputs_unique ON public.loan_scenario_inputs USING btree (loan_scenario_id, pricing_engine_input_id);

CREATE UNIQUE INDEX idx_loans_display_id ON public.loans USING btree (display_id);

CREATE INDEX idx_oam_manager_id ON public.organization_account_managers USING btree (account_manager_id);

CREATE INDEX idx_oam_org_id ON public.organization_account_managers USING btree (organization_id);

CREATE UNIQUE INDEX idx_organization_policies_global_unique ON public.organization_policies USING btree (resource_type, resource_name, action) WHERE (org_id IS NULL);

CREATE INDEX idx_pe_input_categories_not_archived ON public.pricing_engine_input_categories USING btree (id) WHERE (archived_at IS NULL);

CREATE INDEX idx_pe_inputs_input_code ON public.pricing_engine_inputs USING btree (input_code);

CREATE INDEX idx_pe_inputs_not_archived ON public.pricing_engine_inputs USING btree (id) WHERE (archived_at IS NULL);

CREATE INDEX idx_pe_logic_action_input ON public.pe_input_logic_actions USING btree (input_id);

CREATE INDEX idx_pe_logic_action_rule ON public.pe_input_logic_actions USING btree (pe_input_logic_id);

CREATE INDEX idx_pe_logic_cond_rule ON public.pe_input_logic_conditions USING btree (pe_input_logic_id);

CREATE INDEX idx_pe_section_button_actions_button ON public.pe_section_button_actions USING btree (button_id);

CREATE INDEX idx_pe_section_buttons_category ON public.pe_section_buttons USING btree (category_id) WHERE (archived_at IS NULL);

CREATE INDEX idx_pe_term_sheet_conditions_rule_id ON public.pe_term_sheet_conditions USING btree (pe_term_sheet_rule_id);

CREATE INDEX idx_pe_term_sheet_rules_sheet_id ON public.pe_term_sheet_rules USING btree (pe_term_sheet_id);

CREATE INDEX idx_pe_term_sheets_display_order ON public.pe_term_sheets USING btree (display_order);

CREATE INDEX idx_program_conditions_program ON public.program_conditions USING btree (program_id);

CREATE INDEX idx_scenario_program_results_program ON public.scenario_program_results USING btree (program_id);

CREATE INDEX idx_scenario_program_results_scenario ON public.scenario_program_results USING btree (loan_scenario_id);

CREATE INDEX idx_scenario_rate_options_result ON public.scenario_rate_options USING btree (scenario_program_result_id);

CREATE UNIQUE INDEX integration_settings_pkey ON public.integration_settings USING btree (id);

CREATE UNIQUE INDEX integration_settings_slug_key ON public.integration_settings USING btree (slug);

CREATE UNIQUE INDEX integration_setup_pkey ON public.integration_setup USING btree (id);

CREATE UNIQUE INDEX integration_setup_unique_per_user ON public.integration_setup USING btree (organization_id, user_id, type, name);

CREATE UNIQUE INDEX integration_tags_integration_settings_id_tag_key ON public.integration_tags USING btree (integration_settings_id, tag);

CREATE UNIQUE INDEX integration_tags_pkey ON public.integration_tags USING btree (id);

CREATE UNIQUE INDEX loan_scenario_inputs_pkey ON public.loan_scenario_inputs USING btree (id);

CREATE INDEX loan_scenarios_selected_rate_option_id_idx ON public.loan_scenarios USING btree (selected_rate_option_id);

CREATE UNIQUE INDEX organization_account_managers_organization_id_account_manag_key ON public.organization_account_managers USING btree (organization_id, account_manager_id);

CREATE UNIQUE INDEX organization_account_managers_pkey ON public.organization_account_managers USING btree (id);

CREATE UNIQUE INDEX pe_input_logic_actions_pkey ON public.pe_input_logic_actions USING btree (id);

CREATE UNIQUE INDEX pe_input_logic_conditions_pkey ON public.pe_input_logic_conditions USING btree (id);

CREATE UNIQUE INDEX pe_input_logic_pkey ON public.pe_input_logic USING btree (id);

CREATE UNIQUE INDEX pe_section_button_actions_pkey ON public.pe_section_button_actions USING btree (id);

CREATE UNIQUE INDEX pe_section_buttons_pkey ON public.pe_section_buttons USING btree (id);

CREATE UNIQUE INDEX pe_term_sheet_conditions_pkey ON public.pe_term_sheet_conditions USING btree (id);

CREATE UNIQUE INDEX pe_term_sheet_rules_pkey ON public.pe_term_sheet_rules USING btree (id);

CREATE UNIQUE INDEX pe_term_sheets_document_template_id_key ON public.pe_term_sheets USING btree (document_template_id);

CREATE UNIQUE INDEX pe_term_sheets_pkey ON public.pe_term_sheets USING btree (id);

CREATE INDEX pricing_engine_input_categories_display_order_idx ON public.pricing_engine_input_categories USING btree (display_order);

CREATE UNIQUE INDEX pricing_engine_input_categories_pkey ON public.pricing_engine_input_categories USING btree (id);

CREATE UNIQUE INDEX pricing_engine_inputs_input_code_key ON public.pricing_engine_inputs USING btree (input_code);

CREATE UNIQUE INDEX pricing_engine_inputs_pkey ON public.pricing_engine_inputs USING btree (id);

CREATE UNIQUE INDEX program_conditions_pkey ON public.program_conditions USING btree (id);

CREATE INDEX program_documents_chunks_vs_embedding_idx ON public.program_documents_chunks_vs USING hnsw (embedding public.vector_cosine_ops);

CREATE INDEX role_assignments_resource_type_idx ON public.role_assignments USING btree (resource_type);

CREATE UNIQUE INDEX scenario_program_results_pkey ON public.scenario_program_results USING btree (id);

CREATE UNIQUE INDEX scenario_rate_options_pkey ON public.scenario_rate_options USING btree (id);

alter table "public"."appraisal_investor_list" add constraint "appraisal_investor_list_pkey" PRIMARY KEY using index "appraisal_investor_list_pkey";

alter table "public"."appraisal_lender_list" add constraint "appraisal_lender_list_pkey" PRIMARY KEY using index "appraisal_lender_list_pkey";

alter table "public"."appraisal_loan_type_list" add constraint "appraisal_loan_type_list_pkey" PRIMARY KEY using index "appraisal_loan_type_list_pkey";

alter table "public"."appraisal_occupancy_list" add constraint "appraisal_occupancy_list_pkey" PRIMARY KEY using index "appraisal_occupancy_list_pkey";

alter table "public"."appraisal_product_list" add constraint "appraisal_product_list_pkey" PRIMARY KEY using index "appraisal_product_list_pkey";

alter table "public"."appraisal_property_list" add constraint "appraisal_property_list_pkey" PRIMARY KEY using index "appraisal_property_list_pkey";

alter table "public"."appraisal_transaction_type_list" add constraint "appraisal_transaction_type_list_pkey" PRIMARY KEY using index "appraisal_transaction_type_list_pkey";

alter table "public"."background_person_search" add constraint "background_person_search_pkey" PRIMARY KEY using index "background_person_search_pkey";

alter table "public"."background_person_search_bankruptcy" add constraint "background_person_search_bankruptcy_pkey" PRIMARY KEY using index "background_person_search_bankruptcy_pkey";

alter table "public"."background_person_search_criminal" add constraint "background_person_search_criminal_pkey" PRIMARY KEY using index "background_person_search_criminal_pkey";

alter table "public"."background_person_search_lien" add constraint "background_people_search_lien_pkey" PRIMARY KEY using index "background_people_search_lien_pkey";

alter table "public"."background_person_search_litigation" add constraint "background_person_search_litigation_pkey" PRIMARY KEY using index "background_person_search_litigation_pkey";

alter table "public"."background_person_search_quick_analysis" add constraint "background_person_search_quick_analysis_pkey" PRIMARY KEY using index "background_person_search_quick_analysis_pkey";

alter table "public"."background_person_search_ucc" add constraint "background_people_search_ucc_pkey" PRIMARY KEY using index "background_people_search_ucc_pkey";

alter table "public"."deal_users" add constraint "deal_users_pkey" PRIMARY KEY using index "deal_users_pkey";

alter table "public"."document_files_background_reports" add constraint "document_files_background_reports_pkey" PRIMARY KEY using index "document_files_background_reports_pkey";

alter table "public"."document_template_variables" add constraint "document_template_variables_pkey" PRIMARY KEY using index "document_template_variables_pkey";

alter table "public"."integration_settings" add constraint "integration_settings_pkey" PRIMARY KEY using index "integration_settings_pkey";

alter table "public"."integration_setup" add constraint "integration_setup_pkey" PRIMARY KEY using index "integration_setup_pkey";

alter table "public"."integration_tags" add constraint "integration_tags_pkey" PRIMARY KEY using index "integration_tags_pkey";

alter table "public"."loan_scenario_inputs" add constraint "loan_scenario_inputs_pkey" PRIMARY KEY using index "loan_scenario_inputs_pkey";

alter table "public"."organization_account_managers" add constraint "organization_account_managers_pkey" PRIMARY KEY using index "organization_account_managers_pkey";

alter table "public"."pe_input_logic" add constraint "pe_input_logic_pkey" PRIMARY KEY using index "pe_input_logic_pkey";

alter table "public"."pe_input_logic_actions" add constraint "pe_input_logic_actions_pkey" PRIMARY KEY using index "pe_input_logic_actions_pkey";

alter table "public"."pe_input_logic_conditions" add constraint "pe_input_logic_conditions_pkey" PRIMARY KEY using index "pe_input_logic_conditions_pkey";

alter table "public"."pe_section_button_actions" add constraint "pe_section_button_actions_pkey" PRIMARY KEY using index "pe_section_button_actions_pkey";

alter table "public"."pe_section_buttons" add constraint "pe_section_buttons_pkey" PRIMARY KEY using index "pe_section_buttons_pkey";

alter table "public"."pe_term_sheet_conditions" add constraint "pe_term_sheet_conditions_pkey" PRIMARY KEY using index "pe_term_sheet_conditions_pkey";

alter table "public"."pe_term_sheet_rules" add constraint "pe_term_sheet_rules_pkey" PRIMARY KEY using index "pe_term_sheet_rules_pkey";

alter table "public"."pe_term_sheets" add constraint "pe_term_sheets_pkey" PRIMARY KEY using index "pe_term_sheets_pkey";

alter table "public"."pricing_engine_input_categories" add constraint "pricing_engine_input_categories_pkey" PRIMARY KEY using index "pricing_engine_input_categories_pkey";

alter table "public"."pricing_engine_inputs" add constraint "pricing_engine_inputs_pkey" PRIMARY KEY using index "pricing_engine_inputs_pkey";

alter table "public"."program_conditions" add constraint "program_conditions_pkey" PRIMARY KEY using index "program_conditions_pkey";

alter table "public"."scenario_program_results" add constraint "scenario_program_results_pkey" PRIMARY KEY using index "scenario_program_results_pkey";

alter table "public"."scenario_rate_options" add constraint "scenario_rate_options_pkey" PRIMARY KEY using index "scenario_rate_options_pkey";

alter table "public"."ai_chats" add constraint "ai_chats_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL not valid;

alter table "public"."ai_chats" validate constraint "ai_chats_program_id_fkey";

alter table "public"."application_appraisal" add constraint "application_appraisal_amc_id_fkey" FOREIGN KEY (amc_id) REFERENCES public.integration_setup(id) ON DELETE SET NULL not valid;

alter table "public"."application_appraisal" validate constraint "application_appraisal_amc_id_fkey";

alter table "public"."appraisal_investor_list" add constraint "appraisal_investor_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_investor_list" validate constraint "appraisal_investor_list_integration_settings_id_fkey";

alter table "public"."appraisal_lender_list" add constraint "appraisal_lender_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_lender_list" validate constraint "appraisal_lender_list_integration_settings_id_fkey";

alter table "public"."appraisal_lender_list" add constraint "appraisal_lender_list_settings_name_unique" UNIQUE using index "appraisal_lender_list_settings_name_unique";

alter table "public"."appraisal_loan_type_list" add constraint "appraisal_loan_type_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_loan_type_list" validate constraint "appraisal_loan_type_list_integration_settings_id_fkey";

alter table "public"."appraisal_occupancy_list" add constraint "appraisal_occupancy_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_occupancy_list" validate constraint "appraisal_occupancy_list_integration_settings_id_fkey";

alter table "public"."appraisal_product_list" add constraint "appraisal_product_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_product_list" validate constraint "appraisal_product_list_integration_settings_id_fkey";

alter table "public"."appraisal_property_list" add constraint "appraisal_property_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_property_list" validate constraint "appraisal_property_list_integration_settings_id_fkey";

alter table "public"."appraisal_transaction_type_list" add constraint "appraisal_transaction_type_list_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_transaction_type_list" validate constraint "appraisal_transaction_type_list_integration_settings_id_fkey";

alter table "public"."background_person_search" add constraint "background_person_search_background_report_id_fkey" FOREIGN KEY (background_report_id) REFERENCES public.background_reports(id) ON DELETE CASCADE not valid;

alter table "public"."background_person_search" validate constraint "background_person_search_background_report_id_fkey";

alter table "public"."background_person_search_criminal" add constraint "background_person_search_crimi_background_person_search_id_fkey" FOREIGN KEY (background_person_search_id) REFERENCES public.background_person_search(id) ON DELETE CASCADE not valid;

alter table "public"."background_person_search_criminal" validate constraint "background_person_search_crimi_background_person_search_id_fkey";

alter table "public"."background_person_search_lien" add constraint "background_people_search_lien_background_people_search_id_fkey" FOREIGN KEY (background_person_search_id) REFERENCES public.background_person_search(id) ON DELETE CASCADE not valid;

alter table "public"."background_person_search_lien" validate constraint "background_people_search_lien_background_people_search_id_fkey";

alter table "public"."background_person_search_litigation" add constraint "background_person_search_litig_background_person_search_id_fkey" FOREIGN KEY (background_person_search_id) REFERENCES public.background_person_search(id) ON DELETE CASCADE not valid;

alter table "public"."background_person_search_litigation" validate constraint "background_person_search_litig_background_person_search_id_fkey";

alter table "public"."background_person_search_quick_analysis" add constraint "background_person_search_quick_background_person_search_id_fkey" FOREIGN KEY (background_person_search_id) REFERENCES public.background_person_search(id) ON DELETE CASCADE not valid;

alter table "public"."background_person_search_quick_analysis" validate constraint "background_person_search_quick_background_person_search_id_fkey";

alter table "public"."background_person_search_ucc" add constraint "background_people_search_ucc_background_people_search_id_fkey" FOREIGN KEY (background_person_search_id) REFERENCES public.background_person_search(id) ON DELETE CASCADE not valid;

alter table "public"."background_person_search_ucc" validate constraint "background_people_search_ucc_background_people_search_id_fkey";

alter table "public"."credit_report_data_xactus" add constraint "credit_report_data_xactus_credit_report_id_fkey" FOREIGN KEY (credit_report_id) REFERENCES public.credit_reports(id) ON DELETE CASCADE not valid;

alter table "public"."credit_report_data_xactus" validate constraint "credit_report_data_xactus_credit_report_id_fkey";

alter table "public"."custom_broker_settings" add constraint "custom_broker_settings_broker_org_fk" FOREIGN KEY (broker_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."custom_broker_settings" validate constraint "custom_broker_settings_broker_org_fk";

alter table "public"."custom_broker_settings" add constraint "custom_broker_settings_org_broker_org_key" UNIQUE using index "custom_broker_settings_org_broker_org_key";

alter table "public"."deal_users" add constraint "deal_users_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE not valid;

alter table "public"."deal_users" validate constraint "deal_users_deal_id_fkey";

alter table "public"."deal_users" add constraint "deal_users_deal_id_user_id_key" UNIQUE using index "deal_users_deal_id_user_id_key";

alter table "public"."document_files_background_reports" add constraint "document_files_background_reports_background_report_id_fkey" FOREIGN KEY (background_report_id) REFERENCES public.background_reports(id) not valid;

alter table "public"."document_files_background_reports" validate constraint "document_files_background_reports_background_report_id_fkey";

alter table "public"."document_files_background_reports" add constraint "document_files_background_reports_document_file_id_fkey" FOREIGN KEY (document_file_id) REFERENCES public.document_files(id) not valid;

alter table "public"."document_files_background_reports" validate constraint "document_files_background_reports_document_file_id_fkey";

alter table "public"."document_logic_actions" add constraint "document_logic_actions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.document_categories(id) not valid;

alter table "public"."document_logic_actions" validate constraint "document_logic_actions_category_id_fkey";

alter table "public"."document_template_variables" add constraint "document_template_variables_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE not valid;

alter table "public"."document_template_variables" validate constraint "document_template_variables_template_id_fkey";

alter table "public"."input_logic_actions" add constraint "input_logic_actions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.input_categories(id) not valid;

alter table "public"."input_logic_actions" validate constraint "input_logic_actions_category_id_fkey";

alter table "public"."integration_settings" add constraint "integration_settings_slug_key" UNIQUE using index "integration_settings_slug_key";

alter table "public"."integration_settings" add constraint "integration_settings_type_check" CHECK ((type = ANY (ARRAY['system'::text, 'workflow'::text]))) not valid;

alter table "public"."integration_settings" validate constraint "integration_settings_type_check";

alter table "public"."integration_setup" add constraint "integration_setup_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE SET NULL not valid;

alter table "public"."integration_setup" validate constraint "integration_setup_integration_settings_id_fkey";

alter table "public"."integration_setup" add constraint "integration_setup_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."integration_setup" validate constraint "integration_setup_organization_id_fkey";

alter table "public"."integration_setup" add constraint "integration_setup_unique_per_user" UNIQUE using index "integration_setup_unique_per_user";

alter table "public"."integration_tags" add constraint "integration_tags_integration_settings_id_fkey" FOREIGN KEY (integration_settings_id) REFERENCES public.integration_settings(id) ON DELETE CASCADE not valid;

alter table "public"."integration_tags" validate constraint "integration_tags_integration_settings_id_fkey";

alter table "public"."integration_tags" add constraint "integration_tags_integration_settings_id_tag_key" UNIQUE using index "integration_tags_integration_settings_id_tag_key";

alter table "public"."loan_scenario_inputs" add constraint "loan_scenario_inputs_loan_scenario_id_fkey" FOREIGN KEY (loan_scenario_id) REFERENCES public.loan_scenarios(id) ON DELETE CASCADE not valid;

alter table "public"."loan_scenario_inputs" validate constraint "loan_scenario_inputs_loan_scenario_id_fkey";

alter table "public"."loan_scenario_inputs" add constraint "loan_scenario_inputs_pricing_engine_input_id_fkey" FOREIGN KEY (pricing_engine_input_id) REFERENCES public.pricing_engine_inputs(id) ON DELETE CASCADE not valid;

alter table "public"."loan_scenario_inputs" validate constraint "loan_scenario_inputs_pricing_engine_input_id_fkey";

alter table "public"."loan_scenarios" add constraint "fk_selected_rate_option" FOREIGN KEY (selected_rate_option_id) REFERENCES public.scenario_rate_options(id) ON DELETE SET NULL not valid;

alter table "public"."loan_scenarios" validate constraint "fk_selected_rate_option";

alter table "public"."organization_account_managers" add constraint "organization_account_managers_account_manager_id_fkey" FOREIGN KEY (account_manager_id) REFERENCES public.organization_members(id) ON DELETE CASCADE not valid;

alter table "public"."organization_account_managers" validate constraint "organization_account_managers_account_manager_id_fkey";

alter table "public"."organization_account_managers" add constraint "organization_account_managers_organization_id_account_manag_key" UNIQUE using index "organization_account_managers_organization_id_account_manag_key";

alter table "public"."organization_account_managers" add constraint "organization_account_managers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_account_managers" validate constraint "organization_account_managers_organization_id_fkey";

alter table "public"."pe_input_logic_actions" add constraint "pe_input_logic_actions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.pricing_engine_input_categories(id) not valid;

alter table "public"."pe_input_logic_actions" validate constraint "pe_input_logic_actions_category_id_fkey";

alter table "public"."pe_input_logic_actions" add constraint "pe_input_logic_actions_input_id_fkey" FOREIGN KEY (input_id) REFERENCES public.pricing_engine_inputs(id) not valid;

alter table "public"."pe_input_logic_actions" validate constraint "pe_input_logic_actions_input_id_fkey";

alter table "public"."pe_input_logic_actions" add constraint "pe_input_logic_actions_pe_input_logic_id_fkey" FOREIGN KEY (pe_input_logic_id) REFERENCES public.pe_input_logic(id) ON DELETE CASCADE not valid;

alter table "public"."pe_input_logic_actions" validate constraint "pe_input_logic_actions_pe_input_logic_id_fkey";

alter table "public"."pe_input_logic_actions" add constraint "pe_input_logic_actions_value_field_fkey" FOREIGN KEY (value_field) REFERENCES public.pricing_engine_inputs(id) not valid;

alter table "public"."pe_input_logic_actions" validate constraint "pe_input_logic_actions_value_field_fkey";

alter table "public"."pe_input_logic_conditions" add constraint "pe_input_logic_conditions_field_fkey" FOREIGN KEY (field) REFERENCES public.pricing_engine_inputs(id) not valid;

alter table "public"."pe_input_logic_conditions" validate constraint "pe_input_logic_conditions_field_fkey";

alter table "public"."pe_input_logic_conditions" add constraint "pe_input_logic_conditions_pe_input_logic_id_fkey" FOREIGN KEY (pe_input_logic_id) REFERENCES public.pe_input_logic(id) ON DELETE CASCADE not valid;

alter table "public"."pe_input_logic_conditions" validate constraint "pe_input_logic_conditions_pe_input_logic_id_fkey";

alter table "public"."pe_input_logic_conditions" add constraint "pe_input_logic_conditions_value_field_fkey" FOREIGN KEY (value_field) REFERENCES public.pricing_engine_inputs(id) not valid;

alter table "public"."pe_input_logic_conditions" validate constraint "pe_input_logic_conditions_value_field_fkey";

alter table "public"."pe_section_button_actions" add constraint "pe_section_button_actions_action_type_check" CHECK ((action_type = ANY (ARRAY['google_maps'::text, 'workflow'::text]))) not valid;

alter table "public"."pe_section_button_actions" validate constraint "pe_section_button_actions_action_type_check";

alter table "public"."pe_section_button_actions" add constraint "pe_section_button_actions_button_id_fkey" FOREIGN KEY (button_id) REFERENCES public.pe_section_buttons(id) ON DELETE CASCADE not valid;

alter table "public"."pe_section_button_actions" validate constraint "pe_section_button_actions_button_id_fkey";

alter table "public"."pe_section_buttons" add constraint "pe_section_buttons_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.pricing_engine_input_categories(id) ON DELETE CASCADE not valid;

alter table "public"."pe_section_buttons" validate constraint "pe_section_buttons_category_id_fkey";

alter table "public"."pe_term_sheet_conditions" add constraint "pe_term_sheet_conditions_pe_term_sheet_rule_id_fkey" FOREIGN KEY (pe_term_sheet_rule_id) REFERENCES public.pe_term_sheet_rules(id) ON DELETE CASCADE not valid;

alter table "public"."pe_term_sheet_conditions" validate constraint "pe_term_sheet_conditions_pe_term_sheet_rule_id_fkey";

alter table "public"."pe_term_sheet_conditions" add constraint "pe_term_sheet_conditions_value_type_check" CHECK ((value_type = ANY (ARRAY['value'::text, 'field'::text, 'expression'::text]))) not valid;

alter table "public"."pe_term_sheet_conditions" validate constraint "pe_term_sheet_conditions_value_type_check";

alter table "public"."pe_term_sheet_rules" add constraint "pe_term_sheet_rules_logic_type_check" CHECK ((logic_type = ANY (ARRAY['AND'::text, 'OR'::text]))) not valid;

alter table "public"."pe_term_sheet_rules" validate constraint "pe_term_sheet_rules_logic_type_check";

alter table "public"."pe_term_sheet_rules" add constraint "pe_term_sheet_rules_pe_term_sheet_id_fkey" FOREIGN KEY (pe_term_sheet_id) REFERENCES public.pe_term_sheets(id) ON DELETE CASCADE not valid;

alter table "public"."pe_term_sheet_rules" validate constraint "pe_term_sheet_rules_pe_term_sheet_id_fkey";

alter table "public"."pe_term_sheets" add constraint "pe_term_sheets_document_template_id_fkey" FOREIGN KEY (document_template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE not valid;

alter table "public"."pe_term_sheets" validate constraint "pe_term_sheets_document_template_id_fkey";

alter table "public"."pe_term_sheets" add constraint "pe_term_sheets_document_template_id_key" UNIQUE using index "pe_term_sheets_document_template_id_key";

alter table "public"."pe_term_sheets" add constraint "pe_term_sheets_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."pe_term_sheets" validate constraint "pe_term_sheets_status_check";

alter table "public"."pricing_engine_inputs" add constraint "pricing_engine_inputs_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.pricing_engine_input_categories(id) ON DELETE CASCADE not valid;

alter table "public"."pricing_engine_inputs" validate constraint "pricing_engine_inputs_category_id_fkey";

alter table "public"."pricing_engine_inputs" add constraint "pricing_engine_inputs_input_code_key" UNIQUE using index "pricing_engine_inputs_input_code_key";

alter table "public"."program_conditions" add constraint "program_conditions_field_fkey" FOREIGN KEY (field) REFERENCES public.pricing_engine_inputs(id) not valid;

alter table "public"."program_conditions" validate constraint "program_conditions_field_fkey";

alter table "public"."program_conditions" add constraint "program_conditions_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE not valid;

alter table "public"."program_conditions" validate constraint "program_conditions_program_id_fkey";

alter table "public"."program_conditions" add constraint "program_conditions_value_field_fkey" FOREIGN KEY (value_field) REFERENCES public.pricing_engine_inputs(id) not valid;

alter table "public"."program_conditions" validate constraint "program_conditions_value_field_fkey";

alter table "public"."scenario_program_results" add constraint "scenario_program_results_loan_scenario_id_fkey" FOREIGN KEY (loan_scenario_id) REFERENCES public.loan_scenarios(id) ON DELETE CASCADE not valid;

alter table "public"."scenario_program_results" validate constraint "scenario_program_results_loan_scenario_id_fkey";

alter table "public"."scenario_program_results" add constraint "scenario_program_results_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public.programs(id) not valid;

alter table "public"."scenario_program_results" validate constraint "scenario_program_results_program_id_fkey";

alter table "public"."scenario_rate_options" add constraint "scenario_rate_options_scenario_program_result_id_fkey" FOREIGN KEY (scenario_program_result_id) REFERENCES public.scenario_program_results(id) ON DELETE CASCADE not valid;

alter table "public"."scenario_rate_options" validate constraint "scenario_rate_options_scenario_program_result_id_fkey";

alter table "public"."appraisal" add constraint "appraisal_amc_id_fkey" FOREIGN KEY (amc_id) REFERENCES public.integration_setup(id) ON DELETE SET NULL not valid;

alter table "public"."appraisal" validate constraint "appraisal_amc_id_fkey";

alter table "public"."organization_policies" add constraint "organization_policies_action_check" CHECK ((action = ANY (ARRAY['select'::text, 'insert'::text, 'update'::text, 'delete'::text, 'all'::text, 'submit'::text, 'view'::text]))) not valid;

alter table "public"."organization_policies" validate constraint "organization_policies_action_check";

alter table "public"."organization_policies" add constraint "organization_policies_resource_type_check" CHECK ((resource_type = ANY (ARRAY['table'::text, 'storage_bucket'::text, 'feature'::text, 'route'::text]))) not valid;

alter table "public"."organization_policies" validate constraint "organization_policies_resource_type_check";

alter table "public"."pricing_activity_log" add constraint "pricing_activity_log_action_check" CHECK ((action = ANY (ARRAY['changed'::text, 'added'::text, 'deleted'::text, 'downloaded'::text, 'shared'::text, 'archived'::text, 'restored'::text]))) not valid;

alter table "public"."pricing_activity_log" validate constraint "pricing_activity_log_action_check";

alter table "public"."pricing_activity_log" add constraint "pricing_activity_log_activity_type_check" CHECK ((activity_type = ANY (ARRAY['input_changes'::text, 'selection_changed'::text, 'user_assignment'::text, 'term_sheet'::text, 'status_change'::text]))) not valid;

alter table "public"."pricing_activity_log" validate constraint "pricing_activity_log_activity_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_application_display_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_loan_display_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.match_llama_document_chunks_vs(query_embedding public.vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.match_program_document_chunks(query_embedding public.vector, match_count integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.notify_background_report_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM net.http_post(
    url   := 'https://n8n.axora.info/webhook/f1987345-8e50-4ecc-a2b9-986bc00fb50b',
    body  := to_jsonb(NEW.*),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.register_integration_feature_policy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.seed_custom_broker_settings_on_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trg_loan_scenario_inputs_sync_applications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cascade_archive()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding public.vector, match_count integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.match_llama_document_chunks(query_embedding public.vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_application_from_primary_scenario(p_loan_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_primary_scenario_from_application(p_loan_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trg_loan_scenarios_sync_applications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

grant delete on table "public"."appraisal_investor_list" to "anon";

grant insert on table "public"."appraisal_investor_list" to "anon";

grant references on table "public"."appraisal_investor_list" to "anon";

grant select on table "public"."appraisal_investor_list" to "anon";

grant trigger on table "public"."appraisal_investor_list" to "anon";

grant truncate on table "public"."appraisal_investor_list" to "anon";

grant update on table "public"."appraisal_investor_list" to "anon";

grant delete on table "public"."appraisal_investor_list" to "authenticated";

grant insert on table "public"."appraisal_investor_list" to "authenticated";

grant references on table "public"."appraisal_investor_list" to "authenticated";

grant select on table "public"."appraisal_investor_list" to "authenticated";

grant trigger on table "public"."appraisal_investor_list" to "authenticated";

grant truncate on table "public"."appraisal_investor_list" to "authenticated";

grant update on table "public"."appraisal_investor_list" to "authenticated";

grant delete on table "public"."appraisal_investor_list" to "service_role";

grant insert on table "public"."appraisal_investor_list" to "service_role";

grant references on table "public"."appraisal_investor_list" to "service_role";

grant select on table "public"."appraisal_investor_list" to "service_role";

grant trigger on table "public"."appraisal_investor_list" to "service_role";

grant truncate on table "public"."appraisal_investor_list" to "service_role";

grant update on table "public"."appraisal_investor_list" to "service_role";

grant delete on table "public"."appraisal_lender_list" to "anon";

grant insert on table "public"."appraisal_lender_list" to "anon";

grant references on table "public"."appraisal_lender_list" to "anon";

grant select on table "public"."appraisal_lender_list" to "anon";

grant trigger on table "public"."appraisal_lender_list" to "anon";

grant truncate on table "public"."appraisal_lender_list" to "anon";

grant update on table "public"."appraisal_lender_list" to "anon";

grant delete on table "public"."appraisal_lender_list" to "authenticated";

grant insert on table "public"."appraisal_lender_list" to "authenticated";

grant references on table "public"."appraisal_lender_list" to "authenticated";

grant select on table "public"."appraisal_lender_list" to "authenticated";

grant trigger on table "public"."appraisal_lender_list" to "authenticated";

grant truncate on table "public"."appraisal_lender_list" to "authenticated";

grant update on table "public"."appraisal_lender_list" to "authenticated";

grant delete on table "public"."appraisal_lender_list" to "service_role";

grant insert on table "public"."appraisal_lender_list" to "service_role";

grant references on table "public"."appraisal_lender_list" to "service_role";

grant select on table "public"."appraisal_lender_list" to "service_role";

grant trigger on table "public"."appraisal_lender_list" to "service_role";

grant truncate on table "public"."appraisal_lender_list" to "service_role";

grant update on table "public"."appraisal_lender_list" to "service_role";

grant delete on table "public"."appraisal_loan_type_list" to "anon";

grant insert on table "public"."appraisal_loan_type_list" to "anon";

grant references on table "public"."appraisal_loan_type_list" to "anon";

grant select on table "public"."appraisal_loan_type_list" to "anon";

grant trigger on table "public"."appraisal_loan_type_list" to "anon";

grant truncate on table "public"."appraisal_loan_type_list" to "anon";

grant update on table "public"."appraisal_loan_type_list" to "anon";

grant delete on table "public"."appraisal_loan_type_list" to "authenticated";

grant insert on table "public"."appraisal_loan_type_list" to "authenticated";

grant references on table "public"."appraisal_loan_type_list" to "authenticated";

grant select on table "public"."appraisal_loan_type_list" to "authenticated";

grant trigger on table "public"."appraisal_loan_type_list" to "authenticated";

grant truncate on table "public"."appraisal_loan_type_list" to "authenticated";

grant update on table "public"."appraisal_loan_type_list" to "authenticated";

grant delete on table "public"."appraisal_loan_type_list" to "service_role";

grant insert on table "public"."appraisal_loan_type_list" to "service_role";

grant references on table "public"."appraisal_loan_type_list" to "service_role";

grant select on table "public"."appraisal_loan_type_list" to "service_role";

grant trigger on table "public"."appraisal_loan_type_list" to "service_role";

grant truncate on table "public"."appraisal_loan_type_list" to "service_role";

grant update on table "public"."appraisal_loan_type_list" to "service_role";

grant delete on table "public"."appraisal_occupancy_list" to "anon";

grant insert on table "public"."appraisal_occupancy_list" to "anon";

grant references on table "public"."appraisal_occupancy_list" to "anon";

grant select on table "public"."appraisal_occupancy_list" to "anon";

grant trigger on table "public"."appraisal_occupancy_list" to "anon";

grant truncate on table "public"."appraisal_occupancy_list" to "anon";

grant update on table "public"."appraisal_occupancy_list" to "anon";

grant delete on table "public"."appraisal_occupancy_list" to "authenticated";

grant insert on table "public"."appraisal_occupancy_list" to "authenticated";

grant references on table "public"."appraisal_occupancy_list" to "authenticated";

grant select on table "public"."appraisal_occupancy_list" to "authenticated";

grant trigger on table "public"."appraisal_occupancy_list" to "authenticated";

grant truncate on table "public"."appraisal_occupancy_list" to "authenticated";

grant update on table "public"."appraisal_occupancy_list" to "authenticated";

grant delete on table "public"."appraisal_occupancy_list" to "service_role";

grant insert on table "public"."appraisal_occupancy_list" to "service_role";

grant references on table "public"."appraisal_occupancy_list" to "service_role";

grant select on table "public"."appraisal_occupancy_list" to "service_role";

grant trigger on table "public"."appraisal_occupancy_list" to "service_role";

grant truncate on table "public"."appraisal_occupancy_list" to "service_role";

grant update on table "public"."appraisal_occupancy_list" to "service_role";

grant delete on table "public"."appraisal_product_list" to "anon";

grant insert on table "public"."appraisal_product_list" to "anon";

grant references on table "public"."appraisal_product_list" to "anon";

grant select on table "public"."appraisal_product_list" to "anon";

grant trigger on table "public"."appraisal_product_list" to "anon";

grant truncate on table "public"."appraisal_product_list" to "anon";

grant update on table "public"."appraisal_product_list" to "anon";

grant delete on table "public"."appraisal_product_list" to "authenticated";

grant insert on table "public"."appraisal_product_list" to "authenticated";

grant references on table "public"."appraisal_product_list" to "authenticated";

grant select on table "public"."appraisal_product_list" to "authenticated";

grant trigger on table "public"."appraisal_product_list" to "authenticated";

grant truncate on table "public"."appraisal_product_list" to "authenticated";

grant update on table "public"."appraisal_product_list" to "authenticated";

grant delete on table "public"."appraisal_product_list" to "service_role";

grant insert on table "public"."appraisal_product_list" to "service_role";

grant references on table "public"."appraisal_product_list" to "service_role";

grant select on table "public"."appraisal_product_list" to "service_role";

grant trigger on table "public"."appraisal_product_list" to "service_role";

grant truncate on table "public"."appraisal_product_list" to "service_role";

grant update on table "public"."appraisal_product_list" to "service_role";

grant delete on table "public"."appraisal_property_list" to "anon";

grant insert on table "public"."appraisal_property_list" to "anon";

grant references on table "public"."appraisal_property_list" to "anon";

grant select on table "public"."appraisal_property_list" to "anon";

grant trigger on table "public"."appraisal_property_list" to "anon";

grant truncate on table "public"."appraisal_property_list" to "anon";

grant update on table "public"."appraisal_property_list" to "anon";

grant delete on table "public"."appraisal_property_list" to "authenticated";

grant insert on table "public"."appraisal_property_list" to "authenticated";

grant references on table "public"."appraisal_property_list" to "authenticated";

grant select on table "public"."appraisal_property_list" to "authenticated";

grant trigger on table "public"."appraisal_property_list" to "authenticated";

grant truncate on table "public"."appraisal_property_list" to "authenticated";

grant update on table "public"."appraisal_property_list" to "authenticated";

grant delete on table "public"."appraisal_property_list" to "service_role";

grant insert on table "public"."appraisal_property_list" to "service_role";

grant references on table "public"."appraisal_property_list" to "service_role";

grant select on table "public"."appraisal_property_list" to "service_role";

grant trigger on table "public"."appraisal_property_list" to "service_role";

grant truncate on table "public"."appraisal_property_list" to "service_role";

grant update on table "public"."appraisal_property_list" to "service_role";

grant delete on table "public"."appraisal_transaction_type_list" to "anon";

grant insert on table "public"."appraisal_transaction_type_list" to "anon";

grant references on table "public"."appraisal_transaction_type_list" to "anon";

grant select on table "public"."appraisal_transaction_type_list" to "anon";

grant trigger on table "public"."appraisal_transaction_type_list" to "anon";

grant truncate on table "public"."appraisal_transaction_type_list" to "anon";

grant update on table "public"."appraisal_transaction_type_list" to "anon";

grant delete on table "public"."appraisal_transaction_type_list" to "authenticated";

grant insert on table "public"."appraisal_transaction_type_list" to "authenticated";

grant references on table "public"."appraisal_transaction_type_list" to "authenticated";

grant select on table "public"."appraisal_transaction_type_list" to "authenticated";

grant trigger on table "public"."appraisal_transaction_type_list" to "authenticated";

grant truncate on table "public"."appraisal_transaction_type_list" to "authenticated";

grant update on table "public"."appraisal_transaction_type_list" to "authenticated";

grant delete on table "public"."appraisal_transaction_type_list" to "service_role";

grant insert on table "public"."appraisal_transaction_type_list" to "service_role";

grant references on table "public"."appraisal_transaction_type_list" to "service_role";

grant select on table "public"."appraisal_transaction_type_list" to "service_role";

grant trigger on table "public"."appraisal_transaction_type_list" to "service_role";

grant truncate on table "public"."appraisal_transaction_type_list" to "service_role";

grant update on table "public"."appraisal_transaction_type_list" to "service_role";

grant delete on table "public"."background_person_search" to "anon";

grant insert on table "public"."background_person_search" to "anon";

grant references on table "public"."background_person_search" to "anon";

grant select on table "public"."background_person_search" to "anon";

grant trigger on table "public"."background_person_search" to "anon";

grant truncate on table "public"."background_person_search" to "anon";

grant update on table "public"."background_person_search" to "anon";

grant delete on table "public"."background_person_search" to "authenticated";

grant insert on table "public"."background_person_search" to "authenticated";

grant references on table "public"."background_person_search" to "authenticated";

grant select on table "public"."background_person_search" to "authenticated";

grant trigger on table "public"."background_person_search" to "authenticated";

grant truncate on table "public"."background_person_search" to "authenticated";

grant update on table "public"."background_person_search" to "authenticated";

grant delete on table "public"."background_person_search" to "service_role";

grant insert on table "public"."background_person_search" to "service_role";

grant references on table "public"."background_person_search" to "service_role";

grant select on table "public"."background_person_search" to "service_role";

grant trigger on table "public"."background_person_search" to "service_role";

grant truncate on table "public"."background_person_search" to "service_role";

grant update on table "public"."background_person_search" to "service_role";

grant delete on table "public"."background_person_search_bankruptcy" to "anon";

grant insert on table "public"."background_person_search_bankruptcy" to "anon";

grant references on table "public"."background_person_search_bankruptcy" to "anon";

grant select on table "public"."background_person_search_bankruptcy" to "anon";

grant trigger on table "public"."background_person_search_bankruptcy" to "anon";

grant truncate on table "public"."background_person_search_bankruptcy" to "anon";

grant update on table "public"."background_person_search_bankruptcy" to "anon";

grant delete on table "public"."background_person_search_bankruptcy" to "authenticated";

grant insert on table "public"."background_person_search_bankruptcy" to "authenticated";

grant references on table "public"."background_person_search_bankruptcy" to "authenticated";

grant select on table "public"."background_person_search_bankruptcy" to "authenticated";

grant trigger on table "public"."background_person_search_bankruptcy" to "authenticated";

grant truncate on table "public"."background_person_search_bankruptcy" to "authenticated";

grant update on table "public"."background_person_search_bankruptcy" to "authenticated";

grant delete on table "public"."background_person_search_bankruptcy" to "service_role";

grant insert on table "public"."background_person_search_bankruptcy" to "service_role";

grant references on table "public"."background_person_search_bankruptcy" to "service_role";

grant select on table "public"."background_person_search_bankruptcy" to "service_role";

grant trigger on table "public"."background_person_search_bankruptcy" to "service_role";

grant truncate on table "public"."background_person_search_bankruptcy" to "service_role";

grant update on table "public"."background_person_search_bankruptcy" to "service_role";

grant delete on table "public"."background_person_search_criminal" to "anon";

grant insert on table "public"."background_person_search_criminal" to "anon";

grant references on table "public"."background_person_search_criminal" to "anon";

grant select on table "public"."background_person_search_criminal" to "anon";

grant trigger on table "public"."background_person_search_criminal" to "anon";

grant truncate on table "public"."background_person_search_criminal" to "anon";

grant update on table "public"."background_person_search_criminal" to "anon";

grant delete on table "public"."background_person_search_criminal" to "authenticated";

grant insert on table "public"."background_person_search_criminal" to "authenticated";

grant references on table "public"."background_person_search_criminal" to "authenticated";

grant select on table "public"."background_person_search_criminal" to "authenticated";

grant trigger on table "public"."background_person_search_criminal" to "authenticated";

grant truncate on table "public"."background_person_search_criminal" to "authenticated";

grant update on table "public"."background_person_search_criminal" to "authenticated";

grant delete on table "public"."background_person_search_criminal" to "service_role";

grant insert on table "public"."background_person_search_criminal" to "service_role";

grant references on table "public"."background_person_search_criminal" to "service_role";

grant select on table "public"."background_person_search_criminal" to "service_role";

grant trigger on table "public"."background_person_search_criminal" to "service_role";

grant truncate on table "public"."background_person_search_criminal" to "service_role";

grant update on table "public"."background_person_search_criminal" to "service_role";

grant delete on table "public"."background_person_search_lien" to "anon";

grant insert on table "public"."background_person_search_lien" to "anon";

grant references on table "public"."background_person_search_lien" to "anon";

grant select on table "public"."background_person_search_lien" to "anon";

grant trigger on table "public"."background_person_search_lien" to "anon";

grant truncate on table "public"."background_person_search_lien" to "anon";

grant update on table "public"."background_person_search_lien" to "anon";

grant delete on table "public"."background_person_search_lien" to "authenticated";

grant insert on table "public"."background_person_search_lien" to "authenticated";

grant references on table "public"."background_person_search_lien" to "authenticated";

grant select on table "public"."background_person_search_lien" to "authenticated";

grant trigger on table "public"."background_person_search_lien" to "authenticated";

grant truncate on table "public"."background_person_search_lien" to "authenticated";

grant update on table "public"."background_person_search_lien" to "authenticated";

grant delete on table "public"."background_person_search_lien" to "service_role";

grant insert on table "public"."background_person_search_lien" to "service_role";

grant references on table "public"."background_person_search_lien" to "service_role";

grant select on table "public"."background_person_search_lien" to "service_role";

grant trigger on table "public"."background_person_search_lien" to "service_role";

grant truncate on table "public"."background_person_search_lien" to "service_role";

grant update on table "public"."background_person_search_lien" to "service_role";

grant delete on table "public"."background_person_search_litigation" to "anon";

grant insert on table "public"."background_person_search_litigation" to "anon";

grant references on table "public"."background_person_search_litigation" to "anon";

grant select on table "public"."background_person_search_litigation" to "anon";

grant trigger on table "public"."background_person_search_litigation" to "anon";

grant truncate on table "public"."background_person_search_litigation" to "anon";

grant update on table "public"."background_person_search_litigation" to "anon";

grant delete on table "public"."background_person_search_litigation" to "authenticated";

grant insert on table "public"."background_person_search_litigation" to "authenticated";

grant references on table "public"."background_person_search_litigation" to "authenticated";

grant select on table "public"."background_person_search_litigation" to "authenticated";

grant trigger on table "public"."background_person_search_litigation" to "authenticated";

grant truncate on table "public"."background_person_search_litigation" to "authenticated";

grant update on table "public"."background_person_search_litigation" to "authenticated";

grant delete on table "public"."background_person_search_litigation" to "service_role";

grant insert on table "public"."background_person_search_litigation" to "service_role";

grant references on table "public"."background_person_search_litigation" to "service_role";

grant select on table "public"."background_person_search_litigation" to "service_role";

grant trigger on table "public"."background_person_search_litigation" to "service_role";

grant truncate on table "public"."background_person_search_litigation" to "service_role";

grant update on table "public"."background_person_search_litigation" to "service_role";

grant delete on table "public"."background_person_search_quick_analysis" to "anon";

grant insert on table "public"."background_person_search_quick_analysis" to "anon";

grant references on table "public"."background_person_search_quick_analysis" to "anon";

grant select on table "public"."background_person_search_quick_analysis" to "anon";

grant trigger on table "public"."background_person_search_quick_analysis" to "anon";

grant truncate on table "public"."background_person_search_quick_analysis" to "anon";

grant update on table "public"."background_person_search_quick_analysis" to "anon";

grant delete on table "public"."background_person_search_quick_analysis" to "authenticated";

grant insert on table "public"."background_person_search_quick_analysis" to "authenticated";

grant references on table "public"."background_person_search_quick_analysis" to "authenticated";

grant select on table "public"."background_person_search_quick_analysis" to "authenticated";

grant trigger on table "public"."background_person_search_quick_analysis" to "authenticated";

grant truncate on table "public"."background_person_search_quick_analysis" to "authenticated";

grant update on table "public"."background_person_search_quick_analysis" to "authenticated";

grant delete on table "public"."background_person_search_quick_analysis" to "service_role";

grant insert on table "public"."background_person_search_quick_analysis" to "service_role";

grant references on table "public"."background_person_search_quick_analysis" to "service_role";

grant select on table "public"."background_person_search_quick_analysis" to "service_role";

grant trigger on table "public"."background_person_search_quick_analysis" to "service_role";

grant truncate on table "public"."background_person_search_quick_analysis" to "service_role";

grant update on table "public"."background_person_search_quick_analysis" to "service_role";

grant delete on table "public"."background_person_search_ucc" to "anon";

grant insert on table "public"."background_person_search_ucc" to "anon";

grant references on table "public"."background_person_search_ucc" to "anon";

grant select on table "public"."background_person_search_ucc" to "anon";

grant trigger on table "public"."background_person_search_ucc" to "anon";

grant truncate on table "public"."background_person_search_ucc" to "anon";

grant update on table "public"."background_person_search_ucc" to "anon";

grant delete on table "public"."background_person_search_ucc" to "authenticated";

grant insert on table "public"."background_person_search_ucc" to "authenticated";

grant references on table "public"."background_person_search_ucc" to "authenticated";

grant select on table "public"."background_person_search_ucc" to "authenticated";

grant trigger on table "public"."background_person_search_ucc" to "authenticated";

grant truncate on table "public"."background_person_search_ucc" to "authenticated";

grant update on table "public"."background_person_search_ucc" to "authenticated";

grant delete on table "public"."background_person_search_ucc" to "service_role";

grant insert on table "public"."background_person_search_ucc" to "service_role";

grant references on table "public"."background_person_search_ucc" to "service_role";

grant select on table "public"."background_person_search_ucc" to "service_role";

grant trigger on table "public"."background_person_search_ucc" to "service_role";

grant truncate on table "public"."background_person_search_ucc" to "service_role";

grant update on table "public"."background_person_search_ucc" to "service_role";

grant delete on table "public"."deal_users" to "anon";

grant insert on table "public"."deal_users" to "anon";

grant references on table "public"."deal_users" to "anon";

grant select on table "public"."deal_users" to "anon";

grant trigger on table "public"."deal_users" to "anon";

grant truncate on table "public"."deal_users" to "anon";

grant update on table "public"."deal_users" to "anon";

grant delete on table "public"."deal_users" to "authenticated";

grant insert on table "public"."deal_users" to "authenticated";

grant references on table "public"."deal_users" to "authenticated";

grant select on table "public"."deal_users" to "authenticated";

grant trigger on table "public"."deal_users" to "authenticated";

grant truncate on table "public"."deal_users" to "authenticated";

grant update on table "public"."deal_users" to "authenticated";

grant delete on table "public"."deal_users" to "service_role";

grant insert on table "public"."deal_users" to "service_role";

grant references on table "public"."deal_users" to "service_role";

grant select on table "public"."deal_users" to "service_role";

grant trigger on table "public"."deal_users" to "service_role";

grant truncate on table "public"."deal_users" to "service_role";

grant update on table "public"."deal_users" to "service_role";

grant delete on table "public"."document_files_background_reports" to "anon";

grant insert on table "public"."document_files_background_reports" to "anon";

grant references on table "public"."document_files_background_reports" to "anon";

grant select on table "public"."document_files_background_reports" to "anon";

grant trigger on table "public"."document_files_background_reports" to "anon";

grant truncate on table "public"."document_files_background_reports" to "anon";

grant update on table "public"."document_files_background_reports" to "anon";

grant delete on table "public"."document_files_background_reports" to "authenticated";

grant insert on table "public"."document_files_background_reports" to "authenticated";

grant references on table "public"."document_files_background_reports" to "authenticated";

grant select on table "public"."document_files_background_reports" to "authenticated";

grant trigger on table "public"."document_files_background_reports" to "authenticated";

grant truncate on table "public"."document_files_background_reports" to "authenticated";

grant update on table "public"."document_files_background_reports" to "authenticated";

grant delete on table "public"."document_files_background_reports" to "service_role";

grant insert on table "public"."document_files_background_reports" to "service_role";

grant references on table "public"."document_files_background_reports" to "service_role";

grant select on table "public"."document_files_background_reports" to "service_role";

grant trigger on table "public"."document_files_background_reports" to "service_role";

grant truncate on table "public"."document_files_background_reports" to "service_role";

grant update on table "public"."document_files_background_reports" to "service_role";

grant delete on table "public"."document_template_variables" to "anon";

grant insert on table "public"."document_template_variables" to "anon";

grant references on table "public"."document_template_variables" to "anon";

grant select on table "public"."document_template_variables" to "anon";

grant trigger on table "public"."document_template_variables" to "anon";

grant truncate on table "public"."document_template_variables" to "anon";

grant update on table "public"."document_template_variables" to "anon";

grant delete on table "public"."document_template_variables" to "authenticated";

grant insert on table "public"."document_template_variables" to "authenticated";

grant references on table "public"."document_template_variables" to "authenticated";

grant select on table "public"."document_template_variables" to "authenticated";

grant trigger on table "public"."document_template_variables" to "authenticated";

grant truncate on table "public"."document_template_variables" to "authenticated";

grant update on table "public"."document_template_variables" to "authenticated";

grant delete on table "public"."document_template_variables" to "service_role";

grant insert on table "public"."document_template_variables" to "service_role";

grant references on table "public"."document_template_variables" to "service_role";

grant select on table "public"."document_template_variables" to "service_role";

grant trigger on table "public"."document_template_variables" to "service_role";

grant truncate on table "public"."document_template_variables" to "service_role";

grant update on table "public"."document_template_variables" to "service_role";

grant delete on table "public"."integration_settings" to "anon";

grant insert on table "public"."integration_settings" to "anon";

grant references on table "public"."integration_settings" to "anon";

grant select on table "public"."integration_settings" to "anon";

grant trigger on table "public"."integration_settings" to "anon";

grant truncate on table "public"."integration_settings" to "anon";

grant update on table "public"."integration_settings" to "anon";

grant delete on table "public"."integration_settings" to "authenticated";

grant insert on table "public"."integration_settings" to "authenticated";

grant references on table "public"."integration_settings" to "authenticated";

grant select on table "public"."integration_settings" to "authenticated";

grant trigger on table "public"."integration_settings" to "authenticated";

grant truncate on table "public"."integration_settings" to "authenticated";

grant update on table "public"."integration_settings" to "authenticated";

grant delete on table "public"."integration_settings" to "service_role";

grant insert on table "public"."integration_settings" to "service_role";

grant references on table "public"."integration_settings" to "service_role";

grant select on table "public"."integration_settings" to "service_role";

grant trigger on table "public"."integration_settings" to "service_role";

grant truncate on table "public"."integration_settings" to "service_role";

grant update on table "public"."integration_settings" to "service_role";

grant delete on table "public"."integration_setup" to "anon";

grant insert on table "public"."integration_setup" to "anon";

grant references on table "public"."integration_setup" to "anon";

grant select on table "public"."integration_setup" to "anon";

grant trigger on table "public"."integration_setup" to "anon";

grant truncate on table "public"."integration_setup" to "anon";

grant update on table "public"."integration_setup" to "anon";

grant delete on table "public"."integration_setup" to "authenticated";

grant insert on table "public"."integration_setup" to "authenticated";

grant references on table "public"."integration_setup" to "authenticated";

grant select on table "public"."integration_setup" to "authenticated";

grant trigger on table "public"."integration_setup" to "authenticated";

grant truncate on table "public"."integration_setup" to "authenticated";

grant update on table "public"."integration_setup" to "authenticated";

grant delete on table "public"."integration_setup" to "service_role";

grant insert on table "public"."integration_setup" to "service_role";

grant references on table "public"."integration_setup" to "service_role";

grant select on table "public"."integration_setup" to "service_role";

grant trigger on table "public"."integration_setup" to "service_role";

grant truncate on table "public"."integration_setup" to "service_role";

grant update on table "public"."integration_setup" to "service_role";

grant delete on table "public"."integration_tags" to "anon";

grant insert on table "public"."integration_tags" to "anon";

grant references on table "public"."integration_tags" to "anon";

grant select on table "public"."integration_tags" to "anon";

grant trigger on table "public"."integration_tags" to "anon";

grant truncate on table "public"."integration_tags" to "anon";

grant update on table "public"."integration_tags" to "anon";

grant delete on table "public"."integration_tags" to "authenticated";

grant insert on table "public"."integration_tags" to "authenticated";

grant references on table "public"."integration_tags" to "authenticated";

grant select on table "public"."integration_tags" to "authenticated";

grant trigger on table "public"."integration_tags" to "authenticated";

grant truncate on table "public"."integration_tags" to "authenticated";

grant update on table "public"."integration_tags" to "authenticated";

grant delete on table "public"."integration_tags" to "service_role";

grant insert on table "public"."integration_tags" to "service_role";

grant references on table "public"."integration_tags" to "service_role";

grant select on table "public"."integration_tags" to "service_role";

grant trigger on table "public"."integration_tags" to "service_role";

grant truncate on table "public"."integration_tags" to "service_role";

grant update on table "public"."integration_tags" to "service_role";

grant delete on table "public"."loan_scenario_inputs" to "anon";

grant insert on table "public"."loan_scenario_inputs" to "anon";

grant references on table "public"."loan_scenario_inputs" to "anon";

grant select on table "public"."loan_scenario_inputs" to "anon";

grant trigger on table "public"."loan_scenario_inputs" to "anon";

grant truncate on table "public"."loan_scenario_inputs" to "anon";

grant update on table "public"."loan_scenario_inputs" to "anon";

grant delete on table "public"."loan_scenario_inputs" to "authenticated";

grant insert on table "public"."loan_scenario_inputs" to "authenticated";

grant references on table "public"."loan_scenario_inputs" to "authenticated";

grant select on table "public"."loan_scenario_inputs" to "authenticated";

grant trigger on table "public"."loan_scenario_inputs" to "authenticated";

grant truncate on table "public"."loan_scenario_inputs" to "authenticated";

grant update on table "public"."loan_scenario_inputs" to "authenticated";

grant delete on table "public"."loan_scenario_inputs" to "service_role";

grant insert on table "public"."loan_scenario_inputs" to "service_role";

grant references on table "public"."loan_scenario_inputs" to "service_role";

grant select on table "public"."loan_scenario_inputs" to "service_role";

grant trigger on table "public"."loan_scenario_inputs" to "service_role";

grant truncate on table "public"."loan_scenario_inputs" to "service_role";

grant update on table "public"."loan_scenario_inputs" to "service_role";

grant delete on table "public"."organization_account_managers" to "anon";

grant insert on table "public"."organization_account_managers" to "anon";

grant references on table "public"."organization_account_managers" to "anon";

grant select on table "public"."organization_account_managers" to "anon";

grant trigger on table "public"."organization_account_managers" to "anon";

grant truncate on table "public"."organization_account_managers" to "anon";

grant update on table "public"."organization_account_managers" to "anon";

grant delete on table "public"."organization_account_managers" to "authenticated";

grant insert on table "public"."organization_account_managers" to "authenticated";

grant references on table "public"."organization_account_managers" to "authenticated";

grant select on table "public"."organization_account_managers" to "authenticated";

grant trigger on table "public"."organization_account_managers" to "authenticated";

grant truncate on table "public"."organization_account_managers" to "authenticated";

grant update on table "public"."organization_account_managers" to "authenticated";

grant delete on table "public"."organization_account_managers" to "service_role";

grant insert on table "public"."organization_account_managers" to "service_role";

grant references on table "public"."organization_account_managers" to "service_role";

grant select on table "public"."organization_account_managers" to "service_role";

grant trigger on table "public"."organization_account_managers" to "service_role";

grant truncate on table "public"."organization_account_managers" to "service_role";

grant update on table "public"."organization_account_managers" to "service_role";

grant delete on table "public"."pe_input_logic" to "anon";

grant insert on table "public"."pe_input_logic" to "anon";

grant references on table "public"."pe_input_logic" to "anon";

grant select on table "public"."pe_input_logic" to "anon";

grant trigger on table "public"."pe_input_logic" to "anon";

grant truncate on table "public"."pe_input_logic" to "anon";

grant update on table "public"."pe_input_logic" to "anon";

grant delete on table "public"."pe_input_logic" to "authenticated";

grant insert on table "public"."pe_input_logic" to "authenticated";

grant references on table "public"."pe_input_logic" to "authenticated";

grant select on table "public"."pe_input_logic" to "authenticated";

grant trigger on table "public"."pe_input_logic" to "authenticated";

grant truncate on table "public"."pe_input_logic" to "authenticated";

grant update on table "public"."pe_input_logic" to "authenticated";

grant delete on table "public"."pe_input_logic" to "service_role";

grant insert on table "public"."pe_input_logic" to "service_role";

grant references on table "public"."pe_input_logic" to "service_role";

grant select on table "public"."pe_input_logic" to "service_role";

grant trigger on table "public"."pe_input_logic" to "service_role";

grant truncate on table "public"."pe_input_logic" to "service_role";

grant update on table "public"."pe_input_logic" to "service_role";

grant delete on table "public"."pe_input_logic_actions" to "anon";

grant insert on table "public"."pe_input_logic_actions" to "anon";

grant references on table "public"."pe_input_logic_actions" to "anon";

grant select on table "public"."pe_input_logic_actions" to "anon";

grant trigger on table "public"."pe_input_logic_actions" to "anon";

grant truncate on table "public"."pe_input_logic_actions" to "anon";

grant update on table "public"."pe_input_logic_actions" to "anon";

grant delete on table "public"."pe_input_logic_actions" to "authenticated";

grant insert on table "public"."pe_input_logic_actions" to "authenticated";

grant references on table "public"."pe_input_logic_actions" to "authenticated";

grant select on table "public"."pe_input_logic_actions" to "authenticated";

grant trigger on table "public"."pe_input_logic_actions" to "authenticated";

grant truncate on table "public"."pe_input_logic_actions" to "authenticated";

grant update on table "public"."pe_input_logic_actions" to "authenticated";

grant delete on table "public"."pe_input_logic_actions" to "service_role";

grant insert on table "public"."pe_input_logic_actions" to "service_role";

grant references on table "public"."pe_input_logic_actions" to "service_role";

grant select on table "public"."pe_input_logic_actions" to "service_role";

grant trigger on table "public"."pe_input_logic_actions" to "service_role";

grant truncate on table "public"."pe_input_logic_actions" to "service_role";

grant update on table "public"."pe_input_logic_actions" to "service_role";

grant delete on table "public"."pe_input_logic_conditions" to "anon";

grant insert on table "public"."pe_input_logic_conditions" to "anon";

grant references on table "public"."pe_input_logic_conditions" to "anon";

grant select on table "public"."pe_input_logic_conditions" to "anon";

grant trigger on table "public"."pe_input_logic_conditions" to "anon";

grant truncate on table "public"."pe_input_logic_conditions" to "anon";

grant update on table "public"."pe_input_logic_conditions" to "anon";

grant delete on table "public"."pe_input_logic_conditions" to "authenticated";

grant insert on table "public"."pe_input_logic_conditions" to "authenticated";

grant references on table "public"."pe_input_logic_conditions" to "authenticated";

grant select on table "public"."pe_input_logic_conditions" to "authenticated";

grant trigger on table "public"."pe_input_logic_conditions" to "authenticated";

grant truncate on table "public"."pe_input_logic_conditions" to "authenticated";

grant update on table "public"."pe_input_logic_conditions" to "authenticated";

grant delete on table "public"."pe_input_logic_conditions" to "service_role";

grant insert on table "public"."pe_input_logic_conditions" to "service_role";

grant references on table "public"."pe_input_logic_conditions" to "service_role";

grant select on table "public"."pe_input_logic_conditions" to "service_role";

grant trigger on table "public"."pe_input_logic_conditions" to "service_role";

grant truncate on table "public"."pe_input_logic_conditions" to "service_role";

grant update on table "public"."pe_input_logic_conditions" to "service_role";

grant delete on table "public"."pe_section_button_actions" to "anon";

grant insert on table "public"."pe_section_button_actions" to "anon";

grant references on table "public"."pe_section_button_actions" to "anon";

grant select on table "public"."pe_section_button_actions" to "anon";

grant trigger on table "public"."pe_section_button_actions" to "anon";

grant truncate on table "public"."pe_section_button_actions" to "anon";

grant update on table "public"."pe_section_button_actions" to "anon";

grant delete on table "public"."pe_section_button_actions" to "authenticated";

grant insert on table "public"."pe_section_button_actions" to "authenticated";

grant references on table "public"."pe_section_button_actions" to "authenticated";

grant select on table "public"."pe_section_button_actions" to "authenticated";

grant trigger on table "public"."pe_section_button_actions" to "authenticated";

grant truncate on table "public"."pe_section_button_actions" to "authenticated";

grant update on table "public"."pe_section_button_actions" to "authenticated";

grant delete on table "public"."pe_section_button_actions" to "service_role";

grant insert on table "public"."pe_section_button_actions" to "service_role";

grant references on table "public"."pe_section_button_actions" to "service_role";

grant select on table "public"."pe_section_button_actions" to "service_role";

grant trigger on table "public"."pe_section_button_actions" to "service_role";

grant truncate on table "public"."pe_section_button_actions" to "service_role";

grant update on table "public"."pe_section_button_actions" to "service_role";

grant delete on table "public"."pe_section_buttons" to "anon";

grant insert on table "public"."pe_section_buttons" to "anon";

grant references on table "public"."pe_section_buttons" to "anon";

grant select on table "public"."pe_section_buttons" to "anon";

grant trigger on table "public"."pe_section_buttons" to "anon";

grant truncate on table "public"."pe_section_buttons" to "anon";

grant update on table "public"."pe_section_buttons" to "anon";

grant delete on table "public"."pe_section_buttons" to "authenticated";

grant insert on table "public"."pe_section_buttons" to "authenticated";

grant references on table "public"."pe_section_buttons" to "authenticated";

grant select on table "public"."pe_section_buttons" to "authenticated";

grant trigger on table "public"."pe_section_buttons" to "authenticated";

grant truncate on table "public"."pe_section_buttons" to "authenticated";

grant update on table "public"."pe_section_buttons" to "authenticated";

grant delete on table "public"."pe_section_buttons" to "service_role";

grant insert on table "public"."pe_section_buttons" to "service_role";

grant references on table "public"."pe_section_buttons" to "service_role";

grant select on table "public"."pe_section_buttons" to "service_role";

grant trigger on table "public"."pe_section_buttons" to "service_role";

grant truncate on table "public"."pe_section_buttons" to "service_role";

grant update on table "public"."pe_section_buttons" to "service_role";

grant delete on table "public"."pe_term_sheet_conditions" to "anon";

grant insert on table "public"."pe_term_sheet_conditions" to "anon";

grant references on table "public"."pe_term_sheet_conditions" to "anon";

grant select on table "public"."pe_term_sheet_conditions" to "anon";

grant trigger on table "public"."pe_term_sheet_conditions" to "anon";

grant truncate on table "public"."pe_term_sheet_conditions" to "anon";

grant update on table "public"."pe_term_sheet_conditions" to "anon";

grant delete on table "public"."pe_term_sheet_conditions" to "authenticated";

grant insert on table "public"."pe_term_sheet_conditions" to "authenticated";

grant references on table "public"."pe_term_sheet_conditions" to "authenticated";

grant select on table "public"."pe_term_sheet_conditions" to "authenticated";

grant trigger on table "public"."pe_term_sheet_conditions" to "authenticated";

grant truncate on table "public"."pe_term_sheet_conditions" to "authenticated";

grant update on table "public"."pe_term_sheet_conditions" to "authenticated";

grant delete on table "public"."pe_term_sheet_conditions" to "service_role";

grant insert on table "public"."pe_term_sheet_conditions" to "service_role";

grant references on table "public"."pe_term_sheet_conditions" to "service_role";

grant select on table "public"."pe_term_sheet_conditions" to "service_role";

grant trigger on table "public"."pe_term_sheet_conditions" to "service_role";

grant truncate on table "public"."pe_term_sheet_conditions" to "service_role";

grant update on table "public"."pe_term_sheet_conditions" to "service_role";

grant delete on table "public"."pe_term_sheet_rules" to "anon";

grant insert on table "public"."pe_term_sheet_rules" to "anon";

grant references on table "public"."pe_term_sheet_rules" to "anon";

grant select on table "public"."pe_term_sheet_rules" to "anon";

grant trigger on table "public"."pe_term_sheet_rules" to "anon";

grant truncate on table "public"."pe_term_sheet_rules" to "anon";

grant update on table "public"."pe_term_sheet_rules" to "anon";

grant delete on table "public"."pe_term_sheet_rules" to "authenticated";

grant insert on table "public"."pe_term_sheet_rules" to "authenticated";

grant references on table "public"."pe_term_sheet_rules" to "authenticated";

grant select on table "public"."pe_term_sheet_rules" to "authenticated";

grant trigger on table "public"."pe_term_sheet_rules" to "authenticated";

grant truncate on table "public"."pe_term_sheet_rules" to "authenticated";

grant update on table "public"."pe_term_sheet_rules" to "authenticated";

grant delete on table "public"."pe_term_sheet_rules" to "service_role";

grant insert on table "public"."pe_term_sheet_rules" to "service_role";

grant references on table "public"."pe_term_sheet_rules" to "service_role";

grant select on table "public"."pe_term_sheet_rules" to "service_role";

grant trigger on table "public"."pe_term_sheet_rules" to "service_role";

grant truncate on table "public"."pe_term_sheet_rules" to "service_role";

grant update on table "public"."pe_term_sheet_rules" to "service_role";

grant delete on table "public"."pe_term_sheets" to "anon";

grant insert on table "public"."pe_term_sheets" to "anon";

grant references on table "public"."pe_term_sheets" to "anon";

grant select on table "public"."pe_term_sheets" to "anon";

grant trigger on table "public"."pe_term_sheets" to "anon";

grant truncate on table "public"."pe_term_sheets" to "anon";

grant update on table "public"."pe_term_sheets" to "anon";

grant delete on table "public"."pe_term_sheets" to "authenticated";

grant insert on table "public"."pe_term_sheets" to "authenticated";

grant references on table "public"."pe_term_sheets" to "authenticated";

grant select on table "public"."pe_term_sheets" to "authenticated";

grant trigger on table "public"."pe_term_sheets" to "authenticated";

grant truncate on table "public"."pe_term_sheets" to "authenticated";

grant update on table "public"."pe_term_sheets" to "authenticated";

grant delete on table "public"."pe_term_sheets" to "service_role";

grant insert on table "public"."pe_term_sheets" to "service_role";

grant references on table "public"."pe_term_sheets" to "service_role";

grant select on table "public"."pe_term_sheets" to "service_role";

grant trigger on table "public"."pe_term_sheets" to "service_role";

grant truncate on table "public"."pe_term_sheets" to "service_role";

grant update on table "public"."pe_term_sheets" to "service_role";

grant delete on table "public"."pricing_engine_input_categories" to "anon";

grant insert on table "public"."pricing_engine_input_categories" to "anon";

grant references on table "public"."pricing_engine_input_categories" to "anon";

grant select on table "public"."pricing_engine_input_categories" to "anon";

grant trigger on table "public"."pricing_engine_input_categories" to "anon";

grant truncate on table "public"."pricing_engine_input_categories" to "anon";

grant update on table "public"."pricing_engine_input_categories" to "anon";

grant delete on table "public"."pricing_engine_input_categories" to "authenticated";

grant insert on table "public"."pricing_engine_input_categories" to "authenticated";

grant references on table "public"."pricing_engine_input_categories" to "authenticated";

grant select on table "public"."pricing_engine_input_categories" to "authenticated";

grant trigger on table "public"."pricing_engine_input_categories" to "authenticated";

grant truncate on table "public"."pricing_engine_input_categories" to "authenticated";

grant update on table "public"."pricing_engine_input_categories" to "authenticated";

grant delete on table "public"."pricing_engine_input_categories" to "service_role";

grant insert on table "public"."pricing_engine_input_categories" to "service_role";

grant references on table "public"."pricing_engine_input_categories" to "service_role";

grant select on table "public"."pricing_engine_input_categories" to "service_role";

grant trigger on table "public"."pricing_engine_input_categories" to "service_role";

grant truncate on table "public"."pricing_engine_input_categories" to "service_role";

grant update on table "public"."pricing_engine_input_categories" to "service_role";

grant delete on table "public"."pricing_engine_inputs" to "anon";

grant insert on table "public"."pricing_engine_inputs" to "anon";

grant references on table "public"."pricing_engine_inputs" to "anon";

grant select on table "public"."pricing_engine_inputs" to "anon";

grant trigger on table "public"."pricing_engine_inputs" to "anon";

grant truncate on table "public"."pricing_engine_inputs" to "anon";

grant update on table "public"."pricing_engine_inputs" to "anon";

grant delete on table "public"."pricing_engine_inputs" to "authenticated";

grant insert on table "public"."pricing_engine_inputs" to "authenticated";

grant references on table "public"."pricing_engine_inputs" to "authenticated";

grant select on table "public"."pricing_engine_inputs" to "authenticated";

grant trigger on table "public"."pricing_engine_inputs" to "authenticated";

grant truncate on table "public"."pricing_engine_inputs" to "authenticated";

grant update on table "public"."pricing_engine_inputs" to "authenticated";

grant delete on table "public"."pricing_engine_inputs" to "service_role";

grant insert on table "public"."pricing_engine_inputs" to "service_role";

grant references on table "public"."pricing_engine_inputs" to "service_role";

grant select on table "public"."pricing_engine_inputs" to "service_role";

grant trigger on table "public"."pricing_engine_inputs" to "service_role";

grant truncate on table "public"."pricing_engine_inputs" to "service_role";

grant update on table "public"."pricing_engine_inputs" to "service_role";

grant delete on table "public"."program_conditions" to "anon";

grant insert on table "public"."program_conditions" to "anon";

grant references on table "public"."program_conditions" to "anon";

grant select on table "public"."program_conditions" to "anon";

grant trigger on table "public"."program_conditions" to "anon";

grant truncate on table "public"."program_conditions" to "anon";

grant update on table "public"."program_conditions" to "anon";

grant delete on table "public"."program_conditions" to "authenticated";

grant insert on table "public"."program_conditions" to "authenticated";

grant references on table "public"."program_conditions" to "authenticated";

grant select on table "public"."program_conditions" to "authenticated";

grant trigger on table "public"."program_conditions" to "authenticated";

grant truncate on table "public"."program_conditions" to "authenticated";

grant update on table "public"."program_conditions" to "authenticated";

grant delete on table "public"."program_conditions" to "service_role";

grant insert on table "public"."program_conditions" to "service_role";

grant references on table "public"."program_conditions" to "service_role";

grant select on table "public"."program_conditions" to "service_role";

grant trigger on table "public"."program_conditions" to "service_role";

grant truncate on table "public"."program_conditions" to "service_role";

grant update on table "public"."program_conditions" to "service_role";

grant delete on table "public"."scenario_program_results" to "anon";

grant insert on table "public"."scenario_program_results" to "anon";

grant references on table "public"."scenario_program_results" to "anon";

grant select on table "public"."scenario_program_results" to "anon";

grant trigger on table "public"."scenario_program_results" to "anon";

grant truncate on table "public"."scenario_program_results" to "anon";

grant update on table "public"."scenario_program_results" to "anon";

grant delete on table "public"."scenario_program_results" to "authenticated";

grant insert on table "public"."scenario_program_results" to "authenticated";

grant references on table "public"."scenario_program_results" to "authenticated";

grant select on table "public"."scenario_program_results" to "authenticated";

grant trigger on table "public"."scenario_program_results" to "authenticated";

grant truncate on table "public"."scenario_program_results" to "authenticated";

grant update on table "public"."scenario_program_results" to "authenticated";

grant delete on table "public"."scenario_program_results" to "service_role";

grant insert on table "public"."scenario_program_results" to "service_role";

grant references on table "public"."scenario_program_results" to "service_role";

grant select on table "public"."scenario_program_results" to "service_role";

grant trigger on table "public"."scenario_program_results" to "service_role";

grant truncate on table "public"."scenario_program_results" to "service_role";

grant update on table "public"."scenario_program_results" to "service_role";

grant delete on table "public"."scenario_rate_options" to "anon";

grant insert on table "public"."scenario_rate_options" to "anon";

grant references on table "public"."scenario_rate_options" to "anon";

grant select on table "public"."scenario_rate_options" to "anon";

grant trigger on table "public"."scenario_rate_options" to "anon";

grant truncate on table "public"."scenario_rate_options" to "anon";

grant update on table "public"."scenario_rate_options" to "anon";

grant delete on table "public"."scenario_rate_options" to "authenticated";

grant insert on table "public"."scenario_rate_options" to "authenticated";

grant references on table "public"."scenario_rate_options" to "authenticated";

grant select on table "public"."scenario_rate_options" to "authenticated";

grant trigger on table "public"."scenario_rate_options" to "authenticated";

grant truncate on table "public"."scenario_rate_options" to "authenticated";

grant update on table "public"."scenario_rate_options" to "authenticated";

grant delete on table "public"."scenario_rate_options" to "service_role";

grant insert on table "public"."scenario_rate_options" to "service_role";

grant references on table "public"."scenario_rate_options" to "service_role";

grant select on table "public"."scenario_rate_options" to "service_role";

grant trigger on table "public"."scenario_rate_options" to "service_role";

grant truncate on table "public"."scenario_rate_options" to "service_role";

grant update on table "public"."scenario_rate_options" to "service_role";


  create policy "org_policy_delete"
  on "public"."ai_chat_messages"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'ai_chat_messages'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chat_messages'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."ai_chat_messages"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'ai_chat_messages'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chat_messages'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."ai_chat_messages"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'ai_chat_messages'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chat_messages'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."ai_chat_messages"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'ai_chat_messages'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chat_messages'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'ai_chat_messages'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chat_messages'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."ai_chats"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'ai_chats'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chats'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."ai_chats"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'ai_chats'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chats'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."ai_chats"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'ai_chats'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chats'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."ai_chats"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'ai_chats'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chats'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'ai_chats'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'ai_chats'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "applications_modify_org"
  on "public"."applications"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "applications_select_org"
  on "public"."applications"
  as permissive
  for select
  to public
using (true);



  create policy "org_policy_delete"
  on "public"."applications"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'applications'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'applications'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."applications"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'applications'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'applications'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."applications"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'applications'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'applications'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."applications"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'applications'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'applications'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'applications'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'applications'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."applications_emails_sent"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'applications_emails_sent'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."applications_emails_sent"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'applications_emails_sent'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."applications_emails_sent"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'applications_emails_sent'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."applications_emails_sent"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'applications_emails_sent'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'applications_emails_sent'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."appraisal"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'appraisal'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'appraisal'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."appraisal"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'appraisal'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'appraisal'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'appraisal'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."appraisal"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'appraisal'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'appraisal'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'appraisal'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."appraisal"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'appraisal'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'appraisal'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = appraisal.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'appraisal'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."borrower_entities"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'borrower_entities'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrower_entities'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."borrower_entities"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'borrower_entities'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrower_entities'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."borrower_entities"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'borrower_entities'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrower_entities'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."borrower_entities"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'borrower_entities'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrower_entities'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'borrower_entities'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrower_entities'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."borrowers"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'borrowers'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrowers'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."borrowers"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'borrowers'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrowers'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."borrowers"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'borrowers'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrowers'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."borrowers"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'borrowers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrowers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'borrowers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'borrowers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."brokers"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'brokers'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'brokers'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."brokers"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'brokers'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'brokers'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."brokers"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'brokers'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'brokers'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."brokers"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'brokers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'brokers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'brokers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'brokers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."contact"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'contact'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."contact"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'contact'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."contact"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'contact'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."contact"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'contact'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'contact'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."credit_report_chat_messages"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."credit_report_chat_messages"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."credit_report_chat_messages"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."credit_report_chat_messages"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chat_messages'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."credit_report_chats"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_chats'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chats'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."credit_report_chats"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'credit_report_chats'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chats'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."credit_report_chats"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_chats'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chats'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."credit_report_chats"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_chats'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chats'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'credit_report_chats'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_chats'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."credit_report_data_xactus"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."credit_report_data_xactus"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."credit_report_data_xactus"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."credit_report_data_xactus"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_data_xactus'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."credit_report_user_chats"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."credit_report_user_chats"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."credit_report_user_chats"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."credit_report_user_chats"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_user_chats'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_user_chats.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "credit_report_viewers readable by owner/viewer"
  on "public"."credit_report_viewers"
  as permissive
  for select
  to authenticated
using (((auth.role() = 'service_role'::text) OR (user_id = (auth.jwt() ->> 'sub'::text)) OR (added_by = (auth.jwt() ->> 'sub'::text)) OR (EXISTS ( SELECT 1
   FROM public.credit_reports cr
  WHERE ((cr.id = credit_report_viewers.report_id) AND ((auth.jwt() ->> 'sub'::text) = ANY (cr.assigned_to)))))));



  create policy "credit_report_viewers service role all"
  on "public"."credit_report_viewers"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "org_policy_delete"
  on "public"."credit_report_viewers"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_viewers'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_viewers'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."credit_report_viewers"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'credit_report_viewers'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_viewers'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."credit_report_viewers"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_viewers'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_viewers'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."credit_report_viewers"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'credit_report_viewers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_viewers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'credit_report_viewers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_report_viewers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.credit_reports
      WHERE ((credit_reports.id = credit_report_viewers.report_id) AND (credit_reports.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "credit_reports owner or viewer select"
  on "public"."credit_reports"
  as permissive
  for select
  to authenticated
using (((auth.role() = 'service_role'::text) OR ((auth.jwt() ->> 'sub'::text) = ANY (assigned_to)) OR (EXISTS ( SELECT 1
   FROM public.credit_report_viewers v
  WHERE ((v.report_id = credit_reports.id) AND (v.user_id = (auth.jwt() ->> 'sub'::text)))))));



  create policy "credit_reports service role all"
  on "public"."credit_reports"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "org_policy_delete"
  on "public"."credit_reports"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'credit_reports'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_reports'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."credit_reports"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'credit_reports'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_reports'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."credit_reports"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'credit_reports'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_reports'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."credit_reports"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'credit_reports'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_reports'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'credit_reports'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'credit_reports'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."custom_broker_settings"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'custom_broker_settings'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'custom_broker_settings'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."custom_broker_settings"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'custom_broker_settings'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'custom_broker_settings'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."custom_broker_settings"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'custom_broker_settings'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'custom_broker_settings'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."custom_broker_settings"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'custom_broker_settings'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'custom_broker_settings'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'custom_broker_settings'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'custom_broker_settings'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."deal_borrower"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_borrower'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_borrower'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_borrower"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_borrower'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_borrower'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_borrower'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_borrower"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_borrower'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_borrower'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_borrower'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_borrower"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_borrower'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_borrower'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_borrower.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_borrower'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."deal_clerk_orgs"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (clerk_org_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_clerk_orgs"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (clerk_org_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."deal_clerk_orgs"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (clerk_org_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."deal_clerk_orgs"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (clerk_org_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_clerk_orgs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (clerk_org_id = public.get_active_org_id())
    ELSE false
END));



  create policy "Users can create mentions"
  on "public"."deal_comment_mentions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view mentions on accessible comments"
  on "public"."deal_comment_mentions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.deal_comments dc
  WHERE (dc.id = deal_comment_mentions.comment_id))));



  create policy "org_policy_delete"
  on "public"."deal_comment_mentions"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_comment_mentions"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."deal_comment_mentions"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."deal_comment_mentions"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_mentions'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (mentioned_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."deal_comment_reads"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comment_reads'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_reads'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_comment_reads"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'deal_comment_reads'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_reads'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."deal_comment_reads"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comment_reads'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_reads'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."deal_comment_reads"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comment_reads'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_reads'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'deal_comment_reads'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comment_reads'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."deal_comments"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_comments'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comments'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (author_clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id())))) OR (author_clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_comments"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_comments'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comments'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (author_clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id())))) OR (author_clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_comments'::text, 'insert'::text)).scope, (deal_id)::uuid)
END));



  create policy "org_policy_select"
  on "public"."deal_comments"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_comments'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comments'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (author_clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id())))) OR (author_clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_comments'::text, 'select'::text)).scope, (deal_id)::uuid)
END));



  create policy "org_policy_update"
  on "public"."deal_comments"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_comments'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_comments'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (author_clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = (deal_comments.deal_id)::uuid) AND (deals.organization_id = public.get_active_org_id())))) OR (author_clerk_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_comments'::text, 'update'::text)).scope, (deal_id)::uuid)
END));



  create policy "org_policy_delete"
  on "public"."deal_entity"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_entity'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_entity"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_entity'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_entity'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_entity"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_entity'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_entity'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_entity"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_entity'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_entity'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."deal_entity_owners"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity_owners'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_entity_owners"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity_owners'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_entity_owners"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity_owners'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_entity_owners"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_entity_owners'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_entity_owners.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_entity_owners'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."deal_guarantors"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_guarantors'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_guarantors'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_guarantors"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_guarantors'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_guarantors'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_guarantors'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_guarantors"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_guarantors'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_guarantors'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_guarantors'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_guarantors"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_guarantors'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_guarantors'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_guarantors.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_guarantors'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."deal_inputs"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_inputs'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_inputs'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_inputs"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_inputs'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_inputs'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_inputs'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_inputs"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_inputs'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_inputs'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_inputs'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_inputs"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_inputs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_inputs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_inputs.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_inputs'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."deal_property"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_property'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_property'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_property"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_property'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_property'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_property'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_property"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_property'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_property'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_property'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_property"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_property'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_property'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_property.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_property'::text, 'update'::text)).scope, deal_id)
END));



  create policy "Allow authenticated users to read deal_role_types"
  on "public"."deal_role_types"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Service role full access to deal_role_types"
  on "public"."deal_role_types"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "org_policy_delete"
  on "public"."deal_role_types"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'deal_role_types'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."deal_role_types"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'deal_role_types'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."deal_role_types"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'deal_role_types'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."deal_role_types"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'deal_role_types'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'deal_role_types'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."deal_roles"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_roles'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_roles'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id())))) OR (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_roles"
  as permissive
  for insert
  to public
with check (((public.check_org_access('table'::text, 'deal_roles'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_roles'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id())))) OR (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_roles'::text, 'insert'::text)).scope, deal_id)
END));



  create policy "org_policy_select"
  on "public"."deal_roles"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deal_roles'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_roles'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id())))) OR (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_roles'::text, 'select'::text)).scope, deal_id)
END));



  create policy "org_policy_update"
  on "public"."deal_roles"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deal_roles'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_roles'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.deals
      WHERE ((deals.id = deal_roles.deal_id) AND (deals.organization_id = public.get_active_org_id())))) OR (users_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deal_roles'::text, 'update'::text)).scope, deal_id)
END));



  create policy "org_policy_delete"
  on "public"."deal_signature_requests"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deal_signature_requests'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_signature_requests'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deal_signature_requests"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'deal_signature_requests'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_signature_requests'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."deal_signature_requests"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'deal_signature_requests'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_signature_requests'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."deal_signature_requests"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'deal_signature_requests'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_signature_requests'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'deal_signature_requests'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deal_signature_requests'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "deal_task_events_select_authenticated"
  on "public"."deal_task_events"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow anon to read deal_users for realtime"
  on "public"."deal_users"
  as permissive
  for select
  to public
using (true);



  create policy "org_policy_delete"
  on "public"."deals"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'deals'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deals'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."deals"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'deals'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deals'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."deals"
  as permissive
  for select
  to public
using (((public.check_org_access('table'::text, 'deals'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deals'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deals'::text, 'select'::text)).scope, id)
END));



  create policy "org_policy_update"
  on "public"."deals"
  as permissive
  for update
  to public
using (((public.check_org_access('table'::text, 'deals'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'deals'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE public.check_named_scope_from_scope_string((public.check_org_access('table'::text, 'deals'::text, 'update'::text)).scope, id)
END));



  create policy "org_policy_delete"
  on "public"."default_broker_settings"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'default_broker_settings'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'default_broker_settings'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."default_broker_settings"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'default_broker_settings'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'default_broker_settings'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."default_broker_settings"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'default_broker_settings'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'default_broker_settings'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."default_broker_settings"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'default_broker_settings'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'default_broker_settings'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'default_broker_settings'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'default_broker_settings'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "Org admins can manage permissions"
  on "public"."document_access_permissions"
  as permissive
  for all
  to authenticated
using (((clerk_org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.clerk_organization_id = ((auth.jwt() -> 'org_id'::text))::text))) AND public.is_org_admin(clerk_org_id)))
with check (((clerk_org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.clerk_organization_id = ((auth.jwt() -> 'org_id'::text))::text))) AND public.is_org_admin(clerk_org_id)));



  create policy "Service role full access to document_access_permissions"
  on "public"."document_access_permissions"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can read org permissions"
  on "public"."document_access_permissions"
  as permissive
  for select
  to authenticated
using ((clerk_org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.clerk_organization_id = ((auth.jwt() -> 'org_id'::text))::text))));



  create policy "org_policy_delete"
  on "public"."document_access_permissions"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_access_permissions'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_access_permissions'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_access_permissions"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_access_permissions'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_access_permissions'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_access_permissions"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_access_permissions'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_access_permissions'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_access_permissions"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_access_permissions'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_access_permissions'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_access_permissions'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_access_permissions'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (updated_by_clerk_sub = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_access_permissions_global"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'document_access_permissions_global'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."document_access_permissions_global"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'document_access_permissions_global'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."document_access_permissions_global"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'document_access_permissions_global'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."document_access_permissions_global"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'document_access_permissions_global'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'document_access_permissions_global'::text, 'update'::text)).allowed);



  create policy "All authenticated users can view active categories"
  on "public"."document_categories"
  as permissive
  for select
  to authenticated
using ((is_active = true));



  create policy "Allow authenticated users to read document_categories"
  on "public"."document_categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Internal admins can manage categories"
  on "public"."document_categories"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "Service role full access to document_categories"
  on "public"."document_categories"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "org_policy_delete"
  on "public"."document_categories"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'document_categories'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."document_categories"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'document_categories'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."document_categories"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'document_categories'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."document_categories"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'document_categories'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'document_categories'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."document_categories_user_order"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_categories_user_order'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_categories_user_order'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_categories_user_order"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_categories_user_order'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_categories_user_order'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_categories_user_order"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_categories_user_order'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_categories_user_order'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_categories_user_order"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_categories_user_order'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_categories_user_order'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_categories_user_order'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_categories_user_order'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (clerk_user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "Internal admins have full access to documents"
  on "public"."document_files"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "Users can view their own documents (placeholder)"
  on "public"."document_files"
  as permissive
  for select
  to authenticated
using ((uploaded_by = (auth.jwt() ->> 'sub'::text)));



  create policy "org_policy_delete"
  on "public"."document_files"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_files'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_files"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_files'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_files"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_files'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_files"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_files'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_files'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (uploaded_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_files_borrowers"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_borrowers'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_borrowers'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_files_borrowers"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_files_borrowers'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_borrowers'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_files_borrowers"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_borrowers'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_borrowers'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_files_borrowers"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_borrowers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_borrowers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_files_borrowers'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_borrowers'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_files_clerk_orgs"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_files_clerk_orgs"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_files_clerk_orgs"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_files_clerk_orgs"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_orgs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (clerk_org_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((clerk_org_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_files_clerk_users"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_files_clerk_users"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_files_clerk_users"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_files_clerk_users"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_clerk_users'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (clerk_user_id = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_files_entities"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_entities'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_entities'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_files_entities"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_files_entities'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_entities'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_files_entities"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_entities'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_entities'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_files_entities"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_entities'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_entities'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_files_entities'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_entities'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_files_tags"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_tags'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_tags'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_files_tags"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_files_tags'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_tags'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_files_tags"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_tags'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_tags'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_files_tags"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_files_tags'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_tags'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_files_tags'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_files_tags'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_roles"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'document_roles'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."document_roles"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'document_roles'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."document_roles"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'document_roles'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."document_roles"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'document_roles'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'document_roles'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."document_roles_files"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'document_roles_files'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."document_roles_files"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'document_roles_files'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."document_roles_files"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'document_roles_files'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."document_roles_files"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'document_roles_files'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'document_roles_files'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."document_tags"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'document_tags'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_tags'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_tags"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'document_tags'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_tags'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_tags"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'document_tags'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_tags'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_tags"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'document_tags'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_tags'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'document_tags'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'document_tags'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    WHEN 'org_and_user'::text THEN (created_by = ( SELECT users.id
       FROM public.users
      WHERE (users.clerk_user_id = (auth.jwt() ->> 'sub'::text))
     LIMIT 1))
    ELSE false
END));



  create policy "Org admins can manage all template variables"
  on "public"."document_template_variables"
  as permissive
  for all
  to public
using ((template_id IN ( SELECT tst.id
   FROM (public.document_templates tst
     JOIN public.organization_members om ON ((tst.organization_id = om.organization_id)))
  WHERE ((om.user_id = (auth.jwt() ->> 'sub'::text)) AND (om.clerk_org_role = 'admin'::text)))))
with check ((template_id IN ( SELECT tst.id
   FROM (public.document_templates tst
     JOIN public.organization_members om ON ((tst.organization_id = om.organization_id)))
  WHERE ((om.user_id = (auth.jwt() ->> 'sub'::text)) AND (om.clerk_org_role = 'admin'::text)))));



  create policy "Service role full access to document_template_variables"
  on "public"."document_template_variables"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can manage variables for own templates"
  on "public"."document_template_variables"
  as permissive
  for all
  to public
using ((template_id IN ( SELECT document_templates.id
   FROM public.document_templates
  WHERE (document_templates.user_id = (auth.jwt() ->> 'sub'::text)))))
with check ((template_id IN ( SELECT document_templates.id
   FROM public.document_templates
  WHERE (document_templates.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "Users can read variables for org templates"
  on "public"."document_template_variables"
  as permissive
  for select
  to public
using ((template_id IN ( SELECT tst.id
   FROM (public.document_templates tst
     JOIN public.organization_members om ON ((tst.organization_id = om.organization_id)))
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "org_policy_delete"
  on "public"."document_template_variables"
  as permissive
  for delete
  to public
using ((public.check_org_access('table'::text, 'document_template_variables'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."document_template_variables"
  as permissive
  for insert
  to public
with check ((public.check_org_access('table'::text, 'document_template_variables'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."document_template_variables"
  as permissive
  for select
  to public
using ((public.check_org_access('table'::text, 'document_template_variables'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."document_template_variables"
  as permissive
  for update
  to public
using ((public.check_org_access('table'::text, 'document_template_variables'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'document_template_variables'::text, 'update'::text)).allowed);



  create policy "Org admins can manage all templates"
  on "public"."document_templates"
  as permissive
  for all
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = (auth.jwt() ->> 'sub'::text)) AND (om.clerk_org_role = 'admin'::text)))))
with check ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = (auth.jwt() ->> 'sub'::text)) AND (om.clerk_org_role = 'admin'::text)))));



  create policy "Service role full access to term_sheet_templates"
  on "public"."document_templates"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can manage own templates"
  on "public"."document_templates"
  as permissive
  for all
  to authenticated
using ((user_id = (auth.jwt() ->> 'sub'::text)))
with check ((user_id = (auth.jwt() ->> 'sub'::text)));



  create policy "Users can read org templates"
  on "public"."document_templates"
  as permissive
  for select
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "org_policy_delete"
  on "public"."entities"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'entities'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entities'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."entities"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'entities'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entities'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."entities"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'entities'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entities'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."entities"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'entities'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entities'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'entities'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entities'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."entity_owners"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'entity_owners'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entity_owners'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."entity_owners"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'entity_owners'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entity_owners'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."entity_owners"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'entity_owners'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entity_owners'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."entity_owners"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'entity_owners'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entity_owners'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'entity_owners'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'entity_owners'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."guarantor"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'guarantor'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."guarantor"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'guarantor'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."guarantor"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'guarantor'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."guarantor"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'guarantor'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'guarantor'::text, 'update'::text)).allowed);



  create policy "integration_settings_admin_delete"
  on "public"."integration_settings"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (u.is_internal_yn = true)))));



  create policy "integration_settings_admin_insert"
  on "public"."integration_settings"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (u.is_internal_yn = true)))));



  create policy "integration_settings_admin_update"
  on "public"."integration_settings"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (u.is_internal_yn = true)))));



  create policy "integration_settings_select"
  on "public"."integration_settings"
  as permissive
  for select
  to public
using (true);



  create policy "integration_setup_delete"
  on "public"."integration_setup"
  as permissive
  for delete
  to public
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "integration_setup_insert"
  on "public"."integration_setup"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "integration_setup_select"
  on "public"."integration_setup"
  as permissive
  for select
  to public
using ((((archived_at IS NULL) OR (current_setting('app.show_archived'::text, true) = 'true'::text)) AND (organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text))))));



  create policy "integration_setup_update"
  on "public"."integration_setup"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "integration_tags_admin_delete"
  on "public"."integration_tags"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (u.is_internal_yn = true)))));



  create policy "integration_tags_admin_insert"
  on "public"."integration_tags"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (u.is_internal_yn = true)))));



  create policy "integration_tags_admin_update"
  on "public"."integration_tags"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (u.is_internal_yn = true)))));



  create policy "integration_tags_select"
  on "public"."integration_tags"
  as permissive
  for select
  to public
using (true);



  create policy "org_policy_delete"
  on "public"."loan_scenarios"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'loan_scenarios'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loan_scenarios'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."loan_scenarios"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'loan_scenarios'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loan_scenarios'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."loan_scenarios"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'loan_scenarios'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loan_scenarios'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."loan_scenarios"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'loan_scenarios'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loan_scenarios'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'loan_scenarios'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loan_scenarios'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (created_by = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (created_by = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."n8n_chat_histories"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'n8n_chat_histories'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."n8n_chat_histories"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'n8n_chat_histories'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."n8n_chat_histories"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'n8n_chat_histories'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."n8n_chat_histories"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'n8n_chat_histories'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'n8n_chat_histories'::text, 'update'::text)).allowed);



  create policy "System can create notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((user_id = (auth.jwt() ->> 'sub'::text)))
with check ((user_id = (auth.jwt() ->> 'sub'::text)));



  create policy "Users can view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((user_id = (auth.jwt() ->> 'sub'::text)));



  create policy "org_policy_delete"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'notifications'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'notifications'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'notifications'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'notifications'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'notifications'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'notifications'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'notifications'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'notifications'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'notifications'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'notifications'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "organization_policies_delete_admin_or_owner"
  on "public"."organization_policies"
  as permissive
  for delete
  to authenticated
using (((org_id = public.get_active_org_id()) AND (public.is_org_owner(public.get_active_org_id()) OR public.is_org_admin(public.get_active_org_id()))));



  create policy "organization_policies_insert_admin_or_owner"
  on "public"."organization_policies"
  as permissive
  for insert
  to authenticated
with check (((org_id = public.get_active_org_id()) AND (public.is_org_owner(public.get_active_org_id()) OR public.is_org_admin(public.get_active_org_id()))));



  create policy "organization_policies_update_admin_or_owner"
  on "public"."organization_policies"
  as permissive
  for update
  to authenticated
using (((org_id = public.get_active_org_id()) AND (public.is_org_owner(public.get_active_org_id()) OR public.is_org_admin(public.get_active_org_id()))))
with check (((org_id = public.get_active_org_id()) AND (public.is_org_owner(public.get_active_org_id()) OR public.is_org_admin(public.get_active_org_id()))));



  create policy "column_filters_read"
  on "public"."organization_policies_column_filters"
  as permissive
  for select
  to authenticated
using (true);



  create policy "column_filters_service_role"
  on "public"."organization_policies_column_filters"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Org admins can manage themes"
  on "public"."organization_themes"
  as permissive
  for all
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = (auth.jwt() ->> 'sub'::text)) AND (om.clerk_org_role = 'admin'::text)))))
with check ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = (auth.jwt() ->> 'sub'::text)) AND (om.clerk_org_role = 'admin'::text)))));



  create policy "Service role full access to organization_themes"
  on "public"."organization_themes"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can read their org themes"
  on "public"."organization_themes"
  as permissive
  for select
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "org_policy_delete"
  on "public"."organization_themes"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'organization_themes'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'organization_themes'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."organization_themes"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'organization_themes'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'organization_themes'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."organization_themes"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'organization_themes'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'organization_themes'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."organization_themes"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'organization_themes'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'organization_themes'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'organization_themes'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'organization_themes'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'org_and_user'::text THEN (organization_id = public.get_active_org_id())
    ELSE false
END));



  create policy "Internal admins can view all organizations"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using (public.is_internal_admin());



  create policy "Service role full access to organizations"
  on "public"."organizations"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view their organizations"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = (auth.jwt() ->> 'sub'::text))))));



  create policy "Users can insert activity logs for accessible loans"
  on "public"."pricing_activity_log"
  as permissive
  for insert
  to public
with check ((loan_id IN ( SELECT deals.id
   FROM public.deals
  WHERE (deals.organization_id IN ( SELECT organizations.id
           FROM public.organizations
          WHERE (organizations.clerk_organization_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'org_id'::text)))))));



  create policy "Users can view their own activity logs"
  on "public"."pricing_activity_log"
  as permissive
  for select
  to public
using (((user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)) OR (loan_id IN ( SELECT deals.id
   FROM public.deals
  WHERE (deals.assigned_to_user_id ? ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))))));



  create policy "pe_input_categories_authenticated_select"
  on "public"."pricing_engine_input_categories"
  as permissive
  for select
  to authenticated
using (((archived_at IS NULL) OR (current_setting('app.show_archived'::text, true) = 'true'::text)));



  create policy "pe_input_categories_internal_admin_delete"
  on "public"."pricing_engine_input_categories"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "pe_input_categories_internal_admin_insert"
  on "public"."pricing_engine_input_categories"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "pe_input_categories_internal_admin_update"
  on "public"."pricing_engine_input_categories"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "pe_inputs_authenticated_select"
  on "public"."pricing_engine_inputs"
  as permissive
  for select
  to authenticated
using (((archived_at IS NULL) OR (current_setting('app.show_archived'::text, true) = 'true'::text)));



  create policy "pe_inputs_internal_admin_delete"
  on "public"."pricing_engine_inputs"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "pe_inputs_internal_admin_insert"
  on "public"."pricing_engine_inputs"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "pe_inputs_internal_admin_update"
  on "public"."pricing_engine_inputs"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "org_policy_delete"
  on "public"."program_documents"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'program_documents'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."program_documents"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'program_documents'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."program_documents"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'program_documents'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."program_documents"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'program_documents'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'program_documents'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."program_documents_chunks_vs"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'program_documents_chunks_vs'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."program_documents_chunks_vs"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'program_documents_chunks_vs'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."program_documents_chunks_vs"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'program_documents_chunks_vs'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."program_documents_chunks_vs"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'program_documents_chunks_vs'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'program_documents_chunks_vs'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."programs"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'programs'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'programs'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."programs"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'programs'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'programs'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."programs"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'programs'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'programs'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."programs"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'programs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'programs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'programs'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'programs'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN true
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."property"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'property'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."property"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'property'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."property"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'property'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."property"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'property'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'property'::text, 'update'::text)).allowed);



  create policy "Internal admins can manage permissions"
  on "public"."rbac_permissions"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "org_policy_delete"
  on "public"."rbac_permissions"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'rbac_permissions'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."rbac_permissions"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'rbac_permissions'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."rbac_permissions"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'rbac_permissions'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."rbac_permissions"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'rbac_permissions'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'rbac_permissions'::text, 'update'::text)).allowed);



  create policy "task_logic_select_authenticated"
  on "public"."task_logic"
  as permissive
  for select
  to authenticated
using (true);



  create policy "task_logic_actions_select_authenticated"
  on "public"."task_logic_actions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "task_logic_conditions_select_authenticated"
  on "public"."task_logic_conditions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "task_priorities_select_authenticated"
  on "public"."task_priorities"
  as permissive
  for select
  to authenticated
using (true);



  create policy "task_statuses_select_authenticated"
  on "public"."task_statuses"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER trg_ai_chat_messages_touch_chat AFTER INSERT ON public.ai_chat_messages FOR EACH ROW EXECUTE FUNCTION public.touch_ai_chat_last_used();

CREATE TRIGGER trg_applications_auto_emails BEFORE INSERT OR UPDATE OF guarantor_ids ON public.applications FOR EACH ROW EXECUTE FUNCTION public.auto_populate_guarantor_emails();

CREATE TRIGGER trg_applications_set_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_applications_sync_from_primary_scenario AFTER INSERT OR UPDATE OF loan_id ON public.applications FOR EACH ROW EXECUTE FUNCTION public.trg_applications_sync_from_primary_scenario();

CREATE TRIGGER trg_applications_sync_primary_scenario AFTER INSERT OR UPDATE OF entity_id, borrower_name, guarantor_ids, guarantor_names, guarantor_emails ON public.applications FOR EACH ROW EXECUTE FUNCTION public.trg_applications_sync_primary_scenario();

CREATE TRIGGER trg_set_application_display_id BEFORE INSERT ON public.applications FOR EACH ROW WHEN ((new.display_id IS NULL)) EXECUTE FUNCTION public.generate_application_display_id();

CREATE TRIGGER trg_background_report_created AFTER INSERT ON public.background_reports FOR EACH ROW EXECUTE FUNCTION public.notify_background_report_created();

CREATE TRIGGER borrowers_set_updated_at BEFORE UPDATE ON public.borrowers FOR EACH ROW EXECUTE FUNCTION public.borrowers_set_updated_at();

CREATE TRIGGER trg_sync_borrower_to_entity_owners AFTER UPDATE OF first_name, last_name, ssn_last4, address_line1, city, state, zip ON public.borrowers FOR EACH ROW WHEN ((new.id IS NOT NULL)) EXECUTE FUNCTION public.sync_borrower_to_entity_owners();

CREATE TRIGGER set_timestamp_on_brokers BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.contact FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER trg_credit_report_chat_messages_touch_chat AFTER INSERT ON public.credit_report_chat_messages FOR EACH ROW EXECUTE FUNCTION public.touch_credit_report_chat_last_used();

CREATE TRIGGER trg_delete_orphaned_chat AFTER DELETE ON public.credit_report_user_chats FOR EACH ROW EXECUTE FUNCTION public.delete_orphaned_credit_report_chat();

CREATE TRIGGER trg_sync_assigned_from_viewers_del AFTER DELETE ON public.credit_report_viewers FOR EACH ROW EXECUTE FUNCTION public.sync_assigned_from_viewers_del();

CREATE TRIGGER trg_sync_assigned_from_viewers_ins AFTER INSERT ON public.credit_report_viewers FOR EACH ROW EXECUTE FUNCTION public.sync_assigned_from_viewers_ins();

CREATE TRIGGER trg_sync_viewers_from_credit_reports AFTER INSERT OR UPDATE ON public.credit_reports FOR EACH ROW EXECUTE FUNCTION public.sync_viewers_from_credit_reports();

CREATE TRIGGER set_timestamp_on_custom_broker_settings BEFORE UPDATE ON public.custom_broker_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER trg_ddp_deal_guarantors AFTER INSERT OR DELETE ON public.deal_guarantors FOR EACH ROW EXECUTE FUNCTION public.trg_ddp_from_deal_guarantors();

CREATE TRIGGER trg_ddp_deal_property AFTER INSERT OR DELETE ON public.deal_property FOR EACH ROW EXECUTE FUNCTION public.trg_ddp_from_deal_property();

CREATE TRIGGER deal_stages_updated_at BEFORE UPDATE ON public.deal_stages FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER deal_tasks_updated_at BEFORE UPDATE ON public.deal_tasks FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER loans_set_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER set_timestamp_on_default_broker_settings BEFORE UPDATE ON public.default_broker_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_document_template_variables_updated_at BEFORE UPDATE ON public.document_template_variables FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_term_sheet_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER entities_set_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION public.entities_set_updated_at();

CREATE TRIGGER integration_settings_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_register_integration_feature_policy AFTER INSERT ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.register_integration_feature_policy();

CREATE TRIGGER integration_setup_updated_at BEFORE UPDATE ON public.integration_setup FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_loan_scenario_inputs_sync AFTER INSERT OR DELETE OR UPDATE ON public.loan_scenario_inputs FOR EACH ROW EXECUTE FUNCTION public.trg_loan_scenario_inputs_sync_applications();

CREATE TRIGGER trg_loan_scenarios_sync_applications AFTER INSERT OR DELETE OR UPDATE ON public.loan_scenarios FOR EACH ROW EXECUTE FUNCTION public.trg_loan_scenarios_sync_applications();

CREATE TRIGGER trg_set_loan_display_id BEFORE INSERT ON public.loans FOR EACH ROW WHEN ((new.display_id IS NULL)) EXECUTE FUNCTION public.generate_loan_display_id();

CREATE TRIGGER trg_seed_custom_on_account_manager_assign AFTER INSERT ON public.organization_account_managers FOR EACH ROW EXECUTE FUNCTION public.seed_custom_broker_settings_on_assignment();

CREATE TRIGGER trg_insert_default_integrations_for_member AFTER INSERT ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.insert_default_integrations_for_member();

CREATE TRIGGER set_organization_themes_updated_at BEFORE UPDATE ON public.organization_themes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER trg_create_default_org_policies AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.create_default_org_policies();

CREATE TRIGGER programs_set_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER trg_programs_set_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_programs_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.property FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER task_priorities_updated_at BEFORE UPDATE ON public.task_priorities FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER task_statuses_updated_at BEFORE UPDATE ON public.task_statuses FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER task_templates_updated_at BEFORE UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_users_updated_at();


  create policy "program_docs_admin_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'program-docs'::text) AND public.is_internal_admin()));



  create policy "program_docs_admin_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'program-docs'::text) AND public.is_internal_admin()));



  create policy "program_docs_admin_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'program-docs'::text) AND public.is_internal_admin()));



  create policy "program_docs_admin_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'program-docs'::text) AND public.is_internal_admin()))
with check (((bucket_id = 'program-docs'::text) AND public.is_internal_admin()));



