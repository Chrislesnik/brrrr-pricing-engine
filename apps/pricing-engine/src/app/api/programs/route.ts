import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get orgId from query params or auth
    const { searchParams } = new URL(req.url);
    const queryOrgId = searchParams.get("orgId");
    const orgId = queryOrgId || authOrgId;

    if (!orgId) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select(
        "id, loan_type, internal_name, external_name, webhook_url, status"
      )
      .eq("organization_id", orgUuid)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ programs: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
