import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkFeatureAccess } from "@/lib/orgs"

/**
 * POST /api/brokers/invite-member
 *
 * Sends a Clerk organization invitation and stores the intended
 * clerk_member_role so it can be applied when the membership is created.
 *
 * Body: { emailAddress, orgRole, memberRole, targetOrgId? }
 *
 * If targetOrgId (Supabase UUID) is provided, the invitation is sent to
 * that organization instead of the caller's active org. This allows
 * internal admins to invite members into external broker organizations.
 *
 * Authorization: governed by the "organization_invitations / submit"
 * policy in organization_policies (feature resource type).
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId: activeOrgId, userId } = await auth()

    if (!activeOrgId || !userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Policy-engine check: replaces hardcoded admin role check.
    // Evaluates the "feature:organization_invitations/submit" policy
    // which by default allows admin/owner roles + internal users.
    const allowed = await checkFeatureAccess("organization_invitations", "submit")
    if (!allowed) {
      return NextResponse.json(
        { error: "You do not have permission to send organization invitations" },
        { status: 403 }
      )
    }

    const body = (await req.json()) as {
      emailAddress?: string
      orgRole?: string
      memberRole?: string
      targetOrgId?: string
    }

    const emailAddress = body.emailAddress?.trim()
    if (!emailAddress) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      )
    }

    const rawOrgRole = body.orgRole || "org:member"
    const orgRole = rawOrgRole.replace(/^org:/, "")
    const memberRole = (body.memberRole || rawOrgRole).replace(/^org:/, "")

    // Resolve the target Clerk org ID and Supabase UUID.
    // If targetOrgId (Supabase UUID) is provided, look up its Clerk ID.
    // Otherwise, use the caller's active org.
    let clerkOrgId = activeOrgId
    let supabaseOrgUuid: string | null = null

    if (body.targetOrgId) {
      // Cross-org invitation: only allowed when the caller's active org
      // is internal. External org members may only invite to their own org.
      const { data: activeOrgRow } = await supabaseAdmin
        .from("organizations")
        .select("id, is_internal_yn")
        .eq("clerk_organization_id", activeOrgId)
        .single()

      const isActiveOrgInternal = activeOrgRow?.is_internal_yn === true

      // Look up the target org
      const { data: targetRow } = await supabaseAdmin
        .from("organizations")
        .select("id, clerk_organization_id")
        .eq("id", body.targetOrgId)
        .single()

      if (!targetRow?.clerk_organization_id) {
        return NextResponse.json(
          { error: "Target organization not found" },
          { status: 404 }
        )
      }

      // If the target differs from the active org, the active org must be internal
      const isTargetingSelf = targetRow.clerk_organization_id === activeOrgId
      if (!isTargetingSelf && !isActiveOrgInternal) {
        return NextResponse.json(
          { error: "External organization members can only invite to their own organization" },
          { status: 403 }
        )
      }

      clerkOrgId = targetRow.clerk_organization_id as string
      supabaseOrgUuid = targetRow.id as string
    }

    const clerk = await clerkClient()

    // Send invitation via Clerk backend API
    await clerk.organizations.createOrganizationInvitation({
      organizationId: clerkOrgId,
      emailAddress,
      inviterUserId: userId,
      role: rawOrgRole.startsWith("org:") ? rawOrgRole : `org:${rawOrgRole}`,
    })

    // Resolve the Supabase org UUID if not already resolved
    if (!supabaseOrgUuid) {
      const { data: orgRow } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", clerkOrgId)
        .single()
      supabaseOrgUuid = (orgRow?.id as string) ?? null
    }

    if (supabaseOrgUuid) {
      await supabaseAdmin.from("pending_invite_roles").upsert(
        {
          organization_id: supabaseOrgUuid,
          email: emailAddress.toLowerCase(),
          clerk_org_role: orgRole,
          clerk_member_role: memberRole,
        },
        { onConflict: "organization_id,email" }
      ).then(({ error }) => {
        if (error) {
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
