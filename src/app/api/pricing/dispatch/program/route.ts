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
    const { userId, orgId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })
    if (!orgId) return new NextResponse("No active organization", { status: 400 })

    const body = (await req.json().catch(() => null)) as
      | {
          loanType?: string
          data?: Record<string, unknown>
          program?: { internal_name?: string; external_name?: string }
        }
      | null

    if (!body || !body.loanType || !body.data || !body.program) {
      return new NextResponse("Missing payload", { status: 400 })
    }
    const loanType = String(body.loanType).toLowerCase()
    const programName = body.program.internal_name || body.program.external_name || ""
    if (!programName) return new NextResponse("Missing program name", { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return new NextResponse("Organization not found", { status: 400 })

    // Look up webhook for this program
    const { data: programRow, error } = await supabaseAdmin
      .from("programs")
      .select("internal_name,external_name,webhook_url")
      .eq("organization_id", orgUuid)
      .eq("loan_type", loanType)
      .or(`internal_name.eq.${programName},external_name.eq.${programName}`)
      .limit(1)
      .maybeSingle()

    if (error) return new NextResponse(error.message, { status: 500 })
    const url = String(programRow?.webhook_url || "").trim()
    if (!url) return new NextResponse("Program webhook not configured", { status: 400 })

    const normalized = booleanToYesNoDeep(body.data) as Record<string, unknown>
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify(normalized),
    })

    let data: Record<string, unknown> | null = null
    try {
      const parsed = await res.json()
      if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>
    } catch {
      data = null
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      webhook_url: url,
      internal_name: programRow?.internal_name,
      external_name: programRow?.external_name,
      data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}


