import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/**
 * GET /api/signature-requests
 * Fetch signature requests for a deal
 * Query params: dealId (required)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dealId = searchParams.get("dealId")

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId query parameter is required" },
        { status: 400 }
      )
    }

    // Verify user can access this deal (org, assignment, or internal)
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single()

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

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

    // Fetch signature requests for the deal (no org filter — access already checked)
    const { data: requests, error } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching signature requests:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch signature requests" },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error("Signature requests API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
