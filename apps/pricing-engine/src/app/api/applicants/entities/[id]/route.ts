import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { z } from "zod"
import { buildOwnerRows } from "../owner-helpers"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params
    const { data, error } = await supabaseAdmin
      .from("entities")
      .select("id, display_id, entity_name, entity_type, members, ein, date_formed, state_formed, address_line1, address_line2, city, state, zip, county, organization_id, created_at, updated_at")
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entity: data })
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
    const json = await req.json().catch(() => ({}))
    const ownersRaw: any[] = Array.isArray((json as any)?.owners) ? ((json as any).owners as any[]) : []
    const ownerSchema = z.object({
      name: z.string().optional().or(z.literal("")),
      title: z.string().optional().or(z.literal("")),
      member_type: z.string().optional().or(z.literal("")),
      ownership_percent: z.coerce.number().optional(),
      address: z.string().optional().or(z.literal("")),
      borrower_id: z.string().uuid().optional(),
      borrowerId: z.string().uuid().optional(),
      entity_owner_id: z.string().uuid().optional(),
      entityOwnerId: z.string().uuid().optional(),
    })
    const schema = z.object({
      entity_name: z.string().optional(),
      members: z.number().int().nonnegative().optional(),
      entity_type: z.string().optional(),
      ein: z.string().optional(),
      date_formed: z.string().optional(), // YYYY-MM-DD
      state_formed: z.string().optional(),
      address_line1: z.string().optional(),
      address_line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      county: z.string().optional(),
      bank_name: z.string().optional(),
      account_balances: z.string().optional(),
      owners: z.array(ownerSchema).optional(),
    }).partial()
    const parsed = schema.parse(json)
    const update: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (k === "owners") continue // handled separately; not a column on entities
      update[k] = v ?? null
    }
    // If only owners provided, we'll handle below
    const doRowUpdate = Object.keys(update).length > 0
    if (doRowUpdate) {
      const { error } = await supabaseAdmin
      .from("entities")
      .update(update)
      .eq("id", id)
      .eq("organization_id", orgUuid)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Upsert owners if provided: replace existing owners for this entity
    if (Array.isArray(parsed.owners) || ownersRaw.length) {
      await supabaseAdmin.from("entity_owners").delete().eq("entity_id", id).eq("organization_id", orgUuid)
      const source = ownersRaw.length ? ownersRaw : (parsed.owners as any[] ?? [])
      if (source.length > 0) {
        const ownersRows = buildOwnerRows({ source, entityId: id, orgUuid })
        const { error: ownersErr } = await supabaseAdmin.from("entity_owners").insert(ownersRows)
        if (ownersErr) return NextResponse.json({ error: ownersErr.message }, { status: 500 })
        // Link any provided borrower_ids
        // Link borrower_ids only (entity_owner_id is stored on entity_owners)
        const linkables = source.filter((o: any) => (o?.borrower_id || o?.borrowerId))
        if (linkables.length > 0) {
          const linkRows = linkables.map((o: any) => ({
            borrower_id: (o.borrower_id || o.borrowerId) as string,
            entity_id: id,
            role: (o.title && o.title.trim()) ? o.title.trim() : (o.member_type && o.member_type.trim()) ? o.member_type.trim() : null,
            guarantor: o.guarantor ?? null,
            ownership_percent: o.ownership_percent ?? null,
            organization_id: orgUuid,
          }))
          const { error: beErr } = await supabaseAdmin.from("borrower_entities").upsert(linkRows, { onConflict: "borrower_id,entity_id" })
          if (beErr) return NextResponse.json({ error: beErr.message }, { status: 500 })
        }
      }
    }
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
    const { error } = await supabaseAdmin.from("entities").delete().eq("id", id).eq("organization_id", orgUuid)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}


