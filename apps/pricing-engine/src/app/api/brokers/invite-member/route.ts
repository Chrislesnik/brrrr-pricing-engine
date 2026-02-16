import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * POST /api/brokers/invite-member
 *
 * Sends a Clerk organization invitation and stores the intended
 * clerk_member_role so it can be applied when the membership is created.
 *
 * Body: { emailAddress, orgRole, memberRole }
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId, userId, orgRole: callerRole } = await auth()

    if (!orgId || !userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Only admins can invite
    if (
      callerRole !== "org:admin" &&
      callerRole !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only admins can invite members" },
        { status: 403 }
      )
    }

    const body = (await req.json()) as {
      emailAddress?: string
      orgRole?: string
      memberRole?: string
    }

    const emailAddress = body.emailAddress?.trim()
    if (!emailAddress) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      )
    }

    const orgRole = body.orgRole || "org:member"
    const memberRole = body.memberRole || orgRole

    const clerk = await clerkClient()

    // Send invitation via Clerk backend API
    await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress,
      inviterUserId: userId,
      role: orgRole,
    })

    // Store the intended member role in Supabase so it can be applied
    // when the membership webhook fires. We key by email + org.
    // First, resolve the Supabase org UUID.
    const { data: orgRow } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single()

    if (orgRow?.id) {
      // Store as a pending invite role using the pending_invite_roles table.
      // If the table doesn't exist, we fall back to updating the membership
      // directly once it's created.
      await supabaseAdmin.from("pending_invite_roles").upsert(
        {
          organization_id: orgRow.id as string,
          email: emailAddress.toLowerCase(),
          clerk_org_role: orgRole,
          clerk_member_role: memberRole,
        },
        { onConflict: "organization_id,email" }
      ).then(({ error }) => {
        if (error) {
          // Table may not exist yet; that's fine -- we'll handle via
          // a direct membership update when the member accepts.
          console.warn(
            "pending_invite_roles upsert skipped (table may not exist):",
            error.message
          )
        }
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("invite-member error:", error)

    // Pass through Clerk errors for nicer client messages
    const clerkMsg =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Failed to send invitation"

    return NextResponse.json({ error: clerkMsg }, { status: 422 })
  }
}
