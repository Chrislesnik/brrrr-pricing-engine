import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: loanId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!loanId) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })

    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null

    // Verify loan belongs to user's organization
    if (orgUuid) {
      const { data: loan, error: loanErr } = await supabaseAdmin
        .from("loans")
        .select("organization_id")
        .eq("id", loanId)
        .single()
      if (loanErr || !loan) {
        return NextResponse.json({ error: "Loan not found" }, { status: 404 })
      }
      if (loan.organization_id !== orgUuid) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Fetch activity logs for this loan
    const { data: logs, error: logsErr } = await supabaseAdmin
      .from("pricing_activity_log")
      .select("*")
      .eq("loan_id", loanId)
      .order("created_at", { ascending: false })

    if (logsErr) {
      return NextResponse.json({ error: logsErr.message }, { status: 500 })
    }

    // Get unique user IDs from the logs
    const userIds = [...new Set((logs ?? []).map((log) => log.user_id).filter(Boolean))]

    // Also get user IDs from assigned_to_changes arrays
    const assignedUserIds = (logs ?? [])
      .flatMap((log) => log.assigned_to_changes ?? [])
      .filter(Boolean)
    const allUserIds = [...new Set([...userIds, ...assignedUserIds])]

    // Fetch user names from organization_members
    const userMap: Record<string, { first_name: string | null; last_name: string | null }> = {}
    if (allUserIds.length > 0 && orgUuid) {
      const { data: members } = await supabaseAdmin
        .from("organization_members")
        .select("user_id, first_name, last_name")
        .eq("organization_id", orgUuid)
        .in("user_id", allUserIds)

      if (members) {
        for (const m of members) {
          userMap[m.user_id] = {
            first_name: m.first_name,
            last_name: m.last_name,
          }
        }
      }
    }

    // Format logs with user info
    const formattedLogs = (logs ?? []).map((log) => {
      const user = userMap[log.user_id] ?? null
      const firstName = user?.first_name ?? ""
      const lastName = user?.last_name ?? ""
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
      const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || log.user_id?.slice(0, 2)?.toUpperCase() || "?"

      // Get names for assigned_to_changes
      const assignedNames = (log.assigned_to_changes ?? []).map((uid: string) => {
        const u = userMap[uid]
        if (u) {
          return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || uid
        }
        return uid
      })

      return {
        id: log.id,
        loan_id: log.loan_id,
        scenario_id: log.scenario_id,
        activity_type: log.activity_type,
        action: log.action,
        created_at: log.created_at,
        user_id: log.user_id,
        user_name: fullName || log.user_id,
        user_initials: initials,
        assigned_to_changes: log.assigned_to_changes,
        assigned_names: assignedNames,
        inputs: log.inputs,
        outputs: log.outputs,
        selected: log.selected,
        term_sheet_original_path: log.term_sheet_original_path,
        term_sheet_edit_path: log.term_sheet_edit_path,
      }
    })

    return NextResponse.json({ logs: formattedLogs, userMap })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
