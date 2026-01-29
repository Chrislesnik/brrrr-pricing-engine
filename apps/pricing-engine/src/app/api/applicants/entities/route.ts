import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId, getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"
import { buildOwnerRows } from "./owner-helpers"

const ownerSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  member_type: z.enum(["Individual", "Entity"]).optional().or(z.literal("")),
  ssn: z.string().optional().or(z.literal("")),
  ein: z.string().optional().or(z.literal("")),
  ownership_percent: z.coerce.number().optional(),
  address: z.string().optional().or(z.literal("")),
  borrower_id: z.string().uuid().optional(),
  // Accept camelCase from clients and keep it so we can map during insert
  borrowerId: z.string().uuid().optional(),
  // New: link owner to another entity
  entity_owner_id: z.string().uuid().optional(),
  entityOwnerId: z.string().uuid().optional(),
})

const schema = z.object({
  entity_name: z.string().min(1),
  members: z.number().int().nonnegative().optional(),
  entity_type: z.string().optional().or(z.literal("")),
  ein: z.string().optional().or(z.literal("")),
  date_formed: z.string().optional(), // YYYY-MM-DD
  state_formed: z.string().optional().or(z.literal("")),
  address_line1: z.string().optional().or(z.literal("")),
  address_line2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  account_balances: z.string().optional().or(z.literal("")),
  owners: z.array(ownerSchema).optional(),
  link_borrower_id: z.string().uuid().optional(),
})

export async function POST(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const reqId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    // #region agent log
    fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "dup-debug",
        hypothesisId: "H-dup",
        location: "api/applicants/entities/route.ts:entry",
        message: "entities POST entry",
        data: { reqId },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    const json = await req.json()
    const parsed = schema.parse(json)
    // Preserve raw owners from the request to avoid losing camelCase fields during validation
    const ownersRaw: any[] = Array.isArray((json as any)?.owners) ? ((json as any).owners as any[]) : []

    // Derive a single borrower_id from owners when exactly one is linked
    const ownerBorrowerIds = Array.isArray(parsed.owners)
      ? Array.from(
          new Set(
            parsed.owners
              .map((o: any) => (o?.borrower_id || o?.borrowerId) as string | undefined)
              .filter(Boolean) as string[],
          ),
        )
      : []
    const singleOwnerBorrowerId = ownerBorrowerIds.length === 1 ? ownerBorrowerIds[0] : null

    // 1) Insert entity
    const { data: entity, error: entErr } = await supabaseAdmin
      .from("entities")
      .insert({
        entity_name: parsed.entity_name,
        members: parsed.members ?? null,
        entity_type: parsed.entity_type || null,
        ein: parsed.ein || null,
        date_formed: parsed.date_formed ?? null,
        state_formed: parsed.state_formed || null,
        address_line1: parsed.address_line1 || null,
        address_line2: parsed.address_line2 || null,
        city: parsed.city || null,
        state: parsed.state || null,
        zip: parsed.zip || null,
        county: parsed.county || null,
        bank_name: parsed.bank_name || null,
        account_balances: parsed.account_balances || null,
        // Auto-assign to current user by default
        assigned_to: userId ? [userId] : [],
        organization_id: orgUuid,
      })
      .select("*")
      .single()
    // #region agent log
    fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "dup-debug",
        hypothesisId: "H-dup",
        location: "api/applicants/entities/route.ts:entityInsertResult",
        message: "entity insert result",
        data: { reqId, hasError: !!entErr, entityId: entity?.id },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (entErr) return NextResponse.json({ error: entErr.message }, { status: 500 })

    // 2) Insert owners
    if ((parsed.owners && parsed.owners.length) || ownersRaw.length) {
      // Prefer raw array for borrower_id/borrowerId pass-through if available
      const source = ownersRaw.length ? ownersRaw : (parsed.owners as any[])
      // #region agent log
      fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "entity-link",
          hypothesisId: "H-owners-raw",
          location: "api/applicants/entities/route.ts:ownersRaw",
          message: "owners raw payload",
          data: { count: source.length, sample: source[0] ?? null },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      const ownersRows = buildOwnerRows({ source, entityId: entity.id, orgUuid })
      // #region agent log
      fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "entity-link",
          hypothesisId: "H-owners-rows",
          location: "api/applicants/entities/route.ts:ownersRows",
          message: "owners rows before insert",
          data: { count: ownersRows.length, sample: ownersRows[0] ?? null },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      const { error: ownersErr } = await supabaseAdmin.from("entity_owners").insert(ownersRows)
      // #region agent log
      fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "entity-link",
          hypothesisId: "H-owners-insert",
          location: "api/applicants/entities/route.ts:ownersInsert",
          message: "entity_owners insert result",
          data: { hasError: !!ownersErr, error: ownersErr?.message },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      if (ownersErr) return NextResponse.json({ error: ownersErr.message }, { status: 500 })

      // Link any owners that reference an existing borrower
      const linkables = source.filter((o: any) => (o?.borrower_id || o?.borrowerId))
      if (linkables.length > 0) {
        const linkRows = linkables.map((o: any) => ({
          borrower_id: (o.borrower_id || o.borrowerId) as string,
          entity_id: entity.id as string,
          role: (o.title && o.title.trim()) ? o.title.trim() : (o.member_type && o.member_type.trim()) ? o.member_type.trim() : null,
          guarantor: o.guarantor ?? null,
          ownership_percent: o.ownership_percent ?? null,
          organization_id: orgUuid,
        }))
        const { error: beErr } = await supabaseAdmin.from("borrower_entities").upsert(linkRows, { onConflict: "borrower_id,entity_id" })
        if (beErr) return NextResponse.json({ error: beErr.message }, { status: 500 })
      }
    }

    // 3) Optional linking to borrower (legacy single-link support)
    if ((parsed as any).link_borrower_id) {
      await supabaseAdmin.from("borrower_entities").upsert({
        borrower_id: (parsed as any).link_borrower_id as string,
        entity_id: entity.id as string,
        organization_id: orgUuid,
      }, { onConflict: "borrower_id,entity_id" })
    }

    // 4) Create Pipeline loan + primary scenario
    const loanInsert: Record<string, unknown> = {
      organization_id: orgUuid,
      assigned_to_user_id: [userId],
      status: "active",
    }
    if (singleOwnerBorrowerId) {
      loanInsert.borrower_id = singleOwnerBorrowerId
    }
    // #region agent log
    fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "loan-insert",
        hypothesisId: "H-loan-col",
        location: "api/applicants/entities/route.ts:loanInsert",
        message: "loan insert payload",
        data: loanInsert,
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    const { data: loanRow, error: loanErr } = await supabaseAdmin
      .from("loans")
      .insert(loanInsert)
      .select("*")
      .single()
    // #region agent log
    fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "loan-insert",
        hypothesisId: "H-loan-col",
        location: "api/applicants/entities/route.ts:loanInsertResult",
        message: "loan insert result",
        data: { hasError: !!loanErr, error: loanErr?.message },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (loanErr) return NextResponse.json({ error: loanErr.message }, { status: 500 })

    const borrowerName =
      (singleOwnerBorrowerId as string | null) || parsed.link_borrower_id
        ? (await (async () => {
            const { data: b } = await supabaseAdmin
              .from("borrowers")
              .select("first_name,last_name,id")
              .eq("id", (singleOwnerBorrowerId as string) || (parsed.link_borrower_id as string))
              .single()
            return b ? `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() : null
          })())
        : null

    const inputs = {
      borrower_name: borrowerName ?? null,
      entity_name: parsed.entity_name,
      address: {
        street: parsed.address_line1 ?? null,
        city: parsed.city ?? null,
        state: parsed.state ?? null,
        zip: parsed.zip ?? null,
      },
      // Provide sensible defaults so pipeline columns are not empty
      loan_type: "dscr",
      transaction_type: "purchase",
      // Derive guarantors from owners where applicable
      guarantors: Array.isArray(parsed.owners)
        ? (parsed.owners.filter((o: any) => o?.guarantor).map((o: any) => (o?.name ?? "")).filter(Boolean))
        : [],
    }

    const { error: scenErr } = await supabaseAdmin.from("loan_scenarios").insert({
      loan_id: loanRow.id,
      name: "Initial",
      primary: true,
      user_id: userId,
      organization_id: orgUuid,
      inputs,
      selected: {},
    })
    if (scenErr) return NextResponse.json({ error: scenErr.message }, { status: 500 })

    // Return entity (from view if available)
    const { data: row } = await supabaseAdmin
      .from("entities_view")
      .select("*")
      .eq("id", entity.id)
      .single()

    return NextResponse.json({ ok: true, entity: row ?? entity, loanId: loanRow.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function GET(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    // Role-based access control
    const userRole = await getUserRoleInOrg(orgUuid, userId!)
    const hasFullAccess = isPrivilegedRole(userRole)

    // Get current user's org member UUID for filtering
    let currentUserOrgMemberId: string | undefined
    if (!hasFullAccess && userId) {
      const { data: memberRow } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .maybeSingle()
      currentUserOrgMemberId = memberRow?.id as string | undefined
    }

    const search = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? ""
    const includeIdsParam = req.nextUrl.searchParams.get("includeIds") ?? ""
    const includeIds = includeIdsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    const { data, error } = await supabaseAdmin
      .from("entities")
      .select("id, display_id, entity_name, entity_type, organization_id, created_at, assigned_to")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Apply role-based filtering first
    let filtered = (data ?? []).filter((r) => {
      // If user has full access, show all entities
      if (hasFullAccess) return true
      // Otherwise, filter by assigned_to
      const assigned = Array.isArray((r as any).assigned_to) ? ((r as any).assigned_to as string[]) : []
      return assigned.includes(userId!) || (currentUserOrgMemberId && assigned.includes(currentUserOrgMemberId))
    })

    // Apply search filter
    filtered = filtered.filter((r) => {
      if (!search) return true
      const hay = `${r.id ?? ""} ${r.display_id ?? ""} ${r.entity_name ?? ""} ${r.entity_type ?? ""}`.toLowerCase()
      return hay.includes(search)
    })

    // Ensure requested IDs are always included (only if user has access to them)
    if (includeIds.length > 0) {
      const missing = includeIds.filter((id) => !filtered.some((r) => String((r as any).id) === id))
      if (missing.length > 0) {
        const { data: extra } = await supabaseAdmin
          .from("entities")
          .select("id, display_id, entity_name, entity_type, organization_id, created_at, assigned_to")
          .eq("organization_id", orgUuid)
          .in("id", missing)
        if (Array.isArray(extra)) {
          // Only include extra records the user has access to
          const accessibleExtra = extra.filter((r) => {
            if (hasFullAccess) return true
            const assigned = Array.isArray((r as any).assigned_to) ? ((r as any).assigned_to as string[]) : []
            return assigned.includes(userId!) || (currentUserOrgMemberId && assigned.includes(currentUserOrgMemberId))
          })
          filtered = filtered.concat(accessibleExtra)
        }
      }
    }
    return NextResponse.json({ entities: filtered })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}


