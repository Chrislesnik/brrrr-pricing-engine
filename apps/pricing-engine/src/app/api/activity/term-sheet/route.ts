import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function POST(_req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const formData = await req.formData()
    
    const action = formData.get("action") as string | null
    const loanId = formData.get("loanId") as string | null
    const scenarioId = formData.get("scenarioId") as string | null
    const inputsRaw = formData.get("inputs") as string | null
    const outputsRaw = formData.get("outputs") as string | null
    const selectedRaw = formData.get("selected") as string | null
    const originalPdf = formData.get("originalPdf") as File | null
    const editedPdf = formData.get("editedPdf") as File | null

    if (!action || !["downloaded", "shared"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'downloaded' or 'shared'" }, { status: 400 })
    }
    if (!loanId) {
      return NextResponse.json({ error: "Missing loanId" }, { status: 400 })
    }

    // Parse JSON strings
    const inputs = inputsRaw ? JSON.parse(inputsRaw) : null
    const outputs = outputsRaw ? JSON.parse(outputsRaw) : null
    const selected = selectedRaw ? JSON.parse(selectedRaw) : null

    const timestamp = Date.now()
    let originalPath: string | null = null
    let editedPath: string | null = null

    // Upload original PDF if provided
    if (originalPdf && originalPdf.size > 0) {
      const buffer = Buffer.from(await originalPdf.arrayBuffer())
      const path = `${orgUuid}/${loanId}/${scenarioId ?? "no-scenario"}/${timestamp}_original.pdf`
      const { error: uploadErr } = await supabaseAdmin.storage
        .from("term-sheets")
        .upload(path, buffer, {
          contentType: "application/pdf",
          upsert: false,
        })
      if (!uploadErr) {
        originalPath = path
      }
    }

    // Upload edited PDF if provided
    if (editedPdf && editedPdf.size > 0) {
      const buffer = Buffer.from(await editedPdf.arrayBuffer())
      const path = `${orgUuid}/${loanId}/${scenarioId ?? "no-scenario"}/${timestamp}_edited.pdf`
      const { error: uploadErr } = await supabaseAdmin.storage
        .from("term-sheets")
        .upload(path, buffer, {
          contentType: "application/pdf",
          upsert: false,
        })
      if (!uploadErr) {
        editedPath = path
      }
    }

    // Insert activity log
    const { error: logErr } = await supabaseAdmin.from("pricing_activity_log").insert({
      loan_id: loanId,
      scenario_id: scenarioId ?? null,
      activity_type: "term_sheet",
      action: action,
      user_id: userId,
      inputs: inputs,
      outputs: outputs,
      selected: selected,
      term_sheet_original_path: originalPath,
      term_sheet_edit_path: editedPath,
    })

    if (logErr) {
      console.error("Activity log insert error:", logErr)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      ok: true,
      originalPath,
      editedPath,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    console.error("Term sheet activity error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
