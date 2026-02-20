import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { notifyLoanAssignment } from "@/lib/notifications"

export const runtime = "nodejs"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null

    const { data, error } = await supabaseAdmin
      .from("loans")
      .select("assigned_to_user_id, organization_id, primary_user_id")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (orgUuid && data.organization_id && data.organization_id !== orgUuid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const ids = Array.isArray(data.assigned_to_user_id) ? (data.assigned_to_user_id as string[]) : []
    return NextResponse.json({ userIds: ids, primaryUserId: data.primary_user_id ?? null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const body = (await req.json().catch(() => null)) as { userIds?: string[] } | null
    if (!body || !Array.isArray(body.userIds)) {
      return NextResponse.json({ error: "Missing userIds" }, { status: 400 })
    }
    const userIds = body.userIds.filter((v) => typeof v === "string")

    // Get previous state for diff calculation
    const { data: loan } = await supabaseAdmin
      .from("loans")
      .select("assigned_to_user_id")
      .eq("id", id)
      .single()
    const previousIds = new Set<string>(
      Array.isArray(loan?.assigned_to_user_id) ? (loan.assigned_to_user_id as string[]) : []
    )
    const newIds = new Set<string>(userIds)

    // Calculate diff
    const added = userIds.filter((uid) => !previousIds.has(uid))
    const removed = [...previousIds].filter((uid) => !newIds.has(uid))

    // Optional: verify userIds belong to the same org
    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null
    if (orgUuid) {
      const { data: validMembers, error: membersErr } = await supabaseAdmin
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgUuid)
      if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })
      const validSet = new Set((validMembers ?? []).map((m) => m.user_id as string))
      for (const uid of userIds) {
        if (!validSet.has(uid)) {
          return NextResponse.json({ error: "One or more users not in organization" }, { status: 400 })
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("loans")
      .update({ assigned_to_user_id: userIds })
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Sync deal_users table (for deal chat @mention filtering)
    try {
      // Remove users no longer assigned
      if (removed.length > 0) {
        await supabaseAdmin
          .from("deal_users")
          .delete()
          .eq("deal_id", id)
          .in("user_id", removed)
      }
      // Upsert current users
      if (userIds.length > 0) {
        await supabaseAdmin
          .from("deal_users")
          .upsert(
            userIds.map((uid) => ({ deal_id: id, user_id: uid })),
            { onConflict: "deal_id,user_id" }
          )
      }
    } catch {
      // deal_users sync should not block the main flow (id may not be a deal)
    }

    // Log activity for user assignment changes
    try {
      if (added.length > 0) {
        await supabaseAdmin.from("pricing_activity_log").insert({
          loan_id: id,
          activity_type: "user_assignment",
          action: "added",
          user_id: userId,
          assigned_to_changes: added,
        })
      }
      if (removed.length > 0) {
        await supabaseAdmin.from("pricing_activity_log").insert({
          loan_id: id,
          activity_type: "user_assignment",
          action: "deleted",
          user_id: userId,
          assigned_to_changes: removed,
        })
      }
    } catch {
      // Activity logging should not block the main flow
    }

    // Send Liveblocks notification to newly assigned users
    if (added.length > 0) {
      try {
        const { data: assignerRow } = await supabaseAdmin
          .from("users")
          .select("full_name, first_name, last_name")
          .eq("clerk_user_id", userId)
          .maybeSingle()
        const assignerName =
          assignerRow?.full_name ||
          [assignerRow?.first_name, assignerRow?.last_name].filter(Boolean).join(" ") ||
          "Someone"
        // The id here could be a loan or deal; use it as both loanId and dealId for routing
        await Promise.allSettled(
          added
            .filter((uid) => uid !== userId)
            .map((uid) =>
              notifyLoanAssignment(uid, { loanId: id, dealId: id, assignerName })
            )
        )
      } catch {
        // Notification is non-critical
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


