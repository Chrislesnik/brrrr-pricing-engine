import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { encryptToHex } from "@/lib/crypto"
import {
  getOrgUuidFromClerkId,
  getUserRoleInOrg,
  isPrivilegedRole,
} from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  ssn: z
    .string()
    .regex(/^[0-9]{9}$/, "SSN must be 9 digits")
    .optional(),
  date_of_birth: z.string().optional(), // YYYY-MM-DD
  fico_score: z.number().int().min(300).max(850).optional(),
  email: z.string().email().optional().or(z.literal("")),
  primary_phone: z.string().optional().or(z.literal("")),
  alt_phone: z.string().optional().or(z.literal("")),
  address_line1: z.string().optional().or(z.literal("")),
  address_line2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z
    .string()
    .regex(/^[0-9]{5}$/)
    .optional()
    .or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  citizenship: z
    .enum([
      "U.S. Citizen",
      "Permanent Resident",
      "Non-Permanent Resident",
      "Foreign National",
    ])
    .optional(),
  green_card: z.boolean().optional(),
  visa: z.boolean().optional(),
  visa_type: z.string().optional().or(z.literal("")),
  rentals_owned: z.number().int().nonnegative().optional(),
  fix_flips_3yrs: z.number().int().nonnegative().optional(),
  groundups_3yrs: z.number().int().nonnegative().optional(),
  real_estate_licensed: z.boolean().optional(),
  assigned_to: z.array(z.string().uuid()).optional(),
})

function toE164(us: string | undefined | null) {
  const digits = (us ?? "").replace(/\D+/g, "")
  if (!digits) return undefined
  // Assume US numbers; ensure 10 digits
  const d =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
  if (d.length !== 10) return undefined
  return `+1${d}`
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }
    const json = await req.json()
    const parsed = schema.parse(json)

    const primary = toE164(parsed.primary_phone)
    const alt = toE164(parsed.alt_phone)
    const ssnLast4 = parsed.ssn ? parsed.ssn.slice(-4) : null

    // Insert without SSN encryption by default (requires PGP key function). Store last4 only.
    const payload: Record<string, unknown> = {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      date_of_birth: parsed.date_of_birth ?? null,
      fico_score: parsed.fico_score ?? null,
      email: parsed.email || null,
      primary_phone: primary ?? null,
      alt_phone: alt ?? null,
      address_line1: parsed.address_line1 || null,
      address_line2: parsed.address_line2 || null,
      city: parsed.city || null,
      state: parsed.state || null,
      zip: parsed.zip || null,
      county: parsed.county || null,
      citizenship: parsed.citizenship ?? null,
      green_card: parsed.green_card ?? null,
      visa: parsed.visa ?? null,
      visa_type: parsed.visa_type || null,
      rentals_owned: parsed.rentals_owned ?? null,
      fix_flips_3yrs: parsed.fix_flips_3yrs ?? null,
      groundups_3yrs: parsed.groundups_3yrs ?? null,
      real_estate_licensed: parsed.real_estate_licensed ?? null,
      // Auto-assign to current user by default
      assigned_to:
        parsed.assigned_to && parsed.assigned_to.length
          ? parsed.assigned_to
          : userId
            ? [userId]
            : [],
      organization_id: orgUuid,
      ssn_last4: ssnLast4,
      ssn_encrypted: parsed.ssn ? encryptToHex(parsed.ssn) : null,
    }

    const { data, error } = await supabaseAdmin
      .from("borrowers")
      .insert(payload)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Create Pipeline loan + primary scenario for this borrower
    const { data: loanRow, error: loanErr } = await supabaseAdmin
      .from("deals")
      .insert({
        organization_id: orgUuid,
        assigned_to_user_id: userId ? [userId] : [],
        status: "active",
      })
      .select("*")
      .single()
    if (loanErr) {
      // Proceed but log
      console.error("Failed to create loan for borrower:", loanErr.message)
    } else {
      // Populate deal_users for chat @mention filtering
      if (userId) {
        try {
          await supabaseAdmin
            .from("deal_users")
            .insert({ deal_id: loanRow.id as string, user_id: userId })
        } catch {
          // deal_users sync is non-critical
        }
      }
      // Seed a minimal primary scenario so the pipeline has data to show immediately.
      // Include address + borrower_name plus defaults for loan_type/transaction_type,
      // and an empty guarantors array so the pipeline columns are populated.
      const inputs = {
        borrower_name: [parsed.first_name, parsed.last_name]
          .filter(Boolean)
          .join(" ")
          .trim(),
        address: {
          street: parsed.address_line1 ?? null,
          city: parsed.city ?? null,
          state: parsed.state ?? null,
          zip: parsed.zip ?? null,
        },
        loan_type: "dscr",
        transaction_type: "purchase",
        guarantors: [] as string[],
      }
      const { error: scenErr } = await supabaseAdmin
        .from("loan_scenarios")
        .insert({
          loan_id: loanRow.id,
          name: "Initial",
          primary: true,
          organization_id: orgUuid,
          inputs,
          selected: {},
        })
      if (scenErr) {
        console.error("Failed to create primary scenario:", scenErr.message)
      }
    }
    // Fetch inserted row from base table
    const { data: row } = await supabaseAdmin
      .from("borrowers")
      .select("*")
      .eq("id", data.id)
      .single()
    return NextResponse.json({ ok: true, borrower: row ?? data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export const GET = async (req: NextRequest) => {
  try {
    const { orgId, userId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

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
    const entityId = req.nextUrl.searchParams.get("entityId") ?? ""
    const includeIdsParam = req.nextUrl.searchParams.get("includeIds") ?? ""
    const includeIds = includeIdsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    const { data, error } = await supabaseAdmin
      .from("borrowers")
      .select(
        "id, display_id, first_name, last_name, email, primary_phone, alt_phone, organization_id, created_at, assigned_to"
      )
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })

    // Apply role-based filtering first
    let filtered = (data ?? []).filter((r) => {
      // If user has full access, show all borrowers
      if (hasFullAccess) return true
      // Otherwise, filter by assigned_to
      const assigned = Array.isArray((r as any).assigned_to)
        ? ((r as any).assigned_to as string[])
        : []
      return (
        assigned.includes(userId!) ||
        (currentUserOrgMemberId && assigned.includes(currentUserOrgMemberId))
      )
    })

    // Apply search filter
    filtered = filtered.filter((r) => {
      if (!search) return true
      const hay =
        `${r.id ?? ""} ${(r as any).display_id ?? ""} ${r.first_name ?? ""} ${r.last_name ?? ""} ${r.email ?? ""} ${r.primary_phone ?? ""}`.toLowerCase()
      return hay.includes(search)
    })

    // If entityId provided, restrict to borrowers linked via borrower_entities
    if (entityId) {
      const { data: beRows } = await supabaseAdmin
        .from("borrower_entities")
        .select("borrower_id")
        .eq("organization_id", orgUuid)
        .eq("entity_id", entityId)
      const links = (beRows ?? []).map((r: any) => String(r.borrower_id))
      if (links.length > 0) {
        const allowed = new Set(links)
        filtered = filtered.filter((r) => allowed.has(String((r as any).id)))
      }
    }
    // Ensure requested IDs are present (only if user has access to them)
    if (includeIds.length > 0) {
      const missing = includeIds.filter(
        (id) => !filtered.some((r) => String((r as any).id) === id)
      )
      if (missing.length > 0) {
        const { data: extra, error: extraErr } = await supabaseAdmin
          .from("borrowers")
          .select(
            "id, display_id, first_name, last_name, email, primary_phone, alt_phone, organization_id, created_at, assigned_to"
          )
          .eq("organization_id", orgUuid)
          .in("id", missing)
        if (!extraErr && Array.isArray(extra)) {
          // Only include extra records the user has access to
          const accessibleExtra = extra.filter((r) => {
            if (hasFullAccess) return true
            const assigned = Array.isArray((r as any).assigned_to)
              ? ((r as any).assigned_to as string[])
              : []
            return (
              assigned.includes(userId!) ||
              (currentUserOrgMemberId &&
                assigned.includes(currentUserOrgMemberId))
            )
          })
          filtered = filtered.concat(accessibleExtra)
        }
      }
    }
    const shaped = filtered.map((r) => ({
      ...r,
      display_id: (r as any).display_id ?? (r as any).id,
    }))
    return NextResponse.json({ borrowers: shaped })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
