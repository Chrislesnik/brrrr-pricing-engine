import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-lenders?settingsId=<bigint>
 * Returns lender names from appraisal_lender_list for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ lenders: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_lender_list")
      .select("id, lender_name")
      .eq("integration_settings_id", settingsId)
      .order("lender_name")

    if (error) {
      console.error("[GET /api/appraisal-lenders] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const lenders = (data ?? []).map((row) => row.lender_name as string)
    const lenderIds: Record<string, number> = {}
    for (const row of data ?? []) lenderIds[row.lender_name as string] = row.id as number

    return NextResponse.json({ lenders, lenderIds })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
