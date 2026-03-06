export const runtime = "nodejs"
export const maxDuration = 120

import { createAgentUIStreamResponse } from "ai"
import { auth } from "@clerk/nextjs/server"
import { dealAgent } from "@/lib/ai/agents/deal-agent"
import { getOrgUuidFromClerkId, checkDealAccess } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, dealId } = await req.json()
    if (!dealId || !messages) {
      return new Response("Missing dealId or messages", { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return new Response("Organization not found", { status: 404 })
    }

    // Fetch deal for access check
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .maybeSingle()

    if (!deal) {
      return new Response("Deal not found", { status: 404 })
    }

    const hasAccess = await checkDealAccess(deal, userId, orgId, "select")
    if (!hasAccess) {
      return new Response("Access denied", { status: 403 })
    }

    return createAgentUIStreamResponse({
      agent: dealAgent,
      uiMessages: messages,
      options: { dealId, userId, orgId: orgUuid },
      onError: (error) =>
        error instanceof Error ? error.message : "Unknown error",
    })
  } catch (e) {
    console.error("[POST /api/chat/ai-deal]", e)
    return new Response(
      e instanceof Error ? e.message : "Unknown error",
      { status: 500 }
    )
  }
}
