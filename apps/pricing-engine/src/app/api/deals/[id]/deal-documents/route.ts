import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/deal-documents                                         */
/*  Returns all deal_documents rows for a deal.                                */
/* -------------------------------------------------------------------------- */

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

    const { data, error } = await supabaseAdmin
      .from("deal_documents")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data ?? [] });
  } catch (error) {
    console.error("[GET /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/deal-documents                                        */
/*  Creates a new deal_document row (file metadata only — no actual upload).   */
/*  Body: { document_type_id, file_name, file_size?, file_type? }              */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json().catch(() => ({}));

    const { document_type_id, file_name, file_size, file_type } = body;
    if (!file_name?.trim()) {
      return NextResponse.json(
        { error: "file_name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("deal_documents")
      .insert({
        deal_id: dealId,
        document_type_id: document_type_id ?? null,
        file_name: file_name.trim(),
        file_size: file_size ?? null,
        file_type: file_type ?? null,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error("[POST /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/deals/[id]/deal-documents                                       */
/*  Updates the document_type_id on an existing deal_document row.             */
/*  Body: { id: number, document_type_id: number | null }                      */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json().catch(() => ({}));
    const { id: docId, document_type_id } = body;

    if (!docId) {
      return NextResponse.json(
        { error: "Document id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("deal_documents")
      .update({ document_type_id: document_type_id ?? null })
      .eq("id", docId)
      .eq("deal_id", dealId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error("[PATCH /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/deals/[id]/deal-documents                                      */
/*  Deletes a specific deal_document row.                                      */
/*  Body: { id: number }                                                       */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json().catch(() => ({}));
    const docId = body.id;

    if (!docId) {
      return NextResponse.json(
        { error: "Document id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("deal_documents")
      .delete()
      .eq("id", docId)
      .eq("deal_id", dealId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/deals/[id]/deal-documents]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
