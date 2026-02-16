import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers";

/* -------------------------------------------------------------------------- */
/*  GET /api/task-templates                                                    */
/*  List all task templates, ordered by display_order.                         */
/* -------------------------------------------------------------------------- */

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("task_templates")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[GET /api/task-templates]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    console.error("[GET /api/task-templates]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/task-templates                                                   */
/*  Create a new task template.                                                */
/*  Body: { deal_stage_id?, name, description?, code? }                        */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { deal_stage_id, name, description, default_status_id, default_priority_id, due_offset_days } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Auto-generate code from name
    const code = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    // Get next display_order for this stage (or unassigned)
    let query = supabaseAdmin
      .from("task_templates")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    if (deal_stage_id) {
      query = query.eq("deal_stage_id", deal_stage_id);
    } else {
      query = query.is("deal_stage_id", null);
    }

    const { data: maxRow } = await query.maybeSingle();
    const nextOrder = (maxRow?.display_order ?? -1) + 1;

    const { data, error } = await supabaseAdmin
      .from("task_templates")
      .insert({
        deal_stage_id: deal_stage_id || null,
        name: name.trim(),
        description: description?.trim() || null,
        code,
        default_status_id: default_status_id || null,
        default_priority_id: default_priority_id || null,
        due_offset_days: due_offset_days ?? null,
        display_order: nextOrder,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/task-templates]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/task-templates]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/task-templates                                                  */
/*  Single update (name/description) OR batch reorder.                         */
/*  Body: { id, name?, description? }                                          */
/*    OR: { reorder: [{ id, deal_stage_id, display_order }] }                  */
/* -------------------------------------------------------------------------- */

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Single template update
    if (body.id && !Array.isArray(body.reorder)) {
      const {
        id, name, description, default_status_id, default_priority_id,
        due_offset_days, is_active, button_enabled, button_action_id,
        button_label, assigned_role_ids,
      } = body;
      const updatePayload: Record<string, unknown> = {};

      if (name !== undefined) updatePayload.name = String(name).trim();
      if (description !== undefined)
        updatePayload.description = description?.trim() || null;
      if (default_status_id !== undefined)
        updatePayload.default_status_id = default_status_id;
      if (default_priority_id !== undefined)
        updatePayload.default_priority_id = default_priority_id;
      if (due_offset_days !== undefined)
        updatePayload.due_offset_days = due_offset_days;
      if (is_active !== undefined)
        updatePayload.is_active = is_active;
      if (button_enabled !== undefined)
        updatePayload.button_enabled = button_enabled;
      if (button_action_id !== undefined)
        updatePayload.button_action_id = button_action_id;
      if (button_label !== undefined)
        updatePayload.button_label = button_label?.trim() || null;

      // Update the template columns if any changed
      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabaseAdmin
          .from("task_templates")
          .update(updatePayload)
          .eq("id", id);

        if (error) {
          console.error("[PATCH /api/task-templates]", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      // Sync role assignments if provided
      if (Array.isArray(assigned_role_ids)) {
        // Delete all existing roles for this template
        await supabaseAdmin
          .from("task_template_roles")
          .delete()
          .eq("task_template_id", id);

        // Insert new roles
        if (assigned_role_ids.length > 0) {
          const rows = assigned_role_ids.map((roleId: number) => ({
            task_template_id: id,
            deal_role_type_id: roleId,
          }));
          const { error: insertErr } = await supabaseAdmin
            .from("task_template_roles")
            .insert(rows);
          if (insertErr) {
            console.error("[PATCH /api/task-templates] role insert error:", insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    // Batch reorder (drag-and-drop)
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as {
        id: number;
        deal_stage_id: number | null;
        display_order: number;
      }[];

      for (const item of updates) {
        await supabaseAdmin
          .from("task_templates")
          .update({
            deal_stage_id: item.deal_stage_id,
            display_order: item.display_order,
          })
          .eq("id", item.id);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[PATCH /api/task-templates]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/task-templates                                                 */
/*  Delete a task template by id.                                              */
/*  Body: { id: number }                                                       */
/* -------------------------------------------------------------------------- */

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: "Task template id is required" },
        { status: 400 }
      );
    }

    const body2 = await request.clone().json().catch(() => ({}));
    if (body2.action === "restore") {
      const { error } = await restoreRecord("task_templates", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const { error } = await archiveRecord("task_templates", id, userId);

    if (error) {
      console.error("[DELETE /api/task-templates]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/task-templates]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
