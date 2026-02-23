import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-amcs
 * List integration connections whose parent integration_settings has the 'amc' tag
 * in the integration_tags table.
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    // Step 1: Get integration_settings IDs that have the 'amc' tag
    const { data: tagRows, error: tagErr } = await supabaseAdmin
      .from("integration_tags")
      .select("integration_settings_id")
      .eq("tag", "amc")

    if (tagErr) {
      console.error("[GET /api/appraisal-amcs] tag query error:", tagErr.message)
      return NextResponse.json({ error: tagErr.message }, { status: 500 })
    }

    const settingsIds = (tagRows ?? []).map((r) => r.integration_settings_id)

    if (settingsIds.length === 0) {
      return NextResponse.json({ amcs: [] })
    }

    // Step 2: Get connections linked to those settings, scoped to this org
    const { data, error } = await supabaseAdmin
      .from("integration_setup")
      .select("id, name, type, integration_settings_id")
      .eq("organization_id", orgUuid)
      .in("integration_settings_id", settingsIds)
      .is("archived_at", null)
      .order("name")

    if (error) {
      console.error("[GET /api/appraisal-amcs] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const amcs = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name || row.type || "Unnamed",
    }))

    return NextResponse.json({ amcs })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
