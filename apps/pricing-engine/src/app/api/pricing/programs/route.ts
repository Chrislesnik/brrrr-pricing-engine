import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const loanType = (searchParams.get("loanType") || "").toLowerCase()
    if (!loanType) return new NextResponse("Missing loanType", { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id,internal_name,external_name")
      .eq("loan_type", loanType)
      .eq("status", "active")
      .order("internal_name", { ascending: true })

    if (error) return new NextResponse(error.message, { status: 500 })

    return NextResponse.json({ programs: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}
