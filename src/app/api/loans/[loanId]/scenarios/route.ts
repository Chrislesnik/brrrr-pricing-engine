import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type Params = { params: { loanId: string } }

export async function GET(_req: Request, { params }: Params) {
  const loanId = params?.loanId
  if (!loanId) return NextResponse.json({ error: "Missing loanId" }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from("loan_scenarios")
    .select("id, name, primary, created_at")
    .eq("loan_id", loanId)
    .order("primary", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scenarios: data })
}


