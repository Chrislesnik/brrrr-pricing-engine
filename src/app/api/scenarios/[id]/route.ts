import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(_req: Request, context: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { params } = (context as { params: { id: string } }) ?? { params: { id: "" } }
    const id = params.id
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id,inputs,selected")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ scenario: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


