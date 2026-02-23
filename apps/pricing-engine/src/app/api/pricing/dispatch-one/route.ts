import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { fetchProgramConditions, evaluateProgramConditions } from "@/lib/program-condition-evaluator"

export const runtime = "nodejs"

async function waitForOrgMemberId(
  orgUuid: string | null,
  userId: string | null | undefined,
  maxWaitMs = 5000,  // Reduced from 45s to 5s for faster debugging
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
      // ignore
    }
    if (Date.now() - start >= maxWaitMs) {
      // Timeout reached - return null instead of looping forever
      return null
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

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
    console.log("[dispatch-one] Starting POST request")
    const { orgId, userId } = await auth()
    console.log("[dispatch-one] Auth:", { orgId, userId })

    const json = (await req.json().catch(() => null)) as {
      programId?: string
      inputValuesById?: Record<string, unknown>
      data?: Record<string, unknown>
    } | null
    console.log("[dispatch-one] Payload:", { programId: json?.programId, hasData: !!json?.data, hasInputValuesById: !!json?.inputValuesById })
    if (!json?.programId || !json?.data) {
      console.log("[dispatch-one] Missing payload, returning 400")
      return new NextResponse("Missing payload", { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    console.log("[dispatch-one] orgUuid:", orgUuid)
    // Resolve caller's organization_member_id for attribution (wait until available)
    const myMemberId = await waitForOrgMemberId(orgUuid ?? null, userId)
    console.log("[dispatch-one] myMemberId:", myMemberId)

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id,internal_name,external_name,webhook_url")
      .eq("status", "active")
    console.log("[dispatch-one] Programs query result:", { count: data?.length, error: error?.message })
    if (error) return new NextResponse(error.message, { status: 500 })

    const match = (data ?? []).find((p) =>
      p.id === json.programId ||
        p.internal_name === json.programId ||
        p.external_name === json.programId
    )
    console.log("[dispatch-one] Looking for programId:", json.programId, "Found match:", match ? { id: match.id, internal_name: match.internal_name } : null)

    if (match?.id) {
      const condMap = await fetchProgramConditions([match.id])
      const entry = condMap.get(match.id)
      if (entry && entry.conditions.length > 0) {
        const conditionValues = json.inputValuesById ?? json.data ?? {}
        const passes = evaluateProgramConditions(entry.conditions, entry.logic_type, conditionValues)
        if (!passes) {
          console.log("[dispatch-one] Program conditions not met, skipping")
          return NextResponse.json({
            id: match.id,
            internal_name: match.internal_name,
            external_name: match.external_name,
            ok: false,
            status: 0,
            data: null,
          })
        }
      }
    }

    if (!match || !String(match.webhook_url || "").trim()) {
      console.log("[dispatch-one] No match or no webhook URL, returning early")
      return NextResponse.json({
        internal_name: match?.internal_name,
        external_name: match?.external_name,
        ok: false,
        status: 0,
        data: null,
      })
    }

    const url = String(match.webhook_url).trim()
    console.log("[dispatch-one] Will POST to webhook:", url)
    const normalizedData = booleanToYesNoDeep(json.data) as Record<string, unknown>
    normalizedData["organization_member_id"] = myMemberId
    normalizedData["program_id"] = match.id
    console.log("[dispatch-one] Sending POST to webhook...")
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
    console.log("[dispatch-one] Webhook response status:", res.status, res.ok)
    let body: Record<string, unknown> | null = null
    try {
      const parsed = await res.json()
      if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>
    } catch {
      body = null
    }
    console.log("[dispatch-one] Returning success response")
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
    console.error("[dispatch-one] Error:", msg)
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}


