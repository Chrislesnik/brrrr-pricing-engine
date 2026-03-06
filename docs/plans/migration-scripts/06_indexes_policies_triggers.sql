-- ============================================================
-- PHASE 1: Indexes, RLS, Policies, Triggers from DEV schema
-- Auto-extracted; indexes filtered against PROD schema
-- ============================================================

-- SECTION: ROW LEVEL SECURITY ENABLE
-- ==========================================================

ALTER TABLE "public"."ai_chat_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ai_chats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."application_appraisal" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."application_background" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."application_credit" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."application_signings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."applications_emails_sent" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_amcs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_borrowers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_documents" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_investor_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_lender_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_loan_type_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_occupancy_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_product_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_property_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_status_list" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."appraisal_transaction_type_list" ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE "public"."borrower_entities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."borrowers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."brokers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_report_chat_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_report_chats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_report_data_links" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_report_data_xactus" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_report_user_chats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_report_viewers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."credit_reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."custom_broker_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dashboard_widget_chats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dashboard_widget_conversations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dashboard_widgets" ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE "public"."deal_stepper" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."deal_stepper_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."deal_task_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."deal_tasks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."deal_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."default_broker_settings" ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE "public"."document_type_ai_input" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."document_type_ai_input_order" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."document_types" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."entity_owners" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."guarantor" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."input_categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."input_logic" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."input_logic_actions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."input_logic_conditions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."input_stepper" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inputs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."integration_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."integration_setup" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."integration_tags" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."landing_page_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."llama_document_chunks_vs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."llama_document_parsed" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."loan_scenario_inputs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."loan_scenarios" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."n8n_chat_histories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_account_managers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_member_roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_policies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_policies_column_filters" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_policy_named_scope_tables" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_policy_named_scopes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_themes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pe_input_logic" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pe_input_logic_actions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pe_input_logic_conditions" ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE "public"."task_logic_conditions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."task_priorities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."task_statuses" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."task_template_roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."task_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."term_sheets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_deal_access" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."workflow_execution_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."workflow_nodes" ENABLE ROW LEVEL SECURITY;


-- SECTION: INDEXES
-- ==========================================================
-- 207 indexes exist in DEV but NOT in PROD

CREATE INDEX "actions_trigger_type_idx" ON "public"."automations" USING "btree" ("trigger_type");

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

CREATE INDEX "idx_actions_not_archived" ON "public"."automations" USING "btree" ("id") WHERE ("archived_at" IS NULL);

CREATE INDEX "idx_application_appraisal_app" ON "public"."application_appraisal" USING "btree" ("application_id");

CREATE INDEX "idx_application_background_app" ON "public"."application_background" USING "btree" ("application_id");

CREATE INDEX "idx_application_credit_app" ON "public"."application_credit" USING "btree" ("application_id");

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

CREATE INDEX "idx_crdl_aggregator_data" ON "public"."credit_report_data_links" USING "btree" ("aggregator_data_id");

CREATE INDEX "idx_crdl_credit_report" ON "public"."credit_report_data_links" USING "btree" ("credit_report_id");

CREATE INDEX "idx_credit_report_data_xactus_borrower_id" ON "public"."credit_report_data_xactus" USING "btree" ("borrower_id");

CREATE INDEX "idx_credit_report_data_xactus_credit_report_id" ON "public"."credit_report_data_xactus" USING "btree" ("credit_report_id");

CREATE INDEX "idx_custom_broker_settings_broker_org_id" ON "public"."custom_broker_settings" USING "btree" ("broker_org_id");

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

CREATE INDEX "idx_oam_manager_id" ON "public"."organization_account_managers" USING "btree" ("account_manager_id");

CREATE INDEX "idx_oam_org_id" ON "public"."organization_account_managers" USING "btree" ("organization_id");

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

CREATE INDEX "idx_program_conditions_program" ON "public"."program_conditions" USING "btree" ("program_id");

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

CREATE INDEX "idx_task_templates_not_archived" ON "public"."task_templates" USING "btree" ("id") WHERE ("archived_at" IS NULL);

CREATE INDEX "idx_term_sheet_templates_organization_id" ON "public"."document_templates" USING "btree" ("organization_id");

CREATE INDEX "idx_term_sheet_templates_user_id" ON "public"."document_templates" USING "btree" ("user_id");

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

CREATE INDEX "pricing_engine_input_categories_display_order_idx" ON "public"."pricing_engine_input_categories" USING "btree" ("display_order");

CREATE INDEX "program_documents_chunks_vs_embedding_idx" ON "public"."program_documents_chunks_vs" USING "hnsw" ("embedding" "public"."vector_cosine_ops");

CREATE INDEX "role_assignments_resource_type_idx" ON "public"."role_assignments" USING "btree" ("resource_type");

CREATE INDEX "scenario_rate_options_funded_pitia_idx" ON "public"."scenario_rate_options" USING "btree" ("funded_pitia");

CREATE INDEX "task_logic_actions_task_logic_id_idx" ON "public"."task_logic_actions" USING "btree" ("task_logic_id");

CREATE INDEX "task_logic_conditions_task_logic_id_idx" ON "public"."task_logic_conditions" USING "btree" ("task_logic_id");

CREATE INDEX "task_logic_task_template_id_idx" ON "public"."task_logic" USING "btree" ("task_template_id");


-- SECTION: RLS POLICIES
-- ==========================================================

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

CREATE POLICY "anon_read_organizations" ON "public"."organizations" FOR SELECT TO "anon" USING (true);

CREATE POLICY "anon_select" ON "public"."deal_stepper" FOR SELECT TO "anon" USING (true);

CREATE POLICY "anon_select" ON "public"."input_stepper" FOR SELECT TO "anon" USING (true);

CREATE POLICY "anon_select" ON "public"."llama_document_chunks_vs" FOR SELECT TO "anon" USING (true);

CREATE POLICY "applications_modify_org" ON "public"."applications" USING (true) WITH CHECK (true);

CREATE POLICY "applications_select_org" ON "public"."applications" FOR SELECT USING (true);

CREATE POLICY "appraisal_amcs_delete" ON "public"."appraisal_amcs" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_amcs_insert" ON "public"."appraisal_amcs" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_amcs_select" ON "public"."appraisal_amcs" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_amcs_update" ON "public"."appraisal_amcs" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_delete" ON "public"."appraisal" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_insert" ON "public"."appraisal" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_select" ON "public"."appraisal" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "appraisal_update" ON "public"."appraisal" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "authenticated_all" ON "public"."deal_stepper" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON "public"."input_stepper" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "background_reports_delete" ON "public"."background_reports" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "background_reports_insert" ON "public"."background_reports" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "background_reports_select" ON "public"."background_reports" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "background_reports_update" ON "public"."background_reports" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."get_active_org_id"()));

CREATE POLICY "bra_delete" ON "public"."background_report_applications" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."background_reports" "br"
  WHERE (("br"."id" = "background_report_applications"."background_report_id") AND ("br"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "bra_insert" ON "public"."background_report_applications" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."background_reports" "br"
  WHERE (("br"."id" = "background_report_applications"."background_report_id") AND ("br"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "bra_select" ON "public"."background_report_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."background_reports" "br"
  WHERE (("br"."id" = "background_report_applications"."background_report_id") AND ("br"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "column_filters_read" ON "public"."organization_policies_column_filters" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "column_filters_service_role" ON "public"."organization_policies_column_filters" TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "crdl_delete" ON "public"."credit_report_data_links" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_data_links"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "crdl_insert" ON "public"."credit_report_data_links" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_data_links"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "crdl_select" ON "public"."credit_report_data_links" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_data_links"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "credit_report_viewers readable by owner/viewer" ON "public"."credit_report_viewers" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'service_role'::"text") OR ("user_id" = ("auth"."jwt"() ->> 'sub'::"text")) OR ("added_by" = ("auth"."jwt"() ->> 'sub'::"text")) OR (EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "credit_report_viewers"."report_id") AND (("auth"."jwt"() ->> 'sub'::"text") = ANY ("cr"."assigned_to")))))));

CREATE POLICY "credit_report_viewers service role all" ON "public"."credit_report_viewers" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));

CREATE POLICY "credit_reports owner or viewer select" ON "public"."credit_reports" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."jwt"() ->> 'sub'::"text") = ANY ("assigned_to")) OR (EXISTS ( SELECT 1
   FROM "public"."credit_report_viewers" "v"
  WHERE (("v"."report_id" = "credit_reports"."id") AND ("v"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))))));

CREATE POLICY "credit_reports service role all" ON "public"."credit_reports" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));

CREATE POLICY "dashboard_widgets_insert" ON "public"."dashboard_widgets" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));

CREATE POLICY "dashboard_widgets_select" ON "public"."dashboard_widgets" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "dashboard_widgets_update" ON "public"."dashboard_widgets" FOR UPDATE TO "authenticated" USING (((( SELECT "organizations"."is_internal_yn"
   FROM "public"."organizations"
  WHERE ("organizations"."clerk_organization_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))) = true) AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_role'::"text") = ANY (ARRAY['admin'::"text", 'owner'::"text"]))));

CREATE POLICY "deal_stages_select_authenticated" ON "public"."deal_stages" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));

CREATE POLICY "deal_task_events_select_authenticated" ON "public"."deal_task_events" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "deal_tasks_select_authenticated" ON "public"."deal_tasks" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));

CREATE POLICY "dfcr_delete" ON "public"."document_files_credit_reports" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "document_files_credit_reports"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "dfcr_insert" ON "public"."document_files_credit_reports" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "document_files_credit_reports"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));

CREATE POLICY "dfcr_select" ON "public"."document_files_credit_reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."credit_reports" "cr"
  WHERE (("cr"."id" = "document_files_credit_reports"."credit_report_id") AND ("cr"."organization_id" = "public"."get_active_org_id"())))));

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

CREATE POLICY "members_internal_admins" ON "public"."organization_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")) AND ("users"."is_internal_yn" = true)))));

CREATE POLICY "members_service_role" ON "public"."organization_members" TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "members_view_own" ON "public"."organization_members" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));

CREATE POLICY "named_scope_tables_read" ON "public"."organization_policy_named_scope_tables" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "named_scope_tables_service" ON "public"."organization_policy_named_scope_tables" TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "named_scopes_read" ON "public"."organization_policy_named_scopes" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "named_scopes_service" ON "public"."organization_policy_named_scopes" TO "service_role" USING (true) WITH CHECK (true);

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

CREATE POLICY "organization_policies_delete_admin_or_owner" ON "public"."organization_policies" FOR DELETE TO "authenticated" USING ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"()))));

CREATE POLICY "organization_policies_insert_admin_or_owner" ON "public"."organization_policies" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"()))));

CREATE POLICY "organization_policies_read_own_org" ON "public"."organization_policies" FOR SELECT TO "authenticated" USING (((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")) AND (("org_id" = "public"."get_active_org_id"()) OR ("org_id" IS NULL))));

CREATE POLICY "organization_policies_update_admin_or_owner" ON "public"."organization_policies" FOR UPDATE TO "authenticated" USING ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"())))) WITH CHECK ((("org_id" = "public"."get_active_org_id"()) AND ("public"."is_org_owner"("public"."get_active_org_id"()) OR "public"."is_org_admin"("public"."get_active_org_id"()))));

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

CREATE POLICY "task_logic_actions_select_authenticated" ON "public"."task_logic_actions" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "task_logic_conditions_select_authenticated" ON "public"."task_logic_conditions" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "task_logic_select_authenticated" ON "public"."task_logic" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "task_priorities_select_authenticated" ON "public"."task_priorities" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "task_statuses_select_authenticated" ON "public"."task_statuses" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "task_templates_select_authenticated" ON "public"."task_templates" FOR SELECT TO "authenticated" USING ((("archived_at" IS NULL) OR ("current_setting"('app.show_archived'::"text", true) = 'true'::"text")));

CREATE POLICY "user_deal_access_self" ON "public"."user_deal_access" FOR SELECT TO "authenticated" USING (("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")));

CREATE POLICY "user_deal_access_service" ON "public"."user_deal_access" TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "workflow_execution_logs_select" ON "public"."workflow_execution_logs" FOR SELECT TO "authenticated" USING (("execution_id" IN ( SELECT "workflow_executions"."id"
   FROM "public"."workflow_executions"
  WHERE ("workflow_executions"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));

CREATE POLICY "workflow_executions_select" ON "public"."workflow_executions" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));


-- SECTION: TRIGGERS
-- ==========================================================

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

CREATE OR REPLACE TRIGGER "loans_set_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "loans_set_updated_at" BEFORE UPDATE ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "on_document_file_inserted" AFTER INSERT ON "public"."document_files" FOR EACH ROW EXECUTE FUNCTION "public"."notify_n8n_on_document_file_insert"();

CREATE OR REPLACE TRIGGER "on_org_created_create_theme" AFTER INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_org_theme"();

CREATE OR REPLACE TRIGGER "organizations_set_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "programs_set_updated_at" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

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

-- ============================================================================
-- OBJECTS ADDED FROM TASK 5.0 PRE-FLIGHT (drift since 2026-03-03 snapshot)
-- ============================================================================

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_input_linked_rules_input_id" ON "public"."input_linked_rules" USING btree ("input_id");

-- RLS enablement
ALTER TABLE "public"."input_linked_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."input_autofill_rules" ENABLE ROW LEVEL SECURITY;

-- Policies for input_linked_rules
CREATE POLICY "Authenticated users can delete input_linked_rules" ON "public"."input_linked_rules" FOR DELETE TO "authenticated" USING (true);
CREATE POLICY "Authenticated users can insert input_linked_rules" ON "public"."input_linked_rules" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Authenticated users can read input_linked_rules" ON "public"."input_linked_rules" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Authenticated users can update input_linked_rules" ON "public"."input_linked_rules" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on input_linked_rules" ON "public"."input_linked_rules" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

