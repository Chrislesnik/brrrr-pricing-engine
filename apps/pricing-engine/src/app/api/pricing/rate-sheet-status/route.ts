import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const versionId = req.nextUrl.searchParams.get("versionId")
    if (!versionId) {
      return NextResponse.json({ error: "Missing versionId" }, { status: 400 })
    }

    const id = Number(versionId)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid versionId" }, { status: 400 })
    }

    const { data: row } = await supabaseAdmin
      .from("program_rows_ids")
      .select("primary, rate_sheet_date")
      .eq("id", id)
      .maybeSingle()

    if (!row) {
      return NextResponse.json({ active: null, rate_sheet_date: null })
    }

    return NextResponse.json({
      active: row.primary === true,
      rate_sheet_date: row.rate_sheet_date ?? null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
