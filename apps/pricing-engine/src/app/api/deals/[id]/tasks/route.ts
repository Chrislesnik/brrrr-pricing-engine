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

    // Fetch tasks with status, priority, and stage joins
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
        deal_stages (id, code, name, color, display_order),
        task_templates (button_enabled, button_automation_id, button_label)
      `)
      .eq("deal_id", dealId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching deal tasks:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const taskList = tasks ?? [];

    // --- Resolve assignees via task_template_roles -> role_assignments -> org members ---

    // 1. Collect all task_template_ids
    const templateIds = [
      ...new Set(
        taskList
          .map((t: any) => t.task_template_id)
          .filter((id: unknown): id is number => id != null)
      ),
    ];

    // 2. Batch-fetch task_template_roles for those templates
    type TTR = { task_template_id: number; deal_role_type_id: number };
    const templateRolesMap = new Map<number, number[]>(); // template_id -> role_type_ids
    if (templateIds.length > 0) {
      const { data: ttrRows } = await supabaseAdmin
        .from("task_template_roles")
        .select("task_template_id, deal_role_type_id")
        .in("task_template_id", templateIds);

      for (const row of (ttrRows ?? []) as TTR[]) {
        const arr = templateRolesMap.get(row.task_template_id) ?? [];
        arr.push(row.deal_role_type_id);
        templateRolesMap.set(row.task_template_id, arr);
      }
    }

    // 3. Collect all role_type_ids we need to look up
    const allRoleTypeIds = [...new Set(Array.from(templateRolesMap.values()).flat())];

    // 4. Batch-fetch role_assignments for this deal
    type RA = { role_type_id: number; user_id: string };
    const roleUserMap = new Map<number, string[]>(); // role_type_id -> user_ids
    if (allRoleTypeIds.length > 0) {
      const { data: raRows } = await supabaseAdmin
        .from("role_assignments")
        .select("role_type_id, user_id")
        .eq("resource_type", "deal")
        .eq("resource_id", dealId)
        .in("role_type_id", allRoleTypeIds);

      for (const row of (raRows ?? []) as RA[]) {
        const arr = roleUserMap.get(row.role_type_id) ?? [];
        if (!arr.includes(row.user_id)) arr.push(row.user_id);
        roleUserMap.set(row.role_type_id, arr);
      }
    }

    // 5. Also collect user_ids from direct assigned_to_user_ids (fallback)
    const directUserIds: string[] = [];
    for (const t of taskList as any[]) {
      if (Array.isArray(t.assigned_to_user_ids)) {
        for (const uid of t.assigned_to_user_ids) {
          if (uid && !directUserIds.includes(uid)) directUserIds.push(uid);
        }
      }
    }

    // 6. Batch-fetch organization_members for all resolved user_ids
    const allUserIds = [
      ...new Set([
        ...Array.from(roleUserMap.values()).flat(),
        ...directUserIds,
      ]),
    ];

    type MemberInfo = { user_id: string; first_name: string | null; last_name: string | null };
    const memberMap = new Map<string, MemberInfo>();
    if (allUserIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from("organization_members")
        .select("user_id, first_name, last_name")
        .in("user_id", allUserIds);

      for (const m of (members ?? []) as MemberInfo[]) {
        if (!memberMap.has(m.user_id)) {
          memberMap.set(m.user_id, m);
        }
      }
    }

    // 7. Attach assignees to each task
    const enrichedTasks = taskList.map((t: any) => {
      const assigneeUserIds = new Set<string>();

      // Resolve via template roles
      if (t.task_template_id && templateRolesMap.has(t.task_template_id)) {
        const roleIds = templateRolesMap.get(t.task_template_id)!;
        for (const rid of roleIds) {
          const users = roleUserMap.get(rid) ?? [];
          for (const uid of users) assigneeUserIds.add(uid);
        }
      }

      // Fallback: use direct assigned_to_user_ids if no role-based assignees
      if (assigneeUserIds.size === 0 && Array.isArray(t.assigned_to_user_ids)) {
        for (const uid of t.assigned_to_user_ids) {
          if (uid) assigneeUserIds.add(uid);
        }
      }

      const assignees = Array.from(assigneeUserIds).map((uid) => {
        const member = memberMap.get(uid);
        return {
          user_id: uid,
          first_name: member?.first_name ?? null,
          last_name: member?.last_name ?? null,
        };
      });

      return { ...t, assignees };
    });

    return NextResponse.json({ tasks: enrichedTasks });
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
        deal_stages (id, code, name, color, display_order)
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
