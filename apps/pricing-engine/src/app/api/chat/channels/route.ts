export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { ensureDealChatRoom } from "@/lib/liveblocks";

/**
 * GET /api/chat/channels
 *
 * Returns deals the current user has access to, formatted as chat channels.
 * Each channel includes: id, display_name, room_id
 *
 * Lazily creates deal_chat rooms for deals that don't have one yet.
 */
export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ channels: [] }, { status: 200 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ channels: [] }, { status: 200 });
    }

    // Parse query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const search = url.searchParams.get("search") ?? "";

    // Fetch deals from the organization
    let query = supabaseAdmin
      .from("deals")
      .select("id, name, deal_number, created_at")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,deal_number.ilike.%${search}%`
      );
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error("[GET /api/chat/channels] DB error:", error.message);
      return NextResponse.json(
        { channels: [], error: error.message },
        { status: 200 }
      );
    }

    const dealList = deals ?? [];

    // Lazy creation: ensure deal_chat rooms exist for all deals
    // ensureDealChatRoom uses getOrCreateRoom (idempotent — no-op if exists)
    await Promise.all(
      dealList.map((deal) =>
        ensureDealChatRoom({
          dealId: deal.id as string,
          organizationId: orgId!,
          creatorUserId: userId,
        }).catch(() => {})
      )
    );

    const channels = dealList.map((deal) => ({
      id: deal.id,
      display_name:
        deal.name || deal.deal_number || `Deal ${(deal.id as string).slice(0, 8)}`,
      room_id: `deal_chat:${deal.id}`,
      unread_count: 0, // Placeholder — computed client-side via Liveblocks
    }));

    return NextResponse.json({ channels });
  } catch (e) {
    console.error("[GET /api/chat/channels] Error:", e);
    return NextResponse.json({ channels: [] }, { status: 200 });
  }
}
