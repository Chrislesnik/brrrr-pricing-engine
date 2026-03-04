import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/deal-document-overrides                                */
/*  Returns all per-deal overrides for a deal.                                 */
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
      .from("deal_document_overrides")
      .select("*")
      .eq("deal_id", dealId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ overrides: data ?? [] });
  } catch (error) {
    console.error("[GET /api/deals/[id]/deal-document-overrides]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/deal-document-overrides                               */
/*  Upserts a per-deal override for a specific document type.                  */
/*  Body: { document_type_id, is_visible_override?, is_required_override? }    */
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

    const { document_type_id, is_visible_override, is_required_override } = body;

    if (!document_type_id) {
      return NextResponse.json(
        { error: "document_type_id is required" },
        { status: 400 }
      );
    }

    // Upsert: insert or update on conflict (deal_id, document_type_id)
    const { data, error } = await supabaseAdmin
      .from("deal_document_overrides")
      .upsert(
        {
          deal_id: dealId,
          document_type_id,
          is_visible_override:
            is_visible_override !== undefined ? is_visible_override : null,
          is_required_override:
            is_required_override !== undefined ? is_required_override : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "deal_id,document_type_id" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ override: data });
  } catch (error) {
    console.error("[POST /api/deals/[id]/deal-document-overrides]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
