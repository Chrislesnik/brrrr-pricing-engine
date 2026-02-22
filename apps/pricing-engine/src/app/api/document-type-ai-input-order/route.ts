import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/document-type-ai-input-order?input_id=<uuid>
 * Fetch all document types linked to an input via document_type_ai_input,
 * joined with the order table and document_types for names.
 * Returns them sorted by display_order ascending.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const inputId = req.nextUrl.searchParams.get("input_id");
    if (!inputId)
      return NextResponse.json(
        { error: "input_id is required" },
        { status: 400 }
      );

    // Fetch document_type_ai_input rows for this input,
    // joined with order and document_types
    const { data: aiInputs, error: aiErr } = await supabaseAdmin
      .from("document_type_ai_input")
      .select(
        "id, document_type_id, input_id, ai_prompt, created_at, document_types(id, document_name)"
      )
      .eq("input_id", inputId)
      .order("created_at", { ascending: true });

    if (aiErr)
      return NextResponse.json({ error: aiErr.message }, { status: 500 });

    if (!aiInputs || aiInputs.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch order rows for these ai_input IDs
    const aiInputIds = aiInputs.map((r) => r.id);
    const { data: orderRows, error: orderErr } = await supabaseAdmin
      .from("document_type_ai_input_order")
      .select("id, document_type_ai_input_id, display_order")
      .in("document_type_ai_input_id", aiInputIds);

    if (orderErr)
      return NextResponse.json({ error: orderErr.message }, { status: 500 });

    // Build a map of ai_input_id -> display_order
    const orderMap = new Map<number, number>();
    for (const o of orderRows ?? []) {
      orderMap.set(
        o.document_type_ai_input_id as number,
        o.display_order as number
      );
    }

    // Assemble result
    const result = aiInputs.map((ai) => ({
      ai_input_id: ai.id,
      document_type_id: ai.document_type_id,
      document_type_name:
        (ai.document_types as unknown as { id: number; document_name: string } | null)
          ?.document_name ?? `Document #${ai.document_type_id}`,
      display_order: orderMap.get(ai.id as number) ?? 999,
      ai_prompt: ai.ai_prompt,
    }));

    // Sort by display_order
    result.sort((a, b) => a.display_order - b.display_order);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/document-type-ai-input-order
 * Body: { reorder: [{ document_type_ai_input_id: number, display_order: number }, ...] }
 * Updates display_order for multiple rows at once.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const reorder: { document_type_ai_input_id: number; display_order: number }[] =
      body.reorder;

    if (!Array.isArray(reorder) || reorder.length === 0) {
      return NextResponse.json(
        { error: "reorder array is required" },
        { status: 400 }
      );
    }

    // Upsert each order row (creates missing rows for new ai_input entries)
    const errors: string[] = [];
    for (const item of reorder) {
      const { error } = await supabaseAdmin
        .from("document_type_ai_input_order")
        .upsert(
          {
            document_type_ai_input_id: item.document_type_ai_input_id,
            display_order: item.display_order,
          },
          { onConflict: "document_type_ai_input_id" }
        );

      if (error) {
        errors.push(
          `Failed to update order for ai_input_id ${item.document_type_ai_input_id}: ${error.message}`
        );
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join("; ") },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
