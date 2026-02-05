import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(_req: NextRequest) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ rows: [] })

    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("loan_id, guarantor_names, guarantor_emails")
      .eq("organization_id", orgUuid)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data ?? []) as any[]
    const loanIds = rows.map((r) => r.loan_id as string)
    const guarantorTotals: Record<string, number> = {}
    rows.forEach((r) => {
      const names = Array.isArray(r.guarantor_names) ? (r.guarantor_names as string[]) : []
      guarantorTotals[r.loan_id as string] = names.length
    })

    let signedCounts: Record<string, number> = {}
    let signedEmails: Record<string, string[]> = {}
    let sentEmails: Record<string, string[]> = {}
    if (loanIds.length) {
      const { data: signings } = await supabaseAdmin
        .from("application_signings")
        .select("loan_id, signer_email")
        .in("loan_id", loanIds)
      signedCounts = (signings ?? []).reduce((acc: Record<string, number>, row: any) => {
        const loanId = row.loan_id as string
        acc[loanId] = (acc[loanId] ?? 0) + 1
        return acc
      }, {})
      signedEmails = (signings ?? []).reduce((acc: Record<string, string[]>, row: any) => {
        const loanId = row.loan_id as string
        const email = (row.signer_email as string | null)?.toLowerCase() ?? null
        if (!email) return acc
        if (!acc[loanId]) acc[loanId] = []
        if (!acc[loanId].includes(email)) acc[loanId].push(email)
        return acc
      }, {})

      // Fetch sent emails from applications_emails_sent table
      const { data: sentEmailsData } = await supabaseAdmin
        .from("applications_emails_sent")
        .select("loan_id, email")
        .in("loan_id", loanIds)
      sentEmails = (sentEmailsData ?? []).reduce((acc: Record<string, string[]>, row: any) => {
        const loanId = row.loan_id as string
        const email = (row.email as string | null)?.toLowerCase() ?? null
        if (!email) return acc
        if (!acc[loanId]) acc[loanId] = []
        if (!acc[loanId].includes(email)) acc[loanId].push(email)
        return acc
      }, {})
    }

    const result = rows.map((r) => {
      const total = guarantorTotals[r.loan_id] ?? 0
      const signed = signedCounts[r.loan_id] ?? 0
      const pct = total > 0 ? Math.min(1, Math.max(0, signed / total)) : 0
      const emails = Array.isArray(r.guarantor_emails) ? (r.guarantor_emails as string[]) : []
      return {
        loan_id: r.loan_id as string,
        signingProgressPct: pct,
        signingSigned: signed,
        signingTotal: total,
        signingEmails: signedEmails[r.loan_id]?.length ? signedEmails[r.loan_id] : [],
        sentEmails: sentEmails[r.loan_id]?.length ? sentEmails[r.loan_id] : [],
        guarantorEmails: emails.map((e: string) => (e ?? "").toLowerCase()).filter((e: string) => e.length > 0),
      }
    })

    return NextResponse.json({ rows: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
