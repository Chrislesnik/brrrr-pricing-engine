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

    if (!userId || !clerkOrgId) {
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

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Fetch signature requests for the deal
    const { data: requests, error } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("deal_id", dealId)
      .eq("organization_id", orgUuid)
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
