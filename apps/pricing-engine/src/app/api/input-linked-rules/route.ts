import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ConditionPayload {
  field: string;
  operator: string;
  value: string;
  value_type?: "value" | "field" | "expression";
  value_field?: string;
  value_expression?: string;
}

interface LinkedRulePayload {
  rule_order: number;
  logic_type: "AND" | "OR";
  conditions: ConditionPayload[];
  linked_table: string;
  linked_column: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inputId = request.nextUrl.searchParams.get("input_id");
    if (!inputId) {
      return NextResponse.json(
        { error: "input_id is required" },
        { status: 400 }
      );
    }

    const { data: rules, error } = await supabaseAdmin
      .from("input_linked_rules")
      .select("id, input_id, rule_order, conditions, logic_type, linked_table, linked_column")
      .eq("input_id", inputId)
      .order("rule_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rules: rules ?? [] });
  } catch (error) {
    console.error("[GET /api/input-linked-rules]", error);
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
    const inputId = body.input_id as number | undefined;
    const rules = body.rules as LinkedRulePayload[] | undefined;

    if (!inputId) {
      return NextResponse.json(
        { error: "input_id is required" },
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
      .from("input_linked_rules")
      .delete()
      .eq("input_id", inputId);

    if (deleteErr) {
      console.error("[PUT /api/input-linked-rules] delete error:", deleteErr);
      return NextResponse.json(
        { error: deleteErr.message },
        { status: 500 }
      );
    }

    if (rules.length === 0) {
      return NextResponse.json({ ok: true, rules: [] });
    }

    const rows = rules.map((r, idx) => ({
      input_id: inputId,
      rule_order: r.rule_order ?? idx,
      logic_type: r.logic_type || "AND",
      conditions: r.conditions ?? [],
      linked_table: r.linked_table,
      linked_column: r.linked_column ?? "",
    }));

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("input_linked_rules")
      .insert(rows)
      .select("id, input_id, rule_order, conditions, logic_type, linked_table, linked_column");

    if (insertErr) {
      console.error("[PUT /api/input-linked-rules] insert error:", insertErr);
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, rules: inserted ?? [] });
  } catch (error) {
    console.error("[PUT /api/input-linked-rules]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
