import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

/**
 * GET /api/activity/term-sheet/download?path=...
 * Returns a signed URL to download a term sheet PDF from storage.
 * Verifies the user has access to the organization that owns the term sheet.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const storagePath = searchParams.get("path")

    if (!storagePath) {
      return NextResponse.json({ error: "Missing path parameter" }, { status: 400 })
    }

    // Storage path format: {orgUuid}/{loanId}/{scenarioId}/{timestamp}_{type}.pdf
    // Verify the path starts with the user's organization UUID for access control
    const pathOrgUuid = storagePath.split("/")[0]
    if (pathOrgUuid !== orgUuid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create a signed URL (5 minute expiry)
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("term-sheets")
      .createSignedUrl(storagePath, 60 * 5)

    if (signErr || !signed?.signedUrl) {
      console.error("Signed URL error:", signErr)
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
    }

    return NextResponse.json({ url: signed.signedUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    console.error("Term sheet download error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
