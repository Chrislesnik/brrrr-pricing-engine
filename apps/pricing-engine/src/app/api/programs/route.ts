import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("[API /programs] Request received");
  
  try {
    let userId: string, orgId: string;
    try {
      ({ userId, orgId } = await authForApiRoute("programs", "read"));
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (e as Error).message }, { status });
    }

    // Get orgId from query params or auth
    const { searchParams } = new URL(req.url);
    const queryOrgId = searchParams.get("orgId");
    const effectiveOrgId = queryOrgId || orgId;
    console.log("[API /programs] Using orgId:", effectiveOrgId);

    if (!effectiveOrgId) {
      console.log("[API /programs] No orgId, returning 400");
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    // Get organization UUID
    console.log("[API /programs] Resolving org UUID...");
    const orgUuid = await getOrgUuidFromClerkId(effectiveOrgId);
    console.log("[API /programs] Org UUID:", orgUuid);
    
    if (!orgUuid) {
      console.log("[API /programs] Org not found, returning empty array");
      // Return empty programs array instead of error - org might not be synced yet
      return NextResponse.json({ programs: [] });
    }

    // Fetch programs for the organization
    console.log("[API /programs] Fetching programs from database...");
    const { data, error } = await supabaseAdmin
      .from("programs")
      .select(
        "id, loan_type, internal_name, external_name, webhook_url, status"
      )
      .eq("organization_id", orgUuid)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[API /programs] Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API /programs] Success, returning", data?.length || 0, "programs");
    return NextResponse.json({ programs: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[API /programs] Exception caught:", { msg, stack });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
