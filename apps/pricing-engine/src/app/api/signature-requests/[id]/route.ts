import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { deleteDocument, getDocument, sendDocument } from "@/lib/documenso"

/** Check if the current user can access a deal */
async function canAccessDeal(
  dealId: string,
  userId: string,
  clerkOrgId: string | null | undefined
): Promise<boolean> {
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("organization_id, assigned_to_user_id, primary_user_id")
    .eq("id", dealId)
    .single()

  if (!deal) return false

  const orgUuid = clerkOrgId ? await getOrgUuidFromClerkId(clerkOrgId) : null
  const hasOrgAccess = orgUuid && deal.organization_id === orgUuid

  const assignedUsers = Array.isArray(deal.assigned_to_user_id)
    ? deal.assigned_to_user_id
    : []
  const isAssigned = assignedUsers.includes(userId)
  const isPrimaryUser = deal.primary_user_id === userId

  let isInternal = false
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, is_internal_yn")
    .eq("clerk_user_id", userId)
    .maybeSingle()
  if (userRow) {
    isInternal = Boolean(userRow.is_internal_yn)
  }

  return Boolean(hasOrgAccess || isAssigned || isPrimaryUser || isInternal)
}

/**
 * GET /api/signature-requests/[id]
 * Get a specific signature request
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Fetch the signature request
    const { data: request, error } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: "Signature request not found" }, { status: 404 })
    }

    // Verify user can access the parent deal
    const hasAccess = await canAccessDeal(request.deal_id, userId, clerkOrgId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Optionally sync status from Documenso
    try {
      const documensoDoc = await getDocument(request.documenso_document_id)
      
      // Update local status if it differs from Documenso
      if (documensoDoc.status !== request.status) {
        const statusMap: Record<string, string> = {
          COMPLETED: "signed",
          PENDING: "pending",
          DECLINED: "declined",
          EXPIRED: "expired",
        }
        
        const newStatus = statusMap[documensoDoc.status] || request.status
        
        if (newStatus !== request.status) {
          await supabaseAdmin
            .from("deal_signature_requests")
            .update({ 
              status: newStatus,
              recipients: documensoDoc.recipients.map(r => ({
                email: r.email,
                name: r.name,
                status: r.signingStatus.toLowerCase(),
              }))
            })
            .eq("id", id)
          
          request.status = newStatus
          request.recipients = documensoDoc.recipients.map(r => ({
            email: r.email,
            name: r.name,
            status: r.signingStatus.toLowerCase(),
          }))
        }
      }
    } catch (docError) {
      // If Documenso API fails, just return the local data
      console.warn("Failed to sync with Documenso:", docError)
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error fetching signature request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/signature-requests/[id]?action=cancel|cancel-delete|delete
 *
 * cancel        – Cancel in Documenso, set local status to "cancelled"
 * cancel-delete – Cancel in Documenso + remove the Supabase row
 * delete        – Remove the Supabase row (only if already cancelled/signed/declined/expired)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const action = req.nextUrl.searchParams.get("action") || "cancel"

    const { data: request, error: fetchError } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !request) {
      return NextResponse.json({ error: "Signature request not found" }, { status: 404 })
    }

    const hasAccess = await canAccessDeal(request.deal_id, userId, clerkOrgId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const needsDocumensoCancel = action === "cancel" || action === "cancel-delete"
    const needsRowDelete = action === "cancel-delete" || action === "delete"

    if (needsDocumensoCancel && request.status === "pending") {
      try {
        await deleteDocument(request.documenso_document_id)
      } catch (docError) {
        console.warn("Failed to cancel in Documenso:", docError)
      }
    }

    if (needsRowDelete) {
      if (needsDocumensoCancel || ["cancelled", "signed", "declined", "expired"].includes(request.status)) {
        const { error: delError } = await supabaseAdmin
          .from("deal_signature_requests")
          .delete()
          .eq("id", id)

        if (delError) {
          console.error("Error deleting signature request row:", delError)
          return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
        }
      } else {
        return NextResponse.json(
          { error: "Cannot delete a request that is still active. Cancel it first." },
          { status: 400 },
        )
      }
    } else {
      const { error: updateError } = await supabaseAdmin
        .from("deal_signature_requests")
        .update({ status: "cancelled" })
        .eq("id", id)

      if (updateError) {
        console.error("Error cancelling signature request:", updateError)
        return NextResponse.json({ error: "Failed to cancel" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE signature request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/signature-requests/[id]
 * Finalize a signature request after embedded authoring is complete
 * Body: { documentId: string, documentName: string, recipients: Array<{email, name}> }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // The ID here is actually the dealId for finalization
    const { id: dealId } = await params
    const body = await req.json()
    const { documentId, documentName, recipients } = body

    if (!documentId || !documentName) {
      return NextResponse.json(
        { error: "documentId and documentName are required" },
        { status: 400 }
      )
    }

    // Verify deal access via org, assignment, or internal
    const hasAccess = await canAccessDeal(dealId, userId, clerkOrgId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Resolve org UUID for the record (fall back to deal's org)
    const orgUuid = clerkOrgId ? await getOrgUuidFromClerkId(clerkOrgId) : null
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("organization_id")
      .eq("id", dealId)
      .single()

    // Create the signature request record
    const { data: request, error: insertError } = await supabaseAdmin
      .from("deal_signature_requests")
      .insert({
        deal_id: dealId,
        documenso_document_id: documentId,
        document_name: documentName,
        status: "pending",
        recipients: recipients || [],
        created_by_user_id: userId,
        organization_id: orgUuid ?? deal?.organization_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating signature request:", insertError)
      return NextResponse.json(
        { error: "Failed to create signature request" },
        { status: 500 }
      )
    }

    // The Documenso embed already sends the document as part of its
    // createEmbeddingDocument flow. We attempt sendDocument as a fallback
    // in case the embed didn't send it, but ignore errors (e.g. if the
    // document is already in PENDING state).
    try {
      await sendDocument(documentId)
      console.log(`Document ${documentId} sent to recipients`)
    } catch {
      console.log(`Document ${documentId} likely already sent by embed`)
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error finalizing signature request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
