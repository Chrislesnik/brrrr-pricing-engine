import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function GET() {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .select("id, uuid, name, status, liveblocks_room_id, subject, updated_at, created_at")
    .eq("organization_id", orgUuid)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("[email-templates] list failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * POST /api/email-templates
 *
 * Creates a new empty email template. Returns the auto-generated UUID
 * so the client can navigate to the editor with it.
 */
export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as { name?: string }

  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .insert({
      organization_id: orgUuid,
      name: body.name ?? "Untitled Template",
      status: "draft",
      subject: "",
      preview_text: "",
      editor_json: { type: "doc", content: [{ type: "paragraph" }] },
      styles: {},
      schema_version: 1,
    })
    .select("uuid, name")
    .single()

  if (error) {
    console.error("[email-templates] create failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const templateUuid = data.uuid as string
  const roomId = `email_template:${templateUuid}`

  await supabaseAdmin
    .from("email_templates")
    .update({ liveblocks_room_id: roomId })
    .eq("uuid", templateUuid)

  return NextResponse.json({ uuid: templateUuid, name: data.name })
}
