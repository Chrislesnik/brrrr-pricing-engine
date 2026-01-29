import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type AppRow = {
  organization_id?: string | null
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

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })

  // Pull from applications row (same source as Applications table)
  const { data: appRow, error: appErr } = await supabaseAdmin
    .from("applications")
    .select("organization_id, entity_id, borrower_name, guarantor_ids, guarantor_names, guarantor_emails")
    .eq("loan_id", id)
    .maybeSingle<AppRow>()
  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 })
  if (!appRow) return NextResponse.json({ guarantors: [], entityIds: [], entityName: null })

    // Resolve entity display name
    let entityIds: string[] = []
    let entityName: string | null = null
    if (appRow.entity_id) {
      entityIds = [appRow.entity_id]
      const { data: ent } = await supabaseAdmin.from("entities").select("name").eq("id", appRow.entity_id).maybeSingle()
      entityName = (ent?.name as string) ?? appRow.borrower_name ?? null
    } else {
      entityName = appRow.borrower_name ?? null
    }

  // Build guarantors exactly like Applications table
  const ids = extractIds(appRow.guarantor_ids)
  const names = Array.isArray(appRow.guarantor_names) ? (appRow.guarantor_names as string[]) : []
  const emails = Array.isArray(appRow.guarantor_emails) ? (appRow.guarantor_emails as string[]) : []

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

  return NextResponse.json({ guarantors: resolved, entityIds, entityName })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


