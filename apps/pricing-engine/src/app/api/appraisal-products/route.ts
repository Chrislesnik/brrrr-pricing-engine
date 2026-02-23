import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-products?settingsId=<bigint>
 * Returns product names from appraisal_product_list for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ products: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_product_list")
      .select("id, product_name")
      .eq("integration_settings_id", settingsId)
      .order("product_name")

    if (error) {
      console.error("[GET /api/appraisal-products] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const products = (data ?? []).map((row) => row.product_name as string)

    return NextResponse.json({ products })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
