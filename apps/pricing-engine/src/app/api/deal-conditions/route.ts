import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

/* -------------------------------------------------------------------------- */
/*  GET /api/deal-conditions                                                   */
/*  Returns deal-level conditions for the org AND all document-type AI         */
/*  conditions (for the read-only aggregated view).                            */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 });
    }

    // Deal-level conditions
    const { data: dealConditions, error: dcErr } = await supabaseAdmin
      .from("deal_conditions")
      .select("*")
      .eq("organization_id", orgUuid)
      .order("display_order", { ascending: true });

    if (dcErr) {
      return NextResponse.json({ error: dcErr.message }, { status: 500 });
    }

    // Document-type AI conditions (aggregated across all doc types)
    const { data: docTypeConditions, error: dtcErr } = await supabaseAdmin
      .from("document_type_ai_condition")
      .select(
        `
        id,
        document_type,
        condition_label,
        ai_prompt,
        created_at,
        document_types:document_type ( id, document_name )
      `
      )
      .order("document_type", { ascending: true })
      .order("created_at", { ascending: true });

    if (dtcErr) {
      return NextResponse.json({ error: dtcErr.message }, { status: 500 });
    }

    return NextResponse.json({
      deal_conditions: dealConditions ?? [],
      document_type_conditions: (docTypeConditions ?? []).map((row: any) => ({
        id: row.id,
        document_type_id: row.document_type,
        document_type_name: (row.document_types as any)?.document_name ?? "Unknown",
        condition_label: row.condition_label,
        ai_prompt: row.ai_prompt,
        created_at: row.created_at,
      })),
    });
  } catch (e) {
    console.error("[GET /api/deal-conditions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deal-conditions                                                  */
/*  Create a new deal-level condition.                                         */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { label, description, evaluation_type, ai_prompt, rule_config } = body;

    if (!label?.trim()) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    const evalType = evaluation_type === "rule" ? "rule" : "ai_prompt";

    if (evalType === "ai_prompt" && !ai_prompt?.trim()) {
      return NextResponse.json({ error: "ai_prompt is required for AI conditions" }, { status: 400 });
    }

    // Get the next display_order
    const { data: maxRow } = await supabaseAdmin
      .from("deal_conditions")
      .select("display_order")
      .eq("organization_id", orgUuid)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxRow?.display_order ?? -1) + 1;

    const { data, error } = await supabaseAdmin
      .from("deal_conditions")
      .insert({
        organization_id: orgUuid,
        label: label.trim(),
        description: description?.trim() || null,
        evaluation_type: evalType,
        ai_prompt: evalType === "ai_prompt" ? ai_prompt?.trim() : null,
        rule_config: evalType === "rule" ? (rule_config ?? null) : null,
        display_order: nextOrder,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[POST /api/deal-conditions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/deal-conditions                                                 */
/*  Update an existing deal-level condition.                                   */
/* -------------------------------------------------------------------------- */

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const allowed: Record<string, unknown> = {};
    if (fields.label !== undefined) allowed.label = fields.label;
    if (fields.description !== undefined) allowed.description = fields.description;
    if (fields.evaluation_type !== undefined) allowed.evaluation_type = fields.evaluation_type;
    if (fields.ai_prompt !== undefined) allowed.ai_prompt = fields.ai_prompt;
    if (fields.rule_config !== undefined) allowed.rule_config = fields.rule_config;
    if (fields.is_active !== undefined) allowed.is_active = fields.is_active;
    if (fields.display_order !== undefined) allowed.display_order = fields.display_order;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("deal_conditions")
      .update(allowed)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[PATCH /api/deal-conditions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/deal-conditions                                                */
/*  Delete a deal-level condition.                                             */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("deal_conditions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/deal-conditions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
