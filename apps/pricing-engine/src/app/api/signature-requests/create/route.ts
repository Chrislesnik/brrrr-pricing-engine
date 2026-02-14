import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { createPresignToken } from "@/lib/documenso"

/**
 * POST /api/signature-requests/create
 * Creates a presign token for Documenso embedded authoring
 * Body: { dealId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { dealId } = body

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 }
      )
    }

    // Fetch the deal with fields needed for access check
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Check access: org membership, assignment, primary user, or internal admin
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

    if (!hasOrgAccess && !isAssigned && !isPrimaryUser && !isInternal) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Create a presign token from Documenso
    const presignData = await createPresignToken()

    return NextResponse.json({
      token: presignData.token,
      expiresAt: presignData.expiresAt,
      dealId,
      organizationId: orgUuid ?? deal.organization_id,
      userId,
    })
  } catch (error) {
    console.error("Error creating presign token:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
