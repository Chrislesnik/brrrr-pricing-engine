import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Tables that support soft delete via archived_at / archived_by columns.
 */
export type ArchivableTable =
  // Tier 1: Core Business
  | "loans"
  | "loan_scenarios"
  | "deals"
  | "borrowers"
  | "entities"
  | "guarantor"
  // Tier 2: Operational
  | "inputs"
  | "input_categories"
  | "document_types"
  | "document_files"
  | "deal_tasks"
  | "deal_documents"
  | "task_templates"
  | "actions"
  | "programs"
  | "document_templates"
  // Tier 3: Settings/Config
  | "workflow_integrations"
  | "organization_policies"
  | "organization_member_roles"
  | "deal_stages"

/**
 * Soft-delete a record by setting archived_at to now.
 * Cascade triggers in the DB will archive children automatically for
 * loans -> loan_scenarios, deals -> deal_tasks/deal_documents, borrowers -> guarantor.
 */
export async function archiveRecord(
  table: ArchivableTable,
  id: string | number,
  userId: string,
) {
  return supabaseAdmin
    .from(table)
    .update({
      archived_at: new Date().toISOString(),
      archived_by: userId,
    })
    .eq("id", id)
}

/**
 * Archive a record scoped to an organization (extra safety).
 */
export async function archiveRecordScoped(
  table: ArchivableTable,
  id: string | number,
  userId: string,
  orgColumn: string,
  orgId: string,
) {
  return supabaseAdmin
    .from(table)
    .update({
      archived_at: new Date().toISOString(),
      archived_by: userId,
    })
    .eq("id", id)
    .eq(orgColumn, orgId)
}

/**
 * Restore (un-archive) a record.
 * Cascade triggers in the DB will restore children that were archived at the same time.
 */
export async function restoreRecord(
  table: ArchivableTable,
  id: string | number,
) {
  return supabaseAdmin
    .from(table)
    .update({
      archived_at: null,
      archived_by: null,
    })
    .eq("id", id)
}

/**
 * Permanently delete a record. Only works on already-archived records.
 * This is the admin-only path — ON DELETE CASCADE FKs handle children.
 */
export async function permanentlyDelete(
  table: ArchivableTable,
  id: string | number,
) {
  return supabaseAdmin
    .from(table)
    .delete()
    .eq("id", id)
    .not("archived_at", "is", null)
}

/**
 * Append `.is('archived_at', null)` to a Supabase query unless the caller
 * explicitly opts in to seeing archived rows.
 *
 * Usage:
 * ```ts
 * let query = supabaseAdmin.from("loans").select("*")
 * query = addArchiveFilter(query, includeArchived)
 * const { data } = await query
 * ```
 */
export function addArchiveFilter<T>(
  query: T,
  includeArchived: boolean,
): T {
  if (includeArchived) return query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).is("archived_at", null) as T
}

/**
 * Helper to read the `include_archived` query-string flag from a Request.
 */
export function wantsArchived(req: Request): boolean {
  try {
    return new URL(req.url).searchParams.get("include_archived") === "true"
  } catch {
    return false
  }
}
