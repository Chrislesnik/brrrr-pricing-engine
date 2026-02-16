import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

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
/*  GET /api/deals/[id]/tasks                                                  */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Verify deal exists and user has access
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

    // Fetch tasks with status and priority joins
    const { data: tasks, error } = await supabaseAdmin
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
        deal_stage_id,
        task_statuses (id, code, name, color),
        task_priorities (id, code, name, color),
        deal_stages (id, name, display_order),
        task_templates (button_enabled, button_action_id, button_label)
      `)
      .eq("deal_id", dealId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching deal tasks:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: tasks ?? [] });
  } catch (err) {
    console.error("Unexpected error in GET /api/deals/[id]/tasks:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/tasks                                                 */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Verify deal exists and user has access
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

    // Get the next display_order
    const { data: maxOrderRow } = await supabaseAdmin
      .from("deal_tasks")
      .select("display_order")
      .eq("deal_id", dealId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderRow?.display_order ?? -1) + 1;

    const { data: newTask, error } = await supabaseAdmin
      .from("deal_tasks")
      .insert({
        deal_id: dealId,
        organization_id: deal.organization_id,
        title: body.title || "Untitled Task",
        description: body.description || null,
        task_status_id: body.task_status_id || 1, // default: To Do
        task_priority_id: body.task_priority_id || null,
        assigned_to_user_ids: body.assigned_to_user_ids || [],
        due_date_at: body.due_date_at || null,
        deal_stage_id: body.deal_stage_id || null,
        display_order: nextOrder,
        created_by: userId,
      })
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
      console.error("Error creating deal task:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/deals/[id]/tasks:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
