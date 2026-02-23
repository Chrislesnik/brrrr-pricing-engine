import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-orders/[id]/statuses
 * Returns the appraisal_status_list entries for this appraisal's integration,
 * resolved through: appraisal.amc_id -> integration_setup.integration_settings_id
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { id } = await params
    const appraisalId = parseInt(id, 10)
    if (isNaN(appraisalId)) {
      return NextResponse.json({ error: "Invalid appraisal ID" }, { status: 400 })
    }

    const { data: appraisal, error: appraisalErr } = await supabaseAdmin
      .from("appraisal")
      .select("id, amc_id, integration_setup:amc_id (id, integration_settings_id)")
      .eq("id", appraisalId)
      .eq("organization_id", orgUuid)
      .single()

    if (appraisalErr || !appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    const setup = appraisal.integration_setup as { id: string; integration_settings_id: number | null } | null
    const integrationSettingsId = setup?.integration_settings_id

    if (!integrationSettingsId) {
      return NextResponse.json({ statuses: [] })
    }

    const { data: statuses, error: statusErr } = await supabaseAdmin
      .from("appraisal_status_list")
      .select("id, status_id, status_name, revision_requested")
      .eq("integration_settings_id", integrationSettingsId)
      .order("id", { ascending: true })

    if (statusErr) {
      console.error("[GET /api/appraisal-orders/[id]/statuses] Error:", statusErr)
      return NextResponse.json({ error: statusErr.message }, { status: 500 })
    }

    return NextResponse.json({ statuses: statuses ?? [] })
  } catch (e) {
    console.error("[GET /api/appraisal-orders/[id]/statuses] Unexpected:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
