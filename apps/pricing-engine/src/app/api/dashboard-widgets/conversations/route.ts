import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getOrgUuidFromClerkId,
  getUserRoleInOrg,
  isPrivilegedRole,
} from "@/lib/orgs";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = request.nextUrl.searchParams.get("chat_id");
  if (!chatId) {
    return NextResponse.json(
      { error: "chat_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("dashboard_widget_conversations")
    .select("id, role, content, created_at")
    .eq("dashboard_widget_chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

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
  const { widget_id, chat_id, messages } = body;

  if (!widget_id || !chat_id || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "widget_id, chat_id, and messages array are required" },
      { status: 400 }
    );
  }

  const rows = messages.map((m: { role: string; content: string }) => ({
    dashboard_widget_id: widget_id,
    dashboard_widget_chat_id: chat_id,
    role: m.role,
    content: m.content,
  }));

  const { data, error } = await supabaseAdmin
    .from("dashboard_widget_conversations")
    .insert(rows)
    .select("id, role, content, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Touch last_used_at on the parent chat
  await supabaseAdmin
    .from("dashboard_widget_chats")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", chat_id);

  return NextResponse.json({ messages: data });
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
    .from("dashboard_widget_conversations")
    .delete()
    .eq("dashboard_widget_chat_id", chatId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
