import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("integrations")
      .select("id, type, status")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // For floify, include has_key and force status=false when missing
    const floifyIds = (data ?? []).filter((r) => r.type === "floify").map((r) => r.id as string)
    let floifyKeys: Record<string, boolean> = {}
    if (floifyIds.length) {
      const { data: fkRows } = await supabaseAdmin
        .from("integrations_floify")
        .select("integration_id, x_api_key, user_api_key")
        .in("integration_id", floifyIds)
      floifyKeys = Object.fromEntries(
        (fkRows ?? []).map((r) => [
          r.integration_id as string,
          Boolean((r.x_api_key as string | null)?.trim()) && Boolean((r.user_api_key as string | null)?.trim()),
        ])
      )
    }

    // For xactus, include has_key and force status=false when missing
    const xactusIds = (data ?? []).filter((r) => r.type === "xactus").map((r) => r.id as string)
    let xactusKeys: Record<string, boolean> = {}
    if (xactusIds.length) {
      const { data: xkRows } = await supabaseAdmin
        .from("integrations_xactus")
        .select("integration_id, account_user, account_password")
        .in("integration_id", xactusIds)
      xactusKeys = Object.fromEntries(
        (xkRows ?? []).map((r) => [
          r.integration_id as string,
          Boolean((r.account_user as string | null)?.trim()) && Boolean((r.account_password as string | null)?.trim()),
        ])
      )
    }

    const rows = (data ?? []).map((r) => {
      if (r.type === "floify") {
        const hasKey = floifyKeys[r.id as string] ?? false
        return { type: r.type, status: hasKey ? r.status : false, has_key: hasKey }
      }
      if (r.type === "xactus") {
        const hasKey = xactusKeys[r.id as string] ?? false
        return { type: r.type, status: hasKey ? r.status : false, has_key: hasKey }
      }
      return { type: r.type, status: r.status, has_key: undefined }
    })

    return NextResponse.json({ rows })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const json = await req.json().catch(() => ({}))
    const type = (json?.type as string | undefined)?.toLowerCase()
    const status = Boolean(json?.status)
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 })

    // If floify, ensure key exists before enabling
    if (type === "floify" && status) {
      const { data: floifyRow } = await supabaseAdmin
        .from("integrations")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .eq("type", "floify")
        .maybeSingle()
      const floifyId = floifyRow?.id as string | undefined
      if (floifyId) {
        const { data: fk } = await supabaseAdmin
          .from("integrations_floify")
          .select("x_api_key, user_api_key")
          .eq("integration_id", floifyId)
          .maybeSingle()
        const hasKey =
          Boolean((fk?.x_api_key as string | null)?.trim()) && Boolean((fk?.user_api_key as string | null)?.trim())
        if (!hasKey) {
          return NextResponse.json(
            { error: "API keys required to enable Floify", row: { type, status: false, has_key: false } },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json({ error: "Floify integration not found", row: { type, status: false } }, { status: 400 })
      }
    }

    // If xactus, ensure credentials exist before enabling
    if (type === "xactus" && status) {
      const { data: xactusRow } = await supabaseAdmin
        .from("integrations")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .eq("type", "xactus")
        .maybeSingle()
      const xactusId = xactusRow?.id as string | undefined
      if (xactusId) {
        const { data: xk } = await supabaseAdmin
          .from("integrations_xactus")
          .select("account_user, account_password")
          .eq("integration_id", xactusId)
          .maybeSingle()
        const hasKey =
          Boolean((xk?.account_user as string | null)?.trim()) && Boolean((xk?.account_password as string | null)?.trim())
        if (!hasKey) {
          return NextResponse.json(
            { error: "Credentials required to enable Xactus", row: { type, status: false, has_key: false } },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json({ error: "Xactus integration not found", row: { type, status: false } }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from("integrations")
      .upsert(
        {
          organization_id: orgUuid,
          user_id: userId,
          type,
          status,
        },
        { onConflict: "organization_id,user_id,type" }
      )
      .select("type, status")
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ row: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
