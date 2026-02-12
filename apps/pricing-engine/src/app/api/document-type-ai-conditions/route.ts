import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-type-ai-conditions?document_type_id=<id>
 * List AI condition prompts for a document type.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const documentTypeId = req.nextUrl.searchParams.get("document_type_id")
    if (!documentTypeId) return NextResponse.json({ error: "document_type_id is required" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("document_type_ai_condition")
      .select("id, document_type, condition_label, ai_prompt, created_at")
      .eq("document_type", documentTypeId)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/document-type-ai-conditions
 * Create an AI condition prompt for a document type.
 * Body: { document_type_id: number, condition_label: string, ai_prompt: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { document_type_id, condition_label, ai_prompt } = body

    if (!document_type_id) return NextResponse.json({ error: "document_type_id is required" }, { status: 400 })
    if (!condition_label?.trim()) return NextResponse.json({ error: "condition_label is required" }, { status: 400 })
    if (!ai_prompt?.trim()) return NextResponse.json({ error: "ai_prompt is required" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("document_type_ai_condition")
      .insert({
        document_type: document_type_id,
        condition_label: condition_label.trim(),
        ai_prompt: ai_prompt.trim(),
      })
      .select("id, document_type, condition_label, ai_prompt, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/document-type-ai-conditions
 * Update an AI condition prompt.
 * Body: { id: number, condition_label?: string, ai_prompt?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { id, condition_label, ai_prompt } = body

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const updatePayload: Record<string, unknown> = {}
    if (condition_label !== undefined) updatePayload.condition_label = condition_label.trim()
    if (ai_prompt !== undefined) updatePayload.ai_prompt = ai_prompt.trim()

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("document_type_ai_condition")
      .update(updatePayload)
      .eq("id", id)
      .select("id, document_type, condition_label, ai_prompt, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/document-type-ai-conditions
 * Delete an AI condition prompt.
 * Body: { id: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const { error } = await supabaseAdmin
      .from("document_type_ai_condition")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
