import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  /api/deals/[id]/deal-documents/[docId]/ai-results                         */
/*  GET  – Load persisted AI extraction results (inputs + conditions) with    */
/*         labels from parent tables                                          */
/*  POST – Upsert AI extraction results from webhook response                 */
/*  PATCH – Update approved_value / rejected for a single row                 */
/* -------------------------------------------------------------------------- */

type RouteContext = {
  params: Promise<{ id: string; docId: string }>;
};

/* ---------------------------------- GET ----------------------------------- */

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, docId } = await params;
    const dealDocumentId = Number(docId);

    // Fetch AI input results with labels and input_id
    const { data: inputResults, error: inputErr } = await supabaseAdmin
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
        created_at,
        document_type_ai_input:document_type_ai_input_id (
          id,
          ai_prompt,
          input_id,
          inputs:input_id (
            input_label,
            input_type,
            dropdown_options
          )
        )
      `
      )
      .eq("deal_document_id", dealDocumentId);

    if (inputErr) {
      console.error("[GET ai-results] input query error:", inputErr);
    }

    // Fetch AI condition results with labels
    const { data: conditionResults, error: conditionErr } = await supabaseAdmin
      .from("deal_document_ai_condition")
      .select(
        `
        id,
        document_type_ai_condition,
        deal_document_id,
        response,
        ai_value,
        approved_value,
        rejected,
        created_at,
        document_type_ai_condition_rel:document_type_ai_condition (
          id,
          condition_label,
          ai_prompt
        )
      `
      )
      .eq("deal_document_id", dealDocumentId);

    if (conditionErr) {
      console.error("[GET ai-results] condition query error:", conditionErr);
    }

    // Collect input_ids and document_type_ai_input_ids from results
    const inputIdSet = new Set<string>();
    const dtaiIdSet = new Set<number>();
    for (const row of inputResults ?? []) {
      const parent = row.document_type_ai_input as any;
      if (parent?.input_id) inputIdSet.add(parent.input_id);
      if (row.document_type_ai_input_id) dtaiIdSet.add(row.document_type_ai_input_id);
    }

    // Fetch current deal_inputs values for these input_ids
    const dealInputMap = new Map<string, any>();
    if (inputIdSet.size > 0) {
      const { data: dealInputs } = await supabaseAdmin
        .from("deal_inputs")
        .select("input_id, input_type, value_text, value_numeric, value_date, value_bool")
        .eq("deal_id", dealId)
        .in("input_id", Array.from(inputIdSet));

      for (const di of dealInputs ?? []) {
        dealInputMap.set(di.input_id, di);
      }
    }

    // Fetch priority (display_order) for each document_type_ai_input_id
    const priorityMap = new Map<number, number>(); // dtai_id -> display_order
    if (dtaiIdSet.size > 0) {
      const { data: orderRows } = await supabaseAdmin
        .from("document_type_ai_input_order")
        .select("document_type_ai_input_id, display_order")
        .in("document_type_ai_input_id", Array.from(dtaiIdSet));

      for (const o of orderRows ?? []) {
        priorityMap.set(o.document_type_ai_input_id, o.display_order);
      }
    }

    // Fetch document_name for each document_type_ai_input via document_type_id
    // We need: dtai_id -> document_type_id -> document_types.document_name
    const dtaiDocNameMap = new Map<number, string>(); // dtai_id -> document_name
    if (dtaiIdSet.size > 0) {
      const { data: dtaiRows } = await supabaseAdmin
        .from("document_type_ai_input")
        .select("id, document_type_id, document_types:document_type_id ( document_name )")
        .in("id", Array.from(dtaiIdSet));

      for (const r of dtaiRows ?? []) {
        const dt = r.document_types as any;
        if (dt?.document_name) dtaiDocNameMap.set(r.id, dt.document_name);
      }
    }

    // For source tracking: find all approved deal_document_ai_input rows across the deal
    // for the same input_ids, with their priority and document name
    interface SourceInfo {
      approved_value: string;
      priority: number;
      document_name: string;
    }
    // Map: input_id -> SourceInfo[] (all approved sources)
    const approvedSourcesMap = new Map<string, SourceInfo[]>();

    if (inputIdSet.size > 0) {
      // Get all deal_document_ids for this deal
      const { data: dealDocs } = await supabaseAdmin
        .from("deal_documents")
        .select("id")
        .eq("deal_id", dealId);
      const allDealDocIds = (dealDocs ?? []).map((d: any) => d.id);

      if (allDealDocIds.length > 0) {
        // Get all approved ai_input rows across the deal for our input_ids
        const { data: allApproved } = await supabaseAdmin
          .from("deal_document_ai_input")
          .select(
            `
            id,
            document_type_ai_input_id,
            approved_value,
            document_type_ai_input:document_type_ai_input_id (
              input_id,
              document_type_id,
              document_types:document_type_id ( document_name )
            )
          `
          )
          .in("deal_document_id", allDealDocIds)
          .not("approved_value", "is", null);

        for (const row of allApproved ?? []) {
          const parent = row.document_type_ai_input as any;
          const iId = parent?.input_id as string | undefined;
          if (!iId) continue;

          const dtName = (parent?.document_types as any)?.document_name ?? "Unknown";
          const prio = priorityMap.get(row.document_type_ai_input_id) ?? 999;

          // We may not have priority for cross-document dtai_ids, fetch if missing
          let finalPrio = prio;
          if (!priorityMap.has(row.document_type_ai_input_id)) {
            // Will be resolved below
            finalPrio = 999;
          }

          const arr = approvedSourcesMap.get(iId) ?? [];
          arr.push({
            approved_value: String(row.approved_value),
            priority: finalPrio,
            document_name: dtName,
          });
          approvedSourcesMap.set(iId, arr);
        }

        // Fetch priorities for any dtai_ids we didn't have yet
        const allDtaiIds = new Set<number>();
        for (const row of allApproved ?? []) {
          allDtaiIds.add(row.document_type_ai_input_id);
        }
        const missingIds = Array.from(allDtaiIds).filter((id) => !priorityMap.has(id));
        if (missingIds.length > 0) {
          const { data: extraOrders } = await supabaseAdmin
            .from("document_type_ai_input_order")
            .select("document_type_ai_input_id, display_order")
            .in("document_type_ai_input_id", missingIds);

          for (const o of extraOrders ?? []) {
            priorityMap.set(o.document_type_ai_input_id, o.display_order);
          }

          // Update approvedSourcesMap with correct priorities
          for (const row of allApproved ?? []) {
            const parent = row.document_type_ai_input as any;
            const iId = parent?.input_id as string | undefined;
            if (!iId) continue;
            const arr = approvedSourcesMap.get(iId);
            if (arr) {
              for (const s of arr) {
                if (s.priority === 999 && priorityMap.has(row.document_type_ai_input_id)) {
                  s.priority = priorityMap.get(row.document_type_ai_input_id)!;
                }
              }
            }
          }
        }
      }
    }

    // Helper: resolve deal_input value to a display string
    function resolveDealValue(di: any): string | null {
      if (!di) return null;
      const t = di.input_type;
      if (t === "text" || t === "dropdown") return di.value_text ?? null;
      if (t === "number" || t === "currency" || t === "percentage")
        return di.value_numeric != null ? String(di.value_numeric) : null;
      if (t === "date") return di.value_date ?? null;
      if (t === "boolean") return di.value_bool != null ? String(di.value_bool) : null;
      return di.value_text ?? null;
    }

    // Helper: find which source set the current deal value
    function findValueSource(
      inputId: string,
      currentValue: string | null
    ): { document_name: string; priority: number } | null {
      if (!currentValue) return null;
      const sources = approvedSourcesMap.get(inputId);
      if (!sources || sources.length === 0) return null;

      // Find sources whose approved_value matches the current deal value
      const matching = sources.filter((s) => s.approved_value === currentValue);
      if (matching.length === 0) return null;

      // Pick the one with the highest priority (lowest display_order)
      matching.sort((a, b) => a.priority - b.priority);
      return { document_name: matching[0].document_name, priority: matching[0].priority };
    }

    // Normalize into a combined array
    const results: any[] = [];

    for (const row of inputResults ?? []) {
      const parent = row.document_type_ai_input as any;
      const input = parent?.inputs as any;
      const inputId = parent?.input_id as string | undefined;
      const dealInput = inputId ? dealInputMap.get(inputId) : undefined;
      const currentValue = resolveDealValue(dealInput);
      const thisPriority = priorityMap.get(row.document_type_ai_input_id) ?? null;
      const source = inputId ? findValueSource(inputId, currentValue) : null;

      results.push({
        id: row.id,
        type: "input",
        label: input?.input_label ?? "Unknown Input",
        input_id: inputId,
        input_type: input?.input_type ?? "text",
        dropdown_options: input?.dropdown_options ?? null,
        document_type_ai_input_id: row.document_type_ai_input_id,
        deal_document_id: row.deal_document_id,
        output: row.response,
        ai_value: row.ai_value,
        approved_value: row.approved_value,
        rejected: row.rejected,
        current_deal_value: currentValue,
        this_priority: thisPriority,
        this_document_name: dtaiDocNameMap.get(row.document_type_ai_input_id) ?? null,
        current_value_source_document_name: source?.document_name ?? null,
        current_value_source_priority: source?.priority ?? null,
        created_at: row.created_at,
      });
    }

    for (const row of conditionResults ?? []) {
      const parent = row.document_type_ai_condition_rel as any;
      results.push({
        id: row.id,
        type: "condition",
        label: parent?.condition_label ?? "Unknown Condition",
        document_type_ai_condition_id: row.document_type_ai_condition,
        deal_document_id: row.deal_document_id,
        output: row.response,
        ai_value: row.ai_value,
        approved_value: row.approved_value,
        rejected: row.rejected,
        created_at: row.created_at,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[GET /ai-results]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------------------------------- POST ---------------------------------- */

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;
    const dealDocumentId = Number(docId);
    const body = await request.json();
    const items: any[] = Array.isArray(body) ? body : body.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const inputUpserts: any[] = [];
    const conditionUpserts: any[] = [];

    for (const item of items) {
      if (item.type === "input") {
        inputUpserts.push({
          document_type_ai_input_id: item.document_type_ai_input,
          deal_document_id: dealDocumentId,
          response: item.output,
          ai_value: String(item.output?.answer ?? ""),
          approved_value: null,
          rejected: null,
          user_id: userId,
        });
      } else if (item.type === "condition") {
        conditionUpserts.push({
          document_type_ai_condition: item.document_type_ai_condition,
          deal_document_id: dealDocumentId,
          response: item.output,
          ai_value: Boolean(item.output?.answer),
          approved_value: null,
          rejected: null,
          user_id: userId,
        });
      }
    }

    // Upsert inputs
    if (inputUpserts.length > 0) {
      const { error } = await supabaseAdmin
        .from("deal_document_ai_input")
        .upsert(inputUpserts, {
          onConflict: "deal_document_id,document_type_ai_input_id",
        });

      if (error) {
        console.error("[POST ai-results] input upsert error:", error);
        return NextResponse.json(
          { error: "Failed to save input results" },
          { status: 500 }
        );
      }
    }

    // Upsert conditions
    if (conditionUpserts.length > 0) {
      const { error } = await supabaseAdmin
        .from("deal_document_ai_condition")
        .upsert(conditionUpserts, {
          onConflict: "deal_document_id,document_type_ai_condition",
        });

      if (error) {
        console.error("[POST ai-results] condition upsert error:", error);
        return NextResponse.json(
          { error: "Failed to save condition results" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /ai-results]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------------------------------- PATCH --------------------------------- */

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const { id, type, approved_value, rejected } = body;

    if (!id || !type) {
      return NextResponse.json(
        { error: "id and type are required" },
        { status: 400 }
      );
    }

    const table =
      type === "input"
        ? "deal_document_ai_input"
        : "deal_document_ai_condition";

    const updatePayload: Record<string, unknown> = {};
    if (approved_value !== undefined) updatePayload.approved_value = approved_value;
    if (rejected !== undefined) updatePayload.rejected = rejected;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from(table)
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("[PATCH ai-results] update error:", error);
      return NextResponse.json(
        { error: "Failed to update" },
        { status: 500 }
      );
    }

    // When approving an input, also update deal_inputs with the approved value
    if (type === "input" && approved_value !== undefined && approved_value !== null && rejected !== true) {
      try {
        // Look up the ai_input row to get document_type_ai_input_id
        const { data: aiRow } = await supabaseAdmin
          .from("deal_document_ai_input")
          .select("document_type_ai_input_id")
          .eq("id", id)
          .single();

        if (aiRow) {
          // Get input_id from document_type_ai_input
          const { data: dtaiRow } = await supabaseAdmin
            .from("document_type_ai_input")
            .select("input_id")
            .eq("id", aiRow.document_type_ai_input_id)
            .single();

          if (dtaiRow?.input_id) {
            // Get the input_type to know which value column to write
            const { data: inputRow } = await supabaseAdmin
              .from("inputs")
              .select("input_type")
              .eq("id", dtaiRow.input_id)
              .single();

            const inputType = inputRow?.input_type ?? "text";
            const dealInputPayload: Record<string, unknown> = {
              deal_id: dealId,
              input_id: dtaiRow.input_id,
              input_type: inputType,
            };

            // Write to the correct value column based on input_type
            if (inputType === "text" || inputType === "dropdown") {
              dealInputPayload.value_text = String(approved_value);
            } else if (
              inputType === "number" ||
              inputType === "currency" ||
              inputType === "percentage"
            ) {
              const num = Number(String(approved_value).replace(/[^0-9.-]/g, ""));
              dealInputPayload.value_numeric = isNaN(num) ? null : num;
            } else if (inputType === "date") {
              dealInputPayload.value_date = String(approved_value);
            } else if (inputType === "boolean") {
              dealInputPayload.value_bool =
                String(approved_value).toLowerCase() === "true";
            } else {
              dealInputPayload.value_text = String(approved_value);
            }

            // Upsert into deal_inputs
            await supabaseAdmin
              .from("deal_inputs")
              .upsert(dealInputPayload, {
                onConflict: "deal_id,input_id",
              });
          }
        }
      } catch (syncErr) {
        // Non-critical: log but don't fail the response
        console.error("[PATCH ai-results] deal_inputs sync error:", syncErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /ai-results]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
