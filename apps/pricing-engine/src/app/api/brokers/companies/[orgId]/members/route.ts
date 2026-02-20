import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkFeatureAccess } from "@/lib/orgs"
import { syncOrgMembers } from "@/lib/sync-members"

/**
 * GET /api/brokers/companies/[orgId]/members
 *
 * Fetches members for a given organization (by Supabase UUID).
 * Performs a JIT sync via the shared syncOrgMembers() utility,
 * then returns the rows from Supabase.
 *
 * Authorization: governed by the "organization_invitations / view" policy.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: clerkOrgId } = await auth()

    if (!clerkOrgId) {
      return NextResponse.json({ members: [] })
    }

    // Policy-engine check: replaces hardcoded org:broker deny
    const canView = await checkFeatureAccess("organization_invitations", "view")
    if (!canView) {
      return NextResponse.json({ members: [], error: "Forbidden" }, { status: 403 })
    }

    const { orgId } = await params

    // Look up the clerk_organization_id for this Supabase org UUID
    const { data: orgRow, error: orgLookupErr } = await supabaseAdmin
      .from("organizations")
      .select("clerk_organization_id")
      .eq("id", orgId)
      .single()

    if (orgLookupErr || !orgRow?.clerk_organization_id) {
      console.error("Members: org lookup error", orgLookupErr?.message)
      return NextResponse.json({ members: [] })
    }

    const clerkOrgIdForThisOrg = orgRow.clerk_organization_id as string

    // JIT sync using the shared utility (batch queries, role precedence)
    try {
      await syncOrgMembers(clerkOrgIdForThisOrg, orgId)
    } catch (syncErr) {
      console.error("Members JIT sync error:", syncErr)
    }

    // Return members from Supabase (now freshly synced)
    const { data: members, error } = await supabaseAdmin
      .from("organization_members")
      .select(
        "id, user_id, first_name, last_name, clerk_org_role, clerk_member_role, created_at"
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Fetch org members error:", error.message)
      return NextResponse.json({ members: [] })
    }

    return NextResponse.json({
      members: (members ?? []).map((m) => ({
        id: m.id,
        user_id: m.user_id ?? null,
        first_name: m.first_name ?? null,
        last_name: m.last_name ?? null,
        clerk_org_role: m.clerk_org_role ?? "member",
        clerk_member_role: m.clerk_member_role ?? null,
        created_at: m.created_at,
      })),
    })
  } catch (error) {
    console.error("Org members API error:", error)
    return NextResponse.json(
      { members: [], error: "Failed to fetch members" },
      { status: 500 }
    )
  }
}
