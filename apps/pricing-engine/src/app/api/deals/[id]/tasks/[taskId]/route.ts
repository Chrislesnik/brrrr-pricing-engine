import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { restoreRecord } from "@/lib/archive-helpers";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function checkDealAccess(
  deal: { organization_id: string; assigned_to_user_id: unknown; primary_user_id: string | null },
  userId: string,
  orgId: string | null | undefined
): Promise<boolean> {
  const userOrgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null;
  const hasOrgAccess = userOrgUuid && deal.organization_id === userOrgUuid;

  const assignedUsers = Array.isArray(deal.assigned_to_user_id)
    ? deal.assigned_to_user_id
    : [];
  const isAssigned = assignedUsers.includes(userId);
  const isPrimaryUser = deal.primary_user_id === userId;

  let isInternal = false;
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, is_internal_yn")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (userRow) {
    isInternal = Boolean(userRow.is_internal_yn);
  }

  return Boolean(hasOrgAccess || isAssigned || isPrimaryUser || isInternal);
}

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/tasks/[taskId]                                         */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, taskId } = await params;

    // Verify deal access
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const hasAccess = await checkDealAccess(deal, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch the specific task
    const { data: task, error } = await supabaseAdmin
      .from("deal_tasks")
      .select(`
        id,
        uuid,
        deal_id,
        organization_id,
        task_template_id,
        title,
        description,
        task_status_id,
        task_priority_id,
        assigned_to_user_ids,
        due_date_at,
        started_at,
        completed_at,
        display_order,
        created_by,
        created_at,
        updated_at,
        task_statuses (id, code, name, color),
        task_priorities (id, code, name, color)
      `)
      .eq("deal_id", dealId)
      .eq("uuid", taskId)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Unexpected error in GET /api/deals/[id]/tasks/[taskId]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/deals/[id]/tasks/[taskId]                                       */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, taskId } = await params;

    // Verify deal access
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const hasAccess = await checkDealAccess(deal, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();

    // Build update payload — only include fields that were sent
    const updatePayload: Record<string, unknown> = {};
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.task_status_id !== undefined) updatePayload.task_status_id = body.task_status_id;
    if (body.task_priority_id !== undefined) updatePayload.task_priority_id = body.task_priority_id;
    if (body.assigned_to_user_ids !== undefined) updatePayload.assigned_to_user_ids = body.assigned_to_user_ids;
    if (body.due_date_at !== undefined) updatePayload.due_date_at = body.due_date_at;
    if (body.started_at !== undefined) updatePayload.started_at = body.started_at;
    if (body.completed_at !== undefined) updatePayload.completed_at = body.completed_at;
    if (body.display_order !== undefined) updatePayload.display_order = body.display_order;
    if (body.deal_stage_id !== undefined) updatePayload.deal_stage_id = body.deal_stage_id;

    // Auto-set completed_at when status changes to "done" (id=5)
    if (body.task_status_id === 5 && body.completed_at === undefined) {
      updatePayload.completed_at = new Date().toISOString();
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: updatedTask, error } = await supabaseAdmin
      .from("deal_tasks")
      .update(updatePayload)
      .eq("deal_id", dealId)
      .eq("uuid", taskId)
      .select(`
        id,
        uuid,
        deal_id,
        organization_id,
        task_template_id,
        title,
        description,
        task_status_id,
        task_priority_id,
        assigned_to_user_ids,
        due_date_at,
        started_at,
        completed_at,
        deal_stage_id,
        display_order,
        created_by,
        created_at,
        updated_at,
        task_statuses (id, code, name, color),
        task_priorities (id, code, name, color),
        deal_stages (id, name, display_order)
      `)
      .single();

    if (error) {
      console.error("Error updating deal task:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync role_assignments when assigned_to_user_ids changes
    if (body.assigned_to_user_ids !== undefined && updatedTask) {
      try {
        const taskUuid = (updatedTask as any).uuid as string;
        const orgId = (updatedTask as any).organization_id as string | null;
        const newUserIds = Array.isArray(body.assigned_to_user_ids) ? (body.assigned_to_user_ids as string[]) : [];

        // Remove old role_assignments for this task
        await supabaseAdmin
          .from("role_assignments")
          .delete()
          .eq("resource_type", "deal_task")
          .eq("resource_id", taskUuid);

        // Insert new role_assignments (using Point of Contact role, id=17)
        if (newUserIds.length > 0) {
          await supabaseAdmin
            .from("role_assignments")
            .upsert(
              newUserIds.map((uid) => ({
                resource_type: "deal_task" as const,
                resource_id: taskUuid,
                role_type_id: 17,
                user_id: uid,
                organization_id: orgId,
                created_by: userId,
              })),
              { onConflict: "resource_type,resource_id,role_type_id,user_id" }
            );
        }
      } catch (syncErr) {
        console.error("Error syncing role_assignments for task:", syncErr);
      }
    }

    return NextResponse.json({ task: updatedTask });
  } catch (err) {
    console.error("Unexpected error in PATCH /api/deals/[id]/tasks/[taskId]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/deals/[id]/tasks/[taskId]                                      */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, taskId } = await params;

    // Verify deal access
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const hasAccess = await checkDealAccess(deal, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check for restore action
    const url = new URL(_request.url);
    if (url.searchParams.get("action") === "restore") {
      // Need to get the deal_task id from uuid first
      const { data: taskRow } = await supabaseAdmin
        .from("deal_tasks")
        .select("id")
        .eq("deal_id", dealId)
        .eq("uuid", taskId)
        .single();
      if (taskRow) {
        const { error } = await restoreRecord("deal_tasks", taskRow.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Archive the task instead of hard deleting
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("deal_tasks")
      .update({ archived_at: now, archived_by: userId })
      .eq("deal_id", dealId)
      .eq("uuid", taskId);

    if (error) {
      console.error("Error archiving deal task:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/deals/[id]/tasks/[taskId]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
