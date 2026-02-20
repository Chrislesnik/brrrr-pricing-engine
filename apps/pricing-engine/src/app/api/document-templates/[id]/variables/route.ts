import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/document-templates/[id]/variables
 * Get all variables for a specific document template
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

    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const { data: variables, error } = await supabaseAdmin
      .from("document_template_variables")
      .select("id, name, variable_type, required, position, created_at, updated_at")
      .eq("template_id", templateId)
      .order("position", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const mappedVariables = (variables ?? []).map(v => ({
      id: v.id,
      name: v.name,
      type: v.variable_type,
      required: v.required,
      position: v.position,
    }))

    return NextResponse.json({ variables: mappedVariables })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * PUT /api/document-templates/[id]/variables
 * Replace all variables for a template (bulk update)
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
    const { variables } = body

    if (!Array.isArray(variables)) {
      return NextResponse.json({ error: "Variables must be an array" }, { status: 400 })
    }

    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const { error: deleteError } = await supabaseAdmin
      .from("document_template_variables")
      .delete()
      .eq("template_id", templateId)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    if (variables.length > 0) {
      const variablesToInsert = variables.map((v: { name: string; type: string; required?: boolean }, index: number) => ({
        template_id: templateId,
        name: v.name,
        variable_type: v.type,
        required: v.required ?? false,
        position: index,
      }))

      const { error: insertError } = await supabaseAdmin
        .from("document_template_variables")
        .insert(variablesToInsert)

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { data: updatedVariables, error: fetchError } = await supabaseAdmin
      .from("document_template_variables")
      .select("id, name, variable_type, required, position")
      .eq("template_id", templateId)
      .order("position", { ascending: true })

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const mappedVariables = (updatedVariables ?? []).map(v => ({
      id: v.id,
      name: v.name,
      type: v.variable_type,
      required: v.required,
      position: v.position,
    }))

    return NextResponse.json({ variables: mappedVariables })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST /api/document-templates/[id]/variables
 * Add a single variable to a template
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

    const { data: template, error: templateError } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 })
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const { data: maxPosData } = await supabaseAdmin
      .from("document_template_variables")
      .select("position")
      .eq("template_id", templateId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()

    const newPosition = (maxPosData?.position ?? -1) + 1

    const { data: newVariable, error: insertError } = await supabaseAdmin
      .from("document_template_variables")
      .insert({
        template_id: templateId,
        name,
        variable_type: type,
        required,
        position: newPosition,
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({
      variable: {
        id: newVariable.id,
        name: newVariable.name,
        type: newVariable.variable_type,
        required: newVariable.required,
        position: newVariable.position,
      }
    }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
