import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

type SaveScenarioBody = {
  name?: string
  inputs?: Record<string, unknown>
  selected?: Record<string, unknown> | null
  loanId?: string
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    let orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      // Create a minimal organization record when mapping is missing
      const genId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)) as string
      const { data: createdOrg, error: orgErr } = await supabaseAdmin
        .from("organizations")
        .insert({
          id: genId, // organizations.id is text in this project
          clerk_organization_id: orgId,
        })
        .select("id")
        .single()
      if (orgErr || !createdOrg?.id) {
        return NextResponse.json({ error: `Failed to ensure organization: ${orgErr?.message ?? "unknown"}` }, { status: 400 })
      }
      orgUuid = createdOrg.id as string
    }

    const body = (await req.json().catch(() => null)) as SaveScenarioBody | null
    if (!body || !body.inputs) {
      return NextResponse.json({ error: "Missing inputs" }, { status: 400 })
    }

    let loanId = body.loanId
    if (!loanId) {
      // Create minimal loan shell
      const { data: loanRow, error: loanErr } = await supabaseAdmin
        .from("loans")
        .insert({
          organization_id: orgUuid,
          assigned_to_user_id: userId, // Clerk user id
        })
        .select("id")
        .single()
      if (loanErr) {
        return NextResponse.json({ error: `Failed to create loan: ${loanErr.message}` }, { status: 500 })
      }
      loanId = loanRow?.id as string
    }

    // loan_scenarios schema includes jsonb columns: inputs, selected
    // Store raw inputs payload in inputs; selection (and name metadata) in selected/name fields
    const { data: scenario, error: scenErr } = await supabaseAdmin
      .from("loan_scenarios")
      .insert({
        loan_id: loanId,
        primary: false,
        user_id: userId,
        organization_id: orgUuid,
        inputs: body.inputs ?? {},
        selected: body.selected ?? null,
      })
      .select("id")
      .single()
    if (scenErr) {
      return NextResponse.json({ error: `Failed to save scenario: ${scenErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ loanId, scenarioId: scenario?.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


