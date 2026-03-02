import { NextRequest, NextResponse } from "next/server"
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-templates
 * List all document templates for the current organization
 */
export async function GET() {
  try {
    let userId: string, orgId: string
    try {
      ({ userId, orgId } = await authForApiRoute("documents", "read"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from("document_templates")
      .select("id, name, html_content, gjs_data, created_at, updated_at, user_id")
      .eq("organization_id", orgUuid)
      .order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ templates: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST /api/document-templates
 * Create a new document template
 */
export async function POST(req: NextRequest) {
  try {
    let userId: string, orgId: string
    try {
      ({ userId, orgId } = await authForApiRoute("documents", "write"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const body = await req.json()
    const { name, html_content = "", gjs_data = {} } = body

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("document_templates")
      .insert({
        organization_id: orgUuid,
        user_id: userId,
        name: name.trim(),
        html_content,
        gjs_data,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
