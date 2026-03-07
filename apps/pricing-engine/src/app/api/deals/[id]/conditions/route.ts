import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Get all deal_documents for this deal
    const { data: dealDocs, error: docsErr } = await supabaseAdmin
      .from("deal_documents")
      .select("id, document_type_id, file_name, document_file_id")
      .eq("deal_id", dealId)
      .is("archived_at", null);

    if (docsErr) {
      return NextResponse.json({ error: docsErr.message }, { status: 500 });
    }

    if (!dealDocs || dealDocs.length === 0) {
      return NextResponse.json({ conditions: [] });
    }

    const dealDocIds = dealDocs.map((d: any) => d.id);

    // Get all AI condition results for these deal documents
    const { data: condResults, error: condErr } = await supabaseAdmin
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
          ai_prompt,
          document_type
        )
      `
      )
      .in("deal_document_id", dealDocIds);

    if (condErr) {
      return NextResponse.json({ error: condErr.message }, { status: 500 });
    }

    // Build a lookup for deal_documents -> document name + type
    const docTypeIds = [
      ...new Set(dealDocs.map((d: any) => d.document_type_id).filter(Boolean)),
    ];

    let docTypeMap = new Map<number, string>();
    if (docTypeIds.length > 0) {
      const { data: docTypes } = await supabaseAdmin
        .from("document_types")
        .select("id, document_name")
        .in("id", docTypeIds);

      for (const dt of docTypes ?? []) {
        docTypeMap.set(dt.id, dt.document_name);
      }
    }

    const dealDocMap = new Map(
      dealDocs.map((d: any) => [
        d.id,
        {
          file_name: d.file_name,
          document_type_id: d.document_type_id,
          document_type_name: d.document_type_id
            ? docTypeMap.get(d.document_type_id) ?? null
            : null,
          document_file_id: d.document_file_id,
        },
      ])
    );

    // Format results
    const conditions = (condResults ?? []).map((row: any) => {
      const parent = row.document_type_ai_condition_rel as any;
      const dealDoc = dealDocMap.get(row.deal_document_id);
      const output = row.response ?? {};

      // Determine status from the AI answer
      let status: "pass" | "fail" | "not_determined" | "pending" = "pending";
      if (row.ai_value === true || output.answer === true) {
        status = "pass";
      } else if (row.ai_value === false || output.answer === false) {
        status = "fail";
      } else if (output.answer === null || output.answer === "NULL" || output.notFound) {
        status = "not_determined";
      }

      return {
        id: row.id,
        condition_label: parent?.condition_label ?? "Unknown Condition",
        document_type_ai_condition_id: row.document_type_ai_condition,
        deal_document_id: row.deal_document_id,
        document_name: dealDoc?.file_name ?? "Unknown Document",
        document_type_name: dealDoc?.document_type_name ?? null,
        document_file_id: dealDoc?.document_file_id ?? null,
        status,
        ai_value: row.ai_value,
        approved_value: row.approved_value,
        rejected: row.rejected,
        confidence: output.confidence ?? null,
        citations: output.citations ?? [],
        highlights: output.highlights ?? [],
        answer: output.answer,
        created_at: row.created_at,
      };
    });

    // ---- AI Extraction Values (from AI-only input categories) ----
    const { data: aiInputResults, error: aiInputErr } = await supabaseAdmin
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
          input_id,
          inputs:input_id (
            id,
            input_label,
            input_type,
            category_id,
            input_categories:category_id ( is_ai_only )
          )
        )
      `
      )
      .in("deal_document_id", dealDocIds);

    // Filter to only AI-only inputs and format
    const extractions: any[] = [];
    for (const row of aiInputResults ?? []) {
      const parent = row.document_type_ai_input as any;
      const input = parent?.inputs as any;
      const catInfo = input?.input_categories as any;
      if (!catInfo?.is_ai_only) continue;

      const dealDoc = dealDocMap.get(row.deal_document_id);
      const output = (row.response as any) ?? {};

      extractions.push({
        id: row.id,
        input_id: input?.id ? String(input.id) : null,
        input_label: input?.input_label ?? "Unknown",
        input_type: input?.input_type ?? "text",
        deal_document_id: row.deal_document_id,
        document_name: dealDoc?.file_name ?? "Unknown Document",
        document_type_name: dealDoc?.document_type_name ?? null,
        ai_value: row.ai_value,
        approved_value: row.approved_value,
        rejected: row.rejected,
        confidence: output.confidence ?? null,
        citations: output.citations ?? [],
        answer: output.answer,
        created_at: row.created_at,
      });
    }

    return NextResponse.json({ conditions, extractions });
  } catch (err) {
    console.error("[GET /api/deals/[id]/conditions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
