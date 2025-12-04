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
  // Prefer selecting status from DB if the column exists; gracefully fall back if not.
  async function fetchBrokers(includeStatus: boolean) {
    let baseSelect =
      "id, organization_id, organization_member_id, account_manager_ids, email, joined_at, clerk_user_id" +
      (includeStatus ? ", status" : "")
    let q = supabaseAdmin.from("brokers").select(baseSelect).eq("organization_id", orgUuid)
    if (orgMemberId) {
      // Only brokers this member manages
      q = q.contains("account_manager_ids", [orgMemberId])
    }
    return q.order("created_at", { ascending: true })
  }

  let brokers: any[] | null = null
  {
    const { data, error } = await fetchBrokers(true)
    if (error) {
      const msg = String(error.message || "")
      // Retry without status column if it doesn't exist yet
      if (/column .*status.* does not exist/i.test(msg)) {
        const { data: data2, error: error2 } = await fetchBrokers(false)
        if (error2) {
          logError("fetch brokers error (no-status retry failed):", error2.message)
          return []
        }
        brokers = data2 ?? []
      } else {
        logError("fetch brokers error:", error.message)
        return []
      }
    } else {
      brokers = data ?? []
    }
  }
  const brokerRows = brokers ?? []
  if (brokerRows.length === 0) return []

  // Collect all member ids we need to resolve names/emails/companies (owner + managers)
  // Keep both original-case ids for DB querying and lowercase for robust map lookups.
  const memberIdsForQuery = new Set<string>()
  const memberIdsForMap = new Set<string>()
  const clerkUserIdsForQuery = new Set<string>()
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
    const cuid = (b as any).clerk_user_id as string | null
    if (cuid) {
      clerkUserIdsForQuery.add(String(cuid))
    }
  }
  const memberIdsArr = Array.from(memberIdsForQuery)
  const clerkUserIdsArr = Array.from(clerkUserIdsForQuery)

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
  // Fetch members by id
  const { data: membersById, error: membersErr } = await supabaseAdmin
    .from("organization_members")
    .select("id, organization_id, first_name, last_name, company, user_id")
    .in("id", memberIdsArr.length ? memberIdsArr : ["00000000-0000-0000-0000-000000000000"]) // safe guard
    .eq("organization_id", orgUuid)
  if (membersErr) {
    logError("fetch members by id error:", membersErr.message)
  }
  // Fetch members by user_id (for clerk_user_id fallback), scoped to this org
  const { data: membersByUserId, error: membersByUserErr } = await supabaseAdmin
    .from("organization_members")
    .select("id, organization_id, first_name, last_name, company, user_id")
    .in("user_id", clerkUserIdsArr.length ? clerkUserIdsArr : ["000000000000000000000000"]) // safe guard for text array
    .eq("organization_id", orgUuid)
  if (membersByUserErr) {
    logError("fetch members by user_id error:", membersByUserErr.message)
  }
  const memberById = new Map<string, any>()
  const memberByUserId = new Map<string, any>()
  for (const m of membersById ?? []) {
    const key = String(m.id).toLowerCase()
    memberById.set(key, m)
    memberById.set(String(m.id), m)
  }
  for (const m of membersByUserId ?? []) {
    if (m && (m as any).user_id) {
      memberByUserId.set(String((m as any).user_id), m)
    }
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
    // Resolve owner by org member id or by matching clerk_user_id -> organization_members.user_id
    let ownerName: string | null = null
    if (b.organization_member_id) {
      ownerName = await resolveMemberName(String(b.organization_member_id))
    }
    const managersIds = normalizeIdArray((b as any).account_manager_ids).map(sanitizeUuid).filter(Boolean)

    let managers: string | null = null
    if (managersIds.length > 0) {
      // Query organization_members directly for these exact IDs
      const { data: mgrMembers, error: mgrErr } = await supabaseAdmin
        .from("organization_members")
        .select("id, first_name, last_name")
        .in("id", managersIds)
      if (mgrErr) {
        logError("fetch managers by ids error:", mgrErr.message, managersIds)
      }
      const byId = new Map<string, { first_name: string | null; last_name: string | null }>()
      for (const m of mgrMembers ?? []) {
        const key = sanitizeUuid(String(m.id))
        byId.set(key, { first_name: m.first_name as string | null, last_name: m.last_name as string | null })
        // cache for future lookups
        memberById.set(key.toLowerCase(), m as any)
        memberById.set(key, m as any)
      }
      managers =
        managersIds
          .map((id) => {
            const m = byId.get(id)
            if (!m) return id
            const nm = [m.first_name ?? "", m.last_name ?? ""].join(" ").trim()
            return nm || id
          })
          .filter(Boolean)
          .join(", ") || null
    }

    // Resolve owner:
    // 1) Prefer linked organization_member_id
    // 2) Fallback: match brokers.clerk_user_id to organization_members.user_id within same org
    const ownerByMemberId =
      b.organization_member_id
        ? memberById.get(String(b.organization_member_id).toLowerCase()) ??
          memberById.get(String(b.organization_member_id))
        : null
    const ownerByClerkUser =
      ownerByMemberId || !(b as any).clerk_user_id
        ? null
        : memberByUserId.get(String((b as any).clerk_user_id))
    const owner = ownerByMemberId ?? ownerByClerkUser
    if (!ownerName && owner) {
      const nm = [owner.first_name ?? "", owner.last_name ?? ""].join(" ").trim()
      ownerName = nm || null
    }
    // FINAL FALLBACK (per explicit requirement):
    // If still no name, query organization_members directly by (organization_id, user_id == clerk_user_id)
    if (!ownerName && (b as any).clerk_user_id) {
      try {
        const { data: byCuid, error: byCuidErr } = await supabaseAdmin
          .from("organization_members")
          .select("first_name, last_name")
          .eq("organization_id", orgUuid)
          .eq("user_id", String((b as any).clerk_user_id))
          .maybeSingle()
        if (!byCuidErr && byCuid) {
          const nm = [byCuid.first_name ?? "", byCuid.last_name ?? ""].join(" ").trim()
          ownerName = nm || null
        }
      } catch {
        // ignore
      }
    }

    const cs = customByBroker.get(b.id as string) as { default?: boolean } | undefined
    const permissions: BrokerPermission = cs ? (cs.default === false ? "custom" : "default") : "default"

    // Prefer DB-driven status if present; else fall back to derived behavior
    const dbStatusRaw = (b as any).status as string | undefined
    const dbStatus =
      dbStatusRaw === "active" || dbStatusRaw === "inactive" || dbStatusRaw === "pending"
        ? (dbStatusRaw as BrokerStatus)
        : undefined
    const status: BrokerStatus = dbStatus ?? (owner ? "active" : "pending")

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


