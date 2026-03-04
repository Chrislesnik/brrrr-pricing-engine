-- ============================================================================
-- GRANTS FOR NEW OBJECTS
-- ============================================================================

GRANT ALL ON FUNCTION "public"."auto_create_ai_input_order"() TO "anon";

GRANT ALL ON FUNCTION "public"."auto_create_ai_input_order"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."auto_create_ai_input_order"() TO "service_role";

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

GRANT ALL ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) TO "anon";

GRANT ALL ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) TO "authenticated";

GRANT ALL ON FUNCTION "public"."document_file_deal_ids"("p_document_file_id" bigint) TO "service_role";

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

GRANT ALL ON FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";

GRANT ALL ON FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";

GRANT ALL ON FUNCTION "public"."match_llama_document_chunks"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";

GRANT ALL ON FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";

GRANT ALL ON FUNCTION "public"."match_llama_document_chunks_vs"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";

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

GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() TO "anon";

GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_delete"() TO "service_role";

GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() TO "anon";

GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."sync_deal_clerk_orgs_on_insert"() TO "service_role";

GRANT ALL ON FUNCTION "public"."sync_stepper_on_dropdown_change"() TO "anon";

GRANT ALL ON FUNCTION "public"."sync_stepper_on_dropdown_change"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."sync_stepper_on_dropdown_change"() TO "service_role";

GRANT ALL ON FUNCTION "public"."sync_user_deal_access"() TO "anon";

GRANT ALL ON FUNCTION "public"."sync_user_deal_access"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."sync_user_deal_access"() TO "service_role";

GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_guarantors"() TO "anon";

GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_guarantors"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_guarantors"() TO "service_role";

GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_property"() TO "anon";

GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_property"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."trg_ddp_from_deal_property"() TO "service_role";

GRANT ALL ON FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() TO "anon";

GRANT ALL ON FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."trg_loan_scenario_inputs_sync_applications"() TO "service_role";

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

GRANT ALL ON TABLE "public"."contact" TO "anon";

GRANT ALL ON TABLE "public"."contact" TO "authenticated";

GRANT ALL ON TABLE "public"."contact" TO "service_role";

GRANT ALL ON SEQUENCE "public"."contact_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."contact_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."contact_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."credit_report_data_links" TO "anon";

GRANT ALL ON TABLE "public"."credit_report_data_links" TO "authenticated";

GRANT ALL ON TABLE "public"."credit_report_data_links" TO "service_role";

GRANT ALL ON SEQUENCE "public"."credit_report_data_links_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."credit_report_data_links_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."credit_report_data_links_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."credit_report_data_xactus" TO "anon";

GRANT ALL ON TABLE "public"."credit_report_data_xactus" TO "authenticated";

GRANT ALL ON TABLE "public"."credit_report_data_xactus" TO "service_role";

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

GRANT ALL ON TABLE "public"."email_templates" TO "anon";

GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."email_templates" TO "service_role";

GRANT ALL ON SEQUENCE "public"."email_templates_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."email_templates_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."email_templates_id_seq" TO "service_role";

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

GRANT ALL ON SEQUENCE "public"."organizations_org_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."organizations_org_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."organizations_org_id_seq" TO "service_role";

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

GRANT ALL ON TABLE "public"."program_rows_ids" TO "anon";

GRANT ALL ON TABLE "public"."program_rows_ids" TO "authenticated";

GRANT ALL ON TABLE "public"."program_rows_ids" TO "service_role";

GRANT ALL ON SEQUENCE "public"."program_rows_ids_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."program_rows_ids_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."program_rows_ids_id_seq" TO "service_role";

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

GRANT ALL ON TABLE "public"."user_deal_access" TO "anon";

GRANT ALL ON TABLE "public"."user_deal_access" TO "authenticated";

GRANT ALL ON TABLE "public"."user_deal_access" TO "service_role";

GRANT ALL ON TABLE "public"."workflow_execution_logs" TO "anon";

GRANT ALL ON TABLE "public"."workflow_execution_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."workflow_execution_logs" TO "service_role";

GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";

GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";

GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";

GRANT ALL ON TABLE "public"."workflow_nodes" TO "anon";

GRANT ALL ON TABLE "public"."workflow_nodes" TO "authenticated";

GRANT ALL ON TABLE "public"."workflow_nodes" TO "service_role";

-- Grants added from Task 5.0 pre-flight (drift since 2026-03-03 snapshot)

GRANT ALL ON TABLE "public"."input_linked_rules" TO "anon";
GRANT ALL ON TABLE "public"."input_linked_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."input_linked_rules" TO "service_role";

GRANT ALL ON TABLE "public"."input_autofill_rules" TO "anon";
GRANT ALL ON TABLE "public"."input_autofill_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."input_autofill_rules" TO "service_role";

