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
  input_id?: string;
  category_id?: number;
  target_type?: "input" | "category";
  value_type?: string;
  value_text?: string;
  value_visible?: boolean;
  value_required?: boolean;
  value_field?: string;
  value_expression?: string;
}

interface RulePayload {
  type: "AND" | "OR";
  conditions: ConditionPayload[];
  actions: ActionPayload[];
}

/* -------------------------------------------------------------------------- */
/*  GET /api/input-logic                                                       */
/*  Optionally filter by ?input_id=... (finds rules that have an action       */
/*  targeting that input)                                                       */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inputId = request.nextUrl.searchParams.get("input_id");

    // 1. Get all logic rules (optionally filtered via actions)
    let ruleIds: number[] | null = null;

    if (inputId) {
      const { data: actionRows } = await supabaseAdmin
        .from("input_logic_actions")
        .select("input_logic_id")
        .eq("input_id", inputId);

      if (!actionRows || actionRows.length === 0) {
        return NextResponse.json({ rules: [] });
      }
      ruleIds = [
        ...new Set(actionRows.map((r) => r.input_logic_id as number)),
      ];
    }

    let rulesQuery = supabaseAdmin
      .from("input_logic")
      .select("id, type, created_at")
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
      .from("input_logic_conditions")
      .select("id, input_logic_id, field, operator, value, value_type, value_field, value_expression")
      .in("input_logic_id", allRuleIds);

    // 3. Fetch actions for these rules (all value columns)
    const { data: actionRows } = await supabaseAdmin
      .from("input_logic_actions")
      .select(
        "id, input_logic_id, input_id, category_id, value_type, value_visible, value_required, value_text, value_field, value_expression"
      )
      .in("input_logic_id", allRuleIds);

    // 4. Assemble
    const rules = ruleRows.map((rule) => ({
      id: rule.id,
      type: rule.type || "AND",
      conditions: (condRows ?? [])
        .filter((c) => c.input_logic_id === rule.id)
        .map((c) => ({
          field: c.field != null ? String(c.field) : "",
          operator: c.operator ?? "",
          value: c.value ?? "",
          value_type: c.value_type ?? "value",
          value_field: c.value_field != null ? String(c.value_field) : undefined,
          value_expression: c.value_expression ?? undefined,
        })),
      actions: (actionRows ?? [])
        .filter((a) => a.input_logic_id === rule.id)
        .map((a) => ({
          input_id: a.input_id != null ? String(a.input_id) : "",
          category_id: a.category_id ?? undefined,
          target_type: a.category_id ? "category" as const : "input" as const,
          value_type: a.value_type ?? "value",
          value_text: a.value_text ?? "",
          value_visible: a.value_visible ?? undefined,
          value_required: a.value_required ?? undefined,
          value_field: a.value_field != null ? String(a.value_field) : undefined,
          value_expression: a.value_expression ?? undefined,
        })),
    }));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("[GET /api/input-logic]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/input-logic                                                      */
/*  Body: { rules: RulePayload[] }                                             */
/*  Saves rules + conditions + actions.                                        */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rules: RulePayload[] = body.rules;

    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { error: "No rules provided" },
        { status: 400 }
      );
    }

    const createdRuleIds: number[] = [];

    for (const rule of rules) {
      // Insert the rule
      const { data: ruleRow, error: ruleErr } = await supabaseAdmin
        .from("input_logic")
        .insert({ type: rule.type || "AND" })
        .select("id")
        .single();

      if (ruleErr || !ruleRow) {
        console.error("[POST /api/input-logic] rule insert error:", ruleErr);
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
              input_logic_id: ruleId,
              field: c.field || null,
              operator: c.operator || null,
              value_type: vt,
              value: vt === "value" ? (c.value || null) : null,
              value_field: vt === "field" ? (c.value_field || null) : null,
              value_expression: vt === "expression" ? (c.value_expression || null) : null,
            };
          });

        if (condRows.length > 0) {
          const { error: condErr } = await supabaseAdmin
            .from("input_logic_conditions")
            .insert(condRows);

          if (condErr) {
            console.error(
              "[POST /api/input-logic] conditions insert error:",
              condErr
            );
          }
        }
      }

      // Insert actions
      if (rule.actions && rule.actions.length > 0) {
        const actionRows = rule.actions
          .filter((a) => a.input_id || a.category_id)
          .map((a) => {
            const vt = a.value_type || "value";
            const isCategory = a.target_type === "category" || (!a.input_id && a.category_id);
            return {
              input_logic_id: ruleId,
              input_id: isCategory ? null : (a.input_id || null),
              category_id: isCategory ? (a.category_id || null) : null,
              value_type: vt,
              value_visible:
                vt === "visible"
                  ? true
                  : vt === "not_visible"
                    ? false
                    : null,
              value_required:
                isCategory ? null :
                (vt === "required"
                  ? true
                  : vt === "not_required"
                    ? false
                    : null),
              value_text: isCategory ? null : (vt === "value" ? (a.value_text || null) : null),
              value_field: isCategory ? null : (vt === "field" ? (a.value_field || null) : null),
              value_expression: isCategory ? null :
                (vt === "expression" ? (a.value_expression || null) : null),
            };
          });

        if (actionRows.length > 0) {
          const { error: actionErr } = await supabaseAdmin
            .from("input_logic_actions")
            .insert(actionRows);

          if (actionErr) {
            console.error(
              "[POST /api/input-logic] actions insert error:",
              actionErr
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true, ruleIds: createdRuleIds });
  } catch (error) {
    console.error("[POST /api/input-logic]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
