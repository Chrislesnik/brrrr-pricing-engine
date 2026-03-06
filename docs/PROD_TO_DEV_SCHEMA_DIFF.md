# PROD to DEV Schema Diff Analysis

**Generated**: 2026-03-03
**PROD project**: `brrrr-pricing-engine` (ref: `voowqmsukigzwqmssbzh`)
**DEV project**: `brrrr-pricing-engine-dev` (ref: `iufoslzvcjmtgsazttkt`)

## High-Level Summary

| Object Type  | PROD | DEV | Only in PROD | Only in DEV | Shared |
|-------------|------|-----|-------------|-------------|--------|
| Tables      | 39   | 164 | 9           | 134         | 30     |
| Functions   | 30   | 75  | 8           | 53          | 22     |
| Types/Enums | 3    | 5   | 0           | 2           | 3      |
| Indexes     | 75   | 262 | 20          | 207         | 55     |
| RLS Policies| 16   | 423 | 8           | 415         | 8      |

**Prod is massively behind dev.** Dev has 4x the tables, 2.5x the functions, 3.5x the indexes, and 26x the RLS policies.

---

## CATEGORY 1: ADDITIVE CHANGES (safe to apply directly)

These create new objects that don't exist in prod. No risk of breaking existing functionality.

### 1A. New Tables (134 tables)

Grouped by feature area:

**Deals Pipeline (core)**
- `deals` (note: `loans` table still exists in both — see Category 3)
- `deal_borrower`, `deal_entity`, `deal_entity_owners`, `deal_guarantors`, `deal_property`
- `deal_roles`, `deal_role_types`
- `deal_stages`, `deal_stepper`, `deal_stepper_history`
- `deal_tasks`, `deal_task_events`
- `deal_comments`, `deal_comment_mentions`, `deal_comment_reads`
- `deal_signature_requests`
- `deal_users`, `deal_clerk_orgs`
- `deal_calendar_events`
- `deal_inputs`
- `deal_documents`, `deal_document_overrides`
- `deal_document_ai_chat`, `deal_document_ai_condition`, `deal_document_ai_input`
- `user_deal_access`
- `contact`, `guarantor`, `property`

**Documents System**
- `document_files`
- `document_categories`, `document_categories_user_order`
- `document_status`, `document_file_statuses`
- `document_template_variables` (renamed from `term_sheet_template_fields` — see Category 3)
- `document_files_borrowers`, `document_files_entities`
- `document_files_deals`, `document_files_clerk_orgs`, `document_files_clerk_users`
- `document_files_credit_reports`, `document_files_background_reports`
- `document_files_tags`, `document_tags`
- `document_logic`, `document_logic_actions`, `document_logic_conditions`
- `document_roles`, `document_roles_files`
- `document_access_permissions`, `document_access_permissions_global`
- `document_types`, `document_type_ai_condition`, `document_type_ai_input`, `document_type_ai_input_order`

**Appraisal System**
- `appraisal`
- `application_appraisal`
- `appraisal_amcs`
- `appraisal_borrowers`, `appraisal_documents`
- `appraisal_status_list`, `appraisal_property_list`, `appraisal_investor_list`
- `appraisal_lender_list`, `appraisal_loan_type_list`, `appraisal_occupancy_list`
- `appraisal_product_list`, `appraisal_transaction_type_list`

**Background Reports**
- `background_reports`, `background_report_applications`
- `background_person_search`
- `background_person_search_bankruptcy`, `background_person_search_criminal`
- `background_person_search_lien`, `background_person_search_litigation`
- `background_person_search_quick_analysis`, `background_person_search_ucc`

**Organizations / RBAC**
- `organization_policies`, `organization_policies_column_filters`
- `organization_policy_named_scopes`, `organization_policy_named_scope_tables`
- `organization_member_roles`
- `organization_account_managers`
- `rbac_permissions`, `role_assignments`

**Automations / Workflows**
- `automations`
- `task_logic`, `task_logic_actions`, `task_logic_conditions`
- `task_statuses`, `task_priorities`
- `task_templates`, `task_template_roles`
- `workflow_executions`, `workflow_execution_logs`, `workflow_nodes`

**Pricing Engine**
- `pe_term_sheets`, `pe_term_sheet_rules`, `pe_term_sheet_conditions`
- `pe_input_logic`, `pe_input_logic_actions`, `pe_input_logic_conditions`
- `pe_section_buttons`, `pe_section_button_actions`
- `pricing_engine_inputs`, `pricing_engine_input_categories`
- `inputs`, `input_categories`, `input_logic`, `input_logic_actions`, `input_logic_conditions`
- `input_stepper`
- `program_conditions`, `program_rows_ids`
- `scenario_program_results`, `scenario_rate_options`
- `loan_scenario_inputs`

**Integrations (new system)**
- `integration_settings`, `integration_setup`, `integration_tags`

**AI / LLM**
- `llama_document_chunks_vs`, `llama_document_parsed`
- `credit_report_data_links`, `credit_report_data_xactus`

**Dashboards**
- `dashboard_widgets`, `dashboard_widget_chats`, `dashboard_widget_conversations`

**Other**
- `app_settings`
- `email_templates`
- `landing_page_templates`
- `notifications`
- `application_background`, `application_credit`

### 1B. New Functions (53 functions)

- `can_access_deal_document`, `can_access_deal_document_by_code`, `can_access_document`
- `can_access_org_resource`, `check_org_access`
- `check_named_scope`, `check_named_scope_from_scope_string`
- `get_active_org_id`, `get_clerk_user_id`, `get_current_user_id`
- `is_internal_admin`, `is_org_admin`, `is_org_owner`
- `create_default_org_policies`, `create_default_org_theme`
- `create_document_with_deal_link`, `create_document_with_subject_link`
- `finalize_document_upload`, `document_file_deal_ids`, `get_deal_documents`
- `cascade_archive`
- `exec_sql`
- `generate_application_display_id`, `generate_loan_display_id`, `generate_tag_slug`
- `get_node_last_output`, `get_primary_key_column`, `get_public_table_names`
- `list_public_functions`, `list_public_tables`, `list_table_columns`
- `handle_property_changes`, `handle_users_updated_at`
- `match_llama_document_chunks`, `match_llama_document_chunks_vs`, `match_program_document_chunks`
- `notify_background_report_created`, `notify_n8n_on_document_file_insert`
- `register_integration_feature_policy`, `rls_auto_enable`
- `seed_custom_broker_settings_on_assignment`
- `sync_deal_clerk_orgs_on_delete`, `sync_deal_clerk_orgs_on_insert`
- `sync_stepper_on_dropdown_change`, `sync_user_deal_access`
- `auto_create_ai_input_order`, `fail_stale_llama_document_parsed`
- `trg_ddp_from_deal_guarantors`, `trg_ddp_from_deal_property`
- `trg_loan_scenario_inputs_sync_applications`
- `update_deal_signature_requests_updated_at`
- `validate_deal_guarantors_array`, `validate_document_file_status_assignment`

### 1C. New Types/Enums (2)

- `country` (enum)
- `org_access_result` (composite type)

### 1D. New Indexes (207)

See full list in the schema dump diff. All indexes for the new tables above.

### 1E. New RLS Policies (415)

Massive RLS policy expansion for org-scoped access control across all new tables.

### 1F. New Columns on Existing Tables (additive)

These add new columns without removing or changing existing ones:

| Table | New Columns |
|-------|-------------|
| `ai_chats` | `loan_type`, `program_id` |
| `applications` | `display_id`, `external_defaults`, `form_data`, `merged_data` |
| `borrowers` | `archived_at`, `archived_by` |
| `organizations` | `is_internal_yn`, `org_id`, `whitelabel_logo_dark_url`, `whitelabel_logo_light_url`, `whitelabel_logo_url` |
| `users` | 28 new columns (email, avatar, phone, roles, clerk fields, etc.) |

---

## CATEGORY 2: NON-ADDITIVE CHANGES (require expand-and-contract)

These modify or remove existing objects. Must be done carefully to avoid breaking the production app.

### 2A. Column Drops (data-destructive)

| Table | Column to Drop | Current Type |
|-------|---------------|-------------|
| `credit_reports` | `aggregator_id` | `uuid` |
| `credit_reports` | `bucket` | `text` |
| `credit_reports` | `metadata` | `jsonb` |
| `credit_reports` | `storage_path` | `text` |
| `custom_broker_settings` | `broker_id` | `uuid` (RENAMED to `broker_org_id`) |
| `document_templates` | `craft_json` | `jsonb` |
| `entities` | `account_balances` | `text` |
| `entities` | `bank_name` | `text` |
| `loan_scenarios` | `borrower_entity_id` | `uuid` |
| `loan_scenarios` | `guarantor_borrower_ids` | `uuid[]` |
| `loan_scenarios` | `guarantor_emails` | `text[]` |
| `loan_scenarios` | `guarantor_names` | `text[]` |
| `loan_scenarios` | `inputs` | `jsonb` |
| `loan_scenarios` | `selected` | `jsonb` |
| `loan_scenarios` | `user_id` | `text` |
| `loans` | `assigned_to_user_id` | `jsonb` |
| `loans` | `borrower_first_name` | `text` |
| `loans` | `borrower_last_name` | `text` |
| `loans` | `inputs` | `jsonb` |
| `loans` | `loan_amount` | `numeric` |
| `loans` | `loan_type` | `text` |
| `loans` | `meta` | `jsonb` |
| `loans` | `program_id` | `uuid` |
| `loans` | `property_address` | `text` |
| `loans` | `rate` | `numeric` |
| `loans` | `selected` | `jsonb` |
| `loans` | `transaction_type` | `text` |
| `organization_members` | `role` | `text` (RENAMED to `clerk_org_role`) |
| `programs` | `loan_type` | `text` |
| `programs` | `organization_id` | `uuid` |

### 2B. Column Renames

| Table | Old Name | New Name |
|-------|----------|----------|
| `custom_broker_settings` | `broker_id` | `broker_org_id` |
| `organization_members` | `role` | `clerk_org_role` |

### 2C. Column Type/Default Changes

| Table | Column | Change |
|-------|--------|--------|
| `document_templates.id` | Added `DEFAULT gen_random_uuid()` |
| `loans.status` | Added `DEFAULT 'active'` |
| `organization_themes.theme_dark` | Removed `DEFAULT '{}'` |
| `organization_themes.theme_light` | Removed `DEFAULT '{}'` |

### 2D. Table Renames / Replacements

| PROD Table | DEV Equivalent | Notes |
|-----------|---------------|-------|
| `term_sheet_template_fields` | `document_template_variables` | Table rename + likely column changes |
| `term_sheet_templates` | Absorbed into `document_templates` | PROD has both; structure differs |

### 2E. Tables to Drop from PROD (no equivalent in DEV)

| Table | Notes |
|-------|-------|
| `integrations` | Replaced by `integration_settings` + `integration_setup` |
| `integrations_clear` | Part of old integrations system |
| `integrations_floify` | Part of old integrations system |
| `integrations_nadlan` | Part of old integrations system |
| `integrations_xactus` | Part of old integrations system |
| `workflow_integrations` | Replaced by `workflow_executions` + `workflow_nodes` |
| `xactus_data` | Part of old integrations system |

### 2F. Functions to Drop from PROD (no equivalent in DEV)

| Function | Notes |
|----------|-------|
| `create_xactus_subtable_row` | Old integrations trigger |
| `ensure_clear_integration` | Old integrations trigger |
| `ensure_floify_integration` | Old integrations trigger |
| `ensure_xactus_integration` | Old integrations trigger |
| `seed_custom_broker_settings_from_default` | Replaced by `seed_custom_broker_settings_on_assignment` |
| `seed_custom_broker_settings_on_member_attach` | Replaced |
| `sync_clear_child` | Old integrations trigger |
| `sync_nadlan_child` | Old integrations trigger |

### 2G. Indexes to Drop from PROD (20 indexes)

- `credit_reports_bucket_path_idx` (column being dropped)
- `document_templates_org_updated_idx`
- `idx_custom_broker_settings_broker_id` (column renamed)
- `idx_integrations_org`, `idx_integrations_type` (table being dropped)
- `idx_loan_scenarios_inputs_gin`, `idx_loan_scenarios_selected_gin` (columns being dropped)
- `idx_loans_assigned_gin`, `idx_loans_inputs_gin`, `idx_loans_program`, `idx_loans_selected_gin` (columns being dropped)
- `idx_organization_themes_org_id`
- `idx_programs_org`, `programs_org_id_idx` (column being dropped)
- `idx_term_sheet_template_fields_template_id` (table being renamed)
- `idx_term_sheet_templates_org`, `idx_term_sheet_templates_user` (table being renamed)
- `idx_workflow_integrations_org_user`, `idx_workflow_integrations_type` (table being dropped)
- `uq_integrations_org_user_type` (table being dropped)

### 2H. RLS Policies to Drop from PROD (8 policies)

These are on tables being dropped or restructured.

---

## CATEGORY 3: SPECIAL CASES

### 3A. The `loans` -> `deals` Situation

- PROD has: `loans` (with many columns that have been removed in dev)
- DEV has: `loans` (slimmed down, with `archived_at`/`archived_by` added) AND `deals` (new table)
- The `loans` table was NOT fully replaced by `deals` in dev — both exist
- `deals` appears to be the new pipeline entity; `loans` is retained as legacy/pricing
- **Strategy**: Create `deals` table (additive), then gradually migrate data and drop old `loans` columns

### 3B. The `document_templates` Conflict

- PROD has: `document_templates` (with `craft_json`, uuid PK without default)
- DEV has: `document_templates` (with `gjs_data`, `html_content`, `user_id`, uuid PK with `gen_random_uuid()`)
- These are the SAME table with significant column differences
- PROD also has `term_sheet_templates` which may have been the original source
- **Strategy**: Add new columns first (additive), migrate data, then drop old columns

### 3C. The Old Integrations System

- PROD has: `integrations`, `integrations_clear`, `integrations_floify`, `integrations_nadlan`, `integrations_xactus`, `xactus_data`, `workflow_integrations`
- DEV replaced all of these with: `integration_settings`, `integration_setup`, `integration_tags`
- **Strategy**: Create new tables (additive), migrate data, then drop old tables (contract)

---

## MIGRATION EFFORT ESTIMATE

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Additive (new tables, columns, functions, types) | **Large** — 134 tables, 53 functions, 207 indexes, 415 RLS policies | **Low** |
| Phase 2: Data migration (move data to new structures) | **Medium** — deals, documents, integrations | **Medium** |
| Phase 3: Contract (drop old columns, tables, functions) | **Medium** — 30+ column drops, 7 table drops, 8 function drops, 20 index drops | **High** |

Total scope: This is a very large migration. The additive phase alone involves creating 134 new tables.
