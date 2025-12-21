import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { encryptToHex } from "@/lib/crypto"
import { encryptToBase64 } from "@/lib/crypto"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

const schema = z.object({
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	ssn: z.string().regex(/^[0-9]{9}$/, "SSN must be 9 digits").optional(),
	date_of_birth: z.string().optional(), // YYYY-MM-DD
	fico_score: z.number().int().min(300).max(850).optional(),
	email: z.string().email().optional().or(z.literal("")),
	primary_phone: z.string().optional().or(z.literal("")),
	alt_phone: z.string().optional().or(z.literal("")),
	address_line1: z.string().optional().or(z.literal("")),
	address_line2: z.string().optional().or(z.literal("")),
	city: z.string().optional().or(z.literal("")),
	state: z.string().optional().or(z.literal("")),
	zip: z.string().regex(/^[0-9]{5}$/).optional().or(z.literal("")),
	county: z.string().optional().or(z.literal("")),
	citizenship: z
		.enum(["U.S. Citizen", "Permanent Resident", "Non-Permanent Resident", "Foreign National"])
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
	const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
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
			assigned_to: parsed.assigned_to && parsed.assigned_to.length
				? parsed.assigned_to
				: (userId ? [userId] : []),
			organization_id: orgUuid,
			ssn_last4: ssnLast4,
			ssn_encrypted: parsed.ssn ? encryptToHex(parsed.ssn) : null,
		}

		const { data, error } = await supabaseAdmin.from("borrowers").insert(payload).select().single()
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}
    // Create Pipeline loan + primary scenario for this borrower
    const { data: loanRow, error: loanErr } = await supabaseAdmin
      .from("loans")
      .insert({
        organization_id: orgUuid,
        assigned_to_user_id: userId ? [userId] : [],
        status: "active",
      })
      .select("*")
      .single()
    if (loanErr) {
      // Proceed but log
      // eslint-disable-next-line no-console
      console.error("Failed to create loan for borrower:", loanErr.message)
    } else {
      const inputs = {
        borrower_name: [parsed.first_name, parsed.last_name].filter(Boolean).join(" ").trim(),
        address: {
          street: parsed.address_line1 ?? null,
          city: parsed.city ?? null,
          state: parsed.state ?? null,
          zip: parsed.zip ?? null,
        },
      }
      const { error: scenErr } = await supabaseAdmin.from("loan_scenarios").insert({
        loan_id: loanRow.id,
        name: "Initial",
        primary: true,
        organization_id: orgUuid,
        inputs,
        selected: {},
      })
      if (scenErr) {
        // eslint-disable-next-line no-console
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
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }
    const search = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? ""
    const { data, error } = await supabaseAdmin
      .from("borrowers")
      .select("id, display_id, first_name, last_name, email, primary_phone, alt_phone, organization_id, created_at")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const filtered = (data ?? []).filter((r) => {
      if (!search) return true
      const hay = `${r.id ?? ""} ${r.first_name ?? ""} ${r.last_name ?? ""} ${r.email ?? ""} ${r.primary_phone ?? ""}`.toLowerCase()
      return hay.includes(search)
    })
    const shaped = filtered.map((r) => ({ ...r, display_id: (r as any).display_id ?? (r as any).id }))
    return NextResponse.json({ borrowers: shaped })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
