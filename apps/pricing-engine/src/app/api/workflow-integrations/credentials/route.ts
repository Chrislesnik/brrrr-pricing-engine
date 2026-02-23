import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/workflow-integrations/credentials
 *
 * Returns the raw (unstripped) credential config for all of the current user's
 * workflow integrations. Used internally by the workflow runner to enrich step
 * inputs with stored API keys.
 *
 * Response: { credentials: Record<integrationType, config> }
 */
export async function GET(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("integration_setup")
      .select("type, config")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Build a map of type -> merged config (if user has multiple of same type, merge them)
    const credentials: Record<string, Record<string, unknown>> = {}
    for (const row of data ?? []) {
      const type = row.type as string
      const config = (row.config as Record<string, unknown>) || {}
      credentials[type] = { ...credentials[type], ...config }
    }

    return NextResponse.json({ credentials })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
