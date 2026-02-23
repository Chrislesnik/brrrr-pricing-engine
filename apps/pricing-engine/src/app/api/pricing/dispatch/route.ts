import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { filterProgramsByConditions } from "@/lib/program-condition-evaluator"

export const runtime = "nodejs"

async function waitForOrgMemberId(
  orgUuid: string | null,
  userId: string | null | undefined,
  maxWaitMs = 45000,
  intervalMs = 400
): Promise<string | null> {
  const start = Date.now()
  while (true) {
    try {
      if (orgUuid && userId) {
        const { data: me } = await supabaseAdmin
          .from("organization_members")
          .select("id")
          .eq("organization_id", orgUuid)
          .eq("user_id", userId)
          .maybeSingle()
        const id = (me?.id as string) ?? null
        if (id) return id
      }
    } catch {
      // ignore and retry
    }
    if (Date.now() - start >= maxWaitMs) {
      // Timeout reached - return null instead of looping forever
      return null
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

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
    const { orgId, userId } = await auth()
    const json = await req.json().catch(() => null) as {
      loanType?: string
      data?: Record<string, unknown>
    } | null
    if (!json || !json.loanType || !json.data) {
      return new NextResponse("Missing payload", { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    // Resolve caller's organization_member_id (wait until available)
    const myMemberId = await waitForOrgMemberId(orgUuid ?? null, userId)

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id,internal_name,external_name,webhook_url")
      .eq("status", "active")
    if (error) {
      return new NextResponse(`Query error: ${error.message}`, { status: 500 })
    }
    const allActive = (data ?? []).filter((p) => (p.webhook_url ?? "").trim() !== "")
    const programs = await filterProgramsByConditions(allActive, json.data ?? {})

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
    normalizedData["organization_member_id"] = myMemberId
    const requestIdBase = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    await Promise.all(
      programs.map(async (p, idx) => {
        const url = String(p.webhook_url).trim()
        if (!url) return
        try {
          const requestId = `${requestIdBase}-${idx}`
          const payload = { ...normalizedData, program_id: p.id }
          const res = await fetch(url, {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
              "X-Request-Id": requestId,
            },
            body: JSON.stringify(payload),
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


