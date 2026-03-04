# PROD Schema Alignment Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the PROD database (`brrrr-pricing-engine`) into full schema alignment with the DEV database (`brrrr-pricing-engine-dev`), using a staging database as a rehearsal environment.

**Architecture:** Three-phase expand-and-contract migration. Phase 1 applies all additive changes (new types, functions, tables, columns, indexes, RLS policies). Phase 2 handles data migration for restructured tables. Phase 3 contracts — dropping old columns, tables, and functions. Each phase is applied first to staging, verified, then applied to prod.

**Tech Stack:** Supabase (Postgres 17), Supabase CLI v2.72+, `psql`, `pg_dump`

---

## Progress Summary

| Phase | Target | Status | Notes |
|-------|--------|--------|-------|
| Pre-Migration (Task 0) | STG | ✅ Complete | STG built from scratch (not PROD clone) |
| Phase 1: Additive | STG | ✅ Complete | Scripts 01-07 executed successfully |
| Phase 2: Data Migration | STG | ✅ Complete | 07_data_backfill.sql executed |
| Phase 3: Contract | STG | ✅ Complete | 08_contract_columns.sql executed |
| Post-Migration Validation | STG | ✅ Complete | Schema diff verified |
| Config Data Load | STG | ✅ Complete | 47 tables loaded from DEV |
| Storage Buckets | STG | ✅ Complete | 11 buckets + 26 policies |
| Storage Buckets | PROD | ✅ Buckets created | 11 buckets created; 21 DEV policies pending (Task 5.2.1) |
| Scripts Updated | — | ✅ Complete | All staging fixes incorporated into scripts 02, 03, 04, 06, 08 |
| Maintenance Banner | App | ✅ Complete | Component built, merged to `dev` + `staging`, controlled by `NEXT_PUBLIC_MAINTENANCE_MODE` |
| **PRODUCTION DEPLOYMENT** | **PROD** | **⬜ NOT STARTED** | **Next: Execute Tasks 5.0 through 5.7** |

**Unresolved issues from staging rehearsal:**

1. **Function drift (Lesson #11):** Script `01_types_and_functions.sql` contains a 2026-03-03 snapshot. Task 5.0 (run as pre-flight before the maintenance window) will re-dump DEV schema fresh. Regenerate script 01 from the fresh dump if functions have changed.
2. **PROD `program-docs` bucket size limit mismatch:** PROD has no size limit; DEV has 5MB limit. After migration, PROD will retain its original (no limit) since we are not deleting/modifying existing PROD buckets. Consider updating PROD `program-docs` file_size_limit to match DEV (5MB) if desired.

**Pre-flight items completed:**

- ✅ Maintenance banner component built and merged to `staging` (commit `d196862f`)
- ✅ OWNED BY ordering fixed in scripts 02/03 (Lesson #20)
- ✅ Smoke test URLs set to `https://brrrr-pricing-engine.vercel.app` and `https://www.pricingengine.pro`
- ✅ Vercel PROD env vars confirmed as already configured
- ✅ Task 5.0 pre-flight schema dump completed — no function drift; 2 missing tables discovered and fixed (Lesson #21)

---

## Environment Reference

| Environment | Supabase Project Name | Project Ref | DB Password |
|-------------|----------------------|-------------|-------------|
| **DEV** | `brrrr-pricing-engine-dev` | `iufoslzvcjmtgsazttkt` | Same for all |
| **STAGING** | `brrrr-pricing-engine-stg` | `cjclknhqbsecmykksqei` | Same for all |
| **PROD** | `brrrr-pricing-engine` | `voowqmsukigzwqmssbzh` | Same for all |

**Connection strings (URL-encoded password `$CLcl011801%` → `%24CLcl011801%25`):**

| Env | Pooler URL |
|-----|-----------|
| DEV | `postgresql://postgres.iufoslzvcjmtgsazttkt:%24CLcl011801%25@aws-1-us-west-1.pooler.supabase.com:5432/postgres` |
| STG | `postgresql://postgres.cjclknhqbsecmykksqei:%24CLcl011801%25@aws-1-us-east-1.pooler.supabase.com:5432/postgres` |
| PROD | `postgresql://postgres.voowqmsukigzwqmssbzh:%24CLcl011801%25@aws-0-us-west-2.pooler.supabase.com:5432/postgres` |

**SQL script location:** `docs/plans/migration-scripts/`

---

## Pre-Migration: Create Staging Environment ✅ COMPLETED

### Task 0.1: Create the staging Supabase project ✅

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project named `brrrr-pricing-engine-stg`
3. Set the database password to match dev/prod
4. Select the same region as prod
5. Note the new project ref: `________` (fill in after creation)

### Task 0.2: Clone prod schema and data into staging ✅ (NOTE: STG was built from scratch using migration scripts, not cloned from PROD)

```bash
# Dump PROD (schema + data)
PROD_REF="voowqmsukigzwqmssbzh"
PROD_PW="[PASSWORD]"

pg_dump "postgresql://postgres:${PROD_PW}@db.${PROD_REF}.supabase.co:5432/postgres" \
  --no-owner --no-privileges \
  --schema=public \
  > /tmp/prod_full_dump.sql

# Restore into STAGING
STG_REF="[STAGING_REF]"
STG_PW="[PASSWORD]"

psql "postgresql://postgres:${STG_PW}@db.${STG_REF}.supabase.co:5432/postgres" \
  < /tmp/prod_full_dump.sql
```

### Task 0.3: Verify staging matches prod ✅

```sql
-- Run on both staging and prod, compare results
SELECT count(*) AS table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT tablename, 
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.table_schema = 'public') AS col_count
FROM pg_tables t 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected: Both should show 39 tables with matching column counts.

**Checkpoint: Staging is a clone of prod. Proceed to Phase 1.**

---

## PHASE 1: ADDITIVE CHANGES (Low Risk) ✅ COMPLETED ON STG

All operations in this phase CREATE new objects. Nothing existing is modified or removed. Safe to run without app downtime.

> **Scripts updated:** 03, 04, 06 now incorporate staging fixes (search_path, NOT NULL handling, moddatetime).

**Execution order matters — follow the numbered scripts exactly.**

### Task 1.1: Create new types and enums

**Script:** `docs/plans/migration-scripts/01_types_and_functions.sql` (types section only)

**What it does:** Creates 2 new types:

- `country` enum (list of countries)
- `org_access_result` composite type (used by access control functions)

**Run on staging:**

```bash
# Extract just the TYPES section (before "-- FUNCTIONS")
psql "postgresql://postgres:${PW}@db.${STG_REF}.supabase.co:5432/postgres" -f docs/plans/migration-scripts/01_types_and_functions.sql
```

Note: The file contains both types AND functions. Functions depend on types, so running the whole file in order is correct.

**Verify:**

```sql
SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname IN ('country', 'org_access_result');
-- Expected: 2 rows
```

### Task 1.2: Create new sequences

**Script:** `docs/plans/migration-scripts/02_sequences.sql`

**What it does:** Creates 9 new sequences used by tables with serial/bigserial columns:

- `dashboard_widget_chats_id_seq`, `dashboard_widget_conversations_id_seq`, `dashboard_widgets_id_seq`
- `inputs_id_seq`, `organizations_org_id_seq`
- `pe_section_button_actions_id_seq`, `pe_section_buttons_id_seq`
- `scenario_program_results_id_seq`, `scenario_rate_options_id_seq`

**Verify:**

```sql
SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' 
AND sequencename IN ('dashboard_widgets_id_seq', 'inputs_id_seq', 'organizations_org_id_seq');
-- Expected: 3 rows (spot check)
```

### Task 1.3: Create new tables

**Script:** `docs/plans/migration-scripts/03_new_tables.sql`

**What it does:** Creates 134 new tables across all feature areas:

- Deals pipeline (22 tables)
- Documents system (22 tables)
- Appraisal system (12 tables)
- Background reports (8 tables)
- Organizations / RBAC (6 tables)
- Automations / Workflows (10 tables)
- Pricing engine (17 tables)
- Integrations new system (3 tables)
- AI / LLM (4 tables)
- Dashboards (3 tables)
- Other (email templates, landing pages, notifications, etc.)

All tables use `CREATE TABLE IF NOT EXISTS` so re-running is safe.

**Verify:**

```sql
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: ~173 (39 existing + 134 new)
```

### Task 1.4: Add new columns to existing tables

**Script:** `docs/plans/migration-scripts/04_additive_columns.sql`

**What it does:** Adds 71 new columns to existing tables:

| Table | Columns Added | Notes |
|-------|--------------|-------|
| `ai_chats` | 2 | `loan_type`, `program_id` |
| `applications` | 4 | `display_id` (NOT NULL — needs manual handling), `external_defaults`, `form_data`, `merged_data` |
| `borrowers` | 2 | `archived_at`, `archived_by` |
| `credit_reports` | 10 | Score fields, `data`, `pull_type`, etc. |
| `custom_broker_settings` | 1 | `broker_org_id` (expand step before renaming) |
| `document_templates` | 5 | `gjs_data` (NOT NULL), `html_content`, `user_id` (NOT NULL), etc. |
| `entities` | 2 | `archived_at`, `archived_by` |
| `loan_scenarios` | 4 | `archived_at`, `archived_by`, `created_by`, `selected_rate_option_id` |
| `loans` | 3 | `archived_at`, `archived_by`, `display_id` (NOT NULL) |
| `organization_members` | 2 | `clerk_member_role`, `clerk_org_role` (expand step) |
| `organizations` | 5 | `is_internal_yn`, `org_id`, whitelabel logos |
| `programs` | 2 | `archived_at`, `archived_by` |
| `users` | 28 | Full clerk integration fields |

**IMPORTANT — NOT NULL columns without defaults:**

Some columns are `NOT NULL` without a `DEFAULT`. These will fail on tables with existing rows. Handle them by:

1. Adding the column as nullable first
2. Backfilling with a sensible default
3. Then setting NOT NULL

```sql
-- Example for applications.display_id:
ALTER TABLE "public"."applications" ADD COLUMN IF NOT EXISTS "display_id" text;
UPDATE "public"."applications" SET display_id = 'APP-' || id::text WHERE display_id IS NULL;
ALTER TABLE "public"."applications" ALTER COLUMN "display_id" SET NOT NULL;
```

The script flags these with `-- WARNING` comments. Review and handle each one.

**Verify:**

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'clerk_username';
-- Expected: 1 row

SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'is_internal_yn';
-- Expected: 1 row
```

### Task 1.5: Add foreign key constraints

**Script:** `docs/plans/migration-scripts/05_fk_constraints.sql`

**What it does:** Creates 212 new foreign key constraints linking the new tables together and to existing tables.

**Run AFTER all tables exist** (Tasks 1.3 and 1.4 must be complete).

Some FKs may fail if referenced columns don't exist yet (e.g., new columns on existing tables). Run the additive columns script (Task 1.4) first.

**Verify:**

```sql
SELECT count(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
-- Expected: ~262 (50 existing + 212 new)
```

### Task 1.6: Create indexes, RLS policies, and triggers

**Script:** `docs/plans/migration-scripts/06_indexes_policies_triggers.sql`

**What it does:**

- Enables Row Level Security on 164 tables
- Creates 207 new indexes
- Creates 423 RLS policies (org-scoped access control)
- Creates 65 triggers

**Run AFTER all tables and functions exist.**

This is the largest script. If it fails partway through, it's safe to re-run since most statements are idempotent.

**Verify:**

```sql
-- Check RLS is enabled
SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: most tables should have RLS enabled

-- Check index count
SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';
-- Expected: ~262

-- Check policy count
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
-- Expected: ~423
```

### Task 1.7: Apply grants

**Script:** `docs/plans/migration-scripts/07_grants.sql`

**What it does:** Grants `anon`, `authenticated`, and `service_role` access to all new tables, sequences, and functions (894 GRANT statements).

**Verify:**

```sql
SELECT grantee, count(*) FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
GROUP BY grantee;
```

### Phase 1 Verification Checkpoint

Run this comprehensive check after all Phase 1 tasks:

```sql
-- Compare table count against dev
SELECT count(*) AS staging_tables FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: ~173

-- Compare function count
SELECT count(*) AS staging_functions FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Compare index count
SELECT count(*) AS staging_indexes FROM pg_indexes WHERE schemaname = 'public';

-- Compare policy count  
SELECT count(*) AS staging_policies FROM pg_policies WHERE schemaname = 'public';
```

Compare these numbers against the DEV database. Tables should match (minus the 9 prod-only tables that will be dropped in Phase 3). Functions, indexes, and policies should be close.

**Checkpoint: Phase 1 complete on staging. Existing prod functionality should be unaffected. New tables are empty but structurally present.**

---

## PHASE 2: DATA MIGRATION & EXPAND OPERATIONS (Medium Risk) ✅ COMPLETED ON STG

This phase prepares for the eventual column/table drops by migrating data from old structures to new ones. No destructive operations yet.

### Task 2.1: Expand — Column renames (add new, keep old)

For columns being renamed, the new column was already added in Phase 1 (Task 1.4). Now backfill data from old column to new:

```sql
-- custom_broker_settings: broker_id -> broker_org_id
UPDATE "public"."custom_broker_settings" 
SET broker_org_id = broker_id 
WHERE broker_org_id IS NULL AND broker_id IS NOT NULL;

-- organization_members: role -> clerk_org_role
UPDATE "public"."organization_members" 
SET clerk_org_role = role 
WHERE clerk_org_role IS NULL AND role IS NOT NULL;
```

**Verify:**

```sql
SELECT count(*) FROM custom_broker_settings WHERE broker_org_id IS NULL AND broker_id IS NOT NULL;
-- Expected: 0

SELECT count(*) FROM organization_members WHERE clerk_org_role IS NULL AND role IS NOT NULL;
-- Expected: 0
```

### Task 2.2: Migrate credit_reports data to new columns

The `credit_reports` table gained score fields and lost storage-related columns:

```sql
-- If credit report data needs to be restructured from metadata/storage_path
-- into the new score columns, do it here.
-- This depends on what data exists in prod.

-- Check what data exists:
SELECT count(*), 
  count(aggregator_id) AS has_aggregator,
  count(storage_path) AS has_storage_path,
  count(metadata) AS has_metadata
FROM credit_reports;
```

Review the output and write appropriate migration queries based on what data exists.

### Task 2.3: Migrate loans data for new structure

The `loans` table had many columns removed in dev. The data likely moved to related tables (`deal_inputs`, `deal_borrower`, etc.):

```sql
-- Check what loan data exists that might need migration
SELECT count(*),
  count(borrower_first_name) AS has_borrower_name,
  count(property_address) AS has_property,
  count(inputs) AS has_inputs,
  count(selected) AS has_selected,
  count(program_id) AS has_program
FROM loans;
```

If significant data exists in these columns:

1. Create corresponding `deals` records from `loans` rows
2. Migrate `inputs` JSONB to `deal_inputs` rows
3. Migrate borrower info to `deal_borrower` rows
4. Migrate property info to `deal_property` rows

**This task is data-dependent.** Inspect the actual data before writing migration queries.

### Task 2.4: Migrate loan_scenarios data

Similar to loans — several columns were removed:

```sql
SELECT count(*),
  count(inputs) AS has_inputs,
  count(selected) AS has_selected,
  count(guarantor_borrower_ids) AS has_guarantors,
  count(borrower_entity_id) AS has_entity
FROM loan_scenarios;
```

If data exists in `inputs`, migrate it to `loan_scenario_inputs` rows.
If data exists in `selected`, migrate it to `scenario_rate_options`.

### Task 2.5: Migrate document_templates structure

```sql
-- document_templates changed from craft_json to gjs_data/html_content
SELECT count(*), count(craft_json) AS has_craft_json FROM document_templates;
```

If `craft_json` data exists, decide whether it can be converted to `gjs_data` format or needs to be preserved separately.

### Task 2.6: Migrate old integrations to new system

```sql
-- Check what integration data exists in prod
SELECT count(*) FROM integrations;
SELECT count(*) FROM integrations_clear;
SELECT count(*) FROM integrations_floify;
SELECT count(*) FROM integrations_xactus;
SELECT count(*) FROM workflow_integrations;
SELECT count(*) FROM xactus_data;
```

If data exists, write migration queries to move it into `integration_settings` and `integration_setup`.

### Task 2.7: Migrate term_sheet_template_fields to document_template_variables

```sql
-- Check data in old table
SELECT count(*) FROM term_sheet_template_fields;
```

If rows exist, insert them into `document_template_variables` (mapping old columns to new ones).

### Phase 2 Verification Checkpoint

```sql
-- Verify no data was lost by checking row counts in migrated tables
-- (specific queries depend on what data existed)

-- Verify renamed columns are backfilled
SELECT count(*) FROM custom_broker_settings WHERE broker_org_id IS NULL AND broker_id IS NOT NULL;
SELECT count(*) FROM organization_members WHERE clerk_org_role IS NULL AND role IS NOT NULL;
-- Both should be 0
```

**Checkpoint: Phase 2 complete on staging. Data migrated to new structures. Old columns/tables still exist but data has been copied to new locations.**

---

## PHASE 3: CONTRACT — DESTRUCTIVE CHANGES (High Risk) ✅ COMPLETED ON STG

This phase drops old columns, tables, functions, and indexes. **Only proceed after Phase 2 data migration is verified.**

> **Script updated:** 08 now includes pre-drop trigger/policy removal (staging lessons #6, #7).

**WARNING:** These operations are irreversible. Back up the database before proceeding.

### Task 3.0: Pre-contract backup

```bash
pg_dump "postgresql://postgres:${PW}@db.${STG_REF}.supabase.co:5432/postgres" \
  --no-owner --no-privileges \
  > /tmp/staging_pre_contract_backup.sql
```

### Task 3.1: Drop old indexes (must happen before column/table drops)

```sql
-- Indexes on columns being dropped
DROP INDEX IF EXISTS "public"."credit_reports_bucket_path_idx";
DROP INDEX IF EXISTS "public"."idx_custom_broker_settings_broker_id";
DROP INDEX IF EXISTS "public"."idx_loan_scenarios_inputs_gin";
DROP INDEX IF EXISTS "public"."idx_loan_scenarios_selected_gin";
DROP INDEX IF EXISTS "public"."idx_loans_assigned_gin";
DROP INDEX IF EXISTS "public"."idx_loans_inputs_gin";
DROP INDEX IF EXISTS "public"."idx_loans_program";
DROP INDEX IF EXISTS "public"."idx_loans_selected_gin";
DROP INDEX IF EXISTS "public"."idx_programs_org";
DROP INDEX IF EXISTS "public"."programs_org_id_idx";
DROP INDEX IF EXISTS "public"."document_templates_org_updated_idx";
DROP INDEX IF EXISTS "public"."idx_organization_themes_org_id";

-- Indexes on tables being dropped
DROP INDEX IF EXISTS "public"."idx_integrations_org";
DROP INDEX IF EXISTS "public"."idx_integrations_type";
DROP INDEX IF EXISTS "public"."uq_integrations_org_user_type";
DROP INDEX IF EXISTS "public"."idx_term_sheet_template_fields_template_id";
DROP INDEX IF EXISTS "public"."idx_term_sheet_templates_org";
DROP INDEX IF EXISTS "public"."idx_term_sheet_templates_user";
DROP INDEX IF EXISTS "public"."idx_workflow_integrations_org_user";
DROP INDEX IF EXISTS "public"."idx_workflow_integrations_type";
```

### Task 3.2: Drop old RLS policies on tables being removed

```sql
-- List and drop all policies on tables being removed
-- Run this query to find them:
SELECT policyname, tablename FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('integrations', 'integrations_clear', 'integrations_floify', 
  'integrations_nadlan', 'integrations_xactus', 'workflow_integrations', 'xactus_data',
  'term_sheet_template_fields', 'term_sheet_templates');

-- Then drop each one:
-- DROP POLICY IF EXISTS "[policy_name]" ON "public"."[table_name]";
```

### Task 3.3: Drop old triggers on affected tables

```sql
-- Find triggers referencing old functions
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (action_statement LIKE '%create_xactus_subtable_row%'
  OR action_statement LIKE '%ensure_clear_integration%'
  OR action_statement LIKE '%ensure_floify_integration%'
  OR action_statement LIKE '%ensure_xactus_integration%'
  OR action_statement LIKE '%seed_custom_broker_settings_from_default%'
  OR action_statement LIKE '%seed_custom_broker_settings_on_member_attach%'
  OR action_statement LIKE '%sync_clear_child%'
  OR action_statement LIKE '%sync_nadlan_child%');

-- Drop each trigger found above:
-- DROP TRIGGER IF EXISTS "[trigger_name]" ON "public"."[table_name]";
```

### Task 3.4: Drop old functions

```sql
DROP FUNCTION IF EXISTS "public"."create_xactus_subtable_row"();
DROP FUNCTION IF EXISTS "public"."ensure_clear_integration"();
DROP FUNCTION IF EXISTS "public"."ensure_floify_integration"();
DROP FUNCTION IF EXISTS "public"."ensure_xactus_integration"();
DROP FUNCTION IF EXISTS "public"."seed_custom_broker_settings_from_default"();
DROP FUNCTION IF EXISTS "public"."seed_custom_broker_settings_on_member_attach"();
DROP FUNCTION IF EXISTS "public"."sync_clear_child"();
DROP FUNCTION IF EXISTS "public"."sync_nadlan_child"();
```

### Task 3.5: Drop old columns from existing tables

**Script:** `docs/plans/migration-scripts/08_contract_columns.sql`

This drops 38 columns and applies 4 default changes:

```sql
-- credit_reports: drop storage-related columns
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "aggregator_id";
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "bucket";
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "metadata";
ALTER TABLE "public"."credit_reports" DROP COLUMN IF EXISTS "storage_path";

-- custom_broker_settings: drop old column (renamed)
ALTER TABLE "public"."custom_broker_settings" DROP COLUMN IF EXISTS "broker_id";

-- document_templates: drop old column
ALTER TABLE "public"."document_templates" DROP COLUMN IF EXISTS "craft_json";

-- entities: drop unused columns
ALTER TABLE "public"."entities" DROP COLUMN IF EXISTS "account_balances";
ALTER TABLE "public"."entities" DROP COLUMN IF EXISTS "bank_name";

-- loan_scenarios: drop migrated columns
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "borrower_entity_id";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "guarantor_borrower_ids";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "guarantor_emails";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "guarantor_names";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "inputs";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "selected";
ALTER TABLE "public"."loan_scenarios" DROP COLUMN IF EXISTS "user_id";

-- loans: drop migrated columns
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

-- organization_members: drop old column (renamed)
ALTER TABLE "public"."organization_members" DROP COLUMN IF EXISTS "role";

-- programs: drop migrated columns
ALTER TABLE "public"."programs" DROP COLUMN IF EXISTS "loan_type";
ALTER TABLE "public"."programs" DROP COLUMN IF EXISTS "organization_id";

-- Column default changes
ALTER TABLE "public"."document_templates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "public"."loans" ALTER COLUMN "status" SET DEFAULT 'active';
ALTER TABLE "public"."organization_themes" ALTER COLUMN "theme_dark" DROP DEFAULT;
ALTER TABLE "public"."organization_themes" ALTER COLUMN "theme_light" DROP DEFAULT;
```

### Task 3.6: Drop old tables

```sql
-- Drop in reverse dependency order (children first)
DROP TABLE IF EXISTS "public"."xactus_data" CASCADE;
DROP TABLE IF EXISTS "public"."integrations_clear" CASCADE;
DROP TABLE IF EXISTS "public"."integrations_floify" CASCADE;
DROP TABLE IF EXISTS "public"."integrations_nadlan" CASCADE;
DROP TABLE IF EXISTS "public"."integrations_xactus" CASCADE;
DROP TABLE IF EXISTS "public"."integrations" CASCADE;
DROP TABLE IF EXISTS "public"."workflow_integrations" CASCADE;
DROP TABLE IF EXISTS "public"."term_sheet_template_fields" CASCADE;
DROP TABLE IF EXISTS "public"."term_sheet_templates" CASCADE;
```

### Phase 3 Verification Checkpoint

```sql
-- Final table count should match dev
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: ~164 (matching dev)

-- Verify dropped tables are gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('integrations', 'integrations_clear', 'integrations_floify', 
  'integrations_nadlan', 'integrations_xactus', 'workflow_integrations', 'xactus_data',
  'term_sheet_template_fields', 'term_sheet_templates');
-- Expected: 0 rows

-- Verify dropped functions are gone
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace 
AND proname IN ('create_xactus_subtable_row', 'ensure_clear_integration', 
  'ensure_floify_integration', 'ensure_xactus_integration');
-- Expected: 0 rows

-- Verify dropped columns are gone
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'borrower_first_name';
-- Expected: 0 rows
```

**Checkpoint: Phase 3 complete on staging. Schema should now match dev.**

---

## POST-MIGRATION: Full Schema Validation ✅ COMPLETED ON STG

### Task 4.1: Dump staging schema and diff against dev

```bash
# Dump staging schema
STG_REF="[STAGING_REF]"
pg_dump "postgresql://postgres:${PW}@db.${STG_REF}.supabase.co:5432/postgres" \
  --schema-only --no-owner --no-privileges --schema=public \
  > /tmp/staging_schema.sql

# Compare against dev
diff <(grep -E "^CREATE TABLE|^CREATE FUNCTION|^CREATE TYPE|^CREATE INDEX|^CREATE POLICY" /tmp/staging_schema.sql | sort) \
     <(grep -E "^CREATE TABLE|^CREATE FUNCTION|^CREATE TYPE|^CREATE INDEX|^CREATE POLICY" /tmp/dev_schema.sql | sort)
```

Any remaining differences should be investigated and resolved before proceeding to prod.

### Task 4.2: Test app against staging

1. Update `.env.local` to point at the staging database
2. Run the application
3. Verify all features work:
   - [ ] Login/auth flow
   - [ ] Organization switching
   - [ ] Deal creation and pipeline
   - [ ] Document uploads
   - [ ] Pricing engine
   - [ ] Background reports
   - [ ] Settings pages

### Task 4.3: Fix any issues found on staging

Address discrepancies before proceeding to prod.

---

## STAGING REHEARSAL: Lessons Learned

The following issues were encountered and resolved during the staging rehearsal. All fixes must be applied when executing on PROD.

### Issues and Fixes

| # | Issue | Fix | Phase |
|---|-------|-----|-------|
| 1 | `vector` type not found when creating tables referencing `public.vector` | Prepend `SET search_path TO public, extensions;` to table creation scripts | 1.3 |
| 2 | pg_dump 17 emits `\restrict` / `\unrestrict` security tokens | Strip with `grep -v '\\restrict'` before loading SQL dumps | Data load |
| 3 | Sequence `OWNED BY` linkages not established after table creation | Run explicit `ALTER SEQUENCE ... OWNED BY ...` for each new sequence | 1.2 |
| 4 | `applications.display_id` NOT NULL fails on existing rows | Add column nullable → backfill from `loan_id` (text column, not numeric `id`) → set NOT NULL | 1.4 |
| 5 | `loans.display_id` NOT NULL fails on existing rows | Add column nullable → backfill from `loan_id` → set NOT NULL | 1.4 |
| 6 | `loan_scenarios.guarantor_borrower_ids` drop blocked by trigger `trg_validate_borrower_ids` | Drop trigger first, then drop column | 3.5 |
| 7 | `loans.assigned_to_user_id` drop blocked by RLS policy referencing that column | Drop the referencing RLS policy first, then drop column | 3.5 |
| 8 | `credit_report_data_links.id` missing auto-increment sequence | Create sequence, set column default to `nextval(...)`, set `OWNED BY` | 1.2 |
| 9 | `moddatetime()` function not found in trigger definitions | Use `extensions.moddatetime()` instead of `moddatetime()` | 1.6 |
| 10 | Identity columns (`GENERATED ALWAYS AS IDENTITY`) not created by migration scripts | Add `ALTER TABLE ... ALTER COLUMN ... ADD GENERATED BY DEFAULT AS IDENTITY` after table creation | 1.3 |
| 11 | Function definitions drifted between 2026-03-03 schema dump and actual DEV state | Re-dump DEV schema fresh before PROD execution | Pre-flight |
| 12 | Trigger functions reference columns that Phase 3 drops | Update trigger function bodies or drop triggers before dropping columns | 3.5 |
| 13 | `TRUNCATE ... CASCADE` unexpectedly cascades through FK chains (e.g. `automations` → `task_templates` → `task_template_roles` + 4 more) | Verify cascade impact before running; explicitly list all affected tables | Data load |
| 14 | `session_replication_role = 'replica'` required during cross-table data loads | Prepend `SET session_replication_role = 'replica';` and append reset to `'origin'` | Data load |
| 15 | Pooler URLs differ by region — DEV = `us-west-1`, STG = `us-east-1`, PROD = `us-west-2` | Use correct pooler hostname per environment (see Environment Reference) | All |
| 16 | Sequence name mismatch: DEV dump references `actions_id_seq` but STG uses `automations_id_seq` | Manually set sequence value after data load: `SELECT setval('automations_id_seq', MAX(id))` | Data load |
| 17 | Supabase Storage buckets completely missing from migration plan | Audit all 3 envs, create union of buckets on STG (11), add 5 DEV buckets to PROD | Pre-flight / 5.2.1 |
| 18 | Storage RLS policies on `storage.objects` not included in migration | Create 26 policies on STG (union of PROD + DEV). PROD gets 21 DEV policies after Phase 1 | 5.2.1 |
| 19 | Storage policies reference functions (`is_internal_admin`, `check_org_access`, `can_access_document`) that don't exist on PROD until Phase 1 | Schedule storage policy creation AFTER Phase 1 completes (Task 5.2.1) | 5.2.1 |
| 20 | Sequence `OWNED BY` statements in script 02 reference tables not yet created (script 03) | Moved all `OWNED BY` from `02_sequences.sql` to end of `03_new_tables.sql` | 1.2/1.3 |
| 21 | 2 tables (`input_autofill_rules`, `input_linked_rules`) missing from scripts 03-07 (created on DEV after 2026-03-03 snapshot) | Added table definitions, FKs, indexes, RLS, grants to scripts 03, 05, 06, 07. Created `input_autofill_rules` on STG and loaded 23 rows from DEV | Pre-flight |

---

## PRODUCTION DEPLOYMENT

**Execute all phases in a single maintenance window.** The app should be offline or in read-only mode during this process.

**Command execution note:** All `pg_dump` and `psql` commands below should be run via Docker to ensure a consistent Postgres 17 client:

```bash
# Instead of:  pg_dump "$CONN" ...
# Run:         docker run --rm postgres:17 pg_dump "$CONN" ...

# Instead of:  psql "$CONN" -f /tmp/script.sql
# Run:         docker run --rm -v /tmp:/tmp postgres:17 psql "$CONN" -f /tmp/script.sql

# Instead of:  psql "$CONN" -c "SELECT ..."
# Run:         docker run --rm postgres:17 psql "$CONN" -c "SELECT ..."
```

**Execution order:**

| # | Task | Risk | Est. Time |
|---|------|------|-----------|
| 1 | Task 5.0 — Pre-deployment preparation (fresh schema dumps) | Low | 10 min |
| 2 | Task 5.0.1 — Enable maintenance banner | Low | 5 min |
| 3 | Task 5.1 — Back up prod | Low | 5 min |
| 4 | Task 5.1.1 — Verify backup is restorable | Low | 15 min |
| 5 | Task 5.2 — Phase 1: additive schema changes | Low | 15 min |
| 6 | Task 5.2.1 — Create storage policies on PROD | Low | 5 min |
| 7 | Task 5.3 — Phase 2: data migration for restructured tables | Medium | 10 min |
| 8 | Task 5.3.1 — Connection draining check | Low | 2 min |
| 9 | Task 5.3.5 — Deploy updated application code | Medium | 15 min |
| 10 | Task 5.4 — Phase 3: contract / destructive changes | **High** | 10 min |
| 11 | Task 5.5 — Migrate configuration data (47 tables) | Medium | 15 min |
| 12 | Task 5.6 — Automated smoke tests + final validation | Low | 10 min |
| 13 | Task 5.6.1 — Set up post-migration monitoring | Low | 10 min |
| 14 | Task 5.7 — Remove maintenance banner | Low | 2 min |

### Task 5.0: Pre-deployment preparation

**Run this BEFORE the maintenance window** (as a pre-flight check). If functions have drifted, regenerate script 01 in advance. During the maintenance window, re-verify the dumps haven't changed.

```bash
DEV_CONN="postgresql://postgres.iufoslzvcjmtgsazttkt:%24CLcl011801%25@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
PROD_CONN="postgresql://postgres.voowqmsukigzwqmssbzh:%24CLcl011801%25@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Fresh DEV schema dump
pg_dump "$DEV_CONN" --schema-only --no-owner --no-privileges --schema=public \
  > /tmp/dev_schema_fresh_raw.sql

# Fresh PROD schema dump
pg_dump "$PROD_CONN" --schema-only --no-owner --no-privileges --schema=public \
  > /tmp/prod_schema_fresh_raw.sql

# Strip pg_dump 17 \restrict tokens (Lesson #2)
grep -v '\\restrict' /tmp/dev_schema_fresh_raw.sql > /tmp/dev_schema_fresh.sql
grep -v '\\restrict' /tmp/prod_schema_fresh_raw.sql > /tmp/prod_schema_fresh.sql

# Verify dumps are non-empty
wc -l /tmp/dev_schema_fresh.sql /tmp/prod_schema_fresh.sql
```

**Verify git branch state** before proceeding:

```bash
cd /Users/aaronkraut/supabase_apps/brrrr-pricing-engine
git log --oneline -3 staging
git log --oneline -3 dev
git log --oneline -3 main
git rev-parse staging dev  # confirm staging and dev are in sync
```

Review the diff. If new objects have appeared in DEV since the staging rehearsal, regenerate the affected migration scripts before proceeding.

### Task 5.0.1: Enable maintenance banner

The maintenance banner component is already built and merged to `staging` (commit `d196862f`). It is controlled by the `NEXT_PUBLIC_MAINTENANCE_MODE` environment variable.

**To activate:**

1. In Vercel Dashboard > Project Settings > Environment Variables, set: `NEXT_PUBLIC_MAINTENANCE_MODE=true`
2. Trigger a redeployment (or this will take effect on the next deploy from Task 5.3.5)
3. Verify the amber banner is visible at the top of all pages: "We're performing scheduled maintenance to improve the platform. Some features may be temporarily unavailable."

**Component:** `apps/pricing-engine/src/components/maintenance-banner.tsx`
**Integrated in:** `apps/pricing-engine/src/app/layout.tsx` (renders before `<Providers>`)

**The banner remains active until Task 5.7 removes it.**

### Task 5.1: Back up prod

```bash
pg_dump "$PROD_CONN" \
  --no-owner --no-privileges \
  > /tmp/prod_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup is non-empty and contains data
wc -l /tmp/prod_backup_*.sql
```

**This backup is the rollback safety net for the entire migration. Do not proceed without verifying it.**

### Task 5.1.1: Verify backup is restorable

Restore the backup to a throwaway environment to confirm it's usable. An untested backup is not a backup.

```bash
# Create a temporary database for verification (use STG or a throwaway project)
# Option A: Use Supabase SQL Editor on a throwaway project
# Option B: Use a local Docker container

docker run --rm -d --name backup-test -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:17
sleep 3

# Restore backup into the test container
psql "postgresql://postgres:test@localhost:5433/postgres" < /tmp/prod_backup_*.sql

# Verify key tables and row counts
psql "postgresql://postgres:test@localhost:5433/postgres" -c "
  SELECT tablename, (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
  FROM (
    SELECT tablename, query_to_xml('SELECT count(*) AS cnt FROM public.' || quote_ident(tablename), false, false, '') AS xml_count
    FROM pg_tables WHERE schemaname = 'public'
  ) t ORDER BY tablename;
"

# Clean up
docker stop backup-test
```

**Verify:** Table count matches PROD (39 tables). Row counts are non-zero for key tables (`organizations`, `users`, `loans`, `programs`).

### Task 5.2: Apply Phase 1 to prod (Additive — Low Risk)

Apply Tasks 1.1 through 1.7 against PROD. All operations create new objects — nothing existing is modified.

**Apply staging fixes inline:**

1. **Task 1.1 (Types & Functions):** If functions have drifted since 2026-03-03, regenerate from fresh DEV dump.

2. **Task 1.2 (Sequences):** Run `02_sequences.sql` as-is. `OWNED BY` linkages are **deferred** — they run automatically at the end of `03_new_tables.sql` (Lesson #20).

3. **Task 1.3 (New Tables):** `SET search_path` and deferred `OWNED BY` linkages are already embedded in the script. After table creation, add identity columns:

   ```sql
   ALTER TABLE public.<table> ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;
   ```

4. **Task 1.4 (Additive Columns):** Handle NOT NULL columns on tables with existing rows:

   ```sql
   -- applications.display_id
   ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS display_id text;
   UPDATE public.applications SET display_id = 'APP-' || loan_id WHERE display_id IS NULL;
   ALTER TABLE public.applications ALTER COLUMN display_id SET NOT NULL;

   -- loans.display_id
   ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS display_id text;
   UPDATE public.loans SET display_id = loan_id WHERE display_id IS NULL;
   ALTER TABLE public.loans ALTER COLUMN display_id SET NOT NULL;

   -- document_templates.gjs_data
   ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS gjs_data jsonb;
   UPDATE public.document_templates SET gjs_data = '{}' WHERE gjs_data IS NULL;
   ALTER TABLE public.document_templates ALTER COLUMN gjs_data SET NOT NULL;

   -- document_templates.user_id
   ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS user_id text;
   UPDATE public.document_templates SET user_id = '' WHERE user_id IS NULL;
   ALTER TABLE public.document_templates ALTER COLUMN user_id SET NOT NULL;
   ```

5. **Task 1.5 (FK Constraints):** Run after Tasks 1.3 and 1.4 are complete.

6. **Task 1.6 (Indexes, Policies, Triggers):** Use `extensions.moddatetime()` in trigger definitions (not `moddatetime()`).

7. **Task 1.7 (Grants):** Run as-is.

**Phase 1 verification:**

```sql
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: ~173
```

### Task 5.2.1: Create storage policies on PROD

Phase 1 created the functions (`is_internal_admin`, `can_access_document`, `check_org_access`) that DEV storage policies depend on. Now create the 21 DEV-origin storage policies on PROD.

**Pre-requisite:** PROD storage buckets already created (5 DEV buckets were added pre-migration: `appraisal-documents`, `companies`, `deals`, `org-assets`, `persons`). PROD retains its existing 6 buckets and 5 policies.

```sql
-- org-assets policies (4)
CREATE POLICY "Authenticated users can delete org assets" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'org-assets'::text);
CREATE POLICY "Authenticated users can update org assets" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'org-assets'::text);
CREATE POLICY "Authenticated users can upload org assets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'org-assets'::text);
CREATE POLICY "Public read access for org assets" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'org-assets'::text);

-- deals policies (5)
CREATE POLICY "deals_admin_full_access" ON storage.objects FOR ALL TO authenticated
USING ((bucket_id = 'deals'::text) AND is_internal_admin());
CREATE POLICY "deals_delete_via_document_files" ON storage.objects FOR DELETE TO authenticated
USING ((bucket_id = 'deals'::text) AND (EXISTS (
  SELECT 1 FROM document_files df WHERE df.storage_bucket = 'deals' AND df.storage_path = objects.name AND can_access_document(df.id, 'delete'))));
CREATE POLICY "deals_insert_via_document_files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deals'::text);
CREATE POLICY "deals_select_via_document_files" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'deals'::text) AND (EXISTS (
  SELECT 1 FROM document_files df WHERE df.storage_bucket = 'deals' AND df.storage_path = objects.name AND can_access_document(df.id, 'view'))));
CREATE POLICY "deals_update_via_document_files" ON storage.objects FOR UPDATE TO authenticated
USING ((bucket_id = 'deals'::text) AND (EXISTS (
  SELECT 1 FROM document_files df WHERE df.storage_bucket = 'deals' AND df.storage_path = objects.name AND can_access_document(df.id, 'upload'))));

-- companies policies (4)
CREATE POLICY "org_policy_storage_companies_delete" ON storage.objects FOR DELETE TO authenticated
USING ((bucket_id = 'companies'::text) AND (check_org_access('storage_bucket', 'companies', 'delete')).allowed);
CREATE POLICY "org_policy_storage_companies_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'companies'::text);
CREATE POLICY "org_policy_storage_companies_select" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'companies'::text) AND (check_org_access('storage_bucket', 'companies', 'select')).allowed);
CREATE POLICY "org_policy_storage_companies_update" ON storage.objects FOR UPDATE TO authenticated
USING ((bucket_id = 'companies'::text) AND (check_org_access('storage_bucket', 'companies', 'update')).allowed);

-- persons policies (4)
CREATE POLICY "org_policy_storage_persons_delete" ON storage.objects FOR DELETE TO authenticated
USING ((bucket_id = 'persons'::text) AND (check_org_access('storage_bucket', 'persons', 'delete')).allowed);
CREATE POLICY "org_policy_storage_persons_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'persons'::text);
CREATE POLICY "org_policy_storage_persons_select" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'persons'::text) AND (check_org_access('storage_bucket', 'persons', 'select')).allowed);
CREATE POLICY "org_policy_storage_persons_update" ON storage.objects FOR UPDATE TO authenticated
USING ((bucket_id = 'persons'::text) AND (check_org_access('storage_bucket', 'persons', 'update')).allowed);

-- program-docs policies (4)
CREATE POLICY "program_docs_admin_delete" ON storage.objects FOR DELETE TO authenticated
USING ((bucket_id = 'program-docs'::text) AND is_internal_admin());
CREATE POLICY "program_docs_admin_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'program-docs'::text);
CREATE POLICY "program_docs_admin_select" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'program-docs'::text) AND is_internal_admin());
CREATE POLICY "program_docs_admin_update" ON storage.objects FOR UPDATE TO authenticated
USING ((bucket_id = 'program-docs'::text) AND is_internal_admin());
```

**Verify:**

```sql
SELECT count(*) FROM pg_policies WHERE schemaname = 'storage';
-- Expected: 26 (5 existing + 21 new)
```

### Task 5.3: Apply Phase 2 to prod (Data Migration — Medium Risk)

Apply Tasks 2.1 through 2.7 against PROD. Adjust based on actual PROD data.

- `custom_broker_settings.broker_org_id`: Backfill from `broker_id` WHERE NULL
- `organization_members.clerk_org_role`: Backfill from `role` WHERE NULL
- Credit reports, loans, loan_scenarios: Inspect actual PROD data first
- Document templates: Handle `craft_json` → `gjs_data` conversion if data exists
- Old integrations: Check for data before migrating to new system

**Phase 2 verification:**

```sql
SELECT count(*) FROM custom_broker_settings WHERE broker_org_id IS NULL AND broker_id IS NOT NULL;
SELECT count(*) FROM organization_members WHERE clerk_org_role IS NULL AND role IS NOT NULL;
-- Both should be 0
```

### Task 5.3.1: Connection draining check

Before deploying new code and executing destructive Phase 3, verify no active queries are running that could conflict:

```sql
-- Check for active queries (exclude idle connections)
SELECT pid, state, query_start, age(clock_timestamp(), query_start) AS duration, query
FROM pg_stat_activity
WHERE datname = 'postgres'
  AND state != 'idle'
  AND pid != pg_backend_pid()
ORDER BY query_start;
```

If long-running queries are found:

1. Wait for them to complete, or
2. Cancel with `SELECT pg_cancel_backend(<pid>);`
3. As a last resort, terminate with `SELECT pg_terminate_backend(<pid>);`

**Proceed only when no active queries remain (aside from your own session).**

### Task 5.3.5: Deploy updated application code

The new app code expects the schema from Phases 1-2. It must be deployed **before** Phase 3 drops old structures.

**Current branch state (verified 2026-03-03):**

- `staging` and `dev` are at the same commit (`babc454b` — includes maintenance banner merge)
- `staging` is 674+ commits ahead of `main`
- No sync needed between `staging` and `dev`
- **Re-verify this at the start of the maintenance window (Task 5.0)**

**Steps:**

1. Merge `staging` into `main`:

   ```bash
   git checkout main
   git pull origin main
   git merge staging
   # Resolve any conflicts if present
   git push origin main
   ```

2. Deploy from `main` (Vercel auto-deploy or manual trigger).

3. Verify production environment variables (already configured in Vercel project settings):
   - `NEXT_PUBLIC_SUPABASE_URL` → PROD Supabase URL ✅ (already set)
   - `CLERK_*` keys → PROD Clerk instance keys ✅ (already set)
   - Set `NEXT_PUBLIC_MAINTENANCE_MODE=true` during the maintenance window
   - Confirm all env vars are correct in Vercel Dashboard > Settings > Environment Variables

4. Verify deployment: Confirm app loads and basic auth flow works against PROD.

**Rollback:** If deployment fails, revert `main`:

```bash
git revert HEAD --no-edit
git push origin main
```

### Task 5.4: Apply Phase 3 to prod (Contract — High Risk)

**WARNING: Point of no return. Once columns are dropped, data in those columns is permanently lost.**

Apply Tasks 3.1 through 3.6 against PROD.

**Apply staging fixes inline:**

1. **Before dropping columns**, check for blocking dependencies:

   ```sql
   -- Triggers referencing columns being dropped
   SELECT tgname, tgrelid::regclass FROM pg_trigger
   WHERE tgfoid IN (
     SELECT oid FROM pg_proc
     WHERE prosrc LIKE '%guarantor_borrower_ids%'
        OR prosrc LIKE '%assigned_to_user_id%'
   );

   -- RLS policies referencing columns being dropped
   SELECT policyname, tablename FROM pg_policies
   WHERE schemaname = 'public'
   AND (qual::text LIKE '%assigned_to_user_id%'
     OR qual::text LIKE '%guarantor_borrower_ids%');
   ```

2. Drop blocking triggers and policies **first**, then drop the columns.

3. **Task 3.6 (Drop Tables):** Use `CASCADE` for remaining FK references.

**Phase 3 verification:**

```sql
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: ~164 (matching DEV)

-- Verify dropped tables are gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('integrations', 'integrations_clear', 'integrations_floify',
  'integrations_nadlan', 'integrations_xactus', 'workflow_integrations', 'xactus_data',
  'term_sheet_template_fields', 'term_sheet_templates');
-- Expected: 0 rows
```

### Task 5.5: Migrate configuration data to prod

Migrate configuration/lookup table data from STG to PROD. This data is required for app functionality (pricing engine, workflows, document system, etc.).

**Mapping table:** `migration_map_records` on STG contains ID mappings across DEV/STG/PROD for organizations, users, and Clerk IDs.

**Strategy:**

1. Dump 47 config tables from STG (data-only, `--inserts`)
2. For tables with `organization_id`/`org_id`/`user_id` columns, apply ID mappings
3. For 3 **existing** tables on PROD (`programs`, `program_documents`, `program_documents_chunks_vs`): TRUNCATE first, then INSERT
4. For 43 **new** tables (empty after Phase 1): INSERT directly
5. Load using `SET session_replication_role = 'replica'` to bypass FK triggers
6. Reset sequences after load
7. Verify row counts match STG

**Tables with ID mappings required:**

| Table | Column | Mapping |
|-------|--------|---------|
| `document_status` | `organization_id` (uuid, nullable) | STG org UUID → PROD org UUID via `migration_map_records` |
| `programs` | `user_id` (text, NOT NULL) | STG Clerk user ID → PROD Clerk user ID via `migration_map_records` |
| `organization_policies` | `org_id` (uuid, nullable) | **Excluded** — only migrate records WHERE `org_id IS NULL` |

**Special handling:**

- `organization_policies`: Exclude records with non-NULL `org_id` (96 rows WHERE NULL, 43 rows excluded)
- Orgs with empty `value_prod` in `migration_map_records` (Records 2, 3): skip data scoped to those org IDs
- `programs`, `program_documents`, `program_documents_chunks_vs`: TRUNCATE before INSERT (these 3 tables already exist on PROD with potentially different data)

**Migration order (respects FK dependencies):**

```
Layer 0 (no FK deps among migrated tables — 22 tables):
  app_settings, automations, dashboard_widgets, deal_role_types, deal_stages,
  document_categories, document_roles, document_status, document_types,
  input_categories, inputs, integration_settings, organization_member_roles,
  organization_policies (WHERE org_id IS NULL), organization_policies_column_filters,
  organization_policy_named_scopes, organization_policy_named_scope_tables,
  pe_section_buttons, pricing_engine_input_categories, programs,
  task_priorities, task_statuses

Layer 1 (depends on Layer 0 — 17 tables):
  document_type_ai_condition, document_type_ai_input, document_type_ai_input_order,
  input_autofill_rules, input_linked_rules, input_logic, input_stepper,
  integration_tags, pe_input_logic,
  pricing_engine_inputs, program_conditions, program_documents, program_rows_ids,
  task_logic, task_templates, pe_section_button_actions,
  workflow_nodes

Layer 2 (depends on Layer 1 — 8 tables):
  input_logic_actions, input_logic_conditions,
  pe_input_logic_actions, pe_input_logic_conditions,
  program_documents_chunks_vs,
  task_logic_actions, task_logic_conditions, task_template_roles
```

**Data dump command:**

```bash
STG_CONN="postgresql://postgres.cjclknhqbsecmykksqei:%24CLcl011801%25@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

pg_dump "$STG_CONN" \
  --data-only --no-owner --no-privileges --schema=public --inserts --rows-per-insert=50 \
  -t public.app_settings \
  -t public.automations \
  -t public.dashboard_widgets \
  -t public.deal_role_types \
  -t public.deal_stages \
  -t public.document_categories \
  -t public.document_roles \
  -t public.document_status \
  -t public.document_type_ai_condition \
  -t public.document_type_ai_input \
  -t public.document_type_ai_input_order \
  -t public.document_types \
  -t public.input_autofill_rules \
  -t public.input_categories \
  -t public.input_linked_rules \
  -t public.input_logic \
  -t public.input_logic_actions \
  -t public.input_logic_conditions \
  -t public.input_stepper \
  -t public.inputs \
  -t public.integration_settings \
  -t public.integration_tags \
  -t public.organization_member_roles \
  -t public.organization_policies \
  -t public.organization_policies_column_filters \
  -t public.organization_policy_named_scope_tables \
  -t public.organization_policy_named_scopes \
  -t public.pe_input_logic \
  -t public.pe_input_logic_actions \
  -t public.pe_input_logic_conditions \
  -t public.pe_section_button_actions \
  -t public.pe_section_buttons \
  -t public.pricing_engine_inputs \
  -t public.pricing_engine_input_categories \
  -t public.program_conditions \
  -t public.program_documents \
  -t public.program_documents_chunks_vs \
  -t public.program_rows_ids \
  -t public.programs \
  -t public.task_logic \
  -t public.task_logic_actions \
  -t public.task_logic_conditions \
  -t public.task_priorities \
  -t public.task_statuses \
  -t public.task_template_roles \
  -t public.task_templates \
  -t public.workflow_nodes \
  > /tmp/stg_config_data.sql
```

**Pre-load transformations:**

```bash
# 1. Strip pg_dump 17 \restrict tokens
grep -v '\\restrict' /tmp/stg_config_data.sql > /tmp/stg_config_clean.sql

# 2. Filter organization_policies: remove INSERT statements for rows with non-NULL org_id
#    (manual review of the dump file — ensure only rows WHERE org_id IS NULL are included)

# 3. Apply ID mappings using sed (from migration_map_records on STG):
#    programs.user_id — replace STG Clerk user IDs with PROD Clerk user IDs
#    document_status.organization_id — replace STG org UUIDs with PROD org UUIDs
#
#    Example (repeat for each mapping record):
#    sed -i '' 's/user_35gNaMW15NHIlK27yStFhNq7D48/user_35gNaMW15NHIlK27yStFhNq7D48/g' /tmp/stg_config_clean.sql
#    (In this case STG and PROD Clerk IDs are the same — only apply where they differ)
#
#    For org UUIDs:
#    sed -i '' 's/5a5ebcd4-7327-42bf-9d0e-b3b6c735a075/d5fcb40a-6b59-42a4-b36b-c3172a92acb6/g' /tmp/stg_config_clean.sql
#    sed -i '' 's/082f8b26-cfc9-401a-9fea-2d764381b2cc/e1466bc1-9163-47cd-a0b8-1c90835a8e77/g' /tmp/stg_config_clean.sql

# 4. Wrap in session_replication_role
{
  echo "SET session_replication_role = 'replica';"
  cat /tmp/stg_config_clean.sql
  echo "SET session_replication_role = 'origin';"
} > /tmp/stg_config_load.sql
```

**TRUNCATE the 3 existing tables before load:**

```sql
-- Run on PROD before loading config data
-- These 3 tables exist on PROD and will be replaced with STG data
TRUNCATE TABLE public.program_documents_chunks_vs CASCADE;
TRUNCATE TABLE public.program_documents CASCADE;
TRUNCATE TABLE public.programs CASCADE;
```

**Load data:**

```bash
PROD_CONN="postgresql://postgres.voowqmsukigzwqmssbzh:%24CLcl011801%25@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

psql "$PROD_CONN" -f /tmp/stg_config_load.sql
```

**Reset sequences after load:**

```sql
-- Reset sequences for tables with integer PKs (serial/identity columns)
SELECT setval('public.automations_id_seq', COALESCE((SELECT MAX(id) FROM public.automations), 1), true);
SELECT setval('public.dashboard_widgets_id_seq', COALESCE((SELECT MAX(id) FROM public.dashboard_widgets), 1), true);
SELECT setval('public.inputs_id_seq', COALESCE((SELECT MAX(id) FROM public.inputs), 1), true);
SELECT setval('public.pe_section_buttons_id_seq', COALESCE((SELECT MAX(id) FROM public.pe_section_buttons), 1), true);
SELECT setval('public.pe_section_button_actions_id_seq', COALESCE((SELECT MAX(id) FROM public.pe_section_button_actions), 1), true);
-- Add any other integer-PK tables as needed
```

**47 tables:**

| # | Table | STG Rows | Existing on PROD? | Has org/user FK? |
|---|-------|---------|-------------------|------------------|
| 1 | `app_settings` | 2 | No | No |
| 2 | `automations` | 6 | No | No |
| 3 | `dashboard_widgets` | 5 | No | No |
| 4 | `deal_role_types` | 19 | No | No |
| 5 | `deal_stages` | 19 | No | No |
| 6 | `document_categories` | 21 | No | No |
| 7 | `document_roles` | 7 | No | No |
| 8 | `document_status` | 5 | No | Yes (`organization_id` nullable) |
| 9 | `document_type_ai_condition` | 1 | No | No |
| 10 | `document_type_ai_input` | 3 | No | No |
| 11 | `document_type_ai_input_order` | 3 | No | No |
| 12 | `document_types` | 77 | No | No |
| 13 | `input_autofill_rules` | 23 | No | No |
| 14 | `input_categories` | 8 | No | No |
| 15 | `input_linked_rules` | 4 | No | No |
| 16 | `input_logic` | 1 | No | No |
| 17 | `input_logic_actions` | 1 | No | No |
| 18 | `input_logic_conditions` | 1 | No | No |
| 19 | `input_stepper` | 1 | No | No |
| 20 | `inputs` | 62 | No | No |
| 21 | `integration_settings` | 20 | No | No |
| 22 | `integration_tags` | 40 | No | No |
| 23 | `organization_member_roles` | 6 | No | No |
| 24 | `organization_policies` | 96 (filtered) | No | Yes (`org_id` — only NULL rows) |
| 25 | `organization_policies_column_filters` | 78 | No | No |
| 26 | `organization_policy_named_scope_tables` | 10 | No | No |
| 27 | `organization_policy_named_scopes` | 1 | No | No |
| 28 | `pe_input_logic` | 16 | No | No |
| 29 | `pe_input_logic_actions` | 77 | No | No |
| 30 | `pe_input_logic_conditions` | 15 | No | No |
| 31 | `pe_section_button_actions` | 2 | No | No |
| 32 | `pe_section_buttons` | 2 | No | No |
| 33 | `pricing_engine_inputs` | 65 | No | No |
| 34 | `pricing_engine_input_categories` | 8 | No | No |
| 35 | `program_conditions` | 14 | No | No |
| 36 | `program_documents` | 2 | **Yes** | No |
| 37 | `program_documents_chunks_vs` | 234 | **Yes** | No |
| 38 | `program_rows_ids` | 19 | No | No |
| 39 | `programs` | 14 | **Yes** | Yes (`user_id` text — Clerk ID) |
| 40 | `task_logic` | 1 | No | No |
| 41 | `task_logic_actions` | 1 | No | No |
| 42 | `task_logic_conditions` | 0 | No | No |
| 43 | `task_priorities` | 4 | No | No |
| 44 | `task_statuses` | 3 | No | No |
| 45 | `task_template_roles` | 3 | No | No |
| 46 | `task_templates` | 11 | No | No |
| 47 | `workflow_nodes` | 27 | No | No |

**Tables removed from migration (7 tables):**

| Table | Rows | Reason |
|-------|------|--------|
| `deal_inputs` | 186 | FK to `deals.id` — parent table not in migration list |
| `document_template_variables` | 88 | FK to `document_templates.id` — parent table not in migration list |
| `pe_term_sheets` | 2 | FK to `document_templates.id` — parent table not in migration list |
| `pe_term_sheet_rules` | 1 | FK to `pe_term_sheets.id` — parent removed above |
| `pe_term_sheet_conditions` | 1 | FK to `pe_term_sheet_rules.id` — parent removed above |
| `workflow_executions` | 113 | Operational/runtime data, not configuration |
| `workflow_execution_logs` | 511 | Operational/runtime data, not configuration |

**Mapping records (in `migration_map_records` on STG):**

| # | table_name | column_name | value_dev | value_stg | value_prod | notes |
|---|------------|-------------|-----------|-----------|------------|-------|
| 1 | organizations | id | `5a5ebcd4-...a075` | `5a5ebcd4-...a075` | `d5fcb40a-...acb6` | pkey |
| 2 | organizations | id | `5f83ef98-...565d` | `5f83ef98-...565d` | *(skip)* | pkey |
| 3 | organizations | id | `6b0ddd4a-...d272` | `6b0ddd4a-...d272` | *(skip)* | pkey |
| 4 | organizations | id | `082f8b26-...b2cc` | `082f8b26-...b2cc` | `e1466bc1-...8e77` | pkey |
| 5 | users | id | 1 | 3 | 3 | pkey |
| 6 | users | id | 3 | 2 | 2 | pkey |
| 7 | users | id | 2 | 1 | 1 | pkey |
| 8 | users | clerk_user_id | `user_35fp2O7y...` | `user_35gNaMW1...` | `user_35gNaMW1...` | Clerk sub |
| 9 | users | clerk_user_id | `user_38MVohq0...` | `user_36H4one9...` | `user_36H4one9...` | Clerk sub |
| 10 | users | clerk_user_id | `user_38cgzmCn...` | `user_35wkNLL0...` | `user_35wkNLL0...` | Clerk sub |
| 11 | organizations | clerk_organization_id | `org_38MVrtrQ...` | `org_38MVrtrQ...` | `org_35gNbFrM...` | Clerk org |
| 12 | organizations | clerk_organization_id | `org_35fqSMtj...` | `org_35fqSMtj...` | `org_35fqSMtj...` | Clerk org |

### Task 5.6: Automated smoke tests + final validation

**Step 1: Schema validation**

```bash
pg_dump "$PROD_CONN" --schema-only --no-owner --no-privileges --schema=public \
  > /tmp/prod_post_migration.sql

diff <(grep -E "^CREATE|^ALTER" /tmp/prod_post_migration.sql | sort) \
     <(grep -E "^CREATE|^ALTER" /tmp/dev_schema_fresh.sql | sort)
```

**Step 2: Config table row count verification**

```sql
SELECT 'app_settings' AS tbl, count(*) FROM public.app_settings
UNION ALL SELECT 'automations', count(*) FROM public.automations
UNION ALL SELECT 'dashboard_widgets', count(*) FROM public.dashboard_widgets
UNION ALL SELECT 'deal_role_types', count(*) FROM public.deal_role_types
UNION ALL SELECT 'deal_stages', count(*) FROM public.deal_stages
UNION ALL SELECT 'document_categories', count(*) FROM public.document_categories
UNION ALL SELECT 'document_roles', count(*) FROM public.document_roles
UNION ALL SELECT 'document_status', count(*) FROM public.document_status
UNION ALL SELECT 'document_types', count(*) FROM public.document_types
UNION ALL SELECT 'inputs', count(*) FROM public.inputs
UNION ALL SELECT 'integration_settings', count(*) FROM public.integration_settings
UNION ALL SELECT 'integration_tags', count(*) FROM public.integration_tags
UNION ALL SELECT 'organization_member_roles', count(*) FROM public.organization_member_roles
UNION ALL SELECT 'organization_policies', count(*) FROM public.organization_policies
UNION ALL SELECT 'pe_input_logic', count(*) FROM public.pe_input_logic
UNION ALL SELECT 'pricing_engine_inputs', count(*) FROM public.pricing_engine_inputs
UNION ALL SELECT 'programs', count(*) FROM public.programs
UNION ALL SELECT 'task_templates', count(*) FROM public.task_templates
UNION ALL SELECT 'workflow_nodes', count(*) FROM public.workflow_nodes
ORDER BY tbl;
```

**Step 3: Automated API smoke tests**

Create and run `scripts/smoke-test.sh` to verify all critical endpoints return expected responses:

```bash
#!/bin/bash
set -e

BASE_URL="${1:-https://brrrr-pricing-engine.vercel.app}"
PASS=0
FAIL=0

check() {
  local name="$1" url="$2" expected_status="${3:-200}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  if [ "$status" = "$expected_status" ]; then
    echo "  ✓ $name ($status)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name (got $status, expected $expected_status)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Smoke Test: $BASE_URL ==="
echo ""

echo "--- Health & Auth ---"
check "Landing page" "$BASE_URL"
check "Sign-in page" "$BASE_URL/sign-in"

echo ""
echo "--- API Endpoints (expect 401 without auth) ---"
check "API: deals" "$BASE_URL/api/deals" "401"
check "API: programs" "$BASE_URL/api/programs" "401"
check "API: pricing-engine inputs" "$BASE_URL/api/pricing-engine/inputs" "401"
check "API: organizations" "$BASE_URL/api/org" "401"
check "API: document types" "$BASE_URL/api/documents/types" "401"
check "API: deal stages" "$BASE_URL/api/deals/stages" "401"
check "API: task templates" "$BASE_URL/api/tasks/templates" "401"
check "API: automations" "$BASE_URL/api/automations" "401"
check "API: integration settings" "$BASE_URL/api/integrations/settings" "401"
check "API: dashboard widgets" "$BASE_URL/api/dashboard/widgets" "401"

echo ""
echo "--- Database Connectivity (via Supabase) ---"
check "Supabase health" "https://voowqmsukigzwqmssbzh.supabase.co/rest/v1/" "401"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED — investigate before removing maintenance banner"
exit $FAIL
```

```bash
chmod +x scripts/smoke-test.sh
./scripts/smoke-test.sh "https://brrrr-pricing-engine.vercel.app"
# Also test the custom domain:
./scripts/smoke-test.sh "https://www.pricingengine.pro"
```

**Step 4: Manual verification checklist**

After automated tests pass, manually verify:

- [ ] Login/auth flow with PROD Clerk instance
- [ ] Organization switching
- [ ] Pricing engine loads inputs, rules, and categories
- [ ] Deal pipeline and stages render
- [ ] Document upload/download works (storage buckets)
- [ ] Settings pages load
- [ ] Workflow/automation definitions visible

**Step 5: Storage bucket verification**

```sql
-- Verify all 11 buckets exist
SELECT id, name, public FROM storage.buckets ORDER BY name;
-- Expected: 11 rows

-- Verify all 26 policies exist
SELECT count(*) FROM pg_policies WHERE schemaname = 'storage';
-- Expected: 26
```

### Task 5.6.1: Set up post-migration monitoring

Monitor the system for 24-48 hours after migration to catch issues early.

**Database monitoring (run periodically or set up alerts):**

```sql
-- 1. Check for failed RLS policy denials (common after policy changes)
SELECT count(*) AS error_count
FROM pg_stat_activity
WHERE state = 'active'
  AND query LIKE '%permission denied%';

-- 2. Check for slow queries (> 5 seconds)
SELECT pid, age(clock_timestamp(), query_start) AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < clock_timestamp() - interval '5 seconds'
  AND pid != pg_backend_pid();

-- 3. Check connection pool utilization
SELECT count(*) AS total_connections,
  count(*) FILTER (WHERE state = 'active') AS active,
  count(*) FILTER (WHERE state = 'idle') AS idle,
  count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_txn
FROM pg_stat_activity
WHERE datname = 'postgres';

-- 4. Check for deadlocks (should be 0)
SELECT deadlocks FROM pg_stat_database WHERE datname = 'postgres';
```

**Application monitoring:**

- Watch Vercel deployment logs for errors
- Monitor Supabase Dashboard > Logs for failed queries
- Check Clerk Dashboard for webhook delivery failures
- Watch for elevated error rates in browser console

**Alerting thresholds:**

- Error rate > 1% of requests → investigate
- Query duration > 10s → investigate  
- Connection count > 80% of pool → investigate
- Any deadlocks → investigate immediately

### Task 5.7: Remove maintenance banner

Once all smoke tests pass and monitoring shows no issues:

1. In Vercel Dashboard > Project Settings > Environment Variables, either:
   - Delete `NEXT_PUBLIC_MAINTENANCE_MODE`, or
   - Set `NEXT_PUBLIC_MAINTENANCE_MODE=false`
2. Trigger a redeployment
3. Verify the banner is no longer visible on `https://brrrr-pricing-engine.vercel.app` and `https://www.pricingengine.pro`

**The migration is complete.**

---

## ROLLBACK PROCEDURES

### Phase 1 Rollback (Low Risk)

Phase 1 is entirely additive. If it fails partway:

- Fix the issue and re-run the failed statement (all use `IF NOT EXISTS`)
- No existing data is modified, no existing objects are changed
- **Full undo (if needed):** Restore from Task 5.1 backup

### Phase 2 Rollback (Medium Risk)

Phase 2 backfills data into new columns. If it fails:

- Fix and re-run (backfills use `WHERE new_column IS NULL`, making them idempotent)
- No existing data is deleted in Phase 2
- **Full undo:** Restore from Task 5.1 backup

### App Code Rollback

If the new app code has issues after deployment:

```bash
# Find the pre-merge commit
git log --oneline -3 main

# Revert the merge commit
git revert HEAD --no-edit
git push origin main

# Trigger redeployment
```

### Phase 3 Rollback (High Risk — Point of No Return)

Once columns/tables are dropped, data in those columns is permanently lost.

- **If Phase 3 fails partway:** Stop immediately. Assess which drops succeeded. Fix the blocking issue (trigger, policy, FK) and continue. Remaining drops are independent.
- **If critical data was lost:** Full restore from Task 5.1 backup, then redo Phases 1-3.

### Task 5.5 Rollback (Config Data)

If data load fails or data is incorrect:

- TRUNCATE the affected tables
- Fix the dump file or mapping
- Re-run the load

### Full Restore (Nuclear Option)

If the entire migration needs to be undone:

```bash
PROD_CONN="postgresql://postgres.voowqmsukigzwqmssbzh:%24CLcl011801%25@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# 1. Drop and recreate public schema
psql "$PROD_CONN" -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
"

# 2. Restore from backup
psql "$PROD_CONN" < /tmp/prod_backup_YYYYMMDD_HHMMSS.sql

# 3. Revert app code if needed
git revert HEAD --no-edit && git push origin main
```

---

## SQL Script Inventory

| Script | Phase | Description | Staging Fixes Applied |
|--------|-------|-------------|-----------------------|
| `01_types_and_functions.sql` | 1.1 | 2 types + 53 functions | None needed (Lesson #11 handled by Task 5.0 fresh dump) |
| `02_sequences.sql` | 1.2 | 9 new sequences (OWNED BY deferred to script 03) | **Lesson #20:** OWNED BY moved to end of script 03 |
| `03_new_tables.sql` | 1.3 | 134 new tables + deferred OWNED BY linkages | **Lesson #1:** `SET search_path`; **Lesson #20:** OWNED BY appended |
| `04_additive_columns.sql` | 1.4 | 71 new columns on existing tables | **Lesson #4, #5:** NOT NULL → nullable + backfill + set NOT NULL |
| `05_fk_constraints.sql` | 1.5 | 212 foreign key constraints | None needed |
| `06_indexes_policies_triggers.sql` | 1.6 | 207 indexes, 423 policies, 65 triggers | **Lesson #9:** `moddatetime()` → `extensions.moddatetime()` |
| `07_grants.sql` | 1.7 | 894 GRANT statements | None needed |
| `08_contract_columns.sql` | 3.5 | 38 column drops + 4 default changes | **Lesson #6, #7:** Pre-drop trigger/policy removal added |

**Reference files:**

| File | Description |
|------|-------------|
| `ref_dev_schema.sql` | Full DEV schema dump (snapshot 2026-03-03, will be refreshed in Task 5.0) |
| `ref_prod_schema.sql` | Full PROD schema dump (snapshot 2026-03-03, will be refreshed in Task 5.0) |

---

## Storage Bucket Inventory

All 3 environments now have 11 identical buckets:

| Bucket | Public | Size Limit | MIME Types | Origin |
|--------|--------|-----------|------------|--------|
| `appraisal-documents` | No | None | None | DEV |
| `broker-assets` | Yes | None | None | PROD |
| `companies` | No | 50 MB | PDF, image, text, zip | DEV |
| `credit-reports` | No | None | None | PROD |
| `deals` | No | 50 MB | PDF, image, text, zip | DEV |
| `documents` | No | 50 MB | PDF, image, text, zip | PROD |
| `lender-logo-assets` | Yes | None | None | PROD |
| `org-assets` | Yes | None | None | DEV |
| `persons` | No | 50 MB | PDF, image, text, zip | DEV |
| `program-docs` | No | 5 MB | PDF | DEV (overrides PROD limit) |
| `term-sheets` | No | 50 MB | PDF | PROD |

**Storage policy status:**

- DEV: 21 policies ✅
- STG: 26 policies (5 PROD + 21 DEV) ✅
- PROD: 5 existing policies; 21 DEV policies to be created in Task 5.2.1 (after Phase 1 functions exist)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Phase 1 breaks existing queries | All additive — impossible to break existing queries |
| NOT NULL columns fail on existing rows | Add nullable → backfill → set NOT NULL (proven in staging; script 04 fixed) |
| FK constraints fail due to ordering | Run AFTER all tables/columns exist; use IF NOT EXISTS |
| Phase 2 data loss | Backfills are idempotent; always SELECT before UPDATE |
| Phase 3 drops blocked by triggers/policies | Query `pg_trigger` and `pg_policies` for references; drop blockers first (script 08 fixed) |
| `vector` type not found | Prepend `SET search_path TO public, extensions;` (script 03 fixed) |
| `moddatetime()` not found | Use `extensions.moddatetime()` (script 06 fixed) |
| TRUNCATE cascades unexpectedly | Verify FK chains before running; explicitly list all affected tables |
| Sequence name mismatch in dump | Manually verify and set sequences after data load |
| Config data PK conflicts | 44/47 tables are new (empty); 3 existing tables use TRUNCATE + INSERT |
| Clerk ID mismatch STG→PROD | `migration_map_records` stores mappings; apply via sed before load |
| Schema drift since 2026-03-03 | Re-dump DEV and PROD fresh before execution (Task 5.0) |
| Full migration failure | Task 5.1 backup + verified in Task 5.1.1 + documented rollback procedures |
| App code mismatch with schema | Deploy new code after Phase 2, before Phase 3 (Task 5.3.5) |
| Phase 3 drops columns app still uses | New code deployed first; old code reverted if needed |
| Storage buckets missing on PROD | 5 DEV buckets pre-created on PROD; policies added in Task 5.2.1 |
| Storage policies depend on Phase 1 functions | Policies scheduled AFTER Phase 1 (Task 5.2.1) |
| Active queries conflict with destructive changes | Connection draining check in Task 5.3.1 |
| Users encounter errors during migration | Maintenance banner enabled (Task 5.0.1) until complete (Task 5.7) |
| Backup unusable when needed | Backup verified against throwaway env (Task 5.1.1) |
