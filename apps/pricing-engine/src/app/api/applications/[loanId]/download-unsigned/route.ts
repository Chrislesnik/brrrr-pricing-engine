import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { PDFDocument } from "pdf-lib"

export const runtime = "nodejs"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ loanId: string }> },
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!clerkOrgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const { loanId } = await params
    const body = await req.json().catch(() => ({})) as { sections?: string[] }
    const selectedSections = new Set(body.sections ?? [])

    // 1. Load the active template from DB
    const { data: template, error: tplError } = await supabaseAdmin
      .from("application_templates")
      .select("id, storage_bucket, storage_path")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (tplError || !template) {
      return NextResponse.json({ error: "No active application template found" }, { status: 404 })
    }

    // 2. Load field mappings from DB
    const { data: fieldRows, error: fieldsError } = await supabaseAdmin
      .from("application_template_fields")
      .select("field_name, merge_tag, field_type, section")
      .eq("template_id", template.id)

    if (fieldsError) {
      return NextResponse.json({ error: "Failed to load template fields" }, { status: 500 })
    }

    const fieldMappings = (fieldRows ?? []) as Array<{
      field_name: string
      merge_tag: string
      field_type: string | null
      section: string | null
    }>

    // 3. Load the application
    const { data: app, error } = await supabaseAdmin
      .from("applications")
      .select(
        "loan_id, organization_id, display_id, " +
        "form_data, merged_data, entity_id, borrower_name, " +
        "guarantor_ids, guarantor_names, guarantor_emails, " +
        "property_street, property_city, property_state, property_zip",
      )
      .eq("loan_id", loanId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (error || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // 4. Download the fillable PDF from Supabase Storage
    const { data: fileData, error: storageError } = await supabaseAdmin.storage
      .from(template.storage_bucket)
      .download(template.storage_path)

    if (storageError || !fileData) {
      return NextResponse.json(
        { error: "PDF template not found in storage" },
        { status: 404 },
      )
    }

    const pdfBytes = new Uint8Array(await fileData.arrayBuffer())

    // 5. Build data map from merged_data + form_data
    const merged = (app.merged_data ?? {}) as Record<string, unknown>
    const formData = (app.form_data ?? {}) as Record<string, unknown>
    const data: Record<string, unknown> = { ...formData, ...merged }

    // Fallback: resolve guarantor data from borrowers table when merged_data is empty
    const guarantorIds = Array.isArray(app.guarantor_ids)
      ? (app.guarantor_ids as string[]).filter(Boolean)
      : []

    if (guarantorIds.length > 0 && !data.firstName0) {
      const { data: borrowers } = await supabaseAdmin
        .from("borrowers")
        .select("id, first_name, last_name, email, primary_phone, address_line1, address_line2, city, state, zip, county, date_of_birth")
        .in("id", guarantorIds)

      const borrowerById = Object.fromEntries(
        (borrowers ?? []).map((b) => [b.id as string, b]),
      )

      guarantorIds.forEach((gId, i) => {
        const b = borrowerById[gId]
        if (!b) return
        if (!data[`firstName${i}`]) data[`firstName${i}`] = b.first_name ?? ""
        if (!data[`lastName${i}`]) data[`lastName${i}`] = b.last_name ?? ""
        if (!data[`emailAddress${i}`]) data[`emailAddress${i}`] = (b.email as string) ?? ""
        if (!data[`primaryPhone${i}`]) data[`primaryPhone${i}`] = (b.primary_phone as string) ?? ""
        if (!data[`addressLine1_${i}`]) data[`addressLine1_${i}`] = (b.address_line1 as string) ?? ""
        if (!data[`addressLine2_${i}`]) data[`addressLine2_${i}`] = (b.address_line2 as string) ?? ""
        if (!data[`city${i}`]) data[`city${i}`] = (b.city as string) ?? ""
        if (!data[`state${i}`]) data[`state${i}`] = (b.state as string) ?? ""
        if (!data[`zipCode${i}`]) data[`zipCode${i}`] = (b.zip as string) ?? ""
        if (!data[`county${i}`]) data[`county${i}`] = (b.county as string) ?? ""
        if (!data[`dob${i}`] && b.date_of_birth) data[`dob${i}`] = String(b.date_of_birth)
      })
    }

    // 6. Compute derived fields (merge tags prefixed with _)
    for (let i = 0; i < 4; i++) {
      const first = data[`firstName${i}`] ?? ""
      const last = data[`lastName${i}`] ?? ""
      data[`_fullName${i}`] = [first, last].filter(Boolean).join(" ")
    }

    const owners = Array.isArray(data.entityOwners)
      ? (data.entityOwners as Array<Record<string, unknown>>)
      : []
    data._entityMembers = owners.length > 0
      ? String(owners.length)
      : (data.members != null ? String(data.members) : "")

    for (let i = 0; i < 6; i++) {
      const o = owners[i]
      data[`_em${i + 1}Name`] = o?.name ?? ""
      data[`_em${i + 1}Title`] = o?.title ?? ""
      data[`_em${i + 1}Ownership`] = o?.ownershipPercent ? `${o.ownershipPercent}%` : ""
      data[`_em${i + 1}HomeAddress`] = o?.homeAddress ?? ""
    }

    // 7. Load and fill the PDF using DB field mappings
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()

    for (const mapping of fieldMappings) {
      if (mapping.merge_tag === "_skip") continue
      if (mapping.section && !selectedSections.has(mapping.section)) continue

      const value = data[mapping.merge_tag]
      if (value === undefined || value === null || value === "") continue
      const text = String(value)

      try {
        const textField = form.getTextField(mapping.field_name)
        textField.setText(text)
      } catch {
        try {
          const dropdown = form.getDropdown(mapping.field_name)
          const options = dropdown.getOptions()
          if (options.includes(text)) {
            dropdown.select(text)
          }
        } catch {
          // Field not found or type mismatch; skip
        }
      }
    }

    const filledBytes = await pdfDoc.save()

    const safeName = (app.display_id || `application-${loanId.slice(0, 8)}`)
      .replace(/[^a-zA-Z0-9_\-. ]/g, "")
      .trim()

    return new Response(filledBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(filledBytes.byteLength),
        "Content-Disposition": `attachment; filename="${safeName}-unsigned.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("Download unsigned error:", err)
    return NextResponse.json(
      { error: "Failed to generate unsigned document" },
      { status: 500 },
    )
  }
}
