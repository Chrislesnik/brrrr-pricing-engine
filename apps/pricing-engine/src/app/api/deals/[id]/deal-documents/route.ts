import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { nanoid } from "nanoid";
import { checkRouteAccess, getOrgUuidFromClerkId } from "@/lib/orgs";

type DocumentStatusDetail = {
  id: number;
  code: string;
  label: string;
  color: string | null;
  is_terminal: boolean;
};

async function resolveStatusTableName(): Promise<"document_status" | "document_statuses"> {
  const { error } = await supabaseAdmin
    .from("document_status")
    .select("id")
    .limit(1);

  if (!error) return "document_status";
  if ((error as any)?.code === "42P01") return "document_statuses";

  // Default to final name and let callers surface any non-table-not-found errors.
  return "document_status";
}

async function resolveCurrentUserPk(clerkUserId: string): Promise<number | null> {
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  return (userRow?.id as number | undefined) ?? null;
}

const DEAL_DOCUMENTS_ROUTE_RESOURCE = "/api/deals/[id]/deal-documents";

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/deal-documents                                         */
/*  Returns all deal_documents for a deal, joined with document_files storage  */
/*  info and uploader details.                                                 */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization context" }, { status: 401 });
    }
    const canAccessRoute = await checkRouteAccess(DEAL_DOCUMENTS_ROUTE_RESOURCE, "select").catch(
      () => false
    );
    if (!canAccessRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: dealId } = await params;

    // Resolve whether the caller belongs to an internal org
    let isInternalOrg = false;
    if (orgUuid) {
      const { data: orgRow } = await supabaseAdmin
        .from("organizations")
        .select("is_internal_yn")
        .eq("id", orgUuid)
        .single();
      isInternalOrg = orgRow?.is_internal_yn === true;
    }

    const { data, error } = await supabaseAdmin
      .from("deal_documents")
      .select(
        `
        id,
        deal_id,
        document_type_id,
        file_name,
        file_size,
        file_type,
        storage_path,
        uploaded_by,
        uploaded_at,
        notes,
        created_at,
        document_file_id,
        document_files:document_file_id (
          id,
          uuid,
          storage_bucket,
          storage_path,
          document_name,
          file_type,
          file_size,
          document_category_id,
          document_status_id
        )
      `
      )
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with org-scoped status assignments.
    const documentFileIds = [
      ...new Set((data ?? []).map((d: any) => d.document_file_id).filter(Boolean)),
    ];
    const statusByDocumentFileId = new Map<number, DocumentStatusDetail>();

    if (documentFileIds.length > 0) {
      const { data: assignmentRows, error: assignmentError } = await supabaseAdmin
        .from("document_file_statuses")
        .select("document_file_id, document_status_id")
        .eq("organization_id", orgUuid)
        .in("document_file_id", documentFileIds);

      if (assignmentError) {
        return NextResponse.json({ error: assignmentError.message }, { status: 500 });
      }

      const statusIds = [
        ...new Set((assignmentRows ?? []).map((r: any) => r.document_status_id).filter(Boolean)),
      ];

      if (statusIds.length > 0) {
        const statusTable = await resolveStatusTableName();
        const { data: statusRows, error: statusError } = await supabaseAdmin
          .from(statusTable)
          .select("id, code, label, color, is_terminal")
          .in("id", statusIds);

        if (statusError) {
          return NextResponse.json({ error: statusError.message }, { status: 500 });
        }

        const statusById = new Map<number, DocumentStatusDetail>(
          (statusRows ?? []).map((row: any) => [
            row.id,
            {
              id: row.id,
              code: row.code,
              label: row.label,
              color: row.color,
              is_terminal: row.is_terminal,
            },
          ])
        );

        for (const row of assignmentRows ?? []) {
          const detail = statusById.get(row.document_status_id);
          if (detail) {
            statusByDocumentFileId.set(row.document_file_id, detail);
          }
        }
      }
    }

    // Enrich with uploader info
    const uploaderIds = [
      ...new Set(
        (data ?? [])
          .map((d: any) => d.uploaded_by)
          .filter(Boolean)
      ),
    ];

    let uploaderMap = new Map<
      string,
      { name: string; avatarUrl: string | null }
    >();
    if (uploaderIds.length > 0) {
      const { data: uploaders } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id, first_name, last_name, avatar_url")
        .in("clerk_user_id", uploaderIds);

      uploaderMap = new Map(
        (uploaders ?? []).map((u: any) => [
          u.clerk_user_id,
          {
            name:
              [u.first_name, u.last_name].filter(Boolean).join(" ") ||
              "Unknown User",
            avatarUrl: u.avatar_url,
          },
        ])
      );
    }

    const documents = (data ?? []).map((d: any) => {
      const uploader = uploaderMap.get(d.uploaded_by) || {
        name: "Unknown User",
        avatarUrl: null,
      };
      const df = d.document_files;
      const statusDetail = d.document_file_id
        ? statusByDocumentFileId.get(d.document_file_id) ?? null
        : null;
      return {
        id: d.id,
        deal_id: d.deal_id,
        document_type_id: d.document_type_id,
        file_name: d.file_name,
        file_size: d.file_size,
        file_type: d.file_type,
        storage_path: d.storage_path,
        uploaded_by: d.uploaded_by,
        uploaded_at: d.uploaded_at,
        notes: d.notes,
        created_at: d.created_at,
        document_file_id: d.document_file_id,
        // Storage info from document_files
        has_file: !!df?.storage_path,
        storage_bucket: df?.storage_bucket ?? null,
        document_file_uuid: df?.uuid ?? null,
        document_category_id: df?.document_category_id ?? null,
        document_status_id: df?.document_status_id ?? null,
        document_status_detail: statusDetail ?? null,
        // Uploader info
        uploaded_by_name: uploader.name,
        uploaded_by_avatar: uploader.avatarUrl,
      };
    });

    return NextResponse.json({ documents, is_internal_org: isInternalOrg });
  } catch (error) {
    console.error("[GET /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/deal-documents                                        */
/*  Uploads a file to Supabase Storage, creates document_files row, links via  */
/*  deal_documents + junction tables (document_files_deals, _clerk_orgs,       */
/*  _clerk_users, _entities).                                                  */
/*  Body: FormData { file, documentTypeId, notes? }                            */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization context" }, { status: 401 });
    }
    const canAccessRoute = await checkRouteAccess(DEAL_DOCUMENTS_ROUTE_RESOURCE, "insert").catch(
      () => false
    );
    if (!canAccessRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: dealId } = await params;

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentTypeIdRaw = formData.get("documentTypeId") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const documentTypeId = documentTypeIdRaw
      ? parseInt(documentTypeIdRaw, 10)
      : null;

    // ---- Resolve document_category_id + storage_folder from document_type ----
    let documentCategoryId: number | null = null;
    let storageFolder: string = "uncategorized";

    if (documentTypeId) {
      const { data: docType } = await supabaseAdmin
        .from("document_types")
        .select(
          `
          document_category_id,
          document_categories:document_category_id (
            id,
            storage_folder
          )
        `
        )
        .eq("id", documentTypeId)
        .single();

      if (docType) {
        documentCategoryId = docType.document_category_id;
        const cat = docType.document_categories as any;
        if (cat?.storage_folder) {
          storageFolder = cat.storage_folder;
        }
      }
    }

    // ---- Build storage path: {dealId}/{storage_folder}/{nanoid}.{ext} ----
    const fileExt = file.name.split(".").pop() || "bin";
    const uniqueId = nanoid();
    const fileName = `${uniqueId}.${fileExt}`;
    const storagePath = `${dealId}/${storageFolder}/${fileName}`;

    // ---- Resolve user PK + display info for junction tables + response ----
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, clerk_user_id, first_name, last_name, avatar_url")
      .eq("clerk_user_id", userId)
      .single();

    // ---- Resolve default document status ----
    let defaultStatusId: number | null = null;
    const { data: defaultStatus } = await supabaseAdmin
      .from("document_status")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    if (defaultStatus) {
      defaultStatusId = defaultStatus.id;
    }

    // ---- Step 1: Upload to Supabase Storage FIRST ----
    // (must happen before the DB insert so the trigger's file_download_url is valid)
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("deals")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // ---- Step 2: Insert document_files row ----
    // (trigger fires here to notify n8n — file already exists in storage)
    const { data: docFile, error: docFileError } = await supabaseAdmin
      .from("document_files")
      .insert({
        document_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_bucket: "deals",
        storage_path: storagePath,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        document_category_id: documentCategoryId,
        document_status_id: defaultStatusId,
      })
      .select("id, uuid")
      .single();

    if (docFileError || !docFile) {
      console.error("Error creating document_files row:", docFileError);
      // Rollback: remove the uploaded file from storage
      await supabaseAdmin.storage.from("deals").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    // ---- Step 3: Insert deal_documents row (typed placement) ----
    const { data: dealDoc, error: dealDocError } = await supabaseAdmin
      .from("deal_documents")
      .insert({
        deal_id: dealId,
        document_type_id: documentTypeId,
        document_file_id: docFile.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      })
      .select("id")
      .single();

    if (dealDocError || !dealDoc) {
      console.error("Error creating deal_documents row:", dealDocError);
      // Rollback: delete storage + document_files
      await supabaseAdmin.storage.from("deals").remove([storagePath]);
      await supabaseAdmin
        .from("document_files")
        .delete()
        .eq("id", docFile.id);
      return NextResponse.json(
        { error: "Failed to create deal document record" },
        { status: 500 }
      );
    }

    // ---- Step 4: Insert junction table links (best-effort, non-blocking) ----

    // 4a. document_files_deals (CRITICAL for RLS)
    const { error: dealLinkError } = await supabaseAdmin
      .from("document_files_deals")
      .insert({
        document_file_id: docFile.id,
        deal_id: dealId,
        source_table: "deal_documents",
        source_pk: dealDoc.id,
      });

    if (dealLinkError) {
      console.error("Error creating document_files_deals link:", dealLinkError);
      // This is critical -- rollback everything
      await supabaseAdmin
        .from("deal_documents")
        .delete()
        .eq("id", dealDoc.id);
      await supabaseAdmin.storage.from("deals").remove([storagePath]);
      await supabaseAdmin
        .from("document_files")
        .delete()
        .eq("id", docFile.id);
      return NextResponse.json(
        { error: "Failed to link document to deal" },
        { status: 500 }
      );
    }

    // 4b. document_files_clerk_orgs (org link for org-level access)
    // Get orgs associated with this deal
    const { data: dealOrgs } = await supabaseAdmin
      .from("deal_clerk_orgs")
      .select("clerk_org_id")
      .eq("deal_id", dealId);

    if (dealOrgs && dealOrgs.length > 0) {
      const orgInserts = dealOrgs.map((o: any) => ({
        document_file_id: docFile.id,
        clerk_org_id: o.clerk_org_id,
        created_by: userId,
      }));
      await supabaseAdmin
        .from("document_files_clerk_orgs")
        .insert(orgInserts)
        .then(({ error }) => {
          if (error)
            console.error("Error linking doc to orgs (non-fatal):", error);
        });
    }

    // 4c. document_files_clerk_users (uploader link)
    if (userRow) {
      await supabaseAdmin
        .from("document_files_clerk_users")
        .insert({
          document_file_id: docFile.id,
          clerk_user_id: userRow.id, // bigint users.id
          created_by: userId,
        })
        .then(({ error }) => {
          if (error)
            console.error("Error linking doc to user (non-fatal):", error);
        });
    }

    // 4d. document_files_entities (entities linked to deal)
    const { data: dealEntities } = await supabaseAdmin
      .from("deal_entity")
      .select("entity_id")
      .eq("deal_id", dealId);

    if (dealEntities && dealEntities.length > 0) {
      const entityInserts = dealEntities
        .filter((e: any) => e.entity_id)
        .map((e: any) => ({
          document_file_id: docFile.id,
          entity_id: e.entity_id,
          created_by: userId,
        }));
      if (entityInserts.length > 0) {
        await supabaseAdmin
          .from("document_files_entities")
          .insert(entityInserts)
          .then(({ error }) => {
            if (error)
              console.error(
                "Error linking doc to entities (non-fatal):",
                error
              );
          });
      }
    }

    // 4e. document_file_statuses (org-scoped default status assignment)
    const statusTable = await resolveStatusTableName();
    const { data: draftStatus, error: draftStatusError } = await supabaseAdmin
      .from(statusTable)
      .select("id")
      .eq("code", "draft")
      .or(`organization_id.eq.${orgUuid},organization_id.is.null`)
      .order("organization_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftStatusError) {
      console.error("Error resolving default status (non-fatal):", draftStatusError);
    } else if (draftStatus?.id) {
      const currentUserPk = await resolveCurrentUserPk(userId);
      const { error: statusUpsertError } = await supabaseAdmin
        .from("document_file_statuses")
        .upsert(
          {
            document_file_id: docFile.id,
            organization_id: orgUuid,
            document_status_id: draftStatus.id,
            created_by: currentUserPk,
            updated_by: currentUserPk,
          },
          { onConflict: "document_file_id,organization_id" }
        );
      if (statusUpsertError) {
        console.error("Error creating document_file_statuses row (non-fatal):", statusUpsertError);
      }
    }

    // ---- Build complete response matching GET shape ----
    const uploaderName = userRow
      ? [userRow.first_name, userRow.last_name].filter(Boolean).join(" ") ||
        "Unknown User"
      : "Unknown User";
    const uploaderAvatar = (userRow as any)?.avatar_url ?? null;
    const now = new Date().toISOString();

    return NextResponse.json({
      document: {
        id: dealDoc.id,
        deal_id: dealId,
        document_type_id: documentTypeId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_by: userId,
        uploaded_at: now,
        notes: notes?.trim() || null,
        created_at: now,
        document_file_id: docFile.id,
        // Storage info (mirrors GET enrichment)
        has_file: true,
        storage_bucket: "deals",
        document_file_uuid: docFile.uuid,
        document_category_id: documentCategoryId,
        document_status_id: defaultStatusId,
        document_status_detail: null,
        // Uploader info
        uploaded_by_name: uploaderName,
        uploaded_by_avatar: uploaderAvatar,
      },
    });
  } catch (error) {
    console.error("[POST /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/deals/[id]/deal-documents                                       */
/*  Updates document_type_id and/or file_name on a deal_document row.          */
/*  Body: { id: number, document_type_id?: number | null, file_name?: string } */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization context" }, { status: 401 });
    }
    const canAccessRoute = await checkRouteAccess(DEAL_DOCUMENTS_ROUTE_RESOURCE, "update").catch(
      () => false
    );
    if (!canAccessRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: dealId } = await params;
    const body = await request.json().catch(() => ({}));
    const { id: docId, document_type_id, file_name, document_status_id, document_status_code } = body;

    if (!docId) {
      return NextResponse.json(
        { error: "Document id is required" },
        { status: 400 }
      );
    }

    // Build update payload -- only include fields that were provided
    const updatePayload: Record<string, unknown> = {};

    if (document_type_id !== undefined) {
      updatePayload.document_type_id = document_type_id ?? null;
    }

    if (file_name !== undefined) {
      const trimmed = typeof file_name === "string" ? file_name.trim() : "";
      if (!trimmed) {
        return NextResponse.json(
          { error: "file_name cannot be empty" },
          { status: 400 }
        );
      }
      updatePayload.file_name = trimmed;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // If document_type_id changed, resolve the new category
    let documentCategoryId: number | null = null;
    if (document_type_id) {
      const { data: docType } = await supabaseAdmin
        .from("document_types")
        .select("document_category_id")
        .eq("id", document_type_id)
        .single();
      documentCategoryId = docType?.document_category_id ?? null;
    }

    const { data, error } = await supabaseAdmin
      .from("deal_documents")
      .update(updatePayload)
      .eq("id", docId)
      .eq("deal_id", dealId)
      .select("*, document_file_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync linked document_files row if needed
    if (data?.document_file_id) {
      const docFilesUpdate: Record<string, unknown> = {};

      // Sync category if type changed
      if (documentCategoryId !== null) {
        docFilesUpdate.document_category_id = documentCategoryId;
      }

      // Sync file name
      if (updatePayload.file_name) {
        docFilesUpdate.document_name = updatePayload.file_name;
      }

      if (Object.keys(docFilesUpdate).length > 0) {
        await supabaseAdmin
          .from("document_files")
          .update(docFilesUpdate)
          .eq("id", data.document_file_id);
      }

      // Upsert org-scoped status assignment if status was provided.
      let nextStatusId: number | null = typeof document_status_id === "number" ? document_status_id : null;
      if (!nextStatusId && typeof document_status_code === "string" && document_status_code.trim()) {
        const statusTable = await resolveStatusTableName();
        const { data: statusRow, error: statusLookupError } = await supabaseAdmin
          .from(statusTable)
          .select("id")
          .eq("code", document_status_code.trim())
          .or(`organization_id.eq.${orgUuid},organization_id.is.null`)
          .order("organization_id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (statusLookupError) {
          return NextResponse.json({ error: statusLookupError.message }, { status: 500 });
        }
        if (!statusRow?.id) {
          return NextResponse.json({ error: "Invalid document status code" }, { status: 400 });
        }
        nextStatusId = statusRow.id;
      }

      if (nextStatusId) {
        const currentUserPk = await resolveCurrentUserPk(userId);
        const { error: statusUpsertError } = await supabaseAdmin
          .from("document_file_statuses")
          .upsert(
            {
              document_file_id: data.document_file_id,
              organization_id: orgUuid,
              document_status_id: nextStatusId,
              updated_by: currentUserPk,
            },
            { onConflict: "document_file_id,organization_id" }
          );
        if (statusUpsertError) {
          return NextResponse.json({ error: statusUpsertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error("[PATCH /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/deals/[id]/deal-documents                                      */
/*  Deletes a deal_document + its linked document_files row + storage file.    */
/*  Body: { id: number }                                                       */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const canAccessRoute = await checkRouteAccess(DEAL_DOCUMENTS_ROUTE_RESOURCE, "delete").catch(
      () => false
    );
    if (!canAccessRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: dealId } = await params;
    const body = await request.json().catch(() => ({}));
    const docId = body.id;

    if (!docId) {
      return NextResponse.json(
        { error: "Document id is required" },
        { status: 400 }
      );
    }

    // Load the deal_document to get document_file_id
    const { data: dealDoc, error: fetchError } = await supabaseAdmin
      .from("deal_documents")
      .select("id, document_file_id, storage_path")
      .eq("id", docId)
      .eq("deal_id", dealId)
      .single();

    if (fetchError || !dealDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check for restore action
    if (body.action === "restore") {
      const { error: restoreErr } = await supabaseAdmin
        .from("deal_documents")
        .update({ archived_at: null, archived_by: null })
        .eq("id", docId)
        .eq("deal_id", dealId);
      if (restoreErr) return NextResponse.json({ error: restoreErr.message }, { status: 500 });
      // Also restore linked document_files if it was archived at the same time
      if (dealDoc.document_file_id) {
        await supabaseAdmin
          .from("document_files")
          .update({ archived_at: null, archived_by: null })
          .eq("id", dealDoc.document_file_id);
      }
      return NextResponse.json({ ok: true });
    }

    // Archive instead of delete — storage files are preserved for recovery
    const now = new Date().toISOString();

    // Archive linked document_files row if present
    if (dealDoc.document_file_id) {
      await supabaseAdmin
        .from("document_files")
        .update({ archived_at: now, archived_by: userId })
        .eq("id", dealDoc.document_file_id);
    }

    // Archive the deal_documents row
    const { error: archiveError } = await supabaseAdmin
      .from("deal_documents")
      .update({ archived_at: now, archived_by: userId })
      .eq("id", docId)
      .eq("deal_id", dealId);

    if (archiveError) {
      return NextResponse.json(
        { error: archiveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
