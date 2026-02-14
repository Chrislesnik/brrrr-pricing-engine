import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-templates/[id]/fields
 * Get all fields for a specific document template
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { id: templateId } = await params

    // Verify the template belongs to the organization
    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    // Fetch fields ordered by position
    const { data: fields, error } = await supabaseAdmin
      .from("document_template_fields")
      .select("id, name, field_type, required, position, created_at, updated_at")
      .eq("template_id", templateId)
      .order("position", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Map field_type to type for frontend compatibility
    const mappedFields = (fields ?? []).map(f => ({
      id: f.id,
      name: f.name,
      type: f.field_type,
      required: f.required,
      position: f.position,
    }))

    return NextResponse.json({ fields: mappedFields })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * PUT /api/document-templates/[id]/fields
 * Replace all fields for a template (bulk update)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { id: templateId } = await params
    const body = await req.json()
    const { fields } = body

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Fields must be an array" }, { status: 400 })
    }

    // Verify the template belongs to the organization
    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    // Delete existing fields
    const { error: deleteError } = await supabaseAdmin
      .from("document_template_fields")
      .delete()
      .eq("template_id", templateId)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    // Insert new fields if any
    if (fields.length > 0) {
      const fieldsToInsert = fields.map((f: { name: string; type: string; required?: boolean }, index: number) => ({
        template_id: templateId,
        name: f.name,
        field_type: f.type,
        required: f.required ?? false,
        position: index,
      }))

      const { error: insertError } = await supabaseAdmin
        .from("document_template_fields")
        .insert(fieldsToInsert)

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Fetch and return updated fields
    const { data: updatedFields, error: fetchError } = await supabaseAdmin
      .from("document_template_fields")
      .select("id, name, field_type, required, position")
      .eq("template_id", templateId)
      .order("position", { ascending: true })

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const mappedFields = (updatedFields ?? []).map(f => ({
      id: f.id,
      name: f.name,
      type: f.field_type,
      required: f.required,
      position: f.position,
    }))

    return NextResponse.json({ fields: mappedFields })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST /api/document-templates/[id]/fields
 * Add a single field to a template
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { id: templateId } = await params
    const body = await req.json()
    const { name, type, required = false } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Type is required" }, { status: 400 })
    }

    // Verify the template belongs to the organization
    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    // Get the max position
    const { data: maxPosData } = await supabaseAdmin
      .from("document_template_fields")
      .select("position")
      .eq("template_id", templateId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()

    const newPosition = (maxPosData?.position ?? -1) + 1

    // Insert the new field
    const { data: newField, error: insertError } = await supabaseAdmin
      .from("document_template_fields")
      .insert({
        template_id: templateId,
        name,
        field_type: type,
        required,
        position: newPosition,
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({
      field: {
        id: newField.id,
        name: newField.name,
        type: newField.field_type,
        required: newField.required,
        position: newField.position,
      }
    }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
