import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const { id } = await ctx.params
    // Owners of this entity (parents)
    const { data: owners, error: ownersErr } = await supabaseAdmin
      .from("entity_owners")
      .select("entity_id, entity_owner_id, name, title, member_type, id_number, guarantor, ownership_percent, address, borrower_id, organization_id, created_at")
      .eq("entity_id", id)
      .order("created_at", { ascending: true })
    if (ownersErr) return NextResponse.json({ error: ownersErr.message }, { status: 500 })

    // Entities that this entity owns (children)
    const { data: children, error: childrenErr } = await supabaseAdmin
      .from("entity_owners")
      .select("entity_id, entity_owner_id")
      .eq("entity_owner_id", id)
    if (childrenErr) return NextResponse.json({ error: childrenErr.message }, { status: 500 })

    return NextResponse.json({
      owners: owners ?? [],
      owned_by_entities: (owners ?? []).map((o) => o.entity_owner_id).filter(Boolean),
      owns_entities: (children ?? []).map((o) => o.entity_id).filter(Boolean),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}


