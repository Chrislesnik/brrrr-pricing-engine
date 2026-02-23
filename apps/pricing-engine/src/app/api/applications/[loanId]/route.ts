import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type AppRow = {
  loan_id: string
  entity_id: string | null
  borrower_name: string | null
  guarantor_ids: (string | null)[] | null
  guarantor_names: (string | null)[] | null
  guarantor_emails: (string | null)[] | null
}

function extractIds(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((v) => typeof v === "string" && v.length > 0)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string" && v.length > 0)
    } catch {
      return []
    }
  }
  if (typeof raw === "object") {
    return (Object.values(raw as Record<string, unknown>) as unknown[]).filter((v) => typeof v === "string" && v.length > 0) as string[]
  }
  return []
}

export async function GET(req: Request, context: { params: Promise<{ loanId?: string }> }) {
  // Accept loanId from path or query string for resilience
  const url = new URL(req.url)
  const params = await context.params
  const loanId = params?.loanId || url.searchParams.get("loanId") || url.searchParams.get("id")
  if (!loanId) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })

  // Pull the applications row for this loan
  const { data: appRow, error: appErr } = await supabaseAdmin
    .from("applications")
    .select("loan_id, entity_id, borrower_name, guarantor_ids, guarantor_names, guarantor_emails, property_street, property_city, property_state, property_zip")
    .eq("loan_id", loanId)
    .maybeSingle<AppRow & { property_street?: string | null; property_city?: string | null; property_state?: string | null; property_zip?: string | null }>()

  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 })
  if (!appRow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ids = extractIds(appRow.guarantor_ids)
  const names = Array.isArray(appRow.guarantor_names) ? (appRow.guarantor_names as string[]) : []
  const emails = Array.isArray(appRow.guarantor_emails) ? (appRow.guarantor_emails as string[]) : []

  // Resolve linked guarantors from borrowers table
  let borrowerMap: Record<string, { name: string; email: string | null }> = {}
  if (ids.length) {
    const { data: borrowers } = await supabaseAdmin
      .from("borrowers")
      .select("id, first_name, last_name, email")
      .in("id", ids)
    borrowerMap = Object.fromEntries(
      (borrowers ?? []).map((b) => [
        String(b.id),
        {
          name: [b.first_name ?? "", b.last_name ?? ""].filter(Boolean).join(" ").trim(),
          email: (b.email as string | null) ?? null,
        },
      ])
    )
  }

  const resolved: Array<{ id: string; name: string; email: string | null }> = []

  ids.forEach((gid, idx) => {
    resolved.push({
      id: gid,
      name: borrowerMap[gid]?.name || names[idx] || gid,
      email: borrowerMap[gid]?.email ?? emails[idx] ?? null,
    })
  })

  if (names.length) {
    names.forEach((n, idx) => {
      const fallbackId = `guarantor-name-${idx + 1}`
      if (!resolved[idx]) {
        resolved.push({
          id: fallbackId,
          name: n,
          email: emails[idx] ?? null,
        })
      }
    })
  }

  // Resolve entity name
  let entityName: string | null = null
  if (appRow.entity_id) {
    const { data: ent } = await supabaseAdmin.from("entities").select("entity_name").eq("id", appRow.entity_id).maybeSingle()
    entityName = (ent?.entity_name as string) ?? appRow.borrower_name ?? null
  } else {
    entityName = appRow.borrower_name ?? null
  }

  // Build property address
  const stateZip = [appRow.property_state, appRow.property_zip]
    .filter((p) => (p ?? "").toString().trim().length > 0)
    .join(" ")
  const addrParts = [appRow.property_street, appRow.property_city, stateZip].filter(
    (p) => (p ?? "").toString().trim().length > 0
  )
  const propertyAddress = addrParts.length ? addrParts.join(", ") : null

  return NextResponse.json({
    id: appRow.loan_id,
    entityId: appRow.entity_id,
    entityName,
    propertyAddress,
    guarantors: resolved,
  })
}
