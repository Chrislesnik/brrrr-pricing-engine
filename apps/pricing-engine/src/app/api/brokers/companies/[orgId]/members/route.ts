import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/brokers/companies/[orgId]/members
 *
 * Fetches members for a given organization (by Supabase UUID).
 * Performs a JIT sync: looks up the org's clerk_organization_id, fetches all
 * memberships from Clerk, upserts them into Supabase, then returns the rows.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: clerkOrgId, orgRole } = await auth()

    if (!clerkOrgId) {
      return NextResponse.json({ members: [] })
    }

    if (orgRole === "org:broker" || orgRole === "broker") {
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

    // JIT sync: fetch all members from Clerk and upsert into Supabase
    try {
      const clerk = await clerkClient()
      let offset = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const page = await clerk.organizations.getOrganizationMembershipList({
          organizationId: clerkOrgIdForThisOrg,
          limit,
          offset,
        })
        const items = page.data ?? []

        for (const m of items) {
          const memUserId = m.publicUserData?.userId
          if (!memUserId) continue

          const clerkRole = m.role ?? "member"
          const memberRole =
            typeof (m.publicMetadata as Record<string, unknown>)?.org_member_role === "string"
              ? ((m.publicMetadata as Record<string, unknown>).org_member_role as string)
              : clerkRole

          await supabaseAdmin
            .from("organization_members")
            .upsert(
              {
                organization_id: orgId,
                user_id: memUserId,
                clerk_org_role: clerkRole,
                clerk_member_role: memberRole,
                first_name: m.publicUserData?.firstName ?? null,
                last_name: m.publicUserData?.lastName ?? null,
              },
              { onConflict: "organization_id,user_id" }
            )
        }

        hasMore = items.length === limit
        offset += limit
      }
    } catch (syncErr) {
      // Non-fatal: fall through to return whatever is already in Supabase
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
