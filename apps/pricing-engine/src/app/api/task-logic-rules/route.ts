import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ConditionPayload {
  field: string;
  operator: string;
  value: string;
  value_type?: string;
  value_field?: string;
  value_expression?: string;
}

interface ActionPayload {
  target_task_template_id: number;
  action_type: string;
  value_type?: string;
  value_text?: string;
  value_visible?: boolean;
  value_required?: boolean;
  value_field?: string;
  value_expression?: string;
  required_status_id?: number | null;
  required_for_stage_id?: number | null;
}

interface RulePayload {
  type: "AND" | "OR";
  conditions: ConditionPayload[];
  actions: ActionPayload[];
}

/* -------------------------------------------------------------------------- */
/*  GET /api/task-logic-rules                                                  */
/*  Optionally filter by ?task_template_id=... (finds rules that have an      */
/*  action targeting that task template)                                        */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskTemplateId = request.nextUrl.searchParams.get("task_template_id");

    // 1. Get all logic rules (optionally filtered via actions)
    let ruleIds: number[] | null = null;

    if (taskTemplateId) {
      const { data: actionRows } = await supabaseAdmin
        .from("task_logic_actions")
        .select("task_logic_id")
        .eq("target_task_template_id", Number(taskTemplateId));

      if (!actionRows || actionRows.length === 0) {
        return NextResponse.json({ rules: [] });
      }
      ruleIds = [
        ...new Set(actionRows.map((r) => r.task_logic_id as number)),
      ];
    }

    let rulesQuery = supabaseAdmin
      .from("task_logic")
      .select("id, task_template_id, name, description, type, is_active, execution_order, created_at")
      .order("created_at", { ascending: true });

    if (ruleIds) {
      rulesQuery = rulesQuery.in("id", ruleIds);
    }

    const { data: ruleRows, error: ruleErr } = await rulesQuery;
    if (ruleErr) {
      return NextResponse.json({ error: ruleErr.message }, { status: 500 });
    }
    if (!ruleRows || ruleRows.length === 0) {
      return NextResponse.json({ rules: [] });
    }

    const allRuleIds = ruleRows.map((r) => r.id);

    // 2. Fetch conditions for these rules
    const { data: condRows } = await supabaseAdmin
      .from("task_logic_conditions")
      .select(
        "id, task_logic_id, field, operator, value, value_type, value_field, value_expression"
      )
      .in("task_logic_id", allRuleIds);

    // 3. Fetch actions for these rules
    const { data: actionRows } = await supabaseAdmin
      .from("task_logic_actions")
      .select(
        "id, task_logic_id, action_type, target_task_template_id, value_type, value_text, value_visible, value_required, value_field, value_expression, required_status_id, required_for_stage_id"
      )
      .in("task_logic_id", allRuleIds);

    // 4. Assemble
    const rules = ruleRows.map((rule) => ({
      id: rule.id,
      task_template_id: rule.task_template_id,
      name: rule.name,
      description: rule.description,
      type: rule.type || "AND",
      is_active: rule.is_active,
      execution_order: rule.execution_order,
      conditions: (condRows ?? [])
        .filter((c) => c.task_logic_id === rule.id)
        .map((c) => ({
          field: c.field ?? "",
          operator: c.operator ?? "",
          value: c.value ?? "",
          value_type: c.value_type ?? "value",
          value_field: c.value_field ?? undefined,
          value_expression: c.value_expression ?? undefined,
        })),
      actions: (actionRows ?? [])
        .filter((a) => a.task_logic_id === rule.id)
        .map((a) => ({
          target_task_template_id: a.target_task_template_id ?? 0,
          action_type: a.action_type ?? "visible",
          value_type: a.value_type ?? "value",
          value_text: a.value_text ?? undefined,
          value_visible: a.value_visible ?? undefined,
          value_required: a.value_required ?? undefined,
          value_field: a.value_field ?? undefined,
          value_expression: a.value_expression ?? undefined,
          required_status_id: a.required_status_id ?? undefined,
          required_for_stage_id: a.required_for_stage_id ?? undefined,
        })),
    }));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("[GET /api/task-logic-rules]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/task-logic-rules                                                 */
/*  Body: { rules: RulePayload[], task_template_id?: number }                  */
/*  Replaces all rules in scope: deletes existing, then inserts new.           */
/*  If task_template_id is provided, only rules targeting that template are    */
/*  replaced. Otherwise ALL rules are replaced.                                */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rules: RulePayload[] = body.rules ?? [];
    const taskTemplateId: number | undefined = body.task_template_id;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: "rules must be an array" },
        { status: 400 }
      );
    }

    // ---- Step 1: Delete existing rules in scope ----
    // CASCADE foreign keys will auto-delete conditions and actions.

    if (taskTemplateId) {
      // Find all rule IDs that have actions targeting this task template
      const { data: existingActions } = await supabaseAdmin
        .from("task_logic_actions")
        .select("task_logic_id")
        .eq("target_task_template_id", taskTemplateId);

      if (existingActions && existingActions.length > 0) {
        const existingRuleIds = [
          ...new Set(
            existingActions.map((a) => a.task_logic_id as number)
          ),
        ];
        const { error: delErr } = await supabaseAdmin
          .from("task_logic")
          .delete()
          .in("id", existingRuleIds);

        if (delErr) {
          console.error("[POST /api/task-logic-rules] delete error:", delErr);
        }
      }
    } else {
      // No filter — delete ALL task logic rules
      const { error: delErr } = await supabaseAdmin
        .from("task_logic")
        .delete()
        .neq("id", 0);

      if (delErr) {
        console.error(
          "[POST /api/task-logic-rules] delete-all error:",
          delErr
        );
      }
    }

    // ---- Step 2: Insert new rules ----

    if (rules.length === 0) {
      return NextResponse.json({ ok: true, ruleIds: [] });
    }

    const createdRuleIds: number[] = [];

    for (const rule of rules) {
      // Insert the rule
      const { data: ruleRow, error: ruleErr } = await supabaseAdmin
        .from("task_logic")
        .insert({
          task_template_id: taskTemplateId || null,
          type: rule.type || "AND",
        })
        .select("id")
        .single();

      if (ruleErr || !ruleRow) {
        console.error(
          "[POST /api/task-logic-rules] rule insert error:",
          ruleErr
        );
        continue;
      }

      const ruleId = ruleRow.id;
      createdRuleIds.push(ruleId);

      // Insert conditions
      if (rule.conditions && rule.conditions.length > 0) {
        const condRows = rule.conditions
          .filter((c) => c.field || c.operator || c.value)
          .map((c) => {
            const vt = c.value_type || "value";
            return {
              task_logic_id: ruleId,
              field: c.field || null,
              operator: c.operator || null,
              value_type: vt,
              value: vt === "value" ? c.value || null : null,
              value_field: vt === "field" ? c.value_field || null : null,
              value_expression:
                vt === "expression" ? c.value_expression || null : null,
            };
          });

        if (condRows.length > 0) {
          const { error: condErr } = await supabaseAdmin
            .from("task_logic_conditions")
            .insert(condRows);

          if (condErr) {
            console.error(
              "[POST /api/task-logic-rules] conditions insert error:",
              condErr
            );
          }
        }
      }

      // Insert actions
      if (rule.actions && rule.actions.length > 0) {
        const actionRows = rule.actions
          .filter((a) => a.target_task_template_id)
          .map((a) => {
            const at = a.action_type || "visible";
            return {
              task_logic_id: ruleId,
              target_task_template_id: a.target_task_template_id || null,
              action_type: at,
              value_type: a.value_type || "value",
              value_text: a.value_text || null,
              value_visible:
                at === "visible"
                  ? true
                  : at === "not_visible"
                    ? false
                    : null,
              value_required:
                at === "required"
                  ? true
                  : at === "not_required"
                    ? false
                    : null,
              value_field: a.value_field || null,
              value_expression: a.value_expression || null,
              required_status_id: at === "required" ? (a.required_status_id || null) : null,
              required_for_stage_id: at === "required" ? (a.required_for_stage_id || null) : null,
            };
          });

        if (actionRows.length > 0) {
          const { error: actionErr } = await supabaseAdmin
            .from("task_logic_actions")
            .insert(actionRows);

          if (actionErr) {
            console.error(
              "[POST /api/task-logic-rules] actions insert error:",
              actionErr
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true, ruleIds: createdRuleIds });
  } catch (error) {
    console.error("[POST /api/task-logic-rules]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
