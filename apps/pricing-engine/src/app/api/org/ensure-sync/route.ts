import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Just-in-time sync: ensures the current Clerk organization (and the
 * calling user's membership) exist in the Supabase `organizations` and
 * `organization_members` tables.
 *
 * This handles:
 *  - Local development where Clerk webhooks can't reach localhost
 *  - Race conditions where the user navigates before the webhook fires
 *  - Any webhook delivery failures
 */
export async function POST() {
  try {
    const { orgId, userId, orgRole } = await auth()

    if (!orgId || !userId) {
      return NextResponse.json({ synced: false, reason: "No active organization" })
    }

    // Fetch the full organization from Clerk
    const clerk = await clerkClient()
    let clerkOrg
    try {
      clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId })
    } catch (err) {
      console.error("ensure-sync: failed to fetch Clerk org", err)
      return NextResponse.json(
        { synced: false, reason: "Failed to fetch organization from Clerk" },
        { status: 500 }
      )
    }

    // Upsert the organization into Supabase
    const { data: orgRow, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .upsert(
        {
          clerk_organization_id: clerkOrg.id,
          name: clerkOrg.name,
          slug: clerkOrg.slug ?? null,
        },
        { onConflict: "clerk_organization_id" }
      )
      .select("id")
      .single()

    if (orgErr) {
      console.error("ensure-sync: org upsert error", orgErr.message)
      return NextResponse.json(
        { synced: false, reason: orgErr.message },
        { status: 500 }
      )
    }

    const orgUuid = orgRow?.id as string

    // Upsert the calling user's membership
    if (orgUuid) {
      // Fetch user details from Clerk for first/last name
      let firstName: string | null = null
      let lastName: string | null = null
      try {
        const clerkUser = await clerk.users.getUser(userId)
        firstName = clerkUser.firstName ?? null
        lastName = clerkUser.lastName ?? null
      } catch {
        // Non-fatal: we'll upsert without name details
      }

      // Get the membership ID from Clerk
      let membershipId: string | undefined
      try {
        const memberships = await clerk.organizations.getOrganizationMembershipList({
          organizationId: orgId,
        })
        const match = memberships.data.find(
          (m) => m.publicUserData?.userId === userId
        )
        membershipId = match?.id
      } catch {
        // Non-fatal
      }

      if (membershipId) {
        const { error: memErr } = await supabaseAdmin
          .from("organization_members")
          .upsert(
            {
              id: membershipId,
              organization_id: orgUuid,
              user_id: userId,
              clerk_org_role: orgRole ?? "member",
              first_name: firstName,
              last_name: lastName,
            },
            { onConflict: "id" }
          )

        if (memErr) {
          console.error("ensure-sync: member upsert error", memErr.message)
        }
      }
    }

    return NextResponse.json({ synced: true, orgId: orgUuid })
  } catch (error) {
    console.error("ensure-sync: unexpected error", error)
    return NextResponse.json(
      { synced: false, reason: "Internal error" },
      { status: 500 }
    )
  }
}
