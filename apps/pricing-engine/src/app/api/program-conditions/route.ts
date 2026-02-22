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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programId = request.nextUrl.searchParams.get("program_id");
    if (!programId) {
      return NextResponse.json({ error: "program_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("program_conditions")
      .select("id, program_id, logic_type, field, operator, value_type, value, value_field, value_expression")
      .eq("program_id", programId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const logicType = data && data.length > 0 ? data[0].logic_type : "AND";

    const conditions = (data ?? []).map((c) => ({
      field: c.field != null ? String(c.field) : "",
      operator: c.operator ?? "",
      value: c.value ?? "",
      value_type: c.value_type ?? "value",
      value_field: c.value_field != null ? String(c.value_field) : undefined,
      value_expression: c.value_expression ?? undefined,
    }));

    return NextResponse.json({ logic_type: logicType, conditions });
  } catch (error) {
    console.error("[GET /api/program-conditions]", error);
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
    const { program_id, logic_type, conditions } = body as {
      program_id: string;
      logic_type: "AND" | "OR";
      conditions: ConditionPayload[];
    };

    if (!program_id) {
      return NextResponse.json({ error: "program_id is required" }, { status: 400 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("program_conditions")
      .delete()
      .eq("program_id", program_id);

    if (delErr) {
      console.error("[POST /api/program-conditions] delete error:", delErr);
    }

    if (!conditions || conditions.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const rows = conditions
      .filter((c) => c.field || c.operator || c.value)
      .map((c) => {
        const vt = c.value_type || "value";
        return {
          program_id,
          logic_type: logic_type || "AND",
          field: c.field || null,
          operator: c.operator || null,
          value_type: vt,
          value: vt === "value" ? (c.value || null) : null,
          value_field: vt === "field" ? (c.value_field || null) : null,
          value_expression: vt === "expression" ? (c.value_expression || null) : null,
        };
      });

    if (rows.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from("program_conditions")
        .insert(rows);

      if (insertErr) {
        console.error("[POST /api/program-conditions] insert error:", insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/program-conditions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
