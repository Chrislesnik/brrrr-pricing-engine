import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-categories
 * List all active document categories, ordered by default_display_order.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("document_categories")
      .select("*")
      .eq("is_active", true)
      .order("default_display_order", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/document-categories
 * Batch update default_display_order for categories (kanban drag reorder).
 * Body: { reorder: [{ id: number, default_display_order: number }] }
 *   OR: { id: number, name: string }  (rename)
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    // Batch reorder
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: number; default_display_order: number }[]
      for (const item of updates) {
        await supabaseAdmin
          .from("document_categories")
          .update({ default_display_order: item.default_display_order })
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    // Single rename
    if (body.id && body.name) {
      const { error } = await supabaseAdmin
        .from("document_categories")
        .update({ name: body.name })
        .eq("id", body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
