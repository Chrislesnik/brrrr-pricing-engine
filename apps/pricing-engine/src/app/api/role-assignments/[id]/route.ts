import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { syncDealRoomPermissions } from "@/lib/liveblocks";

export const runtime = "nodejs";

/**
 * DELETE /api/role-assignments/[id]
 * Remove a role assignment by its ID.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Fetch the assignment to check permissions
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from("role_assignments")
      .select("id, resource_type, resource_id, role_type_id, user_id")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Check if caller is external
    const { data: callerOrg } = await supabaseAdmin
      .from("organizations")
      .select("id, is_internal_yn")
      .eq("id", orgUuid)
      .single();

    const isExternal = callerOrg && !callerOrg.is_internal_yn;

    // External users can only remove Broker role assignments (id=4)
    if (isExternal && assignment.role_type_id !== 4) {
      return NextResponse.json(
        { error: "External users can only remove Broker role assignments" },
        { status: 403 }
      );
    }

    // Delete the assignment
    const { error: deleteError } = await supabaseAdmin
      .from("role_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("[DELETE /api/role-assignments]", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Sync deal_users and legacy columns
    const resourceType = assignment.resource_type as string;
    const resourceId = assignment.resource_id as string;
    const removedUserId = assignment.user_id as string;

    if (resourceType === "deal" || resourceType === "loan") {
      // Check if user still has other role assignments on this resource
      const { data: remaining } = await supabaseAdmin
        .from("role_assignments")
        .select("id")
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .eq("user_id", removedUserId)
        .limit(1);

      // If no other assignments, remove from deal_users and revoke room access
      if (!remaining || remaining.length === 0) {
        try {
          await supabaseAdmin
            .from("deal_users")
            .delete()
            .eq("deal_id", resourceId)
            .eq("user_id", removedUserId);
        } catch {
          // best-effort
        }

        // Revoke Liveblocks deal room permissions
        if (resourceType === "deal") {
          syncDealRoomPermissions({
            clerkUserId: removedUserId,
            dealId: resourceId,
            orgUuid,
            assigned: false,
          }).catch((err) =>
            console.error("[role-assignments] Liveblocks revoke error:", err)
          );
        }

        // Update legacy assigned_to column (deals only; loans column removed)
        try {
          if (resourceType === "deal") {
            const { data: deal } = await supabaseAdmin
              .from("deals")
              .select("assigned_to_user_id")
              .eq("id", resourceId)
              .single();
            const current = Array.isArray(deal?.assigned_to_user_id)
              ? (deal.assigned_to_user_id as string[])
              : [];
            await supabaseAdmin
              .from("deals")
              .update({
                assigned_to_user_id: current.filter((uid) => uid !== removedUserId),
              })
              .eq("id", resourceId);
          }
        } catch {
          // Legacy sync is best-effort
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/role-assignments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
