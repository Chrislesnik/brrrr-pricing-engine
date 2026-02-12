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
  document_type_id: number;
  value_type?: string;
  value_visible?: boolean;
  value_required?: boolean;
}

interface RulePayload {
  type: "AND" | "OR";
  conditions: ConditionPayload[];
  actions: ActionPayload[];
}

/* -------------------------------------------------------------------------- */
/*  GET /api/document-logic                                                    */
/*  Optionally filter by ?document_type_id=... (finds rules that have an      */
/*  action targeting that document type)                                        */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentTypeId = request.nextUrl.searchParams.get("document_type_id");

    // 1. Get all logic rules (optionally filtered via actions)
    let ruleIds: number[] | null = null;

    if (documentTypeId) {
      const { data: actionRows } = await supabaseAdmin
        .from("document_logic_actions")
        .select("document_logic_id")
        .eq("document_type_id", Number(documentTypeId));

      if (!actionRows || actionRows.length === 0) {
        return NextResponse.json({ rules: [] });
      }
      ruleIds = [
        ...new Set(actionRows.map((r) => r.document_logic_id as number)),
      ];
    }

    let rulesQuery = supabaseAdmin
      .from("document_logic")
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
      .from("document_logic_conditions")
      .select("id, document_logic_id, field, operator, value, value_type, value_field, value_expression")
      .in("document_logic_id", allRuleIds);

    // 3. Fetch actions for these rules
    const { data: actionRows } = await supabaseAdmin
      .from("document_logic_actions")
      .select(
        "id, document_logic_id, document_type_id, value_type, value_visible, value_required"
      )
      .in("document_logic_id", allRuleIds);

    // 4. Assemble
    const rules = ruleRows.map((rule) => ({
      id: rule.id,
      type: rule.type || "AND",
      conditions: (condRows ?? [])
        .filter((c) => c.document_logic_id === rule.id)
        .map((c) => ({
          field: c.field ?? "",
          operator: c.operator ?? "",
          value: c.value ?? "",
          value_type: c.value_type ?? "value",
          value_field: c.value_field ?? undefined,
          value_expression: c.value_expression ?? undefined,
        })),
      actions: (actionRows ?? [])
        .filter((a) => a.document_logic_id === rule.id)
        .map((a) => ({
          document_type_id: a.document_type_id ?? 0,
          value_type: a.value_type ?? "visible",
          value_visible: a.value_visible ?? undefined,
          value_required: a.value_required ?? undefined,
        })),
    }));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("[GET /api/document-logic]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/document-logic                                                   */
/*  Body: { rules: RulePayload[], document_type_id?: number }                  */
/*  Replaces all rules in scope: deletes existing, then inserts new.           */
/*  If document_type_id is provided, only rules targeting that doc type are    */
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
    const documentTypeId: number | undefined = body.document_type_id;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: "rules must be an array" },
        { status: 400 }
      );
    }

    // ---- Step 1: Delete existing rules in scope ----
    // CASCADE foreign keys will auto-delete conditions and actions.

    if (documentTypeId) {
      // Find all rule IDs that have actions targeting this document type
      const { data: existingActions } = await supabaseAdmin
        .from("document_logic_actions")
        .select("document_logic_id")
        .eq("document_type_id", documentTypeId);

      if (existingActions && existingActions.length > 0) {
        const existingRuleIds = [
          ...new Set(existingActions.map((a) => a.document_logic_id as number)),
        ];
        const { error: delErr } = await supabaseAdmin
          .from("document_logic")
          .delete()
          .in("id", existingRuleIds);

        if (delErr) {
          console.error("[POST /api/document-logic] delete error:", delErr);
        }
      }
    } else {
      // No filter — delete ALL document logic rules
      const { error: delErr } = await supabaseAdmin
        .from("document_logic")
        .delete()
        .neq("id", 0); // match all rows

      if (delErr) {
        console.error("[POST /api/document-logic] delete-all error:", delErr);
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
        .from("document_logic")
        .insert({ type: rule.type || "AND" })
        .select("id")
        .single();

      if (ruleErr || !ruleRow) {
        console.error("[POST /api/document-logic] rule insert error:", ruleErr);
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
              document_logic_id: ruleId,
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
            .from("document_logic_conditions")
            .insert(condRows);

          if (condErr) {
            console.error(
              "[POST /api/document-logic] conditions insert error:",
              condErr
            );
          }
        }
      }

      // Insert actions
      if (rule.actions && rule.actions.length > 0) {
        const actionRows = rule.actions
          .filter((a) => a.document_type_id)
          .map((a) => {
            const vt = a.value_type || "visible";
            return {
              document_logic_id: ruleId,
              document_type_id: a.document_type_id || null,
              value_type: vt,
              value_visible:
                vt === "visible"
                  ? true
                  : vt === "not_visible"
                    ? false
                    : null,
              value_required:
                vt === "required"
                  ? true
                  : vt === "not_required"
                    ? false
                    : null,
            };
          });

        if (actionRows.length > 0) {
          const { error: actionErr } = await supabaseAdmin
            .from("document_logic_actions")
            .insert(actionRows);

          if (actionErr) {
            console.error(
              "[POST /api/document-logic] actions insert error:",
              actionErr
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true, ruleIds: createdRuleIds });
  } catch (error) {
    console.error("[POST /api/document-logic]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
