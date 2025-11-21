import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

function booleanToYesNoDeep(value: unknown): unknown {
  if (typeof value === "boolean") {
    return value ? "yes" : "no"
  }
  if (Array.isArray(value)) {
    return value.map((v) => booleanToYesNoDeep(v))
  }
  if (value && typeof value === "object") {
    const src = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(src)) {
      out[k] = booleanToYesNoDeep(v)
    }
    return out
  }
  return value
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    if (!orgId) {
      return new NextResponse("No active organization", { status: 400 })
    }
    const json = await req.json().catch(() => null) as {
      loanType?: string
      data?: Record<string, unknown>
    } | null
    if (!json || !json.loanType || !json.data) {
      return new NextResponse("Missing payload", { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return new NextResponse("Organization not found", { status: 400 })
    }

    // fetch active program webhooks for this org + loan type
    const { data, error } = await superFetchPrograms(orgUuid, json.loanType)
    if (error) {
      return new NextResponse(`Query error: ${error}`, { status: 500 })
    }
    const programs = (data ?? []).filter((p) => (p.webhook_url ?? "").trim() !== "")

    let delivered = 0
    const results: {
      internal_name?: string
      external_name?: string
      webhook_url?: string
      status?: number
      ok?: boolean
      data: Record<string, unknown> | null
    }[] = []
    const normalizedData = booleanToYesNoDeep(json.data) as Record<string, unknown>
    await Promise.all(
      programs.map(async (p) => {
        const url = String(p.webhook_url).trim()
        if (!url) return
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizedData),
          })
          let body: Record<string, unknown> | null = null
          try {
            const parsed = await res.json()
            if (parsed && typeof parsed === "object") {
              body = parsed as Record<string, unknown>
            }
          } catch {
            body = null
          }
          const ok = res.ok
          if (ok) delivered += 1
          results.push({
            internal_name: p.internal_name,
            external_name: p.external_name,
            webhook_url: url,
            status: res.status,
            ok,
            data: body // whatever the webhook returned
          })
        } catch {
          // swallow individual failures; aggregate count below
          results.push({
            internal_name: p.internal_name,
            external_name: p.external_name,
            webhook_url: url,
            status: 0,
            ok: false,
            data: null
          })
        }
      })
    )

    return NextResponse.json({ delivered, attempted: programs.length, programs: results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}

async function superFetchPrograms(orgUuid: string, loanType: string) {
  const { data, error } = await supabaseAdmin
    .from("programs")
    .select("internal_name,external_name,webhook_url")
    .eq("organization_id", orgUuid)
    .eq("loan_type", loanType.toLowerCase())
    .eq("status", "active")
  return { data, error: error?.message }
}


