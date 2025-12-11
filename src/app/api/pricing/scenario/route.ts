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
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found for current Clerk org" }, { status: 400 })
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
          assigned_to_user_id: [userId], // Clerk user id
          status: "active",
        })
        .select("id, organization_id, assigned_to_user_id, status, created_at")
        .single()
      if (loanErr) {
        return NextResponse.json({ error: `Failed to create loan: ${loanErr.message}` }, { status: 500 })
      }
      loanId = loanRow?.id as string

      // Fire webhook: a brand-new loan was created (not just a scenario)
      // Include creator user info and the inserted loan row.
      // Best-effort: do not block on webhook failures.
      try {
        const { clerkClient } = await import("@clerk/nextjs/server")
        const u = await clerkClient.users.getUser(userId)
        const primaryEmail = u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? u.emailAddresses?.[0]?.emailAddress
        const payload = {
          event: "loan_created",
          loan: loanRow,
          organization_id: orgUuid,
          created_by: {
            id: u.id,
            first_name: u.firstName,
            last_name: u.lastName,
            email: primaryEmail,
            username: u.username,
          },
        }
        const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        await fetch(`https://n8n.axora.info/webhook-test/c96a6fcf-18b2-4ec3-8d7c-8a6a5c31742e?_=${encodeURIComponent(nonce)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Server-to-server; no need for cache
          cache: "no-store",
          body: JSON.stringify(payload),
        }).catch(() => {})
      } catch {
        // ignore webhook errors
      }
    }

    // loan_scenarios schema includes jsonb columns: inputs, selected
    // Store raw inputs payload in inputs; selection (and name metadata) in selected/name fields
    // Compute primary = true when this is the first scenario for the loan
    let isPrimary = false
    if (loanId) {
      const { count } = await supabaseAdmin
        .from("loan_scenarios")
        .select("id", { count: "exact", head: true })
        .eq("loan_id", loanId)
      isPrimary = (count ?? 0) === 0
    }

    const { data: scenario, error: scenErr } = await supabaseAdmin
      .from("loan_scenarios")
      .insert({
        loan_id: loanId,
        name: body.name ?? null,
        primary: isPrimary,
        user_id: userId,
        organization_id: orgUuid,
        inputs: body.inputs ?? {},
        selected: body.selected ?? {},
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


