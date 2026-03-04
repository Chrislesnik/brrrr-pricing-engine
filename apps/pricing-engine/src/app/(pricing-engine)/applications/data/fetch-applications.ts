import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"

export type ApplicationRow = {
  id: string
  displayId: string | null
  appDisplayId: string | null
  entityId: string | null
  propertyAddress: string | null
  borrowerEntityName: string | null
  showBorrowerEntity: boolean
  guarantors: Array<{ id: string; name: string; email: string | null }> | null
  status: string | null
  updatedAt: string | null
  signingProgressPct: number
  signingSigned: number
  signingTotal: number
  signedEmails: string[]
  sentEmails: string[]
}

function extractIds(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((v) => typeof v === "string" && v.length > 0)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string" && v.length > 0)
    } catch {
      return []
    }
  }
  if (typeof raw === "object") {
    return (Object.values(raw as Record<string, unknown>) as unknown[])
      .filter((v) => typeof v === "string" && v.length > 0) as string[]
  }
  return []
}

export async function getApplicationsForOrg(orgUuid: string, userId?: string): Promise<ApplicationRow[]> {
  // If no user, return empty (matching pipeline behavior)
  if (!userId) {
    return []
  }

  // Check user's role - admin/owner sees all applications
  const userRole = await getUserRoleInOrg(orgUuid, userId)
  const hasFullAccess = isPrivilegedRole(userRole)

  let data: any[] | null = null
  let error: any = null

  if (hasFullAccess) {
    // Admin/owner: fetch ALL applications for the org (no filtering by assignment)
    const result = await supabaseAdmin
      .from("applications")
      .select(
        "loan_id, display_id, organization_id, property_street, property_city, property_state, property_zip, borrower_name, guarantor_names, guarantor_emails, status, updated_at, entity_id, guarantor_ids"
      )
      .eq("organization_id", orgUuid)
      .order("updated_at", { ascending: false })
    data = result.data
    error = result.error
  } else {
    // Other roles: filter by assigned loans
    const { data: assignedLoans, error: loansError } = await supabaseAdmin
      .from("deals")
      .select("id, assigned_to_user_id")
      .eq("organization_id", orgUuid)

    if (loansError) {
      return []
    }

    const assignedLoanIds = (assignedLoans ?? [])
      .filter((l) => {
        const arr = Array.isArray(l.assigned_to_user_id) ? (l.assigned_to_user_id as string[]) : []
        return arr.includes(userId)
      })
      .map((l) => l.id as string)

    if (assignedLoanIds.length === 0) {
      return []
    }

    const result = await supabaseAdmin
      .from("applications")
      .select(
        "loan_id, display_id, organization_id, property_street, property_city, property_state, property_zip, borrower_name, guarantor_names, guarantor_emails, status, updated_at, entity_id, guarantor_ids"
      )
      .eq("organization_id", orgUuid)
      .in("loan_id", assignedLoanIds)
      .order("updated_at", { ascending: false })
    data = result.data
    error = result.error
  }

  if (error) {
     
    console.error("getApplicationsForOrg error", error.message)
    return []
  }
  const rows = (data ?? []) as any[]
  const loanIds = rows.map((r) => r.loan_id as string)

  // Fetch display_id from loans table for each loan
  let displayIdMap: Record<string, string> = {}
  if (loanIds.length) {
    const { data: loansData } = await supabaseAdmin
      .from("loans")
      .select("id, display_id")
      .in("id", loanIds)
    displayIdMap = Object.fromEntries(
      (loansData ?? []).map((l) => [l.id as string, (l as any).display_id as string])
    )
  }

  const guarantorTotals: Record<string, number> = {}
  rows.forEach((r) => {
    const names = Array.isArray(r.guarantor_names) ? (r.guarantor_names as string[]) : []
    guarantorTotals[r.loan_id as string] = names.length
  })

  let signedCounts: Record<string, number> = {}
  let signedEmailsMap: Record<string, string[]> = {}
  let sentEmailsMap: Record<string, string[]> = {}
  if (loanIds.length) {
    const { data: signings } = await supabaseAdmin
      .from("application_signings")
      .select("loan_id, signer_email")
      .in("loan_id", loanIds)
    signedCounts = (signings ?? []).reduce((acc: Record<string, number>, row: any) => {
      const loanId = row.loan_id as string
      acc[loanId] = (acc[loanId] ?? 0) + 1
      return acc
    }, {})
    signedEmailsMap = (signings ?? []).reduce((acc: Record<string, string[]>, row: any) => {
      const loanId = row.loan_id as string
      const email = (row.signer_email as string | null)?.toLowerCase() ?? null
      if (!email) return acc
      if (!acc[loanId]) acc[loanId] = []
      if (!acc[loanId].includes(email)) acc[loanId].push(email)
      return acc
    }, {})

    // Fetch sent emails from applications_emails_sent table
    const { data: sentEmailsData } = await supabaseAdmin
      .from("applications_emails_sent")
      .select("loan_id, email")
      .in("loan_id", loanIds)
    sentEmailsMap = (sentEmailsData ?? []).reduce((acc: Record<string, string[]>, row: any) => {
      const loanId = row.loan_id as string
      const email = (row.email as string | null)?.toLowerCase() ?? null
      if (!email) return acc
      if (!acc[loanId]) acc[loanId] = []
      if (!acc[loanId].includes(email)) acc[loanId].push(email)
      return acc
    }, {})
  }

  // Fetch entities for rows that have entity_id
  const entityIds = rows
    .map((r) => (r.entity_id as string | null) ?? null)
    .filter((v): v is string => typeof v === "string" && v.length > 0)

  let entityMap: Record<string, { name: string | null }> = {}
  if (entityIds.length) {
    const { data: entities } = await supabaseAdmin.from("entities").select("id, entity_name").in("id", entityIds)
    entityMap = Object.fromEntries((entities ?? []).map((e) => [e.id as string, { name: (e.entity_name as string) ?? null }]))
  }

  // Fetch primary scenarios for rows without entity_id to read borrower_type
  const loanIdsNeedingScenario = rows
    .filter((r) => !r.entity_id)
    .map((r) => r.loan_id as string)
    .filter((v): v is string => !!v)

  let scenarioMap: Record<string, any> = {}
  if (loanIdsNeedingScenario.length) {
    // Read borrower_type from normalized loan_scenario_inputs for primary scenarios
    const { data: primaryScenarios } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id, loan_id")
      .in("loan_id", loanIdsNeedingScenario)
      .eq("primary", true)

    const scenarioIds = (primaryScenarios ?? []).map((s) => s.id as string)
    const loanByScenario = Object.fromEntries(
      (primaryScenarios ?? []).map((s) => [s.id as string, s.loan_id as string])
    )

    if (scenarioIds.length) {
      const { data: inputRows } = await supabaseAdmin
        .from("loan_scenario_inputs")
        .select("loan_scenario_id, value_text, pricing_engine_inputs!inner(input_code)")
        .in("loan_scenario_id", scenarioIds)
        .eq("pricing_engine_inputs.input_code", "borrower_type")

      for (const row of inputRows ?? []) {
        const loanId = loanByScenario[row.loan_scenario_id as string]
        if (loanId) {
          scenarioMap[loanId] = { borrower_type: row.value_text }
        }
      }
    }
  }

  // Gather all guarantor_ids to resolve names/emails from borrowers
  const guarantorIds = rows
    .flatMap((r) => extractIds(r.guarantor_ids))
    .filter((v): v is string => typeof v === "string" && v.length > 0)

  let guarantorMap: Record<string, { name: string; email: string | null }> = {}
  if (guarantorIds.length) {
    const { data: borrowers } = await supabaseAdmin
      .from("borrowers")
      .select("id, first_name, last_name, email")
      .in("id", guarantorIds)
    guarantorMap = Object.fromEntries(
      (borrowers ?? []).map((b) => [
        b.id as string,
        {
          name: [b.first_name ?? "", b.last_name ?? ""].filter(Boolean).join(" ").trim(),
          email: (b.email as string) ?? null,
        },
      ])
    )
  }

  return rows.map((r) => {
    const stateZip = [r.property_state, r.property_zip].filter((p: string) => (p ?? "").toString().trim().length > 0).join(" ")
    const addrParts = [r.property_street, r.property_city, stateZip].filter(
      (p: string) => (p ?? "").toString().trim().length > 0
    )
    const address = addrParts.length ? addrParts.join(", ") : null

    let borrowerEntityName: string | null = null
    let showBorrowerEntity = true

    if (r.entity_id) {
      borrowerEntityName = entityMap[r.entity_id]?.name ?? (r.borrower_name as string) ?? null
    } else {
      const inputs = scenarioMap[r.loan_id]
      const borrowerType = (inputs?.borrower_type as string | undefined)?.toLowerCase()
      if (borrowerType === "individual") {
        showBorrowerEntity = false
      } else if (borrowerType === "entity") {
        borrowerEntityName = (r.borrower_name as string) ?? null
      } else {
        borrowerEntityName = (r.borrower_name as string) ?? null
      }
    }

    const idsForRow = Array.isArray(r.guarantor_ids)
      ? (r.guarantor_ids as any[]).map((v) => (v != null ? String(v) : "")).filter((v) => v.length > 0)
      : extractIds(r.guarantor_ids)
    const namesForRow = Array.isArray(r.guarantor_names) ? (r.guarantor_names as string[]) : []
    const emailsForRow = Array.isArray(r.guarantor_emails) ? (r.guarantor_emails as string[]) : []
    const resolvedGuarantors: Array<{ id: string; name: string; email: string | null }> = []

    idsForRow.forEach((id, idx) => {
      resolvedGuarantors.push({
        id,
        name: guarantorMap[id]?.name || namesForRow[idx] || id,
        email: guarantorMap[id]?.email || emailsForRow[idx] || null,
      })
    })

    if (namesForRow.length) {
      namesForRow.forEach((n, idx) => {
        const fallbackId = `guarantor-name-${idx + 1}`
        // Only add if there is no matching resolved guarantor occupying this slot
        if (!resolvedGuarantors[idx]) {
          resolvedGuarantors.push({
            id: fallbackId,
            name: n,
            email: emailsForRow[idx] ?? null,
          })
        }
      })
    }

    return {
      id: String(r.loan_id),
      displayId: displayIdMap[r.loan_id] ?? null,
      appDisplayId: (r.display_id as string) ?? null,
      entityId: (r.entity_id as string | null) ?? null,
      propertyAddress: address,
      borrowerEntityName,
      showBorrowerEntity,
      guarantors: resolvedGuarantors,
      status: (r.status as string) ?? null,
      updatedAt: (r.updated_at as string) ?? null,
      signingSigned: signedCounts[r.loan_id] ?? 0,
      signingTotal: guarantorTotals[r.loan_id] ?? 0,
      signingProgressPct: (() => {
        const total = guarantorTotals[r.loan_id] ?? 0
        if (total <= 0) return 0
        const signed = signedCounts[r.loan_id] ?? 0
        return Math.min(1, Math.max(0, signed / total))
      })(),
      signedEmails: signedEmailsMap[r.loan_id] ?? [],
      sentEmails: sentEmailsMap[r.loan_id] ?? [],
    } as ApplicationRow
  })
}





