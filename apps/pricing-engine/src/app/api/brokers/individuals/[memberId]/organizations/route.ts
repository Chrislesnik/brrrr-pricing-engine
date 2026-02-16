import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/brokers/individuals/[memberId]/organizations
 *
 * Returns the organizations that a specific organization_member belongs to
 * (scoped to external orgs where is_internal_yn = false).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { orgId: clerkOrgId, orgRole } = await auth()

    if (!clerkOrgId) {
      return NextResponse.json({ organizations: [] })
    }

    if (orgRole === "org:broker" || orgRole === "broker") {
      return NextResponse.json(
        { organizations: [], error: "Forbidden" },
        { status: 403 }
      )
    }

    const { memberId } = await params

    // Get the user_id for this member so we can find all their memberships
    const { data: member, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("user_id")
      .eq("id", memberId)
      .single()

    if (memErr || !member?.user_id) {
      return NextResponse.json({ organizations: [] })
    }

    // Find all memberships for this user_id across external orgs
    const { data: memberships, error: msErr } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", member.user_id as string)

    if (msErr || !memberships?.length) {
      return NextResponse.json({ organizations: [] })
    }

    const orgIds = memberships.map((m) => m.organization_id as string)

    // Fetch the orgs, filtering to external only
    const { data: orgs, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, created_at")
      .in("id", orgIds)
      .eq("is_internal_yn", false)
      .order("created_at", { ascending: false })

    if (orgErr) {
      console.error("Fetch member orgs error:", orgErr.message)
      return NextResponse.json({ organizations: [] })
    }

    // Get member counts per org
    const { data: allMembers } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .in("organization_id", orgIds)

    const countByOrg: Record<string, number> = {}
    for (const m of allMembers ?? []) {
      const oid = m.organization_id as string
      countByOrg[oid] = (countByOrg[oid] ?? 0) + 1
    }

    return NextResponse.json({
      organizations: (orgs ?? []).map((o) => ({
        id: o.id,
        name: (o.name as string) ?? "Unnamed",
        slug: (o.slug as string) ?? null,
        member_count: countByOrg[o.id as string] ?? 0,
        created_at: o.created_at,
      })),
    })
  } catch (error) {
    console.error("Member organizations API error:", error)
    return NextResponse.json(
      { organizations: [], error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}
