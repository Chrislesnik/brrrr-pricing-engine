import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-transaction-types?settingsId=<bigint>
 * Returns transaction type names from appraisal_transaction_type_list
 * for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ transactionTypes: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_transaction_type_list")
      .select("id, transaction_type_name")
      .eq("integration_settings_id", settingsId)
      .order("transaction_type_name")

    if (error) {
      console.error("[GET /api/appraisal-transaction-types] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transactionTypes = (data ?? []).map((row) => row.transaction_type_name as string)

    return NextResponse.json({ transactionTypes })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
