import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

function booleanToYesNoDeep(value: unknown): unknown {
  if (typeof value === "boolean") return value ? "yes" : "no"
  if (Array.isArray(value)) return value.map((v) => booleanToYesNoDeep(v))
  if (value && typeof value === "object") {
    const src = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(src)) out[k] = booleanToYesNoDeep(v)
    return out
  }
  return value
}

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await auth()

    const json = (await req.json().catch(() => null)) as {
      loanType?: string
      programId?: string
      data?: Record<string, unknown>
    } | null
    if (!json?.loanType || !json?.programId || !json?.data) {
      return new NextResponse("Missing payload", { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)

    let q = supabaseAdmin
      .from("programs")
      .select("id,internal_name,external_name,webhook_url")
      .eq("loan_type", String(json.loanType).toLowerCase())
      .eq("status", "active")
    if (orgUuid) q = q.eq("organization_id", orgUuid)
    const { data, error } = await q
    if (error) return new NextResponse(error.message, { status: 500 })

    const match = (data ?? []).find((p) =>
      p.id === json.programId ||
      p.internal_name === json.programId ||
      p.external_name === json.programId
    )
    if (!match || !String(match.webhook_url || "").trim()) {
      return NextResponse.json({
        internal_name: match?.internal_name,
        external_name: match?.external_name,
        ok: false,
        status: 0,
        data: null,
      })
    }

    const url = String(match.webhook_url).trim()
    const normalizedData = booleanToYesNoDeep(json.data) as Record<string, unknown>
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      body: JSON.stringify(normalizedData),
    })
    let body: Record<string, unknown> | null = null
    try {
      const parsed = await res.json()
      if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>
    } catch {
      body = null
    }
    return NextResponse.json({
      id: (match as any).id,
      internal_name: match.internal_name,
      external_name: match.external_name,
      status: res.status,
      ok: res.ok,
      data: body,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}


