import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // 1. Get all deal_documents for this deal
    const { data: dealDocs, error: docsErr } = await supabaseAdmin
      .from("deal_documents")
      .select("id, document_type_id")
      .eq("deal_id", dealId)
      .is("archived_at", null);

    if (docsErr || !dealDocs?.length) {
      return NextResponse.json({
        pulled: 0,
        skipped: 0,
        no_value: 0,
        message: "No documents found for this deal",
      });
    }

    const dealDocIds = dealDocs.map((d: any) => d.id);

    // 2. Load ALL AI input results across all deal documents
    const { data: allAiInputs, error: aiErr } = await supabaseAdmin
      .from("deal_document_ai_input")
      .select(
        `
        id,
        document_type_ai_input_id,
        deal_document_id,
        response,
        ai_value,
        approved_value,
        rejected,
        document_type_ai_input:document_type_ai_input_id (
          id,
          input_id,
          document_type_id,
          inputs:input_id ( input_type )
        )
      `
      )
      .in("deal_document_id", dealDocIds);

    if (aiErr || !allAiInputs?.length) {
      return NextResponse.json({
        pulled: 0,
        skipped: 0,
        no_value: 0,
        message: "No AI extractions found",
      });
    }

    // 3. Collect all document_type_ai_input_ids to fetch priority
    const allDtaiIds = [
      ...new Set(allAiInputs.map((r: any) => r.document_type_ai_input_id).filter(Boolean)),
    ];

    const { data: orderRows } = await supabaseAdmin
      .from("document_type_ai_input_order")
      .select("document_type_ai_input_id, display_order")
      .in("document_type_ai_input_id", allDtaiIds);

    const priorityMap = new Map<number, number>();
    for (const o of orderRows ?? []) {
      priorityMap.set(o.document_type_ai_input_id, o.display_order);
    }

    // 4. Group extractions by input_id, pick the highest-priority one with a value
    const byInputId = new Map<
      number,
      { row: any; inputType: string; priority: number }[]
    >();

    for (const row of allAiInputs) {
      const parent = (row as any).document_type_ai_input as any;
      const inputId = parent?.input_id as number | undefined;
      if (!inputId) continue;

      const aiValue = row.ai_value;
      const output = (row.response as any) ?? {};
      if (!aiValue || aiValue === "" || aiValue === "NULL" || output.notFound) continue;

      const inputType = (parent?.inputs as any)?.input_type ?? "text";
      const priority = priorityMap.get(row.document_type_ai_input_id) ?? 999;

      const arr = byInputId.get(inputId) ?? [];
      arr.push({ row, inputType, priority });
      byInputId.set(inputId, arr);
    }

    // 5. For each input, pick the highest-priority extraction and commit it
    let pulled = 0;
    let skipped = 0;

    for (const [inputId, candidates] of byInputId.entries()) {
      candidates.sort((a, b) => a.priority - b.priority);
      const best = candidates[0];
      const aiValue = best.row.ai_value;
      const inputType = best.inputType;

      // Auto-approve the winning extraction
      await supabaseAdmin
        .from("deal_document_ai_input")
        .update({ approved_value: String(aiValue), rejected: false })
        .eq("id", best.row.id);

      // Mark lower-priority ones as skipped (don't change their approval)
      skipped += candidates.length - 1;

      // Sync to deal_inputs
      const dealInputPayload: Record<string, unknown> = {
        deal_id: dealId,
        input_id: inputId,
        input_type: inputType,
      };

      if (inputType === "text" || inputType === "dropdown") {
        dealInputPayload.value_text = String(aiValue);
      } else if (
        inputType === "number" ||
        inputType === "currency" ||
        inputType === "percentage"
      ) {
        const num = Number(String(aiValue).replace(/[^0-9.-]/g, ""));
        dealInputPayload.value_numeric = isNaN(num) ? null : num;
      } else if (inputType === "date") {
        dealInputPayload.value_date = String(aiValue);
      } else if (inputType === "boolean") {
        dealInputPayload.value_bool =
          String(aiValue).toLowerCase() === "true";
      } else {
        dealInputPayload.value_text = String(aiValue);
      }

      await supabaseAdmin
        .from("deal_inputs")
        .upsert(dealInputPayload, { onConflict: "deal_id,input_id" });

      pulled++;
    }

    const noValue = allAiInputs.length - [...byInputId.values()].reduce((s, arr) => s + arr.length, 0);

    return NextResponse.json({
      pulled,
      skipped,
      no_value: noValue,
      total: allAiInputs.length,
      message: `Pulled ${pulled} value${pulled !== 1 ? "s" : ""} from ${dealDocs.length} document${dealDocs.length !== 1 ? "s" : ""}`,
    });
  } catch (err) {
    console.error("[POST /api/deals/[id]/auto-pull]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
