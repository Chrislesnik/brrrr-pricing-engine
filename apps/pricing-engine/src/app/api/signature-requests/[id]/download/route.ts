import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { downloadDocument } from "@/lib/documenso"

export async function GET(
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

    const version = request.status === "signed" ? "signed" : "original"
    const docResponse = await downloadDocument(
      request.documenso_document_id,
      version,
    )

    const bytes = new Uint8Array(await docResponse.arrayBuffer())
    console.log(
      `[download] docId=${request.documenso_document_id} version=${version} ` +
      `contentType=${docResponse.headers.get("content-type")} size=${bytes.byteLength}`,
    )

    const safeName = (request.document_name || "document")
      .replace(/[^a-zA-Z0-9_\-. ]/g, "")
      .trim()

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("Download error:", err)
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 },
    )
  }
}
