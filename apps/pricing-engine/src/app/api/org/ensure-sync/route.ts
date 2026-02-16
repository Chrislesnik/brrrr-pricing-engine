import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Just-in-time sync: ensures the current Clerk organization AND all of its
 * members exist in the Supabase `organizations` and `organization_members`
 * tables.
 *
 * This handles:
 *  - Local development where Clerk webhooks can't reach localhost
 *  - Race conditions where the user navigates before the webhook fires
 *  - Any webhook delivery failures
 */
export async function POST() {
  try {
    const { orgId, userId } = await auth()

    if (!orgId || !userId) {
      return NextResponse.json({ synced: false, reason: "No active organization" })
    }

    const clerk = await clerkClient()

    // Fetch the full organization from Clerk
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
    if (!orgUuid) {
      return NextResponse.json(
        { synced: false, reason: "No org UUID returned" },
        { status: 500 }
      )
    }

    // Fetch ALL memberships for this organization from Clerk
    let syncedCount = 0

    try {
      let offset = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const page = await clerk.organizations.getOrganizationMembershipList({
          organizationId: orgId,
          limit,
          offset,
        })
        const items = page.data ?? []

        for (const m of items) {
          const memUserId = m.publicUserData?.userId
          if (!memUserId) continue

          const clerkRole = m.role ?? "member"
          let memberRole =
            typeof (m.publicMetadata as Record<string, unknown>)?.org_member_role === "string"
              ? ((m.publicMetadata as Record<string, unknown>).org_member_role as string)
              : clerkRole

          // Check for a pending invite role (set via the invite-member API)
          const memberEmail = m.publicUserData?.identifier ?? ""
          if (memberEmail) {
            const { data: pendingRow } = await supabaseAdmin
              .from("pending_invite_roles")
              .select("clerk_member_role")
              .eq("organization_id", orgUuid)
              .ilike("email", memberEmail)
              .maybeSingle()

            if (pendingRow?.clerk_member_role) {
              memberRole = pendingRow.clerk_member_role as string
              await supabaseAdmin
                .from("pending_invite_roles")
                .delete()
                .eq("organization_id", orgUuid)
                .ilike("email", memberEmail)
            }
          }

          // Upsert using the composite unique key (organization_id, user_id).
          const { error: memErr } = await supabaseAdmin
            .from("organization_members")
            .upsert(
              {
                organization_id: orgUuid,
                user_id: memUserId,
                clerk_org_role: clerkRole,
                clerk_member_role: memberRole,
                first_name: m.publicUserData?.firstName ?? null,
                last_name: m.publicUserData?.lastName ?? null,
              },
              { onConflict: "organization_id,user_id" }
            )

          if (memErr) {
            console.error(
              `ensure-sync: member upsert error for user ${memUserId}`,
              memErr.message
            )
          } else {
            syncedCount++
          }
        }

        hasMore = items.length === limit
        offset += limit
      }
    } catch (err) {
      console.error("ensure-sync: failed to fetch memberships", err)
    }

    return NextResponse.json({
      synced: true,
      orgId: orgUuid,
      membersSynced: syncedCount,
    })
  } catch (error) {
    console.error("ensure-sync: unexpected error", error)
    return NextResponse.json(
      { synced: false, reason: "Internal error" },
      { status: 500 }
    )
  }
}
