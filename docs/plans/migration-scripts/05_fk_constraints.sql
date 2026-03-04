-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- Apply AFTER all tables are created
-- ============================================================================

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

ALTER TABLE ONLY "public"."credit_report_data_links"
    ADD CONSTRAINT "credit_report_data_links_credit_report_id_fkey" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "credit_report_data_xactus_credit_report_id_fkey" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "credit_report_data_xactus_guarantor_id_fkey" FOREIGN KEY ("guarantor_id") REFERENCES "public"."guarantor"("id");

ALTER TABLE ONLY "public"."credit_report_data_xactus"
    ADD CONSTRAINT "credit_report_data_xactus_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."custom_broker_settings"
    ADD CONSTRAINT "custom_broker_settings_broker_org_fk" FOREIGN KEY ("broker_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

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

ALTER TABLE ONLY "public"."organization_account_managers"
    ADD CONSTRAINT "organization_account_managers_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."organization_members"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_account_managers"
    ADD CONSTRAINT "organization_account_managers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_member_roles"
    ADD CONSTRAINT "organization_member_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_policies"
    ADD CONSTRAINT "organization_policies_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."organization_policies"
    ADD CONSTRAINT "organization_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_policy_named_scope_tables"
    ADD CONSTRAINT "organization_policy_named_scope_tables_scope_name_fkey" FOREIGN KEY ("scope_name") REFERENCES "public"."organization_policy_named_scopes"("name") ON DELETE CASCADE;

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

ALTER TABLE ONLY "public"."pricing_engine_inputs"
    ADD CONSTRAINT "pricing_engine_inputs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."pricing_engine_input_categories"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_field_fkey" FOREIGN KEY ("field") REFERENCES "public"."pricing_engine_inputs"("id");

ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."program_conditions"
    ADD CONSTRAINT "program_conditions_value_field_fkey" FOREIGN KEY ("value_field") REFERENCES "public"."pricing_engine_inputs"("id");

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

ALTER TABLE ONLY "public"."document_categories_user_order"
    ADD CONSTRAINT "user_pref_document_categories_order_document_categories_id_fkey" FOREIGN KEY ("document_categories_id") REFERENCES "public"."document_categories"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."workflow_execution_logs"
    ADD CONSTRAINT "workflow_execution_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE;

-- FK constraints added from Task 5.0 pre-flight (drift since 2026-03-03)
ALTER TABLE ONLY "public"."input_linked_rules"
    ADD CONSTRAINT "input_linked_rules_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "public"."inputs"("id");

ALTER TABLE ONLY "public"."input_autofill_rules"
    ADD CONSTRAINT "input_autofill_rules_source_linked_rule_id_fkey" FOREIGN KEY ("source_linked_rule_id") REFERENCES "public"."input_linked_rules"("id");

