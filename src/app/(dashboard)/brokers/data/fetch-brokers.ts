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

export async function getBrokersForOrg(orgId: string, userId?: string): Promise<BrokerRow[]> {
  if (!orgId) return []
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return []

  function logError(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }

  // Resolve this user's organization_member_id (may be null if not created yet)
  let orgMemberId: string | null = null
  if (userId) {
    const { data: m, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .maybeSingle()
    if (memErr) {
      logError("fetch org member error:", memErr.message)
    } else {
      orgMemberId = (m?.id as string) ?? null
    }
  }

  // 1) Brokers in this org where account_manager_ids contains this org member id
  let query = supabaseAdmin
    .from("brokers")
    .select("id, organization_id, organization_member_id, account_manager_ids, email, joined_at")
    .eq("organization_id", orgUuid)
  if (orgMemberId) {
    // Only brokers this member manages
    query = query.contains("account_manager_ids", [orgMemberId])
  }
  const { data: brokers, error: brokersErr } = await query.order("created_at", { ascending: true })

  if (brokersErr) {
    logError("fetch brokers error:", brokersErr.message)
    return []
  }
  const brokerRows = brokers ?? []
  if (brokerRows.length === 0) return []

  // Collect all member ids we need to resolve names/emails/companies (owner + managers)
  // Keep both original-case ids for DB querying and lowercase for robust map lookups.
  const memberIdsForQuery = new Set<string>()
  const memberIdsForMap = new Set<string>()
  for (const b of brokerRows) {
    const mid = b.organization_member_id as string | null
    if (mid) {
      memberIdsForQuery.add(String(mid))
      memberIdsForMap.add(String(mid).toLowerCase())
    }
    const mgrs = normalizeIdArray((b as any).account_manager_ids)
    for (const m of mgrs) {
      memberIdsForQuery.add(String(m))
      memberIdsForMap.add(String(m).toLowerCase())
    }
  }
  const memberIdsArr = Array.from(memberIdsForQuery)

  // Helper to normalize uuid[] that may arrive as Postgres array literal string like "{id1,id2}"
  function normalizeIdArray(value: unknown): string[] {
    if (Array.isArray(value)) return (value as unknown[]).map((v) => String(v))
    if (typeof value === "string") {
      let s = value.trim()
      if (s.startsWith("{") && s.endsWith("}")) s = s.slice(1, -1)
      if (s.length === 0) return []
      return s
        .split(",")
        .map((x) =>
          x
            .trim()
            // strip surrounding quotes
            .replace(/^"+|"+$/g, "")
            // strip stray braces
            .replace(/^\{+|\}+$/g, "")
        )
    }
    return []
  }
  function sanitizeUuid(id: string): string {
    return String(id)
      .trim()
      .replace(/^"+|"+$/g, "")
      .replace(/^\{+|\}+$/g, "")
  }

  // 2) Members in this org (resolve names/emails/company)
  const { data: members, error: membersErr } = await supabaseAdmin
    .from("organization_members")
    .select("id, organization_id, first_name, last_name, company")
    .in("id", memberIdsArr.length ? memberIdsArr : ["00000000-0000-0000-0000-000000000000"]) // safe guard

  if (membersErr) {
    logError("fetch members error:", membersErr.message)
  }
  const memberById = new Map<string, any>()
  for (const m of members ?? []) {
    const key = String(m.id).toLowerCase()
    memberById.set(key, m)
    // Also store the original-case key to be extra forgiving
    memberById.set(String(m.id), m)
  }

  // 3) Custom settings for brokers
  const brokerIds = brokerRows.map((b) => b.id as string)
  const { data: custom, error: customErr } = await supabaseAdmin
    .from("custom_broker_settings")
    .select('broker_id, \"default\"')
    .eq("organization_id", orgUuid)
    .in("broker_id", brokerIds.length ? brokerIds : ["00000000-0000-0000-0000-000000000000"])

  if (customErr) {
    logError("fetch custom settings error:", customErr.message)
  }
  const customByBroker = new Map<string, any>()
  for (const c of custom ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = c
    customByBroker.set(row.broker_id as string, row)
  }

  // Helper to resolve a member name; caches in memberById map
  async function resolveMemberName(memberId: string): Promise<string | null> {
    const idStr = sanitizeUuid(String(memberId))
    const lc = idStr.toLowerCase()
    let m = memberById.get(lc) ?? memberById.get(idStr)
    if (!m) {
      const { data, error } = await supabaseAdmin
        .from("organization_members")
        .select("id, first_name, last_name, company")
        .eq("id", idStr)
        .maybeSingle()
      if (error) {
        logError("lookup member error:", error.message)
      }
      if (data) {
        const keyOrig = sanitizeUuid(String(data.id))
        memberById.set(keyOrig.toLowerCase(), data)
        memberById.set(keyOrig, data)
        m = data
      }
    }
    if (!m) return null
    const name = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
    return name || null
  }

  // 4) Build rows
  const rows: BrokerRow[] = []
  for (const b of brokerRows) {
    const ownerName = b.organization_member_id
      ? await resolveMemberName(String(b.organization_member_id))
      : null
    const managersIds = normalizeIdArray((b as any).account_manager_ids)
    const managerNames = await Promise.all(managersIds.map((id) => resolveMemberName(String(id))))
    const managers =
      managerNames
        .map((nm, idx) => nm || String(managersIds[idx]))
        .filter(Boolean)
        .join(", ") || null

    const owner =
      b.organization_member_id
        ? memberById.get(String(b.organization_member_id).toLowerCase()) ??
          memberById.get(String(b.organization_member_id))
        : null

    const cs = customByBroker.get(b.id as string) as { default?: boolean } | undefined
    const permissions: BrokerPermission = cs ? (cs.default === false ? "custom" : "default") : "default"

    const status: BrokerStatus = owner ? "active" : "pending"

    rows.push({
      id: b.id as string,
      name: ownerName,
      company: (owner?.company as string) ?? null,
      // Prefer direct broker row email if present, else fall back to owner member email
      email: ((b as any).email as string | null) ?? ((owner?.email as string) ?? null),
      managers,
      permissions,
      status,
      joinedAt: (b.joined_at as string) ?? null,
    })
  }

  return rows
}


