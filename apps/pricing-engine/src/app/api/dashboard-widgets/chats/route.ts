import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getOrgUuidFromClerkId,
  getUserRoleInOrg,
  isPrivilegedRole,
} from "@/lib/orgs";

async function assertInternalAdmin(userId: string, orgId: string) {
  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) throw new Error("Org not found");

  const { data: orgRow } = await supabaseAdmin
    .from("organizations")
    .select("is_internal_yn")
    .eq("id", orgUuid)
    .single();

  const role = await getUserRoleInOrg(orgUuid, userId);
  if (!orgRow?.is_internal_yn || !isPrivilegedRole(role)) {
    throw new Error("Forbidden");
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const widgetId = request.nextUrl.searchParams.get("widget_id");
  if (!widgetId) {
    return NextResponse.json(
      { error: "widget_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("dashboard_widget_chats")
    .select("id, dashboard_widget_id, name, created_at, last_used_at")
    .eq("dashboard_widget_id", widgetId)
    .order("last_used_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chats: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertInternalAdmin(userId, orgId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { widget_id, name } = body;

  if (!widget_id) {
    return NextResponse.json(
      { error: "widget_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("dashboard_widget_chats")
    .insert({
      dashboard_widget_id: widget_id,
      name: typeof name === "string" && name.trim() ? name.trim() : "New chat",
    })
    .select("id, dashboard_widget_id, name, created_at, last_used_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chat: data });
}

export async function DELETE(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertInternalAdmin(userId, orgId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chatId = request.nextUrl.searchParams.get("chat_id");
  if (!chatId) {
    return NextResponse.json(
      { error: "chat_id is required" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("dashboard_widget_chats")
    .delete()
    .eq("id", chatId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
