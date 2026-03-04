import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/background-reports/[id]/applications
 * List all applications linked to a specific background report.
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

    const { id: reportId } = await params

    // Verify the report belongs to this org
    const { data: report, error: reportError } = await supabaseAdmin
      .from("background_reports")
      .select("id")
      .eq("id", reportId)
      .eq("organization_id", orgUuid)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Fetch linked applications
    const { data, error } = await supabaseAdmin
      .from("background_report_applications")
      .select("application_id, created_at")
      .eq("background_report_id", reportId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/background-reports/[id]/applications] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ applications: data ?? [] })
  } catch (e) {
    console.error("[GET /api/background-reports/[id]/applications] error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
