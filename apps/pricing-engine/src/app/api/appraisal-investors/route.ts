import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-investors?settingsId=<bigint>
 * Returns investor names from appraisal_investor_list for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ investors: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_investor_list")
      .select("id, investor_name")
      .eq("integration_settings_id", settingsId)
      .order("investor_name")

    if (error) {
      console.error("[GET /api/appraisal-investors] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const investors = (data ?? []).map((row) => row.investor_name as string)
    const investorIds: Record<string, number> = {}
    for (const row of data ?? []) investorIds[row.investor_name as string] = row.id as number

    return NextResponse.json({ investors, investorIds })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
