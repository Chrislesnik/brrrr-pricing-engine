import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
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
        .select("*")
        .single()
      if (loanErr) {
        return NextResponse.json({ error: `Failed to create loan: ${loanErr.message}` }, { status: 500 })
      }
      loanId = loanRow?.id as string

      // Fire webhook for newly created loan (not for new scenarios on existing loans)
      // This should not block user flow; errors are swallowed.
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const primaryEmail =
          user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? null
        const allEmails = (user.emailAddresses ?? []).map((e) => e.emailAddress)
        const payload = {
          event: "loan.created",
          created_at: new Date().toISOString(),
          loan_id: loanRow?.id ?? null,
          loan: loanRow ?? null,
          organization: {
            clerk_org_id: orgId,
            org_uuid: orgUuid,
          },
          created_by: {
            clerk_user_id: user.id,
            first_name: user.firstName ?? null,
            last_name: user.lastName ?? null,
            image_url: user.imageUrl ?? null,
            primary_email: primaryEmail,
            email_addresses: allEmails,
            username: user.username ?? null,
          },
        }
        await fetch("https://n8n.axora.info/webhook/c96a6fcf-18b2-4ec3-8d7c-8a6a5c31742e", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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


