import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export type BrokerPermission = "default" | "custom"
export type BrokerStatus = "active" | "inactive" | "pending"

export interface BrokerRow {
  id: string
  name: string | null
  company: string | null
  email: string | null
  managers: string | null
  permissions: BrokerPermission
  status: BrokerStatus
  joinedAt: string | null
}

export async function getBrokersForOrg(orgId: string): Promise<BrokerRow[]> {
  if (!orgId) return []
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return []

  function logError(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }

  // 1) Brokers in this org
  const { data: brokers, error: brokersErr } = await supabaseAdmin
    .from("brokers")
    .select("id, organization_id, organization_member_id, account_manager_ids, joined_at")
    .eq("organization_id", orgUuid)
    .order("created_at", { ascending: true })

  if (brokersErr) {
    logError("fetch brokers error:", brokersErr.message)
    return []
  }
  const brokerRows = brokers ?? []
  if (brokerRows.length === 0) return []

  // Collect all member ids we need to resolve names/emails/companies (owner + managers)
  const memberIds = new Set<string>()
  for (const b of brokerRows) {
    const mid = b.organization_member_id as string | null
    if (mid) memberIds.add(mid)
    const mgrs = (b.account_manager_ids as string[] | null) ?? []
    for (const m of mgrs) memberIds.add(m)
  }
  const memberIdsArr = Array.from(memberIds)

  // 2) Members in this org (resolve names/emails/company/status)
  const { data: members, error: membersErr } = await supabaseAdmin
    .from("organization_members")
    .select("id, first_name, last_name, company, email, status")
    .eq("organization_id", orgUuid)
    .in("id", memberIdsArr.length ? memberIdsArr : ["00000000-0000-0000-0000-000000000000"]) // safe guard

  if (membersErr) {
    logError("fetch members error:", membersErr.message)
  }
  const memberById = new Map<string, any>()
  for (const m of members ?? []) {
    memberById.set(m.id as string, m)
  }

  // 3) Custom settings for brokers
  const brokerIds = brokerRows.map((b) => b.id as string)
  const { data: custom, error: customErr } = await supabaseAdmin
    .from("custom_broker_settings")
    .select("broker_id, is_default")
    .eq("organization_id", orgUuid)
    .in("broker_id", brokerIds.length ? brokerIds : ["00000000-0000-0000-0000-000000000000"])

  if (customErr) {
    logError("fetch custom settings error:", customErr.message)
  }
  const customByBroker = new Map<string, any>()
  for (const c of custom ?? []) {
    customByBroker.set(c.broker_id as string, c)
  }

  // 4) Build rows
  const rows: BrokerRow[] = brokerRows.map((b) => {
    const owner = b.organization_member_id ? memberById.get(b.organization_member_id as string) : null
    const fullName =
      owner ? [owner.first_name, owner.last_name].filter(Boolean).join(" ").trim() || null : null
    const managers = ((b.account_manager_ids as string[] | null) ?? [])
      .map((id) => {
        const m = memberById.get(id)
        if (!m) return null
        const nm = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
        return nm || null
      })
      .filter(Boolean)
      .join(", ") || null

    const cs = customByBroker.get(b.id as string) as { is_default?: boolean } | undefined
    const permissions: BrokerPermission = cs
      ? cs.is_default === false
        ? "custom"
        : "default"
      : "default"

    let status: BrokerStatus = "pending"
    if (owner?.status) {
      const s = String(owner.status).toLowerCase()
      status = s === "active" ? "active" : s === "inactive" ? "inactive" : "pending"
    }

    return {
      id: b.id as string,
      name: fullName,
      company: (owner?.company as string) ?? null,
      email: (owner?.email as string) ?? null,
      managers,
      permissions,
      status,
      joinedAt: (b.joined_at as string) ?? null,
    }
  })

  return rows
}


