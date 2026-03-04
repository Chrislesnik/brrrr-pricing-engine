import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const { searchParams } = new URL(req.url)
    const loanId = searchParams.get("loanId")
    const includeUserIdsParam = searchParams.get("includeUserIds")
    const includeUserIds = includeUserIdsParam ? includeUserIdsParam.split(",").map((s) => s.trim()).filter(Boolean) : []
    const includeMemberIdsParam = searchParams.get("includeMemberIds")
    const includeMemberIds = includeMemberIdsParam ? includeMemberIdsParam.split(",").map((s) => s.trim()).filter(Boolean) : []
    const roleTypeIdParam = searchParams.get("roleTypeId")
    const roleTypeId = roleTypeIdParam ? parseInt(roleTypeIdParam, 10) : null

    // Resolve current member/role and org type
    const { data: me, error: meErr } = await supabaseAdmin
      .from("organization_members")
      .select("id, user_id, clerk_org_role")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .maybeSingle()
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 })
    const myRole = String((me as any)?.clerk_org_role ?? "").toLowerCase()
    const myMemberId = (me?.id as string) ?? null

    // Check if caller's org is internal
    const { data: callerOrg } = await supabaseAdmin
      .from("organizations")
      .select("id, is_internal_yn")
      .eq("id", orgUuid)
      .single()
    const isInternalOrg = callerOrg?.is_internal_yn === true

    let members: Array<{ id: string; user_id: string; first_name?: string | null; last_name?: string | null }> = []
    let editable = true

    // Internal org users: see members from ALL internal orgs (+ external for Broker role)
    if (isInternalOrg && myRole !== "broker") {
      // Fetch all internal org IDs
      const { data: allInternalOrgs } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("is_internal_yn", true)
      const internalOrgIds = (allInternalOrgs ?? []).map((o) => o.id as string)

      // Fetch members from all internal orgs, dedup by user_id
      if (internalOrgIds.length > 0) {
        const { data: internalMembers } = await supabaseAdmin
          .from("organization_members")
          .select("id, user_id, first_name, last_name")
          .in("organization_id", internalOrgIds)
          .order("first_name", { ascending: true })
        const seenUserIds = new Set<string>()
        for (const m of internalMembers ?? []) {
          const uid = m.user_id as string
          if (seenUserIds.has(uid)) continue
          seenUserIds.add(uid)
          members.push({
            id: m.id as string,
            user_id: uid,
            first_name: (m.first_name as string | null) ?? "",
            last_name: (m.last_name as string | null) ?? "",
          })
        }
      }

      // For Broker role, also include external org members
      if (roleTypeId === 4) {
        const { data: externalOrgs } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("is_internal_yn", false)
        const extOrgIds = (externalOrgs ?? []).map((o) => o.id as string)
        if (extOrgIds.length > 0) {
          const { data: brokerMembers } = await supabaseAdmin
            .from("organization_members")
            .select("id, user_id, first_name, last_name")
            .in("organization_id", extOrgIds)
            .order("first_name", { ascending: true })
          const existingUserIds = new Set(members.map((m) => m.user_id))
          for (const m of brokerMembers ?? []) {
            const uid = m.user_id as string
            if (existingUserIds.has(uid)) continue
            existingUserIds.add(uid)
            members.push({
              id: m.id as string,
              user_id: uid,
              first_name: (m.first_name as string | null) ?? "",
              last_name: (m.last_name as string | null) ?? "",
            })
          }
        }
      }
    } else if (myRole === "broker") {
      editable = false
      if (loanId) {
        const { data: loan, error: loanErr } = await supabaseAdmin
          .from("deals")
          .select("assigned_to_user_id, organization_id")
          .eq("id", loanId)
          .maybeSingle()
        if (loanErr) return NextResponse.json({ error: loanErr.message }, { status: 500 })
        const assigned = Array.isArray((loan as any)?.assigned_to_user_id)
          ? (((loan as any).assigned_to_user_id as string[]) ?? [])
          : []
        if (assigned.length > 0) {
          const { data, error } = await supabaseAdmin
            .from("organization_members")
          .select("id, user_id, first_name, last_name")
            .eq("organization_id", orgUuid)
            .in("user_id", assigned)
          if (error) return NextResponse.json({ error: error.message }, { status: 500 })
          members = (data ?? []) as any
        }
        // Brokers should also see the org owner(s)
        const { data: owners, error: ownersErr } = await supabaseAdmin
          .from("organization_members")
          .select("id, user_id, first_name, last_name")
          .eq("organization_id", orgUuid)
          .eq("clerk_org_role", "owner")
        if (ownersErr) return NextResponse.json({ error: ownersErr.message }, { status: 500 })
        for (const o of owners ?? []) {
          members.push({
            id: o.id as string,
            user_id: o.user_id as string,
            first_name: (o.first_name as string | null) ?? "",
            last_name: (o.last_name as string | null) ?? "",
          })
        }
      }
    } else if (myRole === "owner") {
      const { data, error } = await supabaseAdmin
        .from("organization_members")
        .select("id, user_id, first_name, last_name")
        .eq("organization_id", orgUuid)
        .order("first_name", { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      members = (data ?? []) as any
    } else {
      // loan_officer or loan_processor (or others): include owners, loan_officers, loan_processors
      const baseRoles = ["owner", "loan_officer", "loan_processor"]
      const { data: baseMembers, error: baseErr } = await supabaseAdmin
        .from("organization_members")
        .select("id, user_id, first_name, last_name, clerk_org_role")
        .eq("organization_id", orgUuid)
        .in("clerk_org_role", baseRoles)
      if (baseErr) return NextResponse.json({ error: baseErr.message }, { status: 500 })
      members = (baseMembers ?? []).map((m) => ({
        id: m.id as string,
        user_id: m.user_id as string,
        first_name: (m.first_name as string | null) ?? "",
        last_name: (m.last_name as string | null) ?? "",
      }))

      // Add brokers managed by this member
      if (myMemberId) {
        const { data: brokerRows, error: brokersErr } = await supabaseAdmin
          .from("brokers")
          .select("organization_member_id")
          .eq("organization_id", orgUuid)
          .contains("account_manager_ids", [myMemberId])
        if (brokersErr) return NextResponse.json({ error: brokersErr.message }, { status: 500 })
        const brokerMemberIds = (brokerRows ?? [])
          .map((b) => (b as any).organization_member_id as string | null)
          .filter(Boolean)
        if (brokerMemberIds.length > 0) {
          const { data: brokersMembers, error: orgErr } = await supabaseAdmin
            .from("organization_members")
          .select("id, user_id, first_name, last_name")
            .eq("organization_id", orgUuid)
            .in("id", brokerMemberIds)
          if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
          for (const m of brokersMembers ?? []) {
            members.push({
              id: m.id as string,
              user_id: m.user_id as string,
              first_name: (m.first_name as string | null) ?? "",
              last_name: (m.last_name as string | null) ?? "",
            })
          }
        }
      }
    }

    // Ensure we can resolve names for any explicitly included user or member ids
    if (includeUserIds.length > 0) {
      const missing = includeUserIds.filter((uid) => !members.some((m) => String(m.user_id) === uid))
      if (missing.length > 0) {
        const { data: extra, error: extraErr } = await supabaseAdmin
          .from("organization_members")
          .select("id, user_id, first_name, last_name")
          .eq("organization_id", orgUuid)
          .or(`user_id.in.(${missing.join(",")}),id.in.(${missing.join(",")})`)
        if (!extraErr) {
          for (const m of extra ?? []) {
            members.push({
              id: m.id as string,
              user_id: m.user_id as string,
              first_name: (m.first_name as string | null) ?? "",
              last_name: (m.last_name as string | null) ?? "",
            })
          }
        }
      }
    }
    if (includeMemberIds.length > 0) {
      const missingMembers = includeMemberIds.filter((mid) => !members.some((m) => String(m.id) === mid))
      if (missingMembers.length > 0) {
        const { data: extraM, error: extraMErr } = await supabaseAdmin
          .from("organization_members")
          .select("id, user_id, first_name, last_name")
          .eq("organization_id", orgUuid)
          .in("id", missingMembers)
        if (!extraMErr) {
          for (const m of extraM ?? []) {
            members.push({
              id: m.id as string,
              user_id: m.user_id as string,
              first_name: (m.first_name as string | null) ?? "",
              last_name: (m.last_name as string | null) ?? "",
            })
          }
        }
      }
    }

    // Deduplicate by member id (fallback user_id)
    const seen = new Set<string>()
    let deduped = members.filter((m) => {
      const id = String(m.id ?? m.user_id)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // Enrich names for all relevant user_ids (assigned + includeUserIds) using org members first, then users
    const allUserIds = Array.from(
      new Set([
        ...deduped.map((m) => m.user_id).filter(Boolean),
        ...includeUserIds,
      ])
    )

    if (allUserIds.length > 0) {
      try {
        // 1) Look up names in organization_members for this org
        const { data: orgRows } = await supabaseAdmin
          .from("organization_members")
          .select("user_id, first_name, last_name")
          .eq("organization_id", orgUuid)
          .in("user_id", allUserIds)

        const nameMap = new Map<string, { first_name: string | null; last_name: string | null }>()
        for (const row of orgRows ?? []) {
          nameMap.set(row.user_id as string, {
            first_name: (row.first_name as string | null) ?? null,
            last_name: (row.last_name as string | null) ?? null,
          })
        }

        // 2) For any still missing, look up in public.users by clerk_user_id
        const missingAfterOrg = allUserIds.filter((uid) => !nameMap.has(uid))
        if (missingAfterOrg.length > 0) {
          const { data: userRows } = await supabaseAdmin
            .from("users")
            .select("clerk_user_id, first_name, last_name")
            .in("clerk_user_id", missingAfterOrg)
          for (const row of userRows ?? []) {
            nameMap.set(row.clerk_user_id as string, {
              first_name: (row.first_name as string | null) ?? null,
              last_name: (row.last_name as string | null) ?? null,
            })
          }
        }

        if (nameMap.size > 0) {
          deduped = deduped.map((m) => {
            if (nameMap.has(m.user_id)) {
              const names = nameMap.get(m.user_id)!
              return { ...m, first_name: names.first_name, last_name: names.last_name }
            }
            return m
          })

          // Ensure any includeUserIds that weren't in members are still returned so chips can render names
          const missingUsers = allUserIds.filter((uid) => !deduped.some((m) => m.user_id === uid))
          for (const uid of missingUsers) {
            const names = nameMap.get(uid)
            deduped.push({
              id: uid,
              user_id: uid,
              first_name: names?.first_name ?? null,
              last_name: names?.last_name ?? null,
            })
          }
        }
      } catch {
        // ignore enrichment errors; fall back to user_id
      }
    }

    // Enrich with email + avatar from users table
    const userIdsForEnrichment = deduped.map((m) => m.user_id).filter(Boolean)
    if (userIdsForEnrichment.length > 0) {
      try {
        const { data: userProfiles } = await supabaseAdmin
          .from("users")
          .select("clerk_user_id, email, image_url, avatar_url, has_image")
          .in("clerk_user_id", userIdsForEnrichment)
        const profileMap = new Map<string, { email: string | null; image_url: string | null }>()
        for (const u of userProfiles ?? []) {
          const img = (u.image_url as string | null) ?? (u.avatar_url as string | null) ?? null
          profileMap.set(u.clerk_user_id as string, {
            email: (u.email as string | null) ?? null,
            image_url: img,
          })
        }
        for (const m of deduped) {
          const profile = profileMap.get(m.user_id)
          if (profile) {
            ;(m as any).email = profile.email
            ;(m as any).image_url = profile.image_url
          }
        }
      } catch {
        // ignore enrichment errors
      }
    }

    // Resolve broker id for this member if they are a broker
    let selfBrokerId: string | null = null
    try {
      const { data: brokerRow } = await supabaseAdmin
        .from("brokers")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("organization_member_id", myMemberId)
        .maybeSingle()
      selfBrokerId = (brokerRow?.id as string) ?? null
    } catch {
      selfBrokerId = null
    }

    return NextResponse.json({ members: deduped, editable, self_member_id: myMemberId, self_broker_id: selfBrokerId, is_internal: isInternalOrg })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


