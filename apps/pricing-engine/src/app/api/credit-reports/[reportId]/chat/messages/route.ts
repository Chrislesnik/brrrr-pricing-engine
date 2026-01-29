import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getChatIdForMapping, insertMessage, isUuid } from "@/lib/chat"

export const runtime = "nodejs"

const AGENT_WEBHOOK = "https://n8n.axora.info/webhook/57c5747c-1b1c-4446-be6c-d604a6c37908"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { reportId: rawReportId } = await params
    const reportId = String(rawReportId || "").trim()
    if (!isUuid(reportId)) {
      return NextResponse.json({ error: "invalid report id" }, { status: 400 })
    }
    const { content, user_type } = await req.json()
    const userType: "user" | "agent" = (user_type === "agent" ? "agent" : "user")
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 })
    }

    // Resolve mapping (mapping-first)
    const chatId = await getChatIdForMapping(reportId, userId)
    if (!chatId) return NextResponse.json({ error: "No chat mapping for this user/report" }, { status: 404 })

    // Persist user message
    const userMessage = await insertMessage(chatId, userId, orgUuid, content, userType)

    // Call webhook and wait for AI response
    const agentMessages: any[] = []
    try {
      const webhookRes = await fetch(AGENT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          report_id: reportId,
          user_id: userId,
          organization_id: orgUuid,
          content,
        }),
      })
      
      if (webhookRes.ok) {
        const webhookData = await webhookRes.json().catch(() => null)

        // Prefer structured array responses: response.output.items | output.items | items
        const rawItems =
          (Array.isArray(webhookData?.response?.output?.items) && webhookData.response.output.items) ||
          (Array.isArray(webhookData?.output?.items) && webhookData.output.items) ||
          (Array.isArray(webhookData?.items) && webhookData.items) ||
          null

        if (Array.isArray(rawItems) && rawItems.length) {
          for (const item of rawItems) {
            const statusRaw = typeof item?.status === "string" ? item.status.toLowerCase() : "neutral"
            const status =
              statusRaw === "pass" || statusRaw === "fail" || statusRaw === "warning" || statusRaw === "neutral"
                ? statusRaw
                : "neutral"
            const message = typeof item?.message === "string" ? item.message : null
            if (!message) continue
            const serialized = JSON.stringify({ status, message })
            const saved = await insertMessage(chatId, "agent", orgUuid, serialized, "agent")
            agentMessages.push(saved)
          }
        } else {
          // Fallback to legacy single-string content fields
          const aiContent =
            webhookData?.response ||
            webhookData?.content ||
            webhookData?.message ||
            webhookData?.output ||
            webhookData?.text ||
            (typeof webhookData === "string" ? webhookData : null)

          if (aiContent && typeof aiContent === "string" && aiContent.trim()) {
            const saved = await insertMessage(chatId, "agent", orgUuid, aiContent.trim(), "agent")
            agentMessages.push(saved)
          }
        }
      }
    } catch (_e) {
      // Log but don't fail the request if webhook errors
      console.error("Agent webhook error:", _e)
    }

    return NextResponse.json({ 
      message: userMessage,
      agentMessage: agentMessages[0] ?? null,
      agentMessages, // new shape for multi-item responses
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

