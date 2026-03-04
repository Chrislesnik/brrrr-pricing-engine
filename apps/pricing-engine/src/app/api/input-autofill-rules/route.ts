import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface AutofillRulePayload {
  source_input_id: number;
  source_linked_rule_id: number | null;
  rule_order: number;
  conditions: unknown[];
  logic_type: "AND" | "OR";
  expression: string;
  locked: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetInputId = request.nextUrl.searchParams.get("target_input_id");
    if (!targetInputId) {
      return NextResponse.json(
        { error: "target_input_id is required" },
        { status: 400 }
      );
    }

    const { data: rules, error } = await supabaseAdmin
      .from("input_autofill_rules")
      .select(
        "id, target_input_id, source_input_id, source_linked_rule_id, rule_order, conditions, logic_type, expression, locked"
      )
      .eq("target_input_id", targetInputId)
      .order("rule_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rules: rules ?? [] });
  } catch (error) {
    console.error("[GET /api/input-autofill-rules]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetInputId = body.target_input_id as number | undefined;
    const rules = body.rules as AutofillRulePayload[] | undefined;

    if (!targetInputId) {
      return NextResponse.json(
        { error: "target_input_id is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: "rules must be an array" },
        { status: 400 }
      );
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("input_autofill_rules")
      .delete()
      .eq("target_input_id", targetInputId);

    if (deleteErr) {
      console.error("[PUT /api/input-autofill-rules] delete error:", deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (rules.length === 0) {
      return NextResponse.json({ ok: true, rules: [] });
    }

    const rows = rules.map((r, idx) => ({
      target_input_id: targetInputId,
      source_input_id: r.source_input_id,
      source_linked_rule_id: r.source_linked_rule_id ?? null,
      rule_order: r.rule_order ?? idx,
      conditions: r.conditions ?? [],
      logic_type: r.logic_type || "AND",
      expression: r.expression ?? "",
      locked: r.locked ?? false,
    }));

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("input_autofill_rules")
      .insert(rows)
      .select(
        "id, target_input_id, source_input_id, source_linked_rule_id, rule_order, conditions, logic_type, expression, locked"
      );

    if (insertErr) {
      console.error("[PUT /api/input-autofill-rules] insert error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, rules: inserted ?? [] });
  } catch (error) {
    console.error("[PUT /api/input-autofill-rules]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
