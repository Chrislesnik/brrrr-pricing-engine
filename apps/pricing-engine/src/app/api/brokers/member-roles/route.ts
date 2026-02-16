import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/**
 * GET /api/brokers/member-roles
 *
 * Returns active member roles for the current organization (both global
 * and org-specific) from the organization_member_roles table.
 */
export async function GET() {
  try {
    const { orgId } = await auth()

    if (!orgId) {
      return NextResponse.json({ roles: [] })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ roles: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("organization_member_roles")
      .select("role_code, role_name")
      .or(`organization_id.is.null,organization_id.eq.${orgUuid}`)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("member-roles fetch error:", error.message)
      return NextResponse.json({ roles: [] })
    }

    return NextResponse.json({
      roles: (data ?? []).map((r) => ({
        value: r.role_code as string,
        label: r.role_name as string,
      })),
    })
  } catch (err) {
    console.error("member-roles API error:", err)
    return NextResponse.json({ roles: [] })
  }
}
