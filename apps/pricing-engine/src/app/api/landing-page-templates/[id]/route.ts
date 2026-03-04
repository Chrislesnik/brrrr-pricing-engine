import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/landing-page-templates/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from("landing_page_templates")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    return NextResponse.json({ template: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * PATCH /api/landing-page-templates/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { id } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 1) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      }
      updates.name = body.name.trim()
    }
    if (body.html_content !== undefined) updates.html_content = body.html_content
    if (body.gjs_data !== undefined) updates.gjs_data = body.gjs_data
    if (body.slug !== undefined) updates.slug = body.slug
    if (body.status !== undefined) {
      updates.status = body.status
      if (body.status === "published") updates.published_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from("landing_page_templates")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ template: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * DELETE /api/landing-page-templates/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { id } = await params

    const { error } = await supabaseAdmin
      .from("landing_page_templates")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgUuid)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
