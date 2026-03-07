import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"
import { encryptToHex } from "@/lib/crypto"
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  ssn: z
    .string()
    .regex(/^[0-9]{9}$/, "SSN must be 9 digits")
    .optional(),
  date_of_birth: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  primary_phone: z.string().optional().or(z.literal("")),
  address_line1: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z
    .string()
    .regex(/^[0-9]{5}$/)
    .optional()
    .or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
})

function toE164(us: string | undefined | null) {
  const digits = (us ?? "").replace(/\D+/g, "")
  if (!digits) return undefined
  const d =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
  if (d.length !== 10) return undefined
  return `+1${d}`
}

export async function POST(req: NextRequest) {
  try {
    let userId: string, orgId: string
    try {
      ;({ userId, orgId } = await authForApiRoute("borrowers", "write"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const json = await req.json()
    const parsed = schema.parse(json)

    const primary = toE164(parsed.primary_phone)
    const ssnLast4 = parsed.ssn ? parsed.ssn.slice(-4) : null

    const payload: Record<string, unknown> = {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      date_of_birth: parsed.date_of_birth ?? null,
      email: parsed.email || null,
      primary_phone: primary ?? null,
      address_line1: parsed.address_line1 || null,
      city: parsed.city || null,
      state: parsed.state || null,
      zip: parsed.zip || null,
      county: parsed.county || null,
      assigned_to: userId ? [userId] : [],
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

    return NextResponse.json({ ok: true, borrower: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
