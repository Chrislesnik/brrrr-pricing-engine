import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-types
 * List all document types, ordered by display_order.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("document_types")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/document-types
 * Create a new document type.
 * Body: { document_category_id: number, document_name: string, document_description?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { document_category_id, document_name, document_description } = body

    if (!document_category_id) return NextResponse.json({ error: "document_category_id is required" }, { status: 400 })
    if (!document_name?.trim()) return NextResponse.json({ error: "document_name is required" }, { status: 400 })

    // Verify category exists
    const { data: catRow } = await supabaseAdmin
      .from("document_categories")
      .select("id")
      .eq("id", document_category_id)
      .single()

    if (!catRow) return NextResponse.json({ error: "Category not found" }, { status: 404 })

    // Get next display_order for this category
    const { data: maxRow } = await supabaseAdmin
      .from("document_types")
      .select("display_order")
      .eq("document_category_id", document_category_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.display_order ?? -1) + 1

    const { data, error } = await supabaseAdmin
      .from("document_types")
      .insert({
        document_category_id,
        document_name: document_name.trim(),
        document_description: document_description?.trim() || null,
        display_order: nextOrder,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/document-types
 * Batch reorder or single update.
 * Body: { reorder: [{ id: number, document_category_id: number, display_order: number }] }
 *   OR: { id: number, document_name?: string, document_description?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    // Single document type update (edit name/description)
    if (body.id && !Array.isArray(body.reorder)) {
      const { id, document_name, document_description } = body
      const updatePayload: Record<string, unknown> = {}
      if (document_name !== undefined) updatePayload.document_name = String(document_name).trim()
      if (document_description !== undefined) updatePayload.document_description = document_description?.trim() || null

      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from("document_types")
        .update(updatePayload)
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Batch reorder (drag-and-drop)
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: number; document_category_id: number; display_order: number }[]

      for (const item of updates) {
        await supabaseAdmin
          .from("document_types")
          .update({
            document_category_id: item.document_category_id,
            display_order: item.display_order,
          })
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/document-types
 * Delete a document type.
 * Body: { id: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: "Document type id is required" }, { status: 400 })

    const { error } = await supabaseAdmin
      .from("document_types")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
