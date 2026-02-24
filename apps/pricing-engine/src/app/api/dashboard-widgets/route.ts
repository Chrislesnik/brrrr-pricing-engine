import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getOrgUuidFromClerkId,
  getUserRoleInOrg,
  isPrivilegedRole,
} from "@/lib/orgs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("dashboard_widgets")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widgets: data });
}

export async function PATCH(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  const { data: orgRow } = await supabaseAdmin
    .from("organizations")
    .select("is_internal_yn")
    .eq("id", orgUuid)
    .single();

  const role = await getUserRoleInOrg(orgUuid, userId);
  if (!orgRow?.is_internal_yn || !isPrivilegedRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { slot, ...updates } = body;

  if (!slot || typeof slot !== "string") {
    return NextResponse.json(
      { error: "slot is required" },
      { status: 400 }
    );
  }

  const allowedFields = [
    "title",
    "subtitle",
    "trend_label",
    "trend_description",
    "value_format",
    "value_prefix",
    "value_suffix",
    "chart_type",
    "x_axis_key",
    "y_axis_key",
    "sql_query",
  ];

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: userId };
  for (const key of allowedFields) {
    if (key in updates) {
      patch[key] = updates[key];
    }
  }

  const { data, error } = await supabaseAdmin
    .from("dashboard_widgets")
    .update(patch)
    .eq("slot", slot)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widget: data });
}
