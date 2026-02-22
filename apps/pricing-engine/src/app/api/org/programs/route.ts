import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { orgId, orgRole } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id, internal_name, external_name, status")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 200 })
    }
    let items = Array.isArray(data)
      ? data.map((p) => ({
          id: p.id as string,
          internal_name: (p.internal_name as string) ?? "",
          external_name: (p.external_name as string) ?? "",
          status: (p.status as string) ?? "",
        }))
      : []

    const isBroker = orgRole === "org:broker" || orgRole === "broker"
    if (isBroker && orgUuid) {
      const { data: settings } = await supabaseAdmin
        .from("custom_broker_settings")
        .select("program_visibility")
        .eq("broker_org_id", orgUuid)
        .maybeSingle()
      const visibility = (settings?.program_visibility ?? {}) as Record<string, boolean>
      items = items.filter((p) => visibility[p.id] === true)
    }

    return NextResponse.json({ items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch programs"
    return NextResponse.json({ items: [], error: msg }, { status: 200 })
  }
}
