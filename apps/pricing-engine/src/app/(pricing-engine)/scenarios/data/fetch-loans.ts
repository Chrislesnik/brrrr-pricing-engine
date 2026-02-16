import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId, getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"

export interface LoanRow {
  id: string
  displayId: string
  status: "active" | "inactive" | "archived"
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  // Spread of primary scenario inputs (unknown shape)
   
  [key: string]: any
}

export async function getPipelineLoansForOrg(orgId: string, userId?: string): Promise<LoanRow[]> {
  if (!orgId) return []
  // If no user is provided, show nothing per requirement
  if (!userId) return []


  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return []

  // Centralized error logger (one-time no-console exemption)
  function logError(...args: unknown[]) {
     
    console.error(...args)
  }

  // 1) Fetch loans scoped to organization
  const { data: loansRaw, error: loansError } = await supabaseAdmin
    .from("loans")
    .select("id,display_id,status,assigned_to_user_id,organization_id,created_at,updated_at,archived_at")
    .eq("organization_id", orgUuid)
    .order("updated_at", { ascending: false })


  if (loansError) {
    logError("Error fetching loans:", loansError.message)
    return []
  }


  // Check user's role - admin/owner sees all loans
  const userRole = await getUserRoleInOrg(orgUuid, userId)
  const hasFullAccess = isPrivilegedRole(userRole)

  // Filter by assignment to current user (assigned_to_user_id is a jsonb array of Clerk user IDs)
  // Admin/owner: skip filtering and show all loans
  const loans = hasFullAccess
    ? (loansRaw ?? [])
    : (loansRaw ?? []).filter((l) => {
        const arr = Array.isArray(l.assigned_to_user_id) ? (l.assigned_to_user_id as string[]) : []
        return arr.includes(userId)
      })
  if (loans.length === 0) return []

  const loanIds = loans.map((l) => l.id as string)

  // 2) Fetch scenarios for these loans. Prefer the primary one; if none is
  // marked primary, fall back to the most recently created scenario per loan.
  const { data: scenarios, error: scenariosError } = await supabaseAdmin
    .from("loan_scenarios")
    .select("loan_id, inputs, selected, primary, created_at")
    .in("loan_id", loanIds)
    .order("primary", { ascending: false })
    .order("created_at", { ascending: false })


  if (scenariosError) {
    logError("Error fetching loan scenarios:", scenariosError.message)
  }

  type ScenarioRow = {
    loan_id: string
     
    inputs?: Record<string, any>
     
    selected?: Record<string, any> | null
    primary?: boolean | null
    created_at?: string
  }
  const loanIdToScenario = new Map<string, ScenarioRow>()
  for (const s of (scenarios ?? []) as ScenarioRow[]) {
    const lid = s.loan_id as string
    // Because we ordered by primary DESC then created_at DESC, the first
    // scenario encountered for a loan is the one we want to display.
    if (!loanIdToScenario.has(lid)) {
      loanIdToScenario.set(lid, {
        loan_id: lid,
        inputs: (s.inputs as Record<string, unknown>) ?? {},
        selected: (s.selected as Record<string, unknown>) ?? {},
        primary: (s as any)?.primary ?? null,
        created_at: (s as any)?.created_at as string | undefined,
      })
    }
  }

  // 3) Fetch role assignments for these loans to resolve names
  const { data: roleAssignmentsRaw, error: raError } = await supabaseAdmin
    .from("role_assignments")
    .select("resource_id, user_id")
    .eq("resource_type", "loan")
    .in("resource_id", loanIds)

  if (raError) {
    logError("Error fetching role_assignments:", raError.message)
  }

  // Build a map of loan_id -> set of user_ids from role_assignments
  const loanToUserIds = new Map<string, Set<string>>()
  for (const ra of roleAssignmentsRaw ?? []) {
    const lid = ra.resource_id as string
    if (!loanToUserIds.has(lid)) loanToUserIds.set(lid, new Set())
    loanToUserIds.get(lid)!.add(ra.user_id as string)
  }

  // Also collect all user_ids that need name resolution
  const allAssignedUserIds = new Set<string>()
  for (const ra of roleAssignmentsRaw ?? []) {
    allAssignedUserIds.add(ra.user_id as string)
  }
  // Fallback: also include legacy assigned_to_user_id in case role_assignments is empty
  for (const l of loans) {
    const arr = Array.isArray(l.assigned_to_user_id) ? (l.assigned_to_user_id as string[]) : []
    for (const uid of arr) allAssignedUserIds.add(uid)
  }

  // Fetch organization members to resolve user names
  const { data: members, error: membersError } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, first_name, last_name")
    .eq("organization_id", orgUuid)

  if (membersError) {
    logError("Error fetching organization members:", membersError.message)
  }

  const userIdToName = new Map<string, string>()
  for (const m of members ?? []) {
    const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
    if (m.user_id) {
      userIdToName.set(m.user_id, fullName || m.user_id)
    }
  }

  // For cross-org members not found in our org, do an additional lookup
  const missingUserIds = [...allAssignedUserIds].filter((uid) => !userIdToName.has(uid))
  if (missingUserIds.length > 0) {
    const { data: crossOrgMembers } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, first_name, last_name")
      .in("user_id", missingUserIds)
    for (const m of crossOrgMembers ?? []) {
      const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
      if (m.user_id && !userIdToName.has(m.user_id as string)) {
        userIdToName.set(m.user_id as string, fullName || (m.user_id as string))
      }
    }
  }

  // 4) Merge into final rows
  const rows: LoanRow[] = loans.map((l) => {
    const scenario = loanIdToScenario.get(l.id as string)
    const inputs = (scenario?.inputs as Record<string, unknown>) ?? {}
    const selected = (scenario?.selected as Record<string, unknown>) ?? {}
    // Prefer role_assignments, fallback to legacy column
    const raUserIds = loanToUserIds.get(l.id as string)
    const assignedToUserIds = raUserIds && raUserIds.size > 0
      ? [...raUserIds]
      : (Array.isArray(l.assigned_to_user_id) ? (l.assigned_to_user_id as string[]) : [])
    const assignedToNames = assignedToUserIds.map((id) => userIdToName.get(id) ?? id)
    const assignedToDisplay = assignedToNames.length ? assignedToNames.join(", ") : null

    return {
      id: l.id as string,
      displayId: (l as any).display_id as string,
      status: (l as any).archived_at ? "archived" : (l.status as "active" | "inactive"),
      assignedTo: assignedToDisplay,
      createdAt: l.created_at as string,
      updatedAt: l.updated_at as string,
      // Derived columns for the pipeline table
      propertyAddress: (() => {
        const addr = inputs["address"] as { street?: string; city?: string; state?: string; zip?: string } | undefined
        if (!addr) return undefined
        const street = addr.street ?? ""
        const city = addr.city ?? ""
        const state = addr.state ?? ""
        const zip = addr.zip ?? ""
        const stateZip =
          state && zip
            ? `${state} ${zip}`
            : [state, zip].filter(Boolean).join(" ")
        const parts = [street, city, stateZip].filter((p) => String(p).trim().length > 0)
        return parts.length ? parts.join(", ") : undefined
      })(),
      borrowerFirstName: (inputs["borrower_name"] as string | undefined)?.split(" ")[0],
      borrowerLastName: (() => {
        const name = inputs["borrower_name"] as string | undefined
        if (!name) return undefined
        const parts = name.trim().split(/\s+/)
        return parts.length > 1 ? parts.slice(1).join(" ") : undefined
      })(),
      guarantors: Array.isArray(inputs["guarantors"]) ? (inputs["guarantors"] as string[]) : [],
      loanType: inputs["loan_type"] as string | undefined,
      transactionType: inputs["transaction_type"] as string | undefined,
      loanAmount: (() => {
        // support both selected.loan_amount and legacy selected.loanAmount
        const v = (selected["loan_amount"] ?? selected["loanAmount"]) as string | number | undefined
        const num = typeof v === "string" ? Number(v.toString().replace(/[$,]/g, "")) : (v as number | undefined)
        return Number.isFinite(num as number) ? (num as number) : undefined
      })(),
      rate: (() => {
        // support both selected.rate and legacy selected.interestRate
        const v = (selected["rate"] ?? selected["interestRate"]) as string | number | undefined
        const num = typeof v === "string" ? Number(v.toString().replace(/[%]/g, "")) : (v as number | undefined)
        return Number.isFinite(num as number) ? (num as number) : undefined
      })(),
      ...(inputs as Record<string, unknown>),
    }
  })

  return rows
}


