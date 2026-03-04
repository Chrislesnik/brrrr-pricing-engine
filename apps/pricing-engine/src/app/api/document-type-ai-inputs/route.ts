import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-type-ai-inputs?document_type_id=<id>
 * List AI input prompts for a document type, joined with input label.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const documentTypeId = req.nextUrl.searchParams.get("document_type_id")
    if (!documentTypeId) return NextResponse.json({ error: "document_type_id is required" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("document_type_ai_input")
      .select("id, document_type_id, input_id, ai_prompt, created_at, inputs(id, input_label)")
      .eq("document_type_id", documentTypeId)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/document-type-ai-inputs
 * Create an AI input prompt for a document type.
 * Body: { document_type_id: number, input_id: number, ai_prompt: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { document_type_id, input_id, ai_prompt } = body

    if (!document_type_id) return NextResponse.json({ error: "document_type_id is required" }, { status: 400 })
    if (!input_id) return NextResponse.json({ error: "input_id is required" }, { status: 400 })
    if (!ai_prompt?.trim()) return NextResponse.json({ error: "ai_prompt is required" }, { status: 400 })

    // Check for existing prompt with same input_id on this document type
    const { data: existing } = await supabaseAdmin
      .from("document_type_ai_input")
      .select("id")
      .eq("document_type_id", document_type_id)
      .eq("input_id", input_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "An AI prompt already exists for this input on this document type" },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("document_type_ai_input")
      .insert({
        document_type_id,
        input_id,
        ai_prompt: ai_prompt.trim(),
      })
      .select("id, document_type_id, input_id, ai_prompt, created_at, inputs(id, input_label)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Create a corresponding order row so the priority system works
    if (data?.id) {
      const { data: maxOrder } = await supabaseAdmin
        .from("document_type_ai_input_order")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      await supabaseAdmin
        .from("document_type_ai_input_order")
        .insert({
          document_type_ai_input_id: data.id,
          display_order: (maxOrder?.display_order ?? 0) + 1,
        })
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/document-type-ai-inputs
 * Update an AI input prompt.
 * Body: { id: number, input_id?: number, ai_prompt?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { id, input_id, ai_prompt } = body

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const updatePayload: Record<string, unknown> = {}
    if (input_id !== undefined) updatePayload.input_id = input_id
    if (ai_prompt !== undefined) updatePayload.ai_prompt = ai_prompt.trim()

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // If input_id is changing, check for duplicate on the same document type
    if (input_id !== undefined) {
      const { data: current } = await supabaseAdmin
        .from("document_type_ai_input")
        .select("document_type_id")
        .eq("id", id)
        .single()

      if (current) {
        const { data: existing } = await supabaseAdmin
          .from("document_type_ai_input")
          .select("id")
          .eq("document_type_id", current.document_type_id)
          .eq("input_id", input_id)
          .neq("id", id)
          .maybeSingle()

        if (existing) {
          return NextResponse.json(
            { error: "An AI prompt already exists for this input on this document type" },
            { status: 409 }
          )
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("document_type_ai_input")
      .update(updatePayload)
      .eq("id", id)
      .select("id, document_type_id, input_id, ai_prompt, created_at, inputs(id, input_label)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/document-type-ai-inputs
 * Delete an AI input prompt.
 * Body: { id: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    // Remove the corresponding order row first
    await supabaseAdmin
      .from("document_type_ai_input_order")
      .delete()
      .eq("document_type_ai_input_id", id)

    const { error } = await supabaseAdmin
      .from("document_type_ai_input")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
