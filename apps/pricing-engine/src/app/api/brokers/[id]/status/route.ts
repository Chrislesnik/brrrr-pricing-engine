import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: brokerId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    if (!brokerId) return NextResponse.json({ error: "Missing broker id" }, { status: 400 })

    const { data: broker, error: brokerErr } = await supabaseAdmin
      .from("brokers")
      .select("id, status")
      .eq("id", brokerId)
      .eq("organization_id", orgUuid)
      .maybeSingle()
    if (brokerErr) return NextResponse.json({ error: brokerErr.message }, { status: 500 })
    if (!broker) return NextResponse.json({ error: "Broker not found" }, { status: 404 })

    return NextResponse.json({ status: (broker as any).status ?? "pending" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: brokerId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    if (!brokerId) return NextResponse.json({ error: "Missing broker id" }, { status: 400 })

    const body = (await req.json().catch(() => ({}))) as {
      action?: "toggle" | "set"
      status?: "active" | "inactive" | "pending"
    }

    const { data: broker, error: brokerErr } = await supabaseAdmin
      .from("brokers")
      .select("id, status")
      .eq("id", brokerId)
      .eq("organization_id", orgUuid)
      .maybeSingle()
    if (brokerErr) return NextResponse.json({ error: brokerErr.message }, { status: 500 })
    if (!broker) return NextResponse.json({ error: "Broker not found" }, { status: 404 })

    const current: string = ((broker as any).status ?? "pending").toLowerCase()

    let nextStatus: "active" | "inactive" | null = null
    if (body.action === "toggle") {
      if (current === "active") nextStatus = "inactive"
      else if (current === "inactive") nextStatus = "active"
      else return NextResponse.json({ error: "Cannot toggle from pending" }, { status: 400 })
    } else if (body.action === "set") {
      const desired = (body.status ?? "").toLowerCase()
      if (desired !== "active" && desired !== "inactive") {
        return NextResponse.json({ error: "Invalid status. Use 'active' or 'inactive'." }, { status: 400 })
      }
      nextStatus = desired as "active" | "inactive"
    } else {
      return NextResponse.json({ error: "Missing action ('toggle' or 'set')" }, { status: 400 })
    }

    const { error: updErr } = await supabaseAdmin
      .from("brokers")
      .update({ status: nextStatus })
      .eq("id", brokerId)
      .eq("organization_id", orgUuid)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, status: nextStatus })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


