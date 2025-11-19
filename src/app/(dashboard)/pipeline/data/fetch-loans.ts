import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export interface LoanRow {
  id: string
  status: "active" | "dead"
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  // Spread of primary scenario inputs (unknown shape)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export async function getPipelineLoansForOrg(orgId: string): Promise<LoanRow[]> {
  if (!orgId) return []
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return []

  // Centralized error logger (one-time no-console exemption)
  function logError(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }

  // 1) Fetch loans scoped to organization
  const { data: loans, error: loansError } = await supabaseAdmin
    .from("loans")
    .select("id,status,assigned_to_user_id,organization_id,created_at,updated_at")
    .eq("organization_id", orgUuid)
    .order("updated_at", { ascending: false })

  if (loansError) {
    logError("Error fetching loans:", loansError.message)
    return []
  }
  if (!loans || loans.length === 0) return []

  const loanIds = loans.map((l) => l.id as string)

  // 2) Fetch primary scenarios for these loans
  const { data: scenarios, error: scenariosError } = await supabaseAdmin
    .from("loan_scenarios")
    .select("loan_id, inputs")
    .in("loan_id", loanIds)
    .eq("primary", true)

  if (scenariosError) {
    logError("Error fetching loan scenarios:", scenariosError.message)
  }
  const loanIdToInputs = new Map<string, Record<string, unknown>>()
  for (const s of scenarios ?? []) {
    loanIdToInputs.set(s.loan_id as string, (s.inputs as Record<string, unknown>) ?? {})
  }

  // 3) Fetch organization members to resolve assigned_to_user_id -> user name
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

  // 4) Merge into final rows
  const rows: LoanRow[] = loans.map((l) => {
    const inputs = loanIdToInputs.get(l.id as string) ?? {}
    const assignedToUserId = (l.assigned_to_user_id as string) ?? null
    const assignedToName =
      assignedToUserId ? userIdToName.get(assignedToUserId) ?? assignedToUserId : null

    return {
      id: l.id as string,
      status: l.status as "active" | "dead",
      assignedTo: assignedToName,
      createdAt: l.created_at as string,
      updatedAt: l.updated_at as string,
      ...(inputs as Record<string, unknown>),
    }
  })

  return rows
}


