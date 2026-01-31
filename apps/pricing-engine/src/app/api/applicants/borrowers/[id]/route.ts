import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { encryptToHex } from "@/lib/crypto"

function toE164(us: string | undefined | null) {
  const digits = (us ?? "").replace(/\D+/g, "")
  if (!digits) return undefined
  const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
  if (d.length !== 10) return undefined
  return `+1${d}`
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params
    const { data, error } = await supabaseAdmin
      .from("borrowers")
      .select("id, display_id, first_name, last_name, email, date_of_birth, fico_score, primary_phone, alt_phone, address_line1, address_line2, city, state, zip, county, citizenship, green_card, visa, visa_type, rentals_owned, fix_flips_3yrs, groundups_3yrs, real_estate_licensed, ssn_last4, ssn_encrypted")
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { ssn_encrypted, ...rest } = data as any
    const borrower = { ...rest, has_ssn: Boolean(ssn_encrypted) }
    return NextResponse.json({ borrower })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const update: Record<string, unknown> = { ...body }
    // Handle SSN updates explicitly
    if ("ssn" in update) {
      const ssnVal = (update.ssn ?? "") as string
      if (ssnVal === "") {
        update.ssn_encrypted = null
        update.ssn_last4 = null
      } else {
        const digits = ssnVal.replace(/\D+/g, "")
        if (digits.length === 9) {
          update.ssn_encrypted = encryptToHex(digits)
          update.ssn_last4 = digits.slice(-4)
        }
      }
      delete update.ssn
    }
    if ("primary_phone" in update) update.primary_phone = toE164(update.primary_phone as string)
    if ("alt_phone" in update) update.alt_phone = toE164(update.alt_phone as string)
    const { error } = await supabaseAdmin.from("borrowers").update(update).eq("id", id).eq("organization_id", orgUuid)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params
    const { error } = await supabaseAdmin.from("borrowers").delete().eq("id", id).eq("organization_id", orgUuid)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}


