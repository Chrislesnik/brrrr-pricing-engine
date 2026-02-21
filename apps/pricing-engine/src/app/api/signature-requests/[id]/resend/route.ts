import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { resendDocument } from "@/lib/documenso"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: request, error } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*, deals:deal_id(organization_id, assigned_to_user_id, primary_user_id)")
      .eq("id", id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { error: "Can only send reminders for pending requests" },
        { status: 400 },
      )
    }

    const deal = (request as any).deals
    const orgUuid = clerkOrgId ? await getOrgUuidFromClerkId(clerkOrgId) : null
    const hasOrgAccess = orgUuid && deal?.organization_id === orgUuid
    const assignedUsers = Array.isArray(deal?.assigned_to_user_id)
      ? deal.assigned_to_user_id
      : []
    const isAssigned = assignedUsers.includes(userId)
    const isPrimary = deal?.primary_user_id === userId

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("is_internal_yn")
      .eq("clerk_user_id", userId)
      .maybeSingle()
    const isInternal = Boolean(userRow?.is_internal_yn)

    if (!hasOrgAccess && !isAssigned && !isPrimary && !isInternal) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const result = await resendDocument(request.documenso_document_id)

    if (result.sent) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({
      success: true,
      fallback: true,
      signingUrls: result.signingUrls,
    })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 },
    )
  }
}
