import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })

    // Look up the loan organization id
    const { data: loanRow, error: loanErr } = await supabaseAdmin
      .from("loans")
      .select("organization_id")
      .eq("id", id)
      .single()
    if (loanErr) return NextResponse.json({ error: loanErr.message }, { status: 500 })
    const orgId = loanRow?.organization_id as string | undefined

    // Fetch the primary scenario (or most recent) with inputs
    const { data: scenario, error: scenErr } = await supabaseAdmin
      .from("loan_scenarios")
      .select("inputs, primary, created_at")
      .eq("loan_id", id)
      .order("primary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (scenErr) return NextResponse.json({ error: scenErr.message }, { status: 500 })

    const inputs = (scenario?.inputs as Record<string, unknown>) ?? {}
    const names = Array.isArray(inputs["guarantors"]) ? (inputs["guarantors"] as string[]) : []
    let entityName = typeof inputs["entity_name"] === "string" ? (inputs["entity_name"] as string) : null
    let borrowerEntityIds: string[] = []
    if (orgId && entityName) {
      const { data: ents } = await supabaseAdmin
        .from("entities")
        .select("id, entity_name, organization_id")
        .eq("organization_id", orgId)
        .ilike("entity_name", entityName)
      borrowerEntityIds = (ents ?? []).map((e: any) => String(e.id))
    }
    // Fallback: if no explicit entity_name in inputs, try to match borrower_name to an Entity
    if (orgId && borrowerEntityIds.length === 0 && (!entityName || !entityName.trim())) {
      const borrowerName = typeof inputs["borrower_name"] === "string" ? (inputs["borrower_name"] as string) : null
      if (borrowerName && borrowerName.trim().length > 0) {
        const { data: ents } = await supabaseAdmin
          .from("entities")
          .select("id, entity_name, organization_id")
          .eq("organization_id", orgId)
          .ilike("entity_name", borrowerName)
        borrowerEntityIds = (ents ?? []).map((e: any) => String(e.id))
        if (!entityName && (ents ?? []).length > 0) {
          entityName = String((ents as any[])[0]?.entity_name ?? borrowerName)
        }
      }
    }
    if (names.length === 0) {
      return NextResponse.json({ guarantors: [], entityIds: borrowerEntityIds, entityName })
    }

    // Attempt to resolve emails from borrowers table within same org
    let matchByName = new Map<string, { id: string; email: string | null }>()
    if (orgId) {
      const { data: borrowers, error: bErr } = await supabaseAdmin
        .from("borrowers")
        .select("id,first_name,last_name,email,organization_id")
        .eq("organization_id", orgId)
      if (!bErr) {
        for (const b of borrowers ?? []) {
          const full = [b.first_name, b.last_name].filter(Boolean).join(" ").trim().toLowerCase()
          if (full) {
            matchByName.set(full, { id: String(b.id), email: (b.email as string | null) ?? null })
          }
        }
      }
    }

    const result = names.map((name) => {
      const key = String(name ?? "").trim().toLowerCase()
      const match = matchByName.get(key)
      return { id: match?.id ?? null, name: String(name ?? ""), email: match?.email ?? null }
    })

    return NextResponse.json({ guarantors: result, entityIds: borrowerEntityIds, entityName })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


