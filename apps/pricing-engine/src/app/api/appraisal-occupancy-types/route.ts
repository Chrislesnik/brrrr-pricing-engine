import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-occupancy-types?settingsId=<bigint>
 * Returns occupancy names from appraisal_occupancy_list for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ occupancyTypes: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_occupancy_list")
      .select("id, occupancy_name")
      .eq("integration_settings_id", settingsId)
      .order("occupancy_name")

    if (error) {
      console.error("[GET /api/appraisal-occupancy-types] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const occupancyTypes = (data ?? []).map((row) => row.occupancy_name as string)

    return NextResponse.json({ occupancyTypes })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
