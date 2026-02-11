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
}

interface ActionPayload {
  input_id: string;
  value_text: string;
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
      .select("id, input_logic_id, field, operator, value")
      .in("input_logic_id", allRuleIds);

    // 3. Fetch actions for these rules
    const { data: actionRows } = await supabaseAdmin
      .from("input_logic_actions")
      .select("id, input_logic_id, input_id, value_text")
      .in("input_logic_id", allRuleIds);

    // 4. Assemble
    const rules = ruleRows.map((rule) => ({
      id: rule.id,
      type: rule.type || "AND",
      conditions: (condRows ?? [])
        .filter((c) => c.input_logic_id === rule.id)
        .map((c) => ({
          field: c.field ?? "",
          operator: c.operator ?? "",
          value: c.value ?? "",
        })),
      actions: (actionRows ?? [])
        .filter((a) => a.input_logic_id === rule.id)
        .map((a) => ({
          input_id: a.input_id ?? "",
          value_text: a.value_text ?? "",
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
/*  Saves rules + conditions. Actions are UI-only for now.                     */
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
          .map((c) => ({
            input_logic_id: ruleId,
            field: c.field || null,
            operator: c.operator || null,
            value: c.value || null,
          }));

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

      // Actions are not saved to DB yet — UI-only for now
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
