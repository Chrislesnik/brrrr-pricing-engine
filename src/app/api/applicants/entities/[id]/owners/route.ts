import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { decryptFromAny } from "@/lib/crypto"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const { id } = await ctx.params
    // Owners of this entity (parents)
    const { data: owners, error: ownersErr } = await supabaseAdmin
      .from("entity_owners")
      .select(`
        entity_id,
        entity_owner_id,
        name,
        title,
        member_type,
        ssn_encrypted,
        ssn_last4,
        ein,
        ownership_percent,
        address,
        borrower_id,
        organization_id,
        created_at
      `)
      .eq("entity_id", id)
      .order("created_at", { ascending: true })
    if (ownersErr) return NextResponse.json({ error: ownersErr.message }, { status: 500 })

    // Entities that this entity owns (children)
    const { data: children, error: childrenErr } = await supabaseAdmin
      .from("entity_owners")
      .select("entity_id, entity_owner_id")
      .eq("entity_owner_id", id)
    if (childrenErr) return NextResponse.json({ error: childrenErr.message }, { status: 500 })

    const ownerEntityIds = (owners ?? [])
      .map((o) => (o as any)?.entity_owner_id as string | null)
      .filter((v): v is string => typeof v === "string" && v.length > 0)
    const borrowerIds = (owners ?? [])
      .map((o) => (o as any)?.borrower_id as string | null)
      .filter((v): v is string => typeof v === "string" && v.length > 0)

    let ownerEntityEinMap: Record<string, { display_id: string | null; entity_name: string | null; ein: string | null }> = {}
    if (ownerEntityIds.length > 0) {
      const { data: entitiesData } = await supabaseAdmin
        .from("entities")
        .select("id, display_id, entity_name, ein")
        .in("id", ownerEntityIds)
      ownerEntityEinMap = Object.fromEntries(
        (entitiesData ?? []).map((e) => [
          e.id as string,
          { display_id: (e.display_id as string) ?? null, entity_name: (e.entity_name as string) ?? null, ein: (e.ein as string) ?? null },
        ])
      )
    }

    let borrowerMap: Record<string, string> = {}
    if (borrowerIds.length > 0) {
      const { data: borrowers } = await supabaseAdmin
        .from("borrowers")
        .select("id, display_id")
        .in("id", borrowerIds)
      borrowerMap = Object.fromEntries((borrowers ?? []).map((b) => [b.id as string, (b.display_id as string) ?? ""]))
    }

    const enrichedOwners = (owners ?? []).map((o: any) => {
      const ent = o?.entity_owner_id ? ownerEntityEinMap[o.entity_owner_id] : null
      // Decrypt SSN for Individual members
      let full_ssn: string | null = null
      if (o?.member_type === "Individual" && o?.ssn_encrypted) {
        try {
          const decrypted = decryptFromAny(o.ssn_encrypted as unknown as string)
          if (/^[0-9]{9}$/.test(decrypted)) {
            full_ssn = decrypted
          }
        } catch {
          // Decryption failed, leave full_ssn as null
        }
      }
      return {
        ...o,
        full_ssn,
        entity_display_id: ent?.display_id ?? null,
        entity_display_name: ent?.entity_name ?? null,
        entity_ein: ent?.ein ?? null,
        borrower_display_id: o?.borrower_id ? borrowerMap[o.borrower_id] ?? null : null,
      }
    })

    return NextResponse.json({
      owners: enrichedOwners ?? [],
      owned_by_entities: (owners ?? []).map((o) => o.entity_owner_id).filter(Boolean),
      owns_entities: (children ?? []).map((o) => o.entity_id).filter(Boolean),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}


