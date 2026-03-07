import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, docId } = await params;
    const dealDocumentId = Number(docId);

    // 1. Load all AI input results for this deal_document with their parent config
    const { data: aiInputs, error: aiErr } = await supabaseAdmin
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
      .eq("deal_document_id", dealDocumentId);

    if (aiErr) {
      return NextResponse.json({ error: aiErr.message }, { status: 500 });
    }

    if (!aiInputs || aiInputs.length === 0) {
      return NextResponse.json({
        pulled: 0,
        skipped: 0,
        no_value: 0,
        message: "No AI extractions found for this document",
      });
    }

    // 2. Collect all document_type_ai_input_ids to fetch their priority order
    const dtaiIds = aiInputs
      .map((r: any) => r.document_type_ai_input_id)
      .filter(Boolean);

    const { data: orderRows } = await supabaseAdmin
      .from("document_type_ai_input_order")
      .select("document_type_ai_input_id, display_order")
      .in("document_type_ai_input_id", dtaiIds);

    const priorityMap = new Map<number, number>();
    for (const o of orderRows ?? []) {
      priorityMap.set(o.document_type_ai_input_id, o.display_order);
    }

    // 3. Get all deal_document_ids for this deal
    const { data: allDealDocs } = await supabaseAdmin
      .from("deal_documents")
      .select("id")
      .eq("deal_id", dealId)
      .is("archived_at", null);

    const allDealDocIds = (allDealDocs ?? []).map((d: any) => d.id);

    // 4. Get all input_ids we're dealing with
    const inputIdSet = new Set<number>();
    for (const row of aiInputs) {
      const parent = (row as any).document_type_ai_input as any;
      if (parent?.input_id) inputIdSet.add(parent.input_id);
    }

    // 5. Get ALL approved ai_input rows across the deal for these input_ids
    //    to check if a higher-priority source already exists
    let allApprovedByInput = new Map<number, { dtaiId: number; priority: number }[]>();
    if (inputIdSet.size > 0 && allDealDocIds.length > 0) {
      const { data: allApproved } = await supabaseAdmin
        .from("deal_document_ai_input")
        .select(
          `
          document_type_ai_input_id,
          approved_value,
          document_type_ai_input:document_type_ai_input_id ( input_id )
        `
        )
        .in("deal_document_id", allDealDocIds)
        .not("approved_value", "is", null);

      // Also fetch priorities for all dtai_ids from other documents
      const otherDtaiIds = (allApproved ?? []).map(
        (r: any) => r.document_type_ai_input_id
      );
      if (otherDtaiIds.length > 0) {
        const { data: extraOrders } = await supabaseAdmin
          .from("document_type_ai_input_order")
          .select("document_type_ai_input_id, display_order")
          .in("document_type_ai_input_id", otherDtaiIds);

        for (const o of extraOrders ?? []) {
          if (!priorityMap.has(o.document_type_ai_input_id)) {
            priorityMap.set(o.document_type_ai_input_id, o.display_order);
          }
        }
      }

      for (const row of allApproved ?? []) {
        const parent = (row as any).document_type_ai_input as any;
        const iId = parent?.input_id as number | undefined;
        if (!iId) continue;
        const arr = allApprovedByInput.get(iId) ?? [];
        arr.push({
          dtaiId: row.document_type_ai_input_id,
          priority: priorityMap.get(row.document_type_ai_input_id) ?? 999,
        });
        allApprovedByInput.set(iId, arr);
      }
    }

    // 6. Process each AI input result
    let pulled = 0;
    let skipped = 0;
    let noValue = 0;

    for (const row of aiInputs) {
      const parent = (row as any).document_type_ai_input as any;
      const inputId = parent?.input_id as number | undefined;
      const inputType = (parent?.inputs as any)?.input_type ?? "text";
      const dtaiId = row.document_type_ai_input_id;
      const aiValue = row.ai_value;
      const output = (row.response as any) ?? {};

      if (!inputId || !aiValue || aiValue === "" || aiValue === "NULL" || output.notFound) {
        noValue++;
        continue;
      }

      const thisPriority = priorityMap.get(dtaiId) ?? 999;

      // Check if there's already an approved value from a higher-priority source
      const existingApprovals = allApprovedByInput.get(inputId) ?? [];
      const higherPriorityExists = existingApprovals.some(
        (a) => a.dtaiId !== dtaiId && a.priority < thisPriority
      );

      if (higherPriorityExists) {
        skipped++;
        continue;
      }

      // Auto-approve this extraction
      await supabaseAdmin
        .from("deal_document_ai_input")
        .update({ approved_value: String(aiValue), rejected: false })
        .eq("id", row.id);

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

    return NextResponse.json({
      pulled,
      skipped,
      no_value: noValue,
      total: aiInputs.length,
      message: `Pulled ${pulled} value${pulled !== 1 ? "s" : ""}, ${skipped} skipped (lower priority), ${noValue} had no extraction`,
    });
  } catch (err) {
    console.error("[POST /auto-pull]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
