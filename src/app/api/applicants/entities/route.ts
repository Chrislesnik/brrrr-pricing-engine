import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

const ownerSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  member_type: z.enum(["Individual", "Entity"]).optional().or(z.literal("")),
  id_number: z.string().optional().or(z.literal("")),
  guarantor: z.boolean().optional(),
  ownership_percent: z.coerce.number().optional(),
  address: z.string().optional().or(z.literal("")),
})

const schema = z.object({
  entity_name: z.string().min(1),
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

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const json = await req.json()
    const parsed = schema.parse(json)

    // 1) Insert entity
    const { data: entity, error: entErr } = await supabaseAdmin
      .from("entities")
      .insert({
        entity_name: parsed.entity_name,
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
        organization_id: orgUuid,
      })
      .select("*")
      .single()
    if (entErr) return NextResponse.json({ error: entErr.message }, { status: 500 })

    // 2) Insert owners
    if (parsed.owners && parsed.owners.length) {
      const ownersRows = parsed.owners.map((o) => ({
        entity_id: entity.id,
        name: o.name || null,
        title: o.title || null,
        member_type: o.member_type || null,
        id_number: o.id_number || null,
        guarantor: o.guarantor ?? null,
        ownership_percent: o.ownership_percent ?? null,
        address: o.address || null,
        organization_id: orgUuid,
      }))
      const { error: ownersErr } = await supabaseAdmin.from("entity_owners").insert(ownersRows)
      if (ownersErr) return NextResponse.json({ error: ownersErr.message }, { status: 500 })
    }

    // 3) Optional linking to borrower
    if (parsed.link_borrower_id) {
      await supabaseAdmin.from("borrower_entities").upsert(
        {
          borrower_id: parsed.link_borrower_id,
          entity_id: entity.id as string,
          organization_id: orgUuid,
        },
        { onConflict: "borrower_id,entity_id" }
      )
    }

    // 4) Create Pipeline loan + primary scenario
    const { data: loanRow, error: loanErr } = await supabaseAdmin
      .from("loans")
      .insert({
        organization_id: orgUuid,
        assigned_to_user_id: [userId],
        status: "active",
      })
      .select("*")
      .single()
    if (loanErr) return NextResponse.json({ error: loanErr.message }, { status: 500 })

    const borrowerName =
      parsed.link_borrower_id
        ? (await (async () => {
            const { data: b } = await supabaseAdmin
              .from("borrowers")
              .select("first_name,last_name,id")
              .eq("id", parsed.link_borrower_id)
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


