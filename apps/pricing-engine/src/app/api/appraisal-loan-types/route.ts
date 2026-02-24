import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-loan-types?settingsId=<bigint>
 * Returns loan types from appraisal_loan_type_list for the given integration_settings_id.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settingsId = req.nextUrl.searchParams.get("settingsId")
    if (!settingsId) {
      return NextResponse.json({ loanTypes: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_loan_type_list")
      .select("id, loan_type_name, other")
      .eq("integration_settings_id", settingsId)
      .order("loan_type_name")

    if (error) {
      console.error("[GET /api/appraisal-loan-types] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const loanTypes = (data ?? []).map((row) => ({
      name: row.loan_type_name as string,
      other: row.other === true,
    }))
    const loanTypeIds: Record<string, number> = {}
    for (const row of data ?? []) loanTypeIds[row.loan_type_name as string] = row.id as number

    return NextResponse.json({ loanTypes, loanTypeIds })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
