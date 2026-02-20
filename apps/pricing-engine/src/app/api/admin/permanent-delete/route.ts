import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId, checkFeatureAccess, getUserRoleInOrg } from "@/lib/orgs"
import { permanentlyDelete, type ArchivableTable } from "@/lib/archive-helpers"
import { supabaseAdmin } from "@/lib/supabase-admin"

/** All table names that support archiving (used for validation). */
const ARCHIVABLE_TABLES: Set<string> = new Set([
  "loans",
  "loan_scenarios",
  "deals",
  "borrowers",
  "entities",
  "guarantor",
  "inputs",
  "input_categories",
  "document_types",
  "document_files",
  "deal_tasks",
  "deal_documents",
  "task_templates",
  "actions",
  "programs",
  "document_templates",
  "workflow_integrations",
  "organization_policies",
  "organization_member_roles",
  "deal_stages",
])

/** Tables whose files should be purged from Supabase Storage on permanent delete. */
const STORAGE_CLEANUP: Record<string, { bucket: string; pathColumn: string }> = {
  deal_documents: { bucket: "deals", pathColumn: "storage_path" },
}

/**
 * POST /api/admin/permanent-delete
 *
 * Permanently delete an already-archived record.
 * Requirements:
 *  1. User must be an internal user (is_internal_yn = true)
 *  2. User's organization must match the record's organization
 *  3. User's role in the org must be "admin"
 *
 * Body: { table: ArchivableTable, id: string | number }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    // Resolve the organization
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Policy engine check: feature:permanent_delete/delete
    let canDelete = await checkFeatureAccess("permanent_delete", "delete").catch(() => false)

    // Fallback: if no feature:permanent_delete policy exists yet (migration not applied),
    // use the original hardcoded checks to avoid regression.
    if (!canDelete) {
      const { data: policyExists } = await supabaseAdmin
        .from("organization_policies")
        .select("id")
        .eq("resource_type", "feature")
        .eq("resource_name", "permanent_delete")
        .eq("action", "delete")
        .eq("is_active", true)
        .limit(1)

      if (!policyExists || policyExists.length === 0) {
        // Legacy fallback: check is_internal_yn + admin/owner
        const { data: userRow } = await supabaseAdmin
          .from("users")
          .select("id, is_internal_yn")
          .eq("clerk_user_id", userId)
          .maybeSingle()

        const role = await getUserRoleInOrg(orgUuid, userId)
        const normalizedRole = role ? role.replace(/^org:/, "") : ""

        canDelete = !!(
          userRow?.is_internal_yn &&
          (normalizedRole === "admin" || normalizedRole === "owner")
        )
      }
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: "You do not have permission to permanently delete records" },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { table, id } = body as { table?: string; id?: string | number }

    if (!table || !ARCHIVABLE_TABLES.has(table)) {
      return NextResponse.json(
        { error: `Invalid table. Must be one of: ${[...ARCHIVABLE_TABLES].join(", ")}` },
        { status: 400 }
      )
    }
    if (!id) {
      return NextResponse.json({ error: "Record id is required" }, { status: 400 })
    }

    // Clean up storage files if applicable
    const storageConfig = STORAGE_CLEANUP[table]
    if (storageConfig) {
      const { data: record } = await supabaseAdmin
        .from(table)
        .select(storageConfig.pathColumn)
        .eq("id", id)
        .not("archived_at", "is", null)
        .single()

      if (record) {
        const path = (record as Record<string, unknown>)[storageConfig.pathColumn]
        if (typeof path === "string" && path) {
          await supabaseAdmin.storage.from(storageConfig.bucket).remove([path])
        }
      }
    }

    // Also handle document_files linked to deal_documents
    if (table === "deal_documents") {
      const { data: dealDoc } = await supabaseAdmin
        .from("deal_documents")
        .select("document_file_id")
        .eq("id", id)
        .not("archived_at", "is", null)
        .single()

      if (dealDoc?.document_file_id) {
        const { data: docFile } = await supabaseAdmin
          .from("document_files")
          .select("storage_bucket, storage_path")
          .eq("id", dealDoc.document_file_id)
          .single()

        if (docFile?.storage_bucket && docFile?.storage_path) {
          await supabaseAdmin.storage
            .from(docFile.storage_bucket as string)
            .remove([docFile.storage_path as string])
        }

        // Delete the document_files record
        await supabaseAdmin.from("document_files").delete().eq("id", dealDoc.document_file_id)
      }
    }

    // Permanently delete the record (only if it's archived)
    const { error } = await permanentlyDelete(table as ArchivableTable, id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
