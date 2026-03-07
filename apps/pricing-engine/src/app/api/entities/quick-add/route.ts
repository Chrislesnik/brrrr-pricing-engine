import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs"
import { buildOwnerRows } from "@/app/api/applicants/entities/owner-helpers"

const ownerSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  member_type: z.enum(["Individual", "Entity"]).optional().or(z.literal("")),
  ssn: z.string().optional().or(z.literal("")),
  ein: z.string().optional().or(z.literal("")),
  ownership_percent: z.coerce.number().optional(),
  address: z.string().optional().or(z.literal("")),
  borrower_id: z.string().uuid().optional(),
  borrowerId: z.string().uuid().optional(),
  entity_owner_id: z.string().uuid().optional(),
  entityOwnerId: z.string().uuid().optional(),
})

const schema = z.object({
  entity_name: z.string().min(1),
  entity_type: z.string().optional().or(z.literal("")),
  ein: z.string().optional().or(z.literal("")),
  date_formed: z.string().optional(),
  state_formed: z.string().optional().or(z.literal("")),
  address_line1: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  owners: z.array(ownerSchema).optional(),
})

export async function POST(req: NextRequest) {
  try {
    let userId: string, orgId: string
    try {
      ;({ userId, orgId } = await authForApiRoute("entities", "write"))
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
    const ownersRaw: any[] = Array.isArray((json as any)?.owners)
      ? ((json as any).owners as any[])
      : []

    const { data: entity, error: entErr } = await supabaseAdmin
      .from("entities")
      .insert({
        entity_name: parsed.entity_name,
        entity_type: parsed.entity_type || null,
        ein: parsed.ein || null,
        date_formed: parsed.date_formed ?? null,
        state_formed: parsed.state_formed || null,
        address_line1: parsed.address_line1 || null,
        city: parsed.city || null,
        state: parsed.state || null,
        zip: parsed.zip || null,
        county: parsed.county || null,
        assigned_to: userId ? [userId] : [],
        organization_id: orgUuid,
      })
      .select("*")
      .single()

    if (entErr) {
      return NextResponse.json({ error: entErr.message }, { status: 500 })
    }

    if ((parsed.owners && parsed.owners.length) || ownersRaw.length) {
      const source = ownersRaw.length ? ownersRaw : (parsed.owners as any[])
      const ownersRows = buildOwnerRows({
        source,
        entityId: entity.id,
        orgUuid,
      })
      const { error: ownersErr } = await supabaseAdmin
        .from("entity_owners")
        .insert(ownersRows)
      if (ownersErr) {
        return NextResponse.json({ error: ownersErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, entity })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
