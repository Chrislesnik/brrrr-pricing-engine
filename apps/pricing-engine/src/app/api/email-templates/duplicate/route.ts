import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { liveblocks } from "@/lib/liveblocks"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/**
 * POST /api/email-templates/duplicate
 *
 * Duplicates an email template:
 *  1. Inserts a new DB record (auto-generates UUID)
 *  2. Uses the UUID to create a Liveblocks room
 *  3. Copies the Yjs document from the source room
 *  4. Updates the DB record with the new room ID
 *  5. Returns the new template info so the client can navigate to it
 */
export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const body = (await req.json()) as {
    sourceTemplateId: string
    name?: string
    styles?: Record<string, unknown>
    blocknoteDocument?: unknown[]
    headerFields?: {
      subject?: string
      fromAddress?: string
      replyTo?: string
      previewText?: string
    }
    email_output_html?: string
    email_output_text?: string
  }

  if (!body.sourceTemplateId) {
    return NextResponse.json({ error: "sourceTemplateId is required" }, { status: 400 })
  }

  const newName = body.name ?? "Untitled Template (copy)"
  const sourceRoomId = `email_template:${body.sourceTemplateId}`

  try {
    const headers = body.headerFields ?? {}
    const { data: row, error: insertErr } = await supabaseAdmin
      .from("email_templates")
      .insert({
        organization_id: orgUuid,
        name: newName,
        status: "draft",
        subject: headers.subject ?? "",
        preview_text: headers.previewText ?? "",
        from_address: headers.fromAddress ?? null,
        reply_to: headers.replyTo ?? null,
        editor_json: { type: "doc", content: [{ type: "paragraph" }] },
        blocknote_document: body.blocknoteDocument ?? null,
        styles: body.styles ?? {},
        email_output_html: body.email_output_html ?? null,
        email_output_text: body.email_output_text ?? null,
        schema_version: 1,
      })
      .select("uuid")
      .single()

    if (insertErr || !row) {
      console.error("[duplicate] DB insert failed:", insertErr)
      return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 })
    }

    const templateUuid = row.uuid as string
    const newRoomId = `email_template:${templateUuid}`

    await liveblocks.getOrCreateRoom(newRoomId, {
      defaultAccesses: ["room:write"],
      usersAccesses: { [userId]: ["room:write"] },
      metadata: {
        roomType: "email_template",
        entityId: templateUuid,
        organizationId: orgId,
      },
    })

    try {
      const yjsBinary = await liveblocks.getYjsDocumentAsBinaryUpdate(sourceRoomId)
      if (yjsBinary && yjsBinary.byteLength > 0) {
        await liveblocks.sendYjsBinaryUpdate(newRoomId, new Uint8Array(yjsBinary))
      }
    } catch (yjsErr) {
      console.warn("[duplicate] Could not copy Yjs document, will fall back to DB content:", yjsErr)
    }

    await supabaseAdmin
      .from("email_templates")
      .update({ liveblocks_room_id: newRoomId })
      .eq("uuid", templateUuid)

    return NextResponse.json({
      id: templateUuid,
      name: newName,
      templateId: templateUuid,
    })
  } catch (err) {
    console.error("[duplicate] Failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Duplication failed" },
      { status: 500 }
    )
  }
}
