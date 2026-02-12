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

    if (!userId || !clerkOrgId) {
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

    // Create a presign token from Documenso
    const presignData = await createPresignToken()

    return NextResponse.json({
      token: presignData.token,
      expiresAt: presignData.expiresAt,
      dealId,
      organizationId: orgUuid,
      userId,
    })
  } catch (error) {
    console.error("Error creating presign token:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
