import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const { searchParams } = new URL(req.url)
    const loanId = searchParams.get("loanId")

    // Resolve current member/role
    const { data: me, error: meErr } = await supabaseAdmin
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .maybeSingle()
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 })
    const myRole = String((me as any)?.role ?? "").toLowerCase()
    const myMemberId = (me?.id as string) ?? null

    let members: Array<{ user_id: string; first_name?: string | null; last_name?: string | null }> = []
    let editable = true

    if (myRole === "broker") {
      editable = false
      if (loanId) {
        const { data: loan, error: loanErr } = await supabaseAdmin
          .from("loans")
          .select("assigned_to_user_id, organization_id")
          .eq("id", loanId)
          .maybeSingle()
        if (loanErr) return NextResponse.json({ error: loanErr.message }, { status: 500 })
        const assigned = Array.isArray((loan as any)?.assigned_to_user_id)
          ? (((loan as any).assigned_to_user_id as string[]) ?? [])
          : []
        if (assigned.length > 0) {
          const { data, error } = await supabaseAdmin
            .from("organization_members")
            .select("user_id, first_name, last_name")
            .eq("organization_id", orgUuid)
            .in("user_id", assigned)
          if (error) return NextResponse.json({ error: error.message }, { status: 500 })
          members = (data ?? []) as any
        }
      }
    } else if (myRole === "owner") {
      const { data, error } = await supabaseAdmin
        .from("organization_members")
        .select("user_id, first_name, last_name")
        .eq("organization_id", orgUuid)
        .order("first_name", { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      members = (data ?? []) as any
    } else {
      // loan_officer or loan_processor (or others): include owners, loan_officers, loan_processors
      const baseRoles = ["owner", "loan_officer", "loan_processor"]
      const { data: baseMembers, error: baseErr } = await supabaseAdmin
        .from("organization_members")
        .select("id, user_id, first_name, last_name, role")
        .eq("organization_id", orgUuid)
        .in("role", baseRoles)
      if (baseErr) return NextResponse.json({ error: baseErr.message }, { status: 500 })
      members = (baseMembers ?? []).map((m) => ({
        user_id: m.user_id as string,
        first_name: (m.first_name as string | null) ?? "",
        last_name: (m.last_name as string | null) ?? "",
      }))

      // Add brokers managed by this member
      if (myMemberId) {
        const { data: brokerRows, error: brokersErr } = await supabaseAdmin
          .from("brokers")
          .select("organization_member_id")
          .eq("organization_id", orgUuid)
          .contains("account_manager_ids", [myMemberId])
        if (brokersErr) return NextResponse.json({ error: brokersErr.message }, { status: 500 })
        const brokerMemberIds = (brokerRows ?? [])
          .map((b) => (b as any).organization_member_id as string | null)
          .filter(Boolean)
        if (brokerMemberIds.length > 0) {
          const { data: brokersMembers, error: orgErr } = await supabaseAdmin
            .from("organization_members")
            .select("user_id, first_name, last_name")
            .eq("organization_id", orgUuid)
            .in("id", brokerMemberIds)
          if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
          for (const m of brokersMembers ?? []) {
            members.push({
              user_id: m.user_id as string,
              first_name: (m.first_name as string | null) ?? "",
              last_name: (m.last_name as string | null) ?? "",
            })
          }
        }
      }
    }

    // Deduplicate by user_id
    const seen = new Set<string>()
    const deduped = members.filter((m) => {
      const id = String(m.user_id)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    return NextResponse.json({ members: deduped, editable })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


