import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUuid } from "@/lib/uuid"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId: rawReportId } = await params
    const reportId = String(rawReportId || "").trim()
    
    if (!isUuid(reportId)) {
      return NextResponse.json({ chatId: null, error: "invalid report id" }, { status: 400 })
    }
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ chatId: null, error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("credit_report_user_chats")
      .select("chat_id")
      .eq("report_id", reportId)
      .eq("user_id", userId)
      .maybeSingle()
    
    if (error) {
      return NextResponse.json({ chatId: null, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ chatId: data?.chat_id || null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ chatId: null, error: msg }, { status: 500 })
  }
}

