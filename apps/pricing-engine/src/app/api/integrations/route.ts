import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/** Platform integration types that have enable/disable status stored in config.status */
const PLATFORM_TYPES = ["floify", "xactus", "clear", "nadlan"]

/** Check if a config has real credential values (not just empty strings) */
function hasCredentials(config: Record<string, unknown>, type: string): boolean {
  switch (type) {
    case "floify":
      return Boolean((config.x_api_key as string)?.trim()) && Boolean((config.user_api_key as string)?.trim())
    case "xactus":
      return Boolean((config.account_user as string)?.trim()) && Boolean((config.account_password as string)?.trim())
    case "clear":
    case "nadlan":
      return Boolean((config.username as string)?.trim()) && Boolean((config.password as string)?.trim())
    default:
      return Object.values(config).some((v) => typeof v === "string" && v.trim().length > 0)
  }
}

export async function GET(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("integration_setup")
      .select("id, type, config")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .in("type", PLATFORM_TYPES)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data ?? []).map((r) => {
      const config = (r.config as Record<string, unknown>) || {}
      const hasKey = hasCredentials(config, r.type as string)
      const status = hasKey && config.status === "true"
      return {
        type: r.type as string,
        status,
        has_key: hasKey,
      }
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

    // Find existing row
    const { data: existing } = await supabaseAdmin
      .from("integration_setup")
      .select("id, config")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .eq("type", type)
      .is("name", null)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    const config = (existing.config as Record<string, unknown>) || {}

    // Check credentials exist before enabling
    if (status && !hasCredentials(config, type)) {
      return NextResponse.json(
        { error: "Credentials required before enabling", row: { type, status: false, has_key: false } },
        { status: 400 }
      )
    }

    // Update status in config
    const updatedConfig = { ...config, status: status.toString() }
    const { error } = await supabaseAdmin
      .from("integration_setup")
      .update({ config: updatedConfig })
      .eq("id", existing.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ row: { type, status } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
