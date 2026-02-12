import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { deleteDocument, getDocument } from "@/lib/documenso"

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

    if (!userId || !clerkOrgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Fetch the signature request
    const { data: request, error } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: "Signature request not found" }, { status: 404 })
    }

    // Verify the request belongs to the user's organization
    if (request.organization_id !== orgUuid) {
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
 * DELETE /api/signature-requests/[id]
 * Cancel/delete a signature request
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()

    if (!userId || !clerkOrgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Fetch the signature request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !request) {
      return NextResponse.json({ error: "Signature request not found" }, { status: 404 })
    }

    // Verify the request belongs to the user's organization
    if (request.organization_id !== orgUuid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Only allow deleting pending requests
    if (request.status !== "pending") {
      return NextResponse.json(
        { error: "Cannot delete a signature request that is not pending" },
        { status: 400 }
      )
    }

    // Try to delete from Documenso
    try {
      await deleteDocument(request.documenso_document_id)
    } catch (docError) {
      console.warn("Failed to delete from Documenso:", docError)
      // Continue with local deletion even if Documenso fails
    }

    // Update status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from("deal_signature_requests")
      .update({ status: "cancelled" })
      .eq("id", id)

    if (updateError) {
      console.error("Error cancelling signature request:", updateError)
      return NextResponse.json(
        { error: "Failed to cancel signature request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting signature request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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

    if (!userId || !clerkOrgId) {
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

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Verify the deal belongs to the user's organization
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id")
      .eq("id", dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    if (deal.organization_id !== orgUuid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

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
        organization_id: orgUuid,
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

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error finalizing signature request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
