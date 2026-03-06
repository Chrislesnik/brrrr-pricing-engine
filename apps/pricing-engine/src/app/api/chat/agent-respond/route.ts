export const runtime = "nodejs"
export const maxDuration = 120

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateText, stepCountIs } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getOrgUuidFromClerkId, checkDealAccess } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { liveblocks } from "@/lib/liveblocks"
import {
  fetchDealContext,
  buildDealSystemPrompt,
  type DealAgentContext,
} from "@/lib/ai/deal-context"
import { getDealInputsTool } from "@/lib/ai/tools/deal-inputs-tool"
import { generateLoanPricingTool } from "@/lib/ai/tools/generate-pricing-tool"
import { generateTermSheetTool } from "@/lib/ai/tools/generate-term-sheet-tool"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Simple in-memory debounce per deal:user
const recentRequests = new Map<string, number>()
const DEBOUNCE_MS = 5000

/**
 * POST /api/chat/agent-respond
 *
 * Called when a user @mentions the agent in a Liveblocks chat room.
 * Generates a response using the deal agent tools, then posts the
 * result back to the Liveblocks thread as the "agent" user.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dealId, message, threadId, roomId } = (await req.json()) as {
      dealId: string
      message: string
      threadId: string
      roomId: string
    }

    if (!dealId || !message || !threadId || !roomId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Debounce: prevent rapid @agent mentions per deal per user
    const debounceKey = `${dealId}:${userId}`
    const lastRequest = recentRequests.get(debounceKey)
    if (lastRequest && Date.now() - lastRequest < DEBOUNCE_MS) {
      return NextResponse.json(
        { error: "Please wait before mentioning @agent again" },
        { status: 429 }
      )
    }
    recentRequests.set(debounceKey, Date.now())

    // Auth: verify org + deal access
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .maybeSingle()

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    const hasAccess = await checkDealAccess(deal, userId, orgId, "select")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Build context and generate response
    const ctx = await fetchDealContext(dealId)
    const agentContext: DealAgentContext = {
      dealId,
      userId,
      orgId: orgUuid,
      dealName: ctx.dealName,
    }

    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildDealSystemPrompt(ctx),
      prompt: message,
      tools: {
        getDealInputs: getDealInputsTool,
        generateLoanPricing: generateLoanPricingTool,
        generateTermSheet: generateTermSheetTool,
      },
      stopWhen: stepCountIs(8),
      providerOptions: {
        anthropic: { cacheControl: { enabled: false } },
      },
      experimental_context: agentContext,
    })

    // Post the agent's text response back to the Liveblocks thread
    if (result.text) {
      await liveblocks.createComment({
        roomId,
        threadId,
        data: {
          userId: "agent",
          body: {
            version: 1,
            content: [
              {
                type: "paragraph" as const,
                children: [{ text: result.text }],
              },
            ],
          },
        },
      })
    }

    // Post tool results as separate comments with metadata
    for (const step of result.steps) {
      for (const toolResult of step.toolResults) {
        const summary = buildToolResultSummary(
          toolResult.toolName,
          toolResult.output as Record<string, unknown>
        )
        if (summary) {
          await liveblocks.createComment({
            roomId,
            threadId,
            data: {
              userId: "agent",
              body: {
                version: 1,
                content: [
                  {
                    type: "paragraph" as const,
                    children: [{ text: summary }],
                  },
                ],
              },
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[POST /api/chat/agent-respond]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * Build a human-readable summary of a tool result for posting to chat.
 */
function buildToolResultSummary(
  toolName: string,
  result: Record<string, unknown>
): string | null {
  if (result.error) {
    return `[${toolName}] Error: ${result.error}`
  }

  switch (toolName) {
    case "getDealInputs": {
      const filled = result.filledFields as number
      const total = result.totalFields as number
      const allFilled = result.allRequiredFilled as boolean
      return `[Deal Inputs] ${filled}/${total} fields filled. ${allFilled ? "All required fields present." : "Some required fields are missing."}`
    }
    case "generateLoanPricing": {
      const totalPrograms = result.totalPrograms as number
      const passing = result.passingPrograms as number
      return `[Pricing] ${passing}/${totalPrograms} programs passed eligibility.`
    }
    case "generateTermSheet": {
      const count = result.totalTemplates as number
      return `[Term Sheets] Found ${count} available template(s).`
    }
    default:
      return null
  }
}
