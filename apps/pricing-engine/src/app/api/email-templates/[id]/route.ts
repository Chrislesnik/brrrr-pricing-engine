import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/**
 * PATCH /api/email-templates/[id]
 *
 * `[id]` is the template's UUID (from the `uuid` column).
 * Templates are matched by `uuid` + `organization_id`.
 * If no row exists yet, one is inserted (upsert-on-first-save) and the
 * auto-generated UUID is used to set `liveblocks_room_id`.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const { id: templateUuid } = await params
  const roomId = `email_template:${templateUuid}`

  const body = (await req.json()) as {
    name?: string
    status?: "draft" | "published"
    subject?: string
    preview_text?: string
    from_address?: string
    reply_to?: string
    editor_json?: Record<string, unknown>
    blocknote_document?: unknown[]
    styles?: Record<string, unknown>
    email_output_html?: string
    email_output_text?: string
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) update.name = body.name
  if (body.status !== undefined) update.status = body.status
  if (body.subject !== undefined) update.subject = body.subject
  if (body.preview_text !== undefined) update.preview_text = body.preview_text
  if (body.from_address !== undefined) update.from_address = body.from_address
  if (body.reply_to !== undefined) update.reply_to = body.reply_to
  if (body.editor_json !== undefined) update.editor_json = body.editor_json
  if (body.blocknote_document !== undefined) update.blocknote_document = body.blocknote_document
  if (body.styles !== undefined) update.styles = body.styles
  if (body.email_output_html !== undefined) update.email_output_html = body.email_output_html
  if (body.email_output_text !== undefined) update.email_output_text = body.email_output_text

  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .update(update)
    .eq("uuid", templateUuid)
    .eq("organization_id", orgUuid)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("email_templates")
        .insert({
          uuid: templateUuid,
          organization_id: orgUuid,
          name: body.name ?? "Untitled Template",
          status: body.status ?? "draft",
          subject: body.subject ?? "",
          preview_text: body.preview_text ?? "",
          from_address: body.from_address ?? null,
          reply_to: body.reply_to ?? null,
          editor_json: body.editor_json ?? { type: "doc", content: [{ type: "paragraph" }] },
          blocknote_document: body.blocknote_document ?? null,
          styles: body.styles ?? {},
          email_output_html: body.email_output_html ?? null,
          email_output_text: body.email_output_text ?? null,
          liveblocks_room_id: roomId,
          schema_version: 1,
        })
        .select()
        .single()

      if (insertErr) {
        console.error("[email-templates] upsert failed:", insertErr)
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
      return NextResponse.json(inserted)
    }

    console.error("[email-templates] update failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/email-templates/[id]
 *
 * Permanently removes the template matched by `uuid` + `organization_id`.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const { id: templateUuid } = await params

  const { error } = await supabaseAdmin
    .from("email_templates")
    .delete()
    .eq("uuid", templateUuid)
    .eq("organization_id", orgUuid)

  if (error) {
    console.error("[email-templates] delete failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
