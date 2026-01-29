import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

async function waitForOrgMemberId(
  orgUuid: string | null,
  userId: string | null | undefined,
  maxWaitMs = 45000,
  intervalMs = 400
): Promise<string> {
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
      // continue waiting but avoid tight loop
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

export async function POST(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()

    const json = (await req.json().catch(() => null)) as {
      loanType?: string
      programId?: string
      data?: Record<string, unknown>
    } | null
    if (!json?.loanType || !json?.programId || !json?.data) {
      return new NextResponse("Missing payload", { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    // Resolve caller's organization_member_id for attribution (wait until available)
    const myMemberId = await waitForOrgMemberId(orgUuid ?? null, userId)

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
    // Ensure admin fee aliases are always present
    if (normalizedData["lender_admin_fee"] === undefined && normalizedData["admin_fee"] !== undefined) {
      normalizedData["lender_admin_fee"] = normalizedData["admin_fee"]
    }
    if (normalizedData["admin_fee"] === undefined && normalizedData["lender_admin_fee"] !== undefined) {
      normalizedData["admin_fee"] = normalizedData["lender_admin_fee"]
    }
    if (normalizedData["broker_admin_fee"] === undefined) {
      normalizedData["broker_admin_fee"] = ""
    }
    // Attach organization_member_id for downstream auditing (always)
    normalizedData["organization_member_id"] = myMemberId
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


