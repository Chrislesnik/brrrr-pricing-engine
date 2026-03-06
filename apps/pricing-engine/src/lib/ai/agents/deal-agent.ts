import { ToolLoopAgent, InferAgentUIMessage, stepCountIs } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { getDealInputsTool } from "../tools/deal-inputs-tool"
import { generateLoanPricingTool } from "../tools/generate-pricing-tool"
import { generateTermSheetTool } from "../tools/generate-term-sheet-tool"
import {
  fetchDealContext,
  buildDealSystemPrompt,
  type DealAgentContext,
} from "../deal-context"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const dealAgent = new ToolLoopAgent({
  model: anthropic("claude-sonnet-4-20250514"),
  instructions: "You are a deal analyst agent.",
  tools: {
    getDealInputs: getDealInputsTool,
    generateLoanPricing: generateLoanPricingTool,
    generateTermSheet: generateTermSheetTool,
  },
  stopWhen: stepCountIs(8),
  callOptionsSchema: z.object({
    dealId: z.string(),
    userId: z.string(),
    orgId: z.string(),
  }),
  prepareCall: async ({ options, ...settings }) => {
    const ctx = await fetchDealContext(options!.dealId)

    const agentContext: DealAgentContext = {
      dealId: options!.dealId,
      userId: options!.userId,
      orgId: options!.orgId,
      dealName: ctx.dealName,
    }

    return {
      ...settings,
      instructions: buildDealSystemPrompt(ctx),
      experimental_context: agentContext,
    }
  },
})

export type DealAgentUIMessage = InferAgentUIMessage<typeof dealAgent>
