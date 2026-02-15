create type "public"."country" as enum ('Bonaire, Sint Eustatius and Saba', 'Curaçao', 'Guernsey', 'Isle of Man', 'Jersey', 'Åland Islands', 'Montenegro', 'Saint Barthélemy', 'Saint Martin (French part)', 'Serbia', 'Sint Maarten (Dutch part)', 'South Sudan', 'Timor-Leste', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Bouvet Island', 'Brazil', 'British Indian Ocean Territory', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'China', 'Christmas Island', 'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Congo', 'Congo, the Democratic Republic of the', 'Cook Islands', 'Costa Rica', 'Cote DIvoire', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Falkland Islands (Malvinas)', 'Faroe Islands', 'Fiji', 'Finland', 'France', 'French Guiana', 'French Polynesia', 'French Southern Territories', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard Island and Mcdonald Islands', 'Holy See (Vatican City State)', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran, Islamic Republic of', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, Democratic People''s Republic of', 'Korea, Republic of', 'Kuwait', 'Kyrgyzstan', 'Lao People''s Democratic Republic', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Macedonia, the Former Yugoslav Republic of', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique', 'Mauritania', 'Mauritius', 'Mayotte', 'Mexico', 'Micronesia, Federated States of', 'Moldova, Republic of', 'Monaco', 'Mongolia', 'Albania', 'Montserrat', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Caledonia', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'Northern Mariana Islands', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine, State of', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Reunion', 'Romania', 'Russian Federation', 'Rwanda', 'Saint Helena, Ascension and Tristan da Cunha', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Pierre and Miquelon', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Georgia and the South Sandwich Islands', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Svalbard and Jan Mayen', 'Swaziland', 'Sweden', 'Switzerland', 'Syrian Arab Republic', 'Taiwan (Province of China)', 'Tajikistan', 'Tanzania, United Republic of', 'Thailand', 'Togo', 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'United States Minor Outlying Islands', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Viet Nam', 'Virgin Islands (British)', 'Virgin Islands (U.S.)', 'Wallis and Futuna', 'Western Sahara', 'Yemen', 'Zambia', 'Zimbabwe', 'Afghanistan', 'Algeria');

create type "public"."entity_type" as enum ('general_partnership', 'limited_liability_company', 'limited_liability_partnership', 'limited_partnership', 'corp', 'c-corp', 's_corp', 'sole_proprietorship', 'other');

create type "public"."us_states" as enum ('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC', 'PR');

create type "public"."us_states_long" as enum ('alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'district_of_columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new_hampshire', 'new_jersey', 'new_mexico', 'new_york', 'north_carolina', 'north_dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode_island', 'south_carolina', 'south_dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west_virginia', 'wisconsin', 'wyoming');

drop policy "org_policy_delete" on "public"."document_files_deals";

drop policy "org_policy_insert" on "public"."document_files_deals";

drop policy "org_policy_select" on "public"."document_files_deals";

drop policy "org_policy_update" on "public"."document_files_deals";

drop policy "org_policy_delete" on "public"."input_categories";

drop policy "org_policy_insert" on "public"."input_categories";

drop policy "org_policy_select" on "public"."input_categories";

drop policy "org_policy_update" on "public"."input_categories";

drop policy "org_policy_delete" on "public"."inputs";

drop policy "org_policy_insert" on "public"."inputs";

drop policy "org_policy_select" on "public"."inputs";

drop policy "org_policy_update" on "public"."inputs";

drop policy "org_policy_delete" on "public"."application_signings";

drop policy "org_policy_insert" on "public"."application_signings";

drop policy "org_policy_select" on "public"."application_signings";

drop policy "org_policy_update" on "public"."application_signings";

drop policy "org_policy_delete" on "public"."document_template_fields";

drop policy "org_policy_insert" on "public"."document_template_fields";

drop policy "org_policy_select" on "public"."document_template_fields";

drop policy "org_policy_update" on "public"."document_template_fields";

drop policy "org_policy_delete" on "public"."document_templates";

drop policy "org_policy_insert" on "public"."document_templates";

drop policy "org_policy_select" on "public"."document_templates";

drop policy "org_policy_update" on "public"."document_templates";

drop policy "org_policy_delete" on "public"."pricing_activity_log";

drop policy "org_policy_insert" on "public"."pricing_activity_log";

drop policy "org_policy_select" on "public"."pricing_activity_log";

drop policy "org_policy_update" on "public"."pricing_activity_log";

drop policy "org_policy_delete" on "public"."term_sheets";

drop policy "org_policy_insert" on "public"."term_sheets";

drop policy "org_policy_select" on "public"."term_sheets";

drop policy "org_policy_update" on "public"."term_sheets";

revoke delete on table "public"."document_files_inputs" from "anon";

revoke insert on table "public"."document_files_inputs" from "anon";

revoke references on table "public"."document_files_inputs" from "anon";

revoke select on table "public"."document_files_inputs" from "anon";

revoke trigger on table "public"."document_files_inputs" from "anon";

revoke truncate on table "public"."document_files_inputs" from "anon";

revoke update on table "public"."document_files_inputs" from "anon";

revoke delete on table "public"."document_files_inputs" from "authenticated";

revoke insert on table "public"."document_files_inputs" from "authenticated";

revoke references on table "public"."document_files_inputs" from "authenticated";

revoke select on table "public"."document_files_inputs" from "authenticated";

revoke trigger on table "public"."document_files_inputs" from "authenticated";

revoke truncate on table "public"."document_files_inputs" from "authenticated";

revoke update on table "public"."document_files_inputs" from "authenticated";

revoke delete on table "public"."document_files_inputs" from "service_role";

revoke insert on table "public"."document_files_inputs" from "service_role";

revoke references on table "public"."document_files_inputs" from "service_role";

revoke select on table "public"."document_files_inputs" from "service_role";

revoke trigger on table "public"."document_files_inputs" from "service_role";

revoke truncate on table "public"."document_files_inputs" from "service_role";

revoke update on table "public"."document_files_inputs" from "service_role";

alter table "public"."background_report_applications" drop constraint "background_report_application_background_report_id_applicat_key";

alter table "public"."credit_report_data_links" drop constraint "credit_report_data_links_credit_report_id_aggregator_key";

alter table "public"."deal_clerk_orgs" drop constraint "deals_clerk_orgs_clerk_org_id_fkey";

alter table "public"."deal_clerk_orgs" drop constraint "deals_clerk_orgs_deal_id_fkey";

alter table "public"."deal_clerk_orgs" drop constraint "deals_orgs_deal_id_clerk_org_id_key";

alter table "public"."deal_document_ai_condition" drop constraint "deal_document_ai_condition_deal_document_id_document_type_a_key";

alter table "public"."deal_document_ai_input" drop constraint "deal_document_ai_input_deal_document_id_document_type_ai_in_key";

alter table "public"."deal_inputs" drop constraint "deal_inputs_deal_id_input_id_key";

alter table "public"."deals" drop constraint "deals_program_id_fkey";

alter table "public"."document_files_inputs" drop constraint "document_files_inputs_document_file_id_fkey";

alter table "public"."document_files_inputs" drop constraint "document_files_inputs_document_file_id_input_id_key";

alter table "public"."document_files_inputs" drop constraint "document_files_inputs_input_id_fkey";

alter table "public"."inputs" drop constraint "inputs_input_code_key";

alter table "public"."programs" drop constraint "programs_organization_id_fkey";

alter table "public"."task_templates" drop constraint "task_templates_org_code_key";

alter table "public"."task_templates" drop constraint "task_templates_organization_id_fkey";

alter table "public"."workflow_integrations" drop constraint "workflow_integrations_organization_id_user_id_type_name_key";

alter table "public"."application_signings" drop constraint "application_signings_loan_id_fkey";

alter table "public"."applications" drop constraint "applications_loan_id_fkey";

alter table "public"."deal_documents" drop constraint "deal_documents_document_type_id_fkey";

alter table "public"."document_logic_actions" drop constraint "document_logic_actions_document_type_id_fkey";

alter table "public"."document_logic_conditions" drop constraint "document_logic_conditions_field_fkey";

alter table "public"."document_logic_conditions" drop constraint "document_logic_conditions_value_field_fkey";

alter table "public"."document_type_ai_input" drop constraint "document_type_ai_input_input_id_fkey";

alter table "public"."document_types" drop constraint "document_types_document_category_id_fkey";

alter table "public"."loan_scenarios" drop constraint "loan_scenarios_loan_id_fkey";

alter table "public"."pricing_activity_log" drop constraint "pricing_activity_log_loan_id_fkey";

alter table "public"."term_sheets" drop constraint "term_sheets_loan_id_fkey";

drop view if exists "public"."entities_view";

drop function if exists "public"."match_documents"(query_embedding public.vector, match_count integer, filter jsonb);

alter table "public"."deal_clerk_orgs" drop constraint "deals_orgs_pkey";

alter table "public"."document_files_inputs" drop constraint "document_files_inputs_pkey";

alter table "public"."llama_document_parsed" drop constraint "llama_document_parsed_pkey";

alter table "public"."document_files_deals" drop constraint "document_files_deals_pkey";

drop index if exists "public"."background_report_application_background_report_id_applicat_key";

drop index if exists "public"."credit_report_data_links_credit_report_id_aggregator_key";

drop index if exists "public"."deal_document_ai_condition_deal_document_id_document_type_a_key";

drop index if exists "public"."deal_document_ai_input_deal_document_id_document_type_ai_in_key";

drop index if exists "public"."deal_inputs_deal_id_input_id_key";

drop index if exists "public"."deals_orgs_deal_id_clerk_org_id_key";

drop index if exists "public"."deals_orgs_pkey";

drop index if exists "public"."document_files_inputs_document_file_id_input_id_key";

drop index if exists "public"."document_files_inputs_pkey";

drop index if exists "public"."idx_deal_documents_document_type_id";

drop index if exists "public"."idx_deals_inputs_gin";

drop index if exists "public"."idx_deals_orgs_clerk_org_id";

drop index if exists "public"."idx_deals_orgs_deal_id";

drop index if exists "public"."idx_deals_program";

drop index if exists "public"."idx_deals_selected_gin";

drop index if exists "public"."idx_deals_status";

drop index if exists "public"."idx_dfd_deal";

drop index if exists "public"."idx_dfd_doc";

drop index if exists "public"."idx_document_files_inputs_doc";

drop index if exists "public"."idx_document_files_inputs_input";

drop index if exists "public"."idx_document_logic_actions_logic_id";

drop index if exists "public"."idx_document_logic_conditions_logic_id";

drop index if exists "public"."idx_document_type_ai_condition_doc_type";

drop index if exists "public"."idx_document_type_ai_input_doc_type";

drop index if exists "public"."idx_programs_org";

drop index if exists "public"."inputs_input_code_key";

drop index if exists "public"."llama_document_parsed_pkey";

drop index if exists "public"."programs_org_id_idx";

drop index if exists "public"."task_templates_org_code_key";

drop index if exists "public"."workflow_integrations_organization_id_user_id_type_name_key";

drop index if exists "public"."document_files_deals_pkey";

drop table "public"."document_files_inputs";


  create table "public"."loans" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "status" text default 'active'::text,
    "assigned_to_user_id" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "primary_user_id" text
      );


alter table "public"."loans" enable row level security;

alter table "public"."actions" enable row level security;

alter table "public"."application_appraisal" enable row level security;

alter table "public"."application_background" enable row level security;

alter table "public"."application_credit" enable row level security;

alter table "public"."applications" add column "external_defaults" jsonb default '{}'::jsonb;

alter table "public"."applications" add column "form_data" jsonb default '{}'::jsonb;

alter table "public"."applications" add column "merged_data" jsonb default '{}'::jsonb;

alter table "public"."appraisal" add column "amc_id" bigint;

alter table "public"."appraisal" add column "borrower_id" uuid;

alter table "public"."appraisal" add column "borrower_name" text;

alter table "public"."appraisal" add column "created_by" text;

alter table "public"."appraisal" add column "date_due" date;

alter table "public"."appraisal" add column "loan_number" text;

alter table "public"."appraisal" add column "organization_id" uuid;

alter table "public"."appraisal" add column "property_address" text;

alter table "public"."appraisal" add column "property_city" text;

alter table "public"."appraisal" add column "property_state" text;

alter table "public"."appraisal" add column "property_zip" text;

alter table "public"."appraisal_amcs" enable row level security;

alter table "public"."background_report_applications" enable row level security;

alter table "public"."background_reports" enable row level security;

alter table "public"."credit_report_data_links" enable row level security;

alter table "public"."credit_report_data_xactus" add column "organization_id" uuid;

alter table "public"."deal_calendar_events" enable row level security;

alter table "public"."deal_document_ai_chat" enable row level security;

alter table "public"."deal_document_ai_condition" enable row level security;

alter table "public"."deal_document_ai_input" enable row level security;

alter table "public"."deal_documents" add column "document_file_id" bigint;

alter table "public"."deal_stepper" enable row level security;

alter table "public"."deals" drop column "borrower_first_name";

alter table "public"."deals" drop column "borrower_last_name";

alter table "public"."deals" drop column "inputs";

alter table "public"."deals" drop column "loan_amount";

alter table "public"."deals" drop column "loan_type";

alter table "public"."deals" drop column "meta";

alter table "public"."deals" drop column "program_id";

alter table "public"."deals" drop column "property_address";

alter table "public"."deals" drop column "rate";

alter table "public"."deals" drop column "selected";

alter table "public"."deals" drop column "status";

alter table "public"."deals" drop column "transaction_type";

alter table "public"."document_files_deals" add column "id" bigint generated by default as identity not null;

alter table "public"."document_files_deals" alter column "source_table" set default 'document_files'::text;

alter table "public"."entities" drop column "account_balances";

alter table "public"."entities" drop column "bank_name";

alter table "public"."input_logic" enable row level security;

alter table "public"."input_logic_actions" enable row level security;

alter table "public"."input_logic_conditions" enable row level security;

alter table "public"."input_stepper" enable row level security;

alter table "public"."llama_document_chunks_vs" enable row level security;

alter table "public"."llama_document_parsed" enable row level security;

alter table "public"."organization_member_roles" enable row level security;

alter table "public"."organization_members" enable row level security;

alter table "public"."organizations" add column "whitelabel_logo_url" text;

alter table "public"."programs" drop column "organization_id";

alter table "public"."task_logic_actions" add column "required_for_stage_id" bigint;

alter table "public"."task_logic_actions" add column "required_status_id" bigint;

alter table "public"."task_logic_conditions" add column "db_column" text;

alter table "public"."task_logic_conditions" add column "db_match_type" text;

alter table "public"."task_logic_conditions" add column "db_table" text;

alter table "public"."task_logic_conditions" add column "source_type" text not null default 'input'::text;

alter table "public"."task_templates" drop column "organization_id";

alter table "public"."workflow_execution_logs" enable row level security;

alter table "public"."workflow_executions" enable row level security;

alter table "public"."workflow_integrations" enable row level security;

CREATE UNIQUE INDEX background_report_applications_unique ON public.background_report_applications USING btree (background_report_id, application_id);

CREATE UNIQUE INDEX credit_report_data_links_unique ON public.credit_report_data_links USING btree (credit_report_id, aggregator);

CREATE UNIQUE INDEX deal_orgs_deal_id_clerk_org_id_key ON public.deal_clerk_orgs USING btree (deal_id, clerk_org_id);

CREATE UNIQUE INDEX deal_orgs_pkey ON public.deal_clerk_orgs USING btree (id);

CREATE INDEX deals_created_at_idx ON public.deals USING btree (created_at);

CREATE UNIQUE INDEX document_files_deals_doc_deal_uq ON public.document_files_deals USING btree (document_file_id, deal_id);

CREATE UNIQUE INDEX document_parsed_pkey ON public.llama_document_parsed USING btree (id);

CREATE INDEX idx_appraisal_borrower ON public.appraisal USING btree (borrower_id);

CREATE INDEX idx_appraisal_deal ON public.appraisal USING btree (deal_id);

CREATE INDEX idx_appraisal_org ON public.appraisal USING btree (organization_id);

CREATE INDEX idx_deal_documents_deal_doc_type ON public.deal_documents USING btree (deal_id, document_type_id);

CREATE INDEX idx_deal_documents_document_file_id ON public.deal_documents USING btree (document_file_id);

CREATE INDEX idx_deal_signature_requests_deal_id ON public.deal_signature_requests USING btree (deal_id);

CREATE INDEX idx_deal_signature_requests_documenso_id ON public.deal_signature_requests USING btree (documenso_document_id);

CREATE INDEX idx_deal_signature_requests_org_id ON public.deal_signature_requests USING btree (organization_id);

CREATE INDEX idx_loans_assigned_gin ON public.loans USING gin (assigned_to_user_id jsonb_path_ops);

CREATE INDEX idx_loans_org ON public.loans USING btree (organization_id);

CREATE INDEX idx_loans_primary_user ON public.loans USING btree (primary_user_id);

CREATE INDEX idx_loans_status ON public.loans USING btree (status);

CREATE UNIQUE INDEX inputs_input_code_unique ON public.inputs USING btree (input_code);

CREATE UNIQUE INDEX loans_pkey ON public.loans USING btree (id);

CREATE UNIQUE INDEX organization_themes_organization_id_key ON public.organization_themes USING btree (organization_id);

CREATE UNIQUE INDEX task_templates_code_key ON public.task_templates USING btree (code);

CREATE UNIQUE INDEX uq_deal_doc_ai_condition ON public.deal_document_ai_condition USING btree (deal_document_id, document_type_ai_condition);

CREATE UNIQUE INDEX uq_deal_doc_ai_input ON public.deal_document_ai_input USING btree (deal_document_id, document_type_ai_input_id);

CREATE UNIQUE INDEX uq_deal_inputs_deal_id_input_id ON public.deal_inputs USING btree (deal_id, input_id);

CREATE UNIQUE INDEX workflow_integrations_unique_per_user ON public.workflow_integrations USING btree (organization_id, user_id, type, name);

CREATE UNIQUE INDEX document_files_deals_pkey ON public.document_files_deals USING btree (id);

alter table "public"."deal_clerk_orgs" add constraint "deal_orgs_pkey" PRIMARY KEY using index "deal_orgs_pkey";

alter table "public"."llama_document_parsed" add constraint "document_parsed_pkey" PRIMARY KEY using index "document_parsed_pkey";

alter table "public"."loans" add constraint "loans_pkey" PRIMARY KEY using index "loans_pkey";

alter table "public"."document_files_deals" add constraint "document_files_deals_pkey" PRIMARY KEY using index "document_files_deals_pkey";

alter table "public"."appraisal" add constraint "appraisal_amc_id_fkey" FOREIGN KEY (amc_id) REFERENCES public.appraisal_amcs(id) ON DELETE SET NULL not valid;

alter table "public"."appraisal" validate constraint "appraisal_amc_id_fkey";

alter table "public"."appraisal" add constraint "appraisal_borrower_id_fkey" FOREIGN KEY (borrower_id) REFERENCES public.borrowers(id) ON DELETE SET NULL not valid;

alter table "public"."appraisal" validate constraint "appraisal_borrower_id_fkey";

alter table "public"."appraisal" add constraint "appraisal_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."appraisal" validate constraint "appraisal_organization_id_fkey";

alter table "public"."background_report_applications" add constraint "background_report_applications_unique" UNIQUE using index "background_report_applications_unique";

alter table "public"."credit_report_data_links" add constraint "credit_report_data_links_unique" UNIQUE using index "credit_report_data_links_unique";

alter table "public"."credit_report_data_xactus" add constraint "credit_report_data_xactus_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."credit_report_data_xactus" validate constraint "credit_report_data_xactus_organization_id_fkey";

alter table "public"."deal_clerk_orgs" add constraint "deal_orgs_deal_id_clerk_org_id_key" UNIQUE using index "deal_orgs_deal_id_clerk_org_id_key";

alter table "public"."deal_document_ai_chat" add constraint "deal_document_ai_chat_deal_document_id_fkey" FOREIGN KEY (deal_document_id) REFERENCES public.deal_documents(id) ON DELETE CASCADE not valid;

alter table "public"."deal_document_ai_chat" validate constraint "deal_document_ai_chat_deal_document_id_fkey";

alter table "public"."deal_document_ai_condition" add constraint "deal_document_ai_condition_deal_document_id_fkey" FOREIGN KEY (deal_document_id) REFERENCES public.deal_documents(id) ON DELETE CASCADE not valid;

alter table "public"."deal_document_ai_condition" validate constraint "deal_document_ai_condition_deal_document_id_fkey";

alter table "public"."deal_document_ai_condition" add constraint "deal_document_ai_condition_document_type_ai_condition_fkey" FOREIGN KEY (document_type_ai_condition) REFERENCES public.document_type_ai_condition(id) not valid;

alter table "public"."deal_document_ai_condition" validate constraint "deal_document_ai_condition_document_type_ai_condition_fkey";

alter table "public"."deal_document_ai_condition" add constraint "uq_deal_doc_ai_condition" UNIQUE using index "uq_deal_doc_ai_condition";

alter table "public"."deal_document_ai_input" add constraint "deal_document_ai_input_deal_document_id_fkey" FOREIGN KEY (deal_document_id) REFERENCES public.deal_documents(id) ON DELETE CASCADE not valid;

alter table "public"."deal_document_ai_input" validate constraint "deal_document_ai_input_deal_document_id_fkey";

alter table "public"."deal_document_ai_input" add constraint "deal_document_ai_input_document_type_ai_input_id_fkey" FOREIGN KEY (document_type_ai_input_id) REFERENCES public.document_type_ai_input(id) not valid;

alter table "public"."deal_document_ai_input" validate constraint "deal_document_ai_input_document_type_ai_input_id_fkey";

alter table "public"."deal_document_ai_input" add constraint "uq_deal_doc_ai_input" UNIQUE using index "uq_deal_doc_ai_input";

alter table "public"."deal_documents" add constraint "deal_documents_document_file_id_fkey" FOREIGN KEY (document_file_id) REFERENCES public.document_files(id) ON DELETE SET NULL not valid;

alter table "public"."deal_documents" validate constraint "deal_documents_document_file_id_fkey";

alter table "public"."deal_inputs" add constraint "uq_deal_inputs_deal_id_input_id" UNIQUE using index "uq_deal_inputs_deal_id_input_id";

alter table "public"."document_files_deals" add constraint "document_files_deals_doc_deal_uq" UNIQUE using index "document_files_deals_doc_deal_uq";

alter table "public"."inputs" add constraint "inputs_input_code_unique" UNIQUE using index "inputs_input_code_unique";

alter table "public"."llama_document_parsed" add constraint "document_parsed_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.document_files(id) ON DELETE CASCADE not valid;

alter table "public"."llama_document_parsed" validate constraint "document_parsed_document_id_fkey";

alter table "public"."loans" add constraint "loans_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."loans" validate constraint "loans_organization_id_fkey";

alter table "public"."loans" add constraint "loans_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."loans" validate constraint "loans_status_check";

alter table "public"."organization_themes" add constraint "organization_themes_organization_id_key" UNIQUE using index "organization_themes_organization_id_key";

alter table "public"."task_logic_actions" add constraint "task_logic_actions_required_for_stage_id_fkey" FOREIGN KEY (required_for_stage_id) REFERENCES public.deal_stages(id) ON DELETE SET NULL not valid;

alter table "public"."task_logic_actions" validate constraint "task_logic_actions_required_for_stage_id_fkey";

alter table "public"."task_logic_actions" add constraint "task_logic_actions_required_status_id_fkey" FOREIGN KEY (required_status_id) REFERENCES public.task_statuses(id) ON DELETE SET NULL not valid;

alter table "public"."task_logic_actions" validate constraint "task_logic_actions_required_status_id_fkey";

alter table "public"."task_logic_conditions" add constraint "task_logic_conditions_db_match_type_check" CHECK (((db_match_type IS NULL) OR (db_match_type = ANY (ARRAY['any'::text, 'all'::text])))) not valid;

alter table "public"."task_logic_conditions" validate constraint "task_logic_conditions_db_match_type_check";

alter table "public"."task_logic_conditions" add constraint "task_logic_conditions_source_type_check" CHECK ((source_type = ANY (ARRAY['input'::text, 'database'::text]))) not valid;

alter table "public"."task_logic_conditions" validate constraint "task_logic_conditions_source_type_check";

alter table "public"."task_templates" add constraint "task_templates_code_key" UNIQUE using index "task_templates_code_key";

alter table "public"."workflow_integrations" add constraint "workflow_integrations_unique_per_user" UNIQUE using index "workflow_integrations_unique_per_user";

alter table "public"."application_signings" add constraint "application_signings_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE not valid;

alter table "public"."application_signings" validate constraint "application_signings_loan_id_fkey";

alter table "public"."applications" add constraint "applications_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_loan_id_fkey";

alter table "public"."deal_documents" add constraint "deal_documents_document_type_id_fkey" FOREIGN KEY (document_type_id) REFERENCES public.document_types(id) ON DELETE CASCADE not valid;

alter table "public"."deal_documents" validate constraint "deal_documents_document_type_id_fkey";

alter table "public"."document_logic_actions" add constraint "document_logic_actions_document_type_id_fkey" FOREIGN KEY (document_type_id) REFERENCES public.document_types(id) not valid;

alter table "public"."document_logic_actions" validate constraint "document_logic_actions_document_type_id_fkey";

alter table "public"."document_logic_conditions" add constraint "document_logic_conditions_field_fkey" FOREIGN KEY (field) REFERENCES public.inputs(id) not valid;

alter table "public"."document_logic_conditions" validate constraint "document_logic_conditions_field_fkey";

alter table "public"."document_logic_conditions" add constraint "document_logic_conditions_value_field_fkey" FOREIGN KEY (value_field) REFERENCES public.inputs(id) not valid;

alter table "public"."document_logic_conditions" validate constraint "document_logic_conditions_value_field_fkey";

alter table "public"."document_type_ai_input" add constraint "document_type_ai_input_input_id_fkey" FOREIGN KEY (input_id) REFERENCES public.inputs(id) not valid;

alter table "public"."document_type_ai_input" validate constraint "document_type_ai_input_input_id_fkey";

alter table "public"."document_types" add constraint "document_types_document_category_id_fkey" FOREIGN KEY (document_category_id) REFERENCES public.document_categories(id) ON DELETE CASCADE not valid;

alter table "public"."document_types" validate constraint "document_types_document_category_id_fkey";

alter table "public"."loan_scenarios" add constraint "loan_scenarios_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE not valid;

alter table "public"."loan_scenarios" validate constraint "loan_scenarios_loan_id_fkey";

alter table "public"."pricing_activity_log" add constraint "pricing_activity_log_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE not valid;

alter table "public"."pricing_activity_log" validate constraint "pricing_activity_log_loan_id_fkey";

alter table "public"."term_sheets" add constraint "term_sheets_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE not valid;

alter table "public"."term_sheets" validate constraint "term_sheets_loan_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_create_ai_input_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_org_theme()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.fail_stale_llama_document_parsed()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE llama_document_parsed
  SET status = 'FAILED'
  WHERE status IN ('PENDING', 'RUNNING')
    AND created_at < NOW() - INTERVAL '15 minutes';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.list_public_functions()
 RETURNS TABLE(function_name text, function_args text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT p.proname::text, pg_get_function_arguments(p.oid)::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
  ORDER BY p.proname
  LIMIT 200;
$function$
;

CREATE OR REPLACE FUNCTION public.list_public_tables()
 RETURNS TABLE(table_name text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$function$
;

CREATE OR REPLACE FUNCTION public.list_table_columns(p_table_name text)
 RETURNS TABLE(column_name text, data_type text, is_nullable boolean)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT c.column_name::text, c.data_type::text, (c.is_nullable = 'YES')
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$function$
;

CREATE OR REPLACE FUNCTION public.match_llama_document_chunks(query_embedding public.vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (llama_document_chunks_vs.embedding <=> query_embedding) AS similarity
  FROM llama_document_chunks_vs
  WHERE metadata @> filter
  ORDER BY llama_document_chunks_vs.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_n8n_on_document_file_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_stepper_on_dropdown_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_steps text[];
BEGIN
  -- Only act when dropdown_options actually changes (cast to text for comparison since json lacks = operator)
  IF NEW.dropdown_options::text IS DISTINCT FROM OLD.dropdown_options::text THEN
    -- Convert json array to text[]
    IF NEW.dropdown_options IS NOT NULL THEN
      SELECT ARRAY(SELECT json_array_elements_text(NEW.dropdown_options)) INTO new_steps;
    ELSE
      new_steps := NULL;
    END IF;

    -- Update input_stepper.step_order to match the new dropdown options
    UPDATE input_stepper
    SET step_order = new_steps
    WHERE input_id = NEW.id;

    -- Cascade to deal_stepper: update step_order for all deals using this stepper
    UPDATE deal_stepper
    SET step_order = new_steps
    WHERE input_stepper_id IN (
      SELECT id FROM input_stepper WHERE input_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_deal_signature_requests_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_deal_guarantors_array()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."entities_view" as  SELECT id,
    display_id,
    entity_name,
    entity_type,
    ein,
    date_formed,
    organization_id,
    assigned_to,
    created_at,
    updated_at,
    COALESCE(( SELECT array_agg(TRIM(BOTH FROM ((COALESCE(om.first_name, ''::text) || ' '::text) || COALESCE(om.last_name, ''::text)))) AS array_agg
           FROM public.organization_members om
          WHERE (om.user_id = ANY (e.assigned_to))), '{}'::text[]) AS assigned_to_names
   FROM public.entities e;


CREATE OR REPLACE FUNCTION public.insert_default_integrations_for_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
END; $function$
;

CREATE OR REPLACE FUNCTION public.is_internal_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE clerk_user_id = (auth.jwt() ->> 'sub')
      AND is_internal_yn = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding public.vector, match_count integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (llama_document_chunks_vs.embedding <=> query_embedding) AS similarity
  FROM llama_document_chunks_vs
  WHERE metadata @> filter
  ORDER BY llama_document_chunks_vs.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_application_from_primary_scenario(p_loan_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
begin
  -- Ensure an application row exists for this loan
  insert into public.applications (loan_id, organization_id, borrower_name, status)
  select l.id,
         l.organization_id,
         null,
         'draft'
  from public.loans l
  where l.id = p_loan_id
    and not exists (select 1 from public.applications a where a.loan_id = p_loan_id);

  -- Sync fields from the current primary scenario
  with primary_scenario as (
    select ls.borrower_entity_id,
           ls.guarantor_borrower_ids,
           ls.guarantor_names,
           ls.guarantor_emails,
           ls.inputs->'address'->>'street' as property_street,
           ls.inputs->'address'->>'city' as property_city,
           ls.inputs->'address'->>'state' as property_state,
           ls.inputs->'address'->>'zip' as property_zip,
           ls.inputs->>'borrower_name' as borrower_name,
           ls.inputs->'guarantors' as guarantor_names_json
    from public.loan_scenarios ls
    where ls.loan_id = p_loan_id
      and coalesce(ls.primary, false) = true
    order by ls.created_at desc nulls last, ls.id desc
    limit 1
  ),
  src as (
    select
      borrower_entity_id,
      guarantor_borrower_ids,
      case when guarantor_names is not null then guarantor_names
           when guarantor_names_json is not null then array(select jsonb_array_elements_text(guarantor_names_json))
           else null end as guarantor_names_array,
      guarantor_emails,
      property_street,
      property_city,
      property_state,
      property_zip,
      borrower_name
    from primary_scenario
    union all
    select null::uuid as borrower_entity_id,
           null::uuid[] as guarantor_borrower_ids,
           null::text[] as guarantor_names_array,
           null::text[] as guarantor_emails,
           null::text as property_street,
           null::text as property_city,
           null::text as property_state,
           null::text as property_zip,
           null::text as borrower_name
    where not exists (select 1 from primary_scenario)
    limit 1
  )
  update public.applications a
  set entity_id = src.borrower_entity_id,
      guarantor_ids = src.guarantor_borrower_ids,
      guarantor_names = src.guarantor_names_array,
      guarantor_emails = src.guarantor_emails,
      property_street = src.property_street,
      property_city = src.property_city,
      property_state = src.property_state,
      property_zip = src.property_zip,
      borrower_name = src.borrower_name
  from src
  where a.loan_id = p_loan_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_borrower_to_entity_owners()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

grant delete on table "public"."loans" to "anon";

grant insert on table "public"."loans" to "anon";

grant references on table "public"."loans" to "anon";

grant select on table "public"."loans" to "anon";

grant trigger on table "public"."loans" to "anon";

grant truncate on table "public"."loans" to "anon";

grant update on table "public"."loans" to "anon";

grant delete on table "public"."loans" to "authenticated";

grant insert on table "public"."loans" to "authenticated";

grant references on table "public"."loans" to "authenticated";

grant select on table "public"."loans" to "authenticated";

grant trigger on table "public"."loans" to "authenticated";

grant truncate on table "public"."loans" to "authenticated";

grant update on table "public"."loans" to "authenticated";

grant delete on table "public"."loans" to "service_role";

grant insert on table "public"."loans" to "service_role";

grant references on table "public"."loans" to "service_role";

grant select on table "public"."loans" to "service_role";

grant trigger on table "public"."loans" to "service_role";

grant truncate on table "public"."loans" to "service_role";

grant update on table "public"."loans" to "service_role";


  create policy "actions_select_authenticated"
  on "public"."actions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "org_delete"
  on "public"."application_appraisal"
  as permissive
  for delete
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_insert"
  on "public"."application_appraisal"
  as permissive
  for insert
  to public
with check ((organization_id = public.get_active_org_id()));



  create policy "org_select"
  on "public"."application_appraisal"
  as permissive
  for select
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_update"
  on "public"."application_appraisal"
  as permissive
  for update
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_delete"
  on "public"."application_background"
  as permissive
  for delete
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_insert"
  on "public"."application_background"
  as permissive
  for insert
  to public
with check ((organization_id = public.get_active_org_id()));



  create policy "org_select"
  on "public"."application_background"
  as permissive
  for select
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_update"
  on "public"."application_background"
  as permissive
  for update
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_delete"
  on "public"."application_credit"
  as permissive
  for delete
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_insert"
  on "public"."application_credit"
  as permissive
  for insert
  to public
with check ((organization_id = public.get_active_org_id()));



  create policy "org_select"
  on "public"."application_credit"
  as permissive
  for select
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "org_update"
  on "public"."application_credit"
  as permissive
  for update
  to public
using ((organization_id = public.get_active_org_id()));



  create policy "appraisal_delete"
  on "public"."appraisal"
  as permissive
  for delete
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "appraisal_insert"
  on "public"."appraisal"
  as permissive
  for insert
  to authenticated
with check ((organization_id = public.get_active_org_id()));



  create policy "appraisal_select"
  on "public"."appraisal"
  as permissive
  for select
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "appraisal_update"
  on "public"."appraisal"
  as permissive
  for update
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "appraisal_amcs_delete"
  on "public"."appraisal_amcs"
  as permissive
  for delete
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "appraisal_amcs_insert"
  on "public"."appraisal_amcs"
  as permissive
  for insert
  to authenticated
with check ((organization_id = public.get_active_org_id()));



  create policy "appraisal_amcs_select"
  on "public"."appraisal_amcs"
  as permissive
  for select
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "appraisal_amcs_update"
  on "public"."appraisal_amcs"
  as permissive
  for update
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "bra_delete"
  on "public"."background_report_applications"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.background_reports br
  WHERE ((br.id = background_report_applications.background_report_id) AND (br.organization_id = public.get_active_org_id())))));



  create policy "bra_insert"
  on "public"."background_report_applications"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.background_reports br
  WHERE ((br.id = background_report_applications.background_report_id) AND (br.organization_id = public.get_active_org_id())))));



  create policy "bra_select"
  on "public"."background_report_applications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.background_reports br
  WHERE ((br.id = background_report_applications.background_report_id) AND (br.organization_id = public.get_active_org_id())))));



  create policy "background_reports_delete"
  on "public"."background_reports"
  as permissive
  for delete
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "background_reports_insert"
  on "public"."background_reports"
  as permissive
  for insert
  to authenticated
with check ((organization_id = public.get_active_org_id()));



  create policy "background_reports_select"
  on "public"."background_reports"
  as permissive
  for select
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "background_reports_update"
  on "public"."background_reports"
  as permissive
  for update
  to authenticated
using ((organization_id = public.get_active_org_id()));



  create policy "crdl_delete"
  on "public"."credit_report_data_links"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.credit_reports cr
  WHERE ((cr.id = credit_report_data_links.credit_report_id) AND (cr.organization_id = public.get_active_org_id())))));



  create policy "crdl_insert"
  on "public"."credit_report_data_links"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.credit_reports cr
  WHERE ((cr.id = credit_report_data_links.credit_report_id) AND (cr.organization_id = public.get_active_org_id())))));



  create policy "crdl_select"
  on "public"."credit_report_data_links"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.credit_reports cr
  WHERE ((cr.id = credit_report_data_links.credit_report_id) AND (cr.organization_id = public.get_active_org_id())))));



  create policy "anon_select"
  on "public"."deal_stepper"
  as permissive
  for select
  to anon
using (true);



  create policy "authenticated_all"
  on "public"."deal_stepper"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "document_files_deals_authenticated_select"
  on "public"."document_files_deals"
  as permissive
  for select
  to authenticated
using (true);



  create policy "document_files_deals_internal_admin_delete"
  on "public"."document_files_deals"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_files_deals_internal_admin_insert"
  on "public"."document_files_deals"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_files_deals_internal_admin_update"
  on "public"."document_files_deals"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_files_deals_service_role_all"
  on "public"."document_files_deals"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "document_type_ai_condition_authenticated_select"
  on "public"."document_type_ai_condition"
  as permissive
  for select
  to authenticated
using (true);



  create policy "document_type_ai_condition_internal_admin_delete"
  on "public"."document_type_ai_condition"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_condition_internal_admin_insert"
  on "public"."document_type_ai_condition"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_condition_internal_admin_update"
  on "public"."document_type_ai_condition"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_input_authenticated_select"
  on "public"."document_type_ai_input"
  as permissive
  for select
  to authenticated
using (true);



  create policy "document_type_ai_input_internal_admin_delete"
  on "public"."document_type_ai_input"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_input_internal_admin_insert"
  on "public"."document_type_ai_input"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_input_internal_admin_update"
  on "public"."document_type_ai_input"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_input_order_authenticated_select"
  on "public"."document_type_ai_input_order"
  as permissive
  for select
  to authenticated
using (true);



  create policy "document_type_ai_input_order_internal_admin_delete"
  on "public"."document_type_ai_input_order"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_input_order_internal_admin_insert"
  on "public"."document_type_ai_input_order"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_type_ai_input_order_internal_admin_update"
  on "public"."document_type_ai_input_order"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_types_authenticated_select"
  on "public"."document_types"
  as permissive
  for select
  to authenticated
using (true);



  create policy "document_types_internal_admin_delete"
  on "public"."document_types"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_types_internal_admin_insert"
  on "public"."document_types"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "document_types_internal_admin_update"
  on "public"."document_types"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "input_categories_authenticated_select"
  on "public"."input_categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "input_categories_internal_admin_delete"
  on "public"."input_categories"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "input_categories_internal_admin_insert"
  on "public"."input_categories"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "input_categories_internal_admin_update"
  on "public"."input_categories"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "anon_select"
  on "public"."input_stepper"
  as permissive
  for select
  to anon
using (true);



  create policy "authenticated_all"
  on "public"."input_stepper"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "inputs_authenticated_select"
  on "public"."inputs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "inputs_internal_admin_delete"
  on "public"."inputs"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "inputs_internal_admin_insert"
  on "public"."inputs"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "inputs_internal_admin_update"
  on "public"."inputs"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "anon_select"
  on "public"."llama_document_chunks_vs"
  as permissive
  for select
  to anon
using (true);



  create policy "org_policy_delete"
  on "public"."llama_document_chunks_vs"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'llama_document_chunks_vs'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."llama_document_chunks_vs"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'llama_document_chunks_vs'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."llama_document_chunks_vs"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'llama_document_chunks_vs'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."llama_document_chunks_vs"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'llama_document_chunks_vs'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'llama_document_chunks_vs'::text, 'update'::text)).allowed);



  create policy "Allow anon to read llama_document_parsed"
  on "public"."llama_document_parsed"
  as permissive
  for select
  to anon
using (true);



  create policy "org_policy_delete"
  on "public"."loans"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'loans'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loans'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."loans"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'loans'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loans'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."loans"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'loans'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loans'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."loans"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'loans'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loans'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'loans'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'loans'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (primary_user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (primary_user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "Allow public read for theme lookup"
  on "public"."organization_members"
  as permissive
  for select
  to anon
using (true);



  create policy "members_internal_admins"
  on "public"."organization_members"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "members_service_role"
  on "public"."organization_members"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "members_view_own"
  on "public"."organization_members"
  as permissive
  for select
  to authenticated
using ((user_id = (auth.jwt() ->> 'sub'::text)));



  create policy "Public can read organization themes"
  on "public"."organization_themes"
  as permissive
  for select
  to anon
using (true);



  create policy "anon_read_organizations"
  on "public"."organizations"
  as permissive
  for select
  to anon
using (true);



  create policy "orgs_internal_admins"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.clerk_user_id = (auth.jwt() ->> 'sub'::text)) AND (users.is_internal_yn = true)))));



  create policy "orgs_service_role"
  on "public"."organizations"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "orgs_view_where_member"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using ((id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "workflow_execution_logs_select"
  on "public"."workflow_execution_logs"
  as permissive
  for select
  to authenticated
using ((execution_id IN ( SELECT workflow_executions.id
   FROM public.workflow_executions
  WHERE (workflow_executions.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "workflow_executions_select"
  on "public"."workflow_executions"
  as permissive
  for select
  to authenticated
using ((user_id = (auth.jwt() ->> 'sub'::text)));



  create policy "workflow_integrations_delete"
  on "public"."workflow_integrations"
  as permissive
  for delete
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "workflow_integrations_insert"
  on "public"."workflow_integrations"
  as permissive
  for insert
  to authenticated
with check ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "workflow_integrations_select"
  on "public"."workflow_integrations"
  as permissive
  for select
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "workflow_integrations_update"
  on "public"."workflow_integrations"
  as permissive
  for update
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE (om.user_id = (auth.jwt() ->> 'sub'::text)))));



  create policy "org_policy_delete"
  on "public"."application_signings"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'application_signings'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'application_signings'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."application_signings"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'application_signings'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'application_signings'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."application_signings"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'application_signings'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'application_signings'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."application_signings"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'application_signings'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'application_signings'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'application_signings'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'application_signings'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = application_signings.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."document_template_fields"
  as permissive
  for delete
  to authenticated
using ((public.check_org_access('table'::text, 'term_sheet_template_fields'::text, 'delete'::text)).allowed);



  create policy "org_policy_insert"
  on "public"."document_template_fields"
  as permissive
  for insert
  to authenticated
with check ((public.check_org_access('table'::text, 'term_sheet_template_fields'::text, 'insert'::text)).allowed);



  create policy "org_policy_select"
  on "public"."document_template_fields"
  as permissive
  for select
  to authenticated
using ((public.check_org_access('table'::text, 'term_sheet_template_fields'::text, 'select'::text)).allowed);



  create policy "org_policy_update"
  on "public"."document_template_fields"
  as permissive
  for update
  to authenticated
using ((public.check_org_access('table'::text, 'term_sheet_template_fields'::text, 'update'::text)).allowed)
with check ((public.check_org_access('table'::text, 'term_sheet_template_fields'::text, 'update'::text)).allowed);



  create policy "org_policy_delete"
  on "public"."document_templates"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'term_sheet_templates'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheet_templates'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."document_templates"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'term_sheet_templates'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheet_templates'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."document_templates"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'term_sheet_templates'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheet_templates'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."document_templates"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'term_sheet_templates'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheet_templates'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'term_sheet_templates'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheet_templates'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (organization_id = public.get_active_org_id())
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((organization_id = public.get_active_org_id()) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."pricing_activity_log"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'pricing_activity_log'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'pricing_activity_log'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."pricing_activity_log"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'pricing_activity_log'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'pricing_activity_log'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."pricing_activity_log"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'pricing_activity_log'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'pricing_activity_log'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."pricing_activity_log"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'pricing_activity_log'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'pricing_activity_log'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'pricing_activity_log'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'pricing_activity_log'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (user_id = (auth.jwt() ->> 'sub'::text))
    WHEN 'org_and_user'::text THEN ((EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = pricing_activity_log.loan_id) AND (loans.organization_id = public.get_active_org_id())))) OR (user_id = (auth.jwt() ->> 'sub'::text)))
    ELSE false
END));



  create policy "org_policy_delete"
  on "public"."term_sheets"
  as permissive
  for delete
  to authenticated
using (((public.check_org_access('table'::text, 'term_sheets'::text, 'delete'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheets'::text, 'delete'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_insert"
  on "public"."term_sheets"
  as permissive
  for insert
  to authenticated
with check (((public.check_org_access('table'::text, 'term_sheets'::text, 'insert'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheets'::text, 'insert'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_select"
  on "public"."term_sheets"
  as permissive
  for select
  to authenticated
using (((public.check_org_access('table'::text, 'term_sheets'::text, 'select'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheets'::text, 'select'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));



  create policy "org_policy_update"
  on "public"."term_sheets"
  as permissive
  for update
  to authenticated
using (((public.check_org_access('table'::text, 'term_sheets'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheets'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END))
with check (((public.check_org_access('table'::text, 'term_sheets'::text, 'update'::text)).allowed AND
CASE (public.check_org_access('table'::text, 'term_sheets'::text, 'update'::text)).scope
    WHEN 'all'::text THEN true
    WHEN 'org_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'user_records'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    WHEN 'org_and_user'::text THEN (EXISTS ( SELECT 1
       FROM public.loans
      WHERE ((loans.id = term_sheets.loan_id) AND (loans.organization_id = public.get_active_org_id()))))
    ELSE false
END));


CREATE TRIGGER actions_updated_at BEFORE UPDATE ON public.actions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.application_appraisal FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.application_background FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.application_credit FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER background_reports_updated_at BEFORE UPDATE ON public.background_reports FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_validate_deal_guarantors_array BEFORE INSERT OR UPDATE ON public.deal_borrower FOR EACH ROW EXECUTE FUNCTION public.validate_deal_guarantors_array();

CREATE TRIGGER deal_signature_requests_updated_at BEFORE UPDATE ON public.deal_signature_requests FOR EACH ROW EXECUTE FUNCTION public.update_deal_signature_requests_updated_at();

CREATE TRIGGER on_document_file_inserted AFTER INSERT ON public.document_files FOR EACH ROW EXECUTE FUNCTION public.notify_n8n_on_document_file_insert();

CREATE TRIGGER trg_auto_create_ai_input_order AFTER INSERT ON public.document_type_ai_input FOR EACH ROW EXECUTE FUNCTION public.auto_create_ai_input_order();

CREATE TRIGGER trg_sync_stepper_on_dropdown_change AFTER UPDATE OF dropdown_options ON public.inputs FOR EACH ROW EXECUTE FUNCTION public.sync_stepper_on_dropdown_change();

CREATE TRIGGER loans_set_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER on_org_created_create_theme AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.create_default_org_theme();

CREATE TRIGGER workflow_integrations_updated_at BEFORE UPDATE ON public.workflow_integrations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Function: get_primary_key_column (present on remote)
CREATE OR REPLACE FUNCTION public.get_primary_key_column(p_table_name text)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = p_table_name
  LIMIT 1;
$function$;

