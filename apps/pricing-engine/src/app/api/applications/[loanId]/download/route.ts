import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { downloadDocument } from "@/lib/documenso"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ loanId: string }> },
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!clerkOrgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const { loanId } = await params

    const { data: app, error } = await supabaseAdmin
      .from("applications")
      .select("loan_id, organization_id, documenso_document_id, display_id")
      .eq("loan_id", loanId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (error || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (!app.documenso_document_id) {
      return NextResponse.json({ error: "No document available for download" }, { status: 404 })
    }

    const docResponse = await downloadDocument(
      app.documenso_document_id,
      "signed",
    )

    const bytes = new Uint8Array(await docResponse.arrayBuffer())

    const safeName = (app.display_id || `application-${loanId.slice(0, 8)}`)
      .replace(/[^a-zA-Z0-9_\-. ]/g, "")
      .trim()

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${safeName}-signed.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("Application download error:", err)
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 },
    )
  }
}
