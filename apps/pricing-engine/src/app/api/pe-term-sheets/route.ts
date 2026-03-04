import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("pe_term_sheets")
      .select("id, document_template_id, status, display_order, created_at, document_templates(name)")
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((row: Record<string, unknown>) => {
      const tmpl = row.document_templates as { name: string } | null;
      return {
        id: row.id,
        document_template_id: row.document_template_id,
        template_name: tmpl?.name ?? "Unknown Template",
        status: row.status,
        display_order: row.display_order,
        created_at: row.created_at,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[GET /api/pe-term-sheets]", error);
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
    const { document_template_id } = body as { document_template_id: string };

    if (!document_template_id) {
      return NextResponse.json({ error: "document_template_id is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("pe_term_sheets")
      .select("id")
      .eq("document_template_id", document_template_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "This template is already linked to a term sheet" }, { status: 409 });
    }

    const { data: maxOrder } = await supabaseAdmin
      .from("pe_term_sheets")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabaseAdmin
      .from("pe_term_sheets")
      .insert({ document_template_id, display_order: nextOrder })
      .select("id, document_template_id, status, display_order, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    fetch("https://n8n.axora.info/webhook/ac651502-6422-400c-892e-c268b8c66201", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.error("[POST /api/pe-term-sheets] webhook error:", err));

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pe-term-sheets]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
