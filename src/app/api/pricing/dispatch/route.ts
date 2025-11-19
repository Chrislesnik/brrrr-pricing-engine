import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

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
    const webhooks = (data ?? [])
      .map((r) => String(r.webhook_url || "").trim())
      .filter((u) => !!u)

    let delivered = 0
    await Promise.all(
      webhooks.map(async (url) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(json.data),
          })
          if (res.ok) delivered += 1
        } catch {
          // swallow individual failures; aggregate count below
        }
      })
    )

    return NextResponse.json({ delivered, attempted: webhooks.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}

async function superFetchPrograms(orgUuid: string, loanType: string) {
  const { data, error } = await supabaseAdmin
    .from("programs")
    .select("webhook_url")
    .eq("organization_id", orgUuid)
    .eq("loan_type", loanType.toLowerCase())
    .eq("status", "active")
  return { data, error: error?.message }
}


