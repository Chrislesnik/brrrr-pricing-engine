import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-property-types?settingsId=<bigint>
 * Returns property names from appraisal_property_list for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ propertyTypes: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_property_list")
      .select("id, property_name")
      .eq("integration_settings_id", settingsId)
      .order("property_name")

    if (error) {
      console.error("[GET /api/appraisal-property-types] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const propertyTypes = (data ?? []).map((row) => row.property_name as string)
    const propertyTypeIds: Record<string, number> = {}
    for (const row of data ?? []) propertyTypeIds[row.property_name as string] = row.id as number

    return NextResponse.json({ propertyTypes, propertyTypeIds })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
