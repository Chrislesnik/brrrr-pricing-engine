export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { ensureDealChatRoom } from "@/lib/liveblocks";

// ─── Types ───────────────────────────────────────────────────────────
interface ChannelMetadata {
  stage: { code: string; name: string; color: string | null } | null;
  loan_officer: { user_id: string; name: string } | null;
  broker: { user_id: string; name: string } | null;
  primary_user: { user_id: string; name: string } | null;
  archived: boolean;
  created_at: string;
}

interface EnrichedChannel {
  id: string;
  display_name: string;
  room_id: string;
  unread_count: number;
  metadata: ChannelMetadata;
}

interface BasicChannel {
  id: string;
  display_name: string;
  room_id: string;
  unread_count: number;
}

/**
 * GET /api/chat/channels
 *
 * Returns deals the current user has access to, formatted as chat channels.
 * Each channel includes: id, display_name, room_id
 *
 * When `?include_metadata=true`, enriches each channel with grouping metadata:
 * stage, loan_officer, broker, primary_user, archived status, created_at.
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
    const includeMetadata = url.searchParams.get("include_metadata") === "true";

    if (!includeMetadata) {
      // ─── Basic channels (no metadata) ────────────────────────
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

      // Lazy room creation (idempotent)
      await Promise.all(
        dealList.map((deal) =>
          ensureDealChatRoom({
            dealId: deal.id,
            organizationId: orgId!,
            creatorUserId: userId,
          }).catch(() => {})
        )
      );

      const channels: BasicChannel[] = dealList.map((deal) => ({
        id: deal.id,
        display_name:
          deal.name || deal.deal_number || `Deal ${deal.id.slice(0, 8)}`,
        room_id: `deal_chat:${deal.id}`,
        unread_count: 0,
      }));

      return NextResponse.json({ channels });
    }

    // ─── Enriched channels with metadata ─────────────────────────
    let metaQuery = supabaseAdmin
      .from("deals")
      .select("id, name, deal_number, created_at, primary_user_id, archived_at")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      metaQuery = metaQuery.or(
        `name.ilike.%${search}%,deal_number.ilike.%${search}%`
      );
    }

    const { data: deals, error } = await metaQuery;

    if (error) {
      console.error("[GET /api/chat/channels] DB error:", error.message);
      return NextResponse.json(
        { channels: [], error: error.message },
        { status: 200 }
      );
    }

    const dealList = deals ?? [];

    // Lazy room creation (idempotent)
    await Promise.all(
      dealList.map((deal) =>
        ensureDealChatRoom({
          dealId: deal.id,
          organizationId: orgId!,
          creatorUserId: userId,
        }).catch(() => {})
      )
    );

    const dealIds = dealList.map((d) => d.id);

    // Parallel metadata queries
    const [roleAssignments, dealRoleTypes, dealSteppers, dealStages, orgMembers] =
      await Promise.all([
        // 1. Role assignments for these deals
        dealIds.length > 0
          ? supabaseAdmin
              .from("role_assignments")
              .select("resource_id, role_type_id, user_id")
              .eq("resource_type", "deal")
              .in("resource_id", dealIds)
              .then((r) => r.data ?? [])
          : Promise.resolve([] as { resource_id: unknown; role_type_id: unknown; user_id: unknown }[]),

        // 2. Deal role types (loan_officer, broker codes)
        supabaseAdmin
          .from("deal_role_types")
          .select("id, code, name")
          .eq("is_active", true)
          .then((r) => r.data ?? []),

        // 3. Deal steppers (current stage per deal)
        dealIds.length > 0
          ? supabaseAdmin
              .from("deal_stepper")
              .select("deal_id, current_step")
              .in("deal_id", dealIds)
              .then((r) => r.data ?? [])
          : Promise.resolve([] as { deal_id: unknown; current_step: unknown }[]),

        // 4. Deal stages (name, color)
        supabaseAdmin
          .from("deal_stages")
          .select("id, code, name, color")
          .eq("is_active", true)
          .then((r) => r.data ?? []),

        // 5. Organization members (names for all user_ids)
        supabaseAdmin
          .from("organization_members")
          .select("user_id, first_name, last_name")
          .eq("organization_id", orgUuid)
          .then((r) => r.data ?? []),
      ]);

    // Build lookup maps
    const roleTypeMap = new Map(
      dealRoleTypes.map((rt) => [String(rt.id), rt])
    );
    const stageMap = new Map(
      dealStages.map((s) => [String(s.code), s])
    );
    const stepperMap = new Map(
      dealSteppers.map((ds) => [String(ds.deal_id), String(ds.current_step)])
    );
    const memberNameMap = new Map(
      orgMembers.map((m) => [
        String(m.user_id),
        `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown",
      ])
    );

    // Group role assignments by deal + role code
    const dealRoleMap = new Map<
      string,
      { loan_officer: { user_id: string; name: string } | null; broker: { user_id: string; name: string } | null }
    >();
    for (const assignment of roleAssignments) {
      const dealId = String(assignment.resource_id);
      const roleType = roleTypeMap.get(String(assignment.role_type_id));
      if (!roleType) continue;

      if (!dealRoleMap.has(dealId)) {
        dealRoleMap.set(dealId, { loan_officer: null, broker: null });
      }
      const entry = dealRoleMap.get(dealId)!;
      const uid = String(assignment.user_id);
      const name = memberNameMap.get(uid) ?? "Unknown";

      if (roleType.code === "loan_officer" && !entry.loan_officer) {
        entry.loan_officer = { user_id: uid, name };
      } else if (roleType.code === "broker" && !entry.broker) {
        entry.broker = { user_id: uid, name };
      }
    }

    // Build enriched channels
    const channels: EnrichedChannel[] = dealList.map((deal) => {
      const currentStep = stepperMap.get(deal.id);
      const stage = currentStep ? stageMap.get(currentStep) : null;
      const roles = dealRoleMap.get(deal.id);
      const primaryUserId = deal.primary_user_id;

      const metadata: ChannelMetadata = {
        stage: stage
          ? {
              code: String(stage.code),
              name: String(stage.name),
              color: stage.color ? String(stage.color) : null,
            }
          : null,
        loan_officer: roles?.loan_officer ?? null,
        broker: roles?.broker ?? null,
        primary_user: primaryUserId
          ? {
              user_id: primaryUserId,
              name: memberNameMap.get(primaryUserId) ?? "Unknown",
            }
          : null,
        archived: !!deal.archived_at,
        created_at: deal.created_at ?? "",
      };

      return {
        id: deal.id,
        display_name:
          deal.name || deal.deal_number || `Deal ${deal.id.slice(0, 8)}`,
        room_id: `deal_chat:${deal.id}`,
        unread_count: 0,
        metadata,
      };
    });

    return NextResponse.json({ channels });
  } catch (e) {
    console.error("[GET /api/chat/channels] Error:", e);
    return NextResponse.json({ channels: [] }, { status: 200 });
  }
}
