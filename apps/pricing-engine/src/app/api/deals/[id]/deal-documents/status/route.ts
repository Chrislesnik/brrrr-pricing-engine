import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params;

    // Only internal org members can change document statuses
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    }

    const { data: orgRow } = await supabaseAdmin
      .from("organizations")
      .select("is_internal_yn")
      .eq("id", orgUuid)
      .single();

    if (!orgRow || orgRow.is_internal_yn !== true) {
      return NextResponse.json(
        { error: "Only internal organization members can change document statuses" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { document_file_id, document_status_id } = body;

    if (!document_file_id || document_status_id === undefined) {
      return NextResponse.json(
        { error: "document_file_id and document_status_id are required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("document_files")
      .update({ document_status_id })
      .eq("id", document_file_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, document_status_id });
  } catch (error) {
    console.error("[PATCH /api/deals/[id]/deal-documents/status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
