import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ConditionPayload {
  field: string;
  operator: string;
  value: string;
  value_type?: string;
  value_field?: string;
  value_expression?: string;
}

interface RulePayload {
  logic_type: "AND" | "OR";
  conditions: ConditionPayload[];
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const peTermSheetId = request.nextUrl.searchParams.get("pe_term_sheet_id");
    if (!peTermSheetId) {
      return NextResponse.json({ error: "pe_term_sheet_id is required" }, { status: 400 });
    }

    const { data: rules, error: rulesErr } = await supabaseAdmin
      .from("pe_term_sheet_rules")
      .select("id, logic_type")
      .eq("pe_term_sheet_id", peTermSheetId)
      .order("created_at", { ascending: true });

    if (rulesErr) {
      return NextResponse.json({ error: rulesErr.message }, { status: 500 });
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({ rules: [] });
    }

    const ruleIds = rules.map((r) => r.id);

    const { data: conditions, error: condErr } = await supabaseAdmin
      .from("pe_term_sheet_conditions")
      .select("id, pe_term_sheet_rule_id, field, operator, value_type, value, value_field, value_expression")
      .in("pe_term_sheet_rule_id", ruleIds)
      .order("created_at", { ascending: true });

    if (condErr) {
      return NextResponse.json({ error: condErr.message }, { status: 500 });
    }

    const condByRule = new Map<number, typeof conditions>();
    for (const c of conditions ?? []) {
      const ruleId = c.pe_term_sheet_rule_id;
      if (!condByRule.has(ruleId)) condByRule.set(ruleId, []);
      condByRule.get(ruleId)!.push(c);
    }

    const result = rules.map((rule) => ({
      id: rule.id,
      logic_type: rule.logic_type,
      conditions: (condByRule.get(rule.id) ?? []).map((c) => ({
        field: c.field != null ? String(c.field) : "",
        operator: c.operator ?? "",
        value: c.value ?? "",
        value_type: c.value_type ?? "value",
        value_field: c.value_field != null ? String(c.value_field) : undefined,
        value_expression: c.value_expression ?? undefined,
      })),
    }));

    return NextResponse.json({ rules: result });
  } catch (error) {
    console.error("[GET /api/pe-term-sheet-conditions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pe_term_sheet_id, rules } = body as {
      pe_term_sheet_id: string;
      rules: RulePayload[];
    };

    if (!pe_term_sheet_id) {
      return NextResponse.json({ error: "pe_term_sheet_id is required" }, { status: 400 });
    }

    // Delete existing rules (cascades to conditions)
    const { error: delErr } = await supabaseAdmin
      .from("pe_term_sheet_rules")
      .delete()
      .eq("pe_term_sheet_id", pe_term_sheet_id);

    if (delErr) {
      console.error("[POST /api/pe-term-sheet-conditions] delete error:", delErr);
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({ ok: true });
    }

    for (const rule of rules) {
      const { data: ruleRow, error: ruleErr } = await supabaseAdmin
        .from("pe_term_sheet_rules")
        .insert({
          pe_term_sheet_id,
          logic_type: rule.logic_type || "AND",
        })
        .select("id")
        .single();

      if (ruleErr || !ruleRow) {
        console.error("[POST /api/pe-term-sheet-conditions] rule insert error:", ruleErr);
        return NextResponse.json({ error: ruleErr?.message ?? "Failed to insert rule" }, { status: 500 });
      }

      const condRows = (rule.conditions ?? [])
        .filter((c) => c.field || c.operator || c.value)
        .map((c) => {
          const vt = c.value_type || "value";
          return {
            pe_term_sheet_rule_id: ruleRow.id,
            field: c.field ? Number(c.field) : null,
            operator: c.operator || "equals",
            value_type: vt,
            value: vt === "value" ? (c.value || null) : null,
            value_field: vt === "field" && c.value_field ? Number(c.value_field) : null,
            value_expression: vt === "expression" ? (c.value_expression || null) : null,
          };
        });

      if (condRows.length > 0) {
        const { error: condErr } = await supabaseAdmin
          .from("pe_term_sheet_conditions")
          .insert(condRows);

        if (condErr) {
          console.error("[POST /api/pe-term-sheet-conditions] condition insert error:", condErr);
          return NextResponse.json({ error: condErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/pe-term-sheet-conditions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
