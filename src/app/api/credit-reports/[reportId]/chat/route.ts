import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getChatIdForMapping, getMessagesByChatId, isUuid } from "@/lib/chat"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId: rawReportId } = await params
    const reportId = (rawReportId || "").trim()
    if (!isUuid(reportId)) {
      return NextResponse.json({ error: `invalid report id: ${reportId}` }, { status: 400 })
    }
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    // Mapping-first
    const chatId = await getChatIdForMapping(reportId, userId)
    if (!chatId) {
      return NextResponse.json({ error: "No chat mapping for this user/report" }, { status: 404 })
    }

    const messages = await getMessagesByChatId(chatId)
    return NextResponse.json({ chat: { id: chatId }, chat_id: chatId, messages })
  } catch (e) {
    // minimal server log
    try {
      console.error("chat.get error", e)
    } catch {}
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

