import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { writeScenarioInputs, writeScenarioOutputs } from "@/lib/scenario-helpers"

export const runtime = "nodejs"

type SaveScenarioBody = {
  name?: string
  inputs?: Record<string, unknown>
  outputs?: unknown[] | null
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
          primary_user_id: userId,
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

      // Auto-assign users to the new loan
      try {
        // Determine if user is internal or external
        const { data: userOrg } = await supabaseAdmin
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", userId)
          .eq("organization_id", orgUuid)
          .maybeSingle()

        let isExternal = false
        if (userOrg?.organization_id) {
          const { data: org } = await supabaseAdmin
            .from("organizations")
            .select("is_internal_yn")
            .eq("id", userOrg.organization_id)
            .maybeSingle()
          isExternal = org?.is_internal_yn === false
        }

        const creatorRoleTypeId = isExternal ? 4 : 6 // Broker (4) or Account Executive (6)

        // Assign the creating user
        await supabaseAdmin.from("role_assignments").insert({
          resource_type: "loan",
          resource_id: loanId,
          role_type_id: creatorRoleTypeId,
          user_id: userId,
          organization_id: orgUuid,
          created_by: userId,
        })

        const assignedUserIds = [userId]

        // If external user (broker), mirror broker_org role assignments to the loan
        if (isExternal) {
          // Find the broker org ID (external org the user belongs to)
          const { data: extMemberships } = await supabaseAdmin
            .from("organization_members")
            .select("organization_id, organizations!inner(is_internal_yn)")
            .eq("user_id", userId)

          const brokerOrgId = (extMemberships ?? []).find(
            (m) => (m.organizations as any)?.is_internal_yn === false
          )?.organization_id as string | undefined

          if (brokerOrgId) {
            // Get role assignments configured on the broker org
            const { data: brokerOrgAssignments } = await supabaseAdmin
              .from("role_assignments")
              .select("role_type_id, user_id")
              .eq("resource_type", "broker_org")
              .eq("resource_id", brokerOrgId)

            for (const ba of brokerOrgAssignments ?? []) {
              const baUserId = ba.user_id as string
              if (baUserId === userId) continue // Already assigned above
              await supabaseAdmin.from("role_assignments").insert({
                resource_type: "loan",
                resource_id: loanId,
                role_type_id: ba.role_type_id,
                user_id: baUserId,
                organization_id: orgUuid,
                created_by: userId,
              }).then(() => {
                assignedUserIds.push(baUserId)
              }).catch(() => {
                // Skip duplicates or errors
              })
            }
          }
        }

        // Sync deal_users for chat filtering
        if (assignedUserIds.length > 0) {
          await supabaseAdmin
            .from("deal_users")
            .upsert(
              assignedUserIds.map((uid) => ({ deal_id: loanId!, user_id: uid })),
              { onConflict: "deal_id,user_id" }
            )
            .catch(() => {})
        }
      } catch {
        // Auto-assignment should not block loan creation
      }
    }

    // Compute primary = true when this is the first scenario for the loan
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
        created_by: userId,
        organization_id: orgUuid,
      })
      .select("id")
      .single()
    if (scenErr) {
      return NextResponse.json({ error: `Failed to save scenario: ${scenErr.message}` }, { status: 500 })
    }

    // Write to normalized tables
    if (scenario?.id && body.inputs) {
      await writeScenarioInputs(scenario.id as string, body.inputs)
    }
    if (scenario?.id && body.outputs) {
      await writeScenarioOutputs(
        scenario.id as string,
        body.outputs,
        body.selected as Record<string, unknown> | null | undefined
      )
    }

    // Log activity for new scenario creation - separate logs for inputs and selection
    try {
      // Always log input_changes for new scenario
      await supabaseAdmin.from("pricing_activity_log").insert({
        loan_id: loanId,
        scenario_id: scenario?.id ?? null,
        activity_type: "input_changes",
        action: "added",
        user_id: userId,
        inputs: body.inputs ?? null,
        outputs: body.outputs ?? null,
        selected: null,
      })

      // Log selection_changed if a selection was made
      if (body.selected && Object.keys(body.selected).length > 0) {
        await supabaseAdmin.from("pricing_activity_log").insert({
          loan_id: loanId,
          scenario_id: scenario?.id ?? null,
          activity_type: "selection_changed",
          action: "added",
          user_id: userId,
          inputs: null,
          outputs: body.outputs ?? null,
          selected: body.selected,
        })
      }
    } catch {
      // Activity logging should not block the main flow
    }

    return NextResponse.json({ loanId, scenarioId: scenario?.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


