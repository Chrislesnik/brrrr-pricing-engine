export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import {
  syncDealRoomPermissions,
  syncDealChatRoomPermissions,
} from "@/lib/liveblocks";

/**
 * GET /api/chat/channels/[dealId]/members
 *
 * Returns all users assigned to a deal (channel), including their role.
 * Uses the `role_assignments` table with `resource_type = 'deal'`.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId } = await params;
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Fetch role assignments for this deal
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from("role_assignments")
      .select("id, role_type_id, user_id, created_at")
      .eq("resource_type", "deal")
      .eq("resource_id", dealId)
      .order("created_at", { ascending: true });

    if (assignError) {
      console.error("[GET /api/chat/channels/members] DB error:", assignError.message);
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Fetch role names
    const roleTypeIds = [...new Set(assignments.map((a) => a.role_type_id))];
    const { data: roles } = await supabaseAdmin
      .from("deal_role_types")
      .select("id, name, code")
      .in("id", roleTypeIds);
    const roleMap = new Map((roles ?? []).map((r) => [r.id, r]));

    // Fetch member names
    const userIds = [...new Set(assignments.map((a) => a.user_id as string))];
    const { data: members } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, first_name, last_name")
      .eq("organization_id", orgUuid)
      .in("user_id", userIds);
    const memberMap = new Map(
      (members ?? []).map((m) => [
        m.user_id as string,
        {
          first_name: (m.first_name as string | null) ?? null,
          last_name: (m.last_name as string | null) ?? null,
        },
      ])
    );

    const enriched = assignments.map((a) => {
      const role = roleMap.get(a.role_type_id);
      const member = memberMap.get(a.user_id as string);
      return {
        user_id: a.user_id,
        role_name: (role?.name as string) ?? "Unknown",
        role_code: (role?.code as string) ?? "unknown",
        first_name: member?.first_name ?? null,
        last_name: member?.last_name ?? null,
      };
    });

    return NextResponse.json({ members: enriched });
  } catch (e) {
    console.error("[GET /api/chat/channels/members] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/chat/channels/[dealId]/members
 *
 * Assigns a user to a deal channel (bidirectional sync):
 * 1. Creates role_assignment (resource_type='deal')
 * 2. Upserts into deal_users
 * 3. Syncs Liveblocks room permissions for both deal and deal_chat rooms
 *
 * Body: { user_id: string, role_type_id: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId } = await params;
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { user_id: targetUserId, role_type_id } = body as {
      user_id?: string;
      role_type_id?: number;
    };

    if (!targetUserId || !role_type_id) {
      return NextResponse.json(
        { error: "user_id and role_type_id are required" },
        { status: 400 }
      );
    }

    // Verify the deal exists and belongs to this org
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if ((deal.organization_id as string) !== orgUuid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 1. Insert role assignment
    const { error: insertError } = await supabaseAdmin
      .from("role_assignments")
      .insert({
        resource_type: "deal",
        resource_id: dealId,
        role_type_id,
        user_id: targetUserId,
        organization_id: orgUuid,
        created_by: userId,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This role assignment already exists" },
          { status: 409 }
        );
      }
      console.error("[POST /api/chat/channels/members] Insert error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. Upsert into deal_users
    await supabaseAdmin
      .from("deal_users")
      .upsert(
        { deal_id: dealId, user_id: targetUserId },
        { onConflict: "deal_id,user_id" }
      );

    // 3. Sync assigned_to_user_id array on deals table
    const { data: allDealUsers } = await supabaseAdmin
      .from("deal_users")
      .select("user_id")
      .eq("deal_id", dealId);

    if (allDealUsers) {
      const userIdArray = allDealUsers.map((du) => du.user_id as string);
      await supabaseAdmin
        .from("deals")
        .update({ assigned_to_user_id: userIdArray })
        .eq("id", dealId);
    }

    // 4. Sync Liveblocks permissions for both deal and deal_chat rooms
    await Promise.all([
      syncDealRoomPermissions({
        clerkUserId: targetUserId,
        dealId,
        orgUuid,
        assigned: true,
      }).catch((err) =>
        console.error("[POST /api/chat/channels/members] Deal room sync error:", err)
      ),
      syncDealChatRoomPermissions({
        clerkUserId: targetUserId,
        dealId,
        orgUuid,
        assigned: true,
      }).catch((err) =>
        console.error("[POST /api/chat/channels/members] Chat room sync error:", err)
      ),
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/chat/channels/members] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
