import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { notifyDealAssignment } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * GET /api/role-assignments?resource_type=deal&resource_id=xxx
 * Returns all role assignments for a resource, joined with role name and member name.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("resource_type");
    const resourceId = searchParams.get("resource_id");

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resource_type and resource_id are required" },
        { status: 400 }
      );
    }

    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null;

    // Fetch role assignments for the resource
    const { data: assignments, error } = await supabaseAdmin
      .from("role_assignments")
      .select("id, resource_type, resource_id, role_type_id, user_id, organization_id, created_at, created_by")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/role-assignments]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // Fetch role names
    const roleTypeIds = [...new Set(assignments.map((a) => a.role_type_id))];
    const { data: roles } = await supabaseAdmin
      .from("deal_role_types")
      .select("id, name, code")
      .in("id", roleTypeIds);
    const roleMap = new Map((roles ?? []).map((r) => [r.id, r]));

    // Fetch member names
    const userIds = [...new Set(assignments.map((a) => a.user_id))];
    let memberMap = new Map<string, { first_name: string | null; last_name: string | null }>();

    if (orgUuid && userIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from("organization_members")
        .select("user_id, first_name, last_name")
        .eq("organization_id", orgUuid)
        .in("user_id", userIds);

      for (const m of members ?? []) {
        memberMap.set(m.user_id as string, {
          first_name: (m.first_name as string | null) ?? null,
          last_name: (m.last_name as string | null) ?? null,
        });
      }

      // For any still missing (cross-org), look up all orgs
      const missing = userIds.filter((uid) => !memberMap.has(uid));
      if (missing.length > 0) {
        const { data: crossOrgMembers } = await supabaseAdmin
          .from("organization_members")
          .select("user_id, first_name, last_name")
          .in("user_id", missing);
        for (const m of crossOrgMembers ?? []) {
          if (!memberMap.has(m.user_id as string)) {
            memberMap.set(m.user_id as string, {
              first_name: (m.first_name as string | null) ?? null,
              last_name: (m.last_name as string | null) ?? null,
            });
          }
        }
      }
    }

    const enriched = assignments.map((a) => {
      const role = roleMap.get(a.role_type_id);
      const member = memberMap.get(a.user_id);
      return {
        id: a.id,
        resource_type: a.resource_type,
        resource_id: a.resource_id,
        role_type_id: a.role_type_id,
        role_name: role?.name ?? "Unknown",
        role_code: role?.code ?? "unknown",
        user_id: a.user_id,
        first_name: member?.first_name ?? null,
        last_name: member?.last_name ?? null,
        created_at: a.created_at,
      };
    });

    return NextResponse.json({ assignments: enriched });
  } catch (err) {
    console.error("[GET /api/role-assignments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/role-assignments
 * Create a new role assignment.
 * Body: { resource_type, resource_id, role_type_id, user_id }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { resource_type, resource_id, role_type_id, user_id: targetUserId } = body as {
      resource_type?: string;
      resource_id?: string;
      role_type_id?: number;
      user_id?: string;
    };

    if (!resource_type || !resource_id || !role_type_id || !targetUserId) {
      return NextResponse.json(
        { error: "resource_type, resource_id, role_type_id, and user_id are required" },
        { status: 400 }
      );
    }

    // Check if caller is external (broker)
    const { data: callerOrg } = await supabaseAdmin
      .from("organizations")
      .select("id, is_internal_yn")
      .eq("id", orgUuid)
      .single();

    const isExternal = callerOrg && !callerOrg.is_internal_yn;

    // External users can only assign Broker role (id=4)
    if (isExternal && role_type_id !== 4) {
      return NextResponse.json(
        { error: "External users can only assign the Broker role" },
        { status: 403 }
      );
    }

    // Insert the assignment
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("role_assignments")
      .insert({
        resource_type,
        resource_id,
        role_type_id,
        user_id: targetUserId,
        organization_id: orgUuid,
        created_by: userId,
      })
      .select("id, resource_type, resource_id, role_type_id, user_id, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This role assignment already exists" },
          { status: 409 }
        );
      }
      console.error("[POST /api/role-assignments]", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Sync organization_account_managers for broker_org assignments
    if (resource_type === "broker_org") {
      try {
        const { data: mem } = await supabaseAdmin
          .from("organization_members")
          .select("id")
          .eq("organization_id", orgUuid)
          .eq("user_id", targetUserId)
          .maybeSingle();
        if (mem?.id) {
          await supabaseAdmin
            .from("organization_account_managers")
            .upsert(
              { organization_id: resource_id, account_manager_id: mem.id },
              { onConflict: "organization_id,account_manager_id" }
            );
        }
      } catch {
        // best-effort sync
      }
    }

    // Sync deal_users if resource is a deal or loan
    if (resource_type === "deal" || resource_type === "loan") {
      try {
        await supabaseAdmin
          .from("deal_users")
          .upsert(
            { deal_id: resource_id, user_id: targetUserId },
            { onConflict: "deal_id,user_id" }
          );
      } catch {
        // deal_users sync should not block the main flow
      }
    }

    // Also keep legacy assigned_to columns in sync for backward compatibility
    try {
      if (resource_type === "loan") {
        const { data: loan } = await supabaseAdmin
          .from("loans")
          .select("assigned_to_user_id")
          .eq("id", resource_id)
          .single();
        const current = Array.isArray(loan?.assigned_to_user_id)
          ? (loan.assigned_to_user_id as string[])
          : [];
        if (!current.includes(targetUserId)) {
          await supabaseAdmin
            .from("loans")
            .update({ assigned_to_user_id: [...current, targetUserId] })
            .eq("id", resource_id);
        }
      } else if (resource_type === "deal") {
        const { data: deal } = await supabaseAdmin
          .from("deals")
          .select("assigned_to_user_id")
          .eq("id", resource_id)
          .single();
        const current = Array.isArray(deal?.assigned_to_user_id)
          ? (deal.assigned_to_user_id as string[])
          : [];
        if (!current.includes(targetUserId)) {
          await supabaseAdmin
            .from("deals")
            .update({ assigned_to_user_id: [...current, targetUserId] })
            .eq("id", resource_id);
        }
      }
    } catch {
      // Legacy sync is best-effort
    }

    // Enrich with role name and member name for response
    const { data: role } = await supabaseAdmin
      .from("deal_role_types")
      .select("name, code")
      .eq("id", role_type_id)
      .single();

    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("first_name, last_name")
      .eq("user_id", targetUserId)
      .limit(1)
      .maybeSingle();

    // Send Liveblocks notification for deal/loan assignments (don't notify yourself)
    if ((resource_type === "deal" || resource_type === "loan") && targetUserId !== userId) {
      try {
        const { data: dealRow } = await supabaseAdmin
          .from("deals")
          .select("deal_name")
          .eq("id", resource_id)
          .maybeSingle();
        const { data: assignerRow } = await supabaseAdmin
          .from("users")
          .select("full_name, first_name, last_name")
          .eq("clerk_user_id", userId)
          .maybeSingle();
        const assignerName =
          assignerRow?.full_name ||
          [assignerRow?.first_name, assignerRow?.last_name].filter(Boolean).join(" ") ||
          "Someone";
        const dealName = dealRow?.deal_name || "a deal";
        await notifyDealAssignment(targetUserId, {
          dealId: resource_id,
          dealName,
          assignerName,
        });
      } catch {
        // Notification is non-critical
      }
    }

    return NextResponse.json(
      {
        assignment: {
          ...inserted,
          role_name: role?.name ?? "Unknown",
          role_code: role?.code ?? "unknown",
          first_name: (member?.first_name as string | null) ?? null,
          last_name: (member?.last_name as string | null) ?? null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/role-assignments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
