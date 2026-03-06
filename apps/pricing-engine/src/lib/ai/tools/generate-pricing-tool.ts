import { tool } from "ai"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { cleanAiResponse } from "@/lib/clean-ai-response"
import type { DealAgentContext } from "../deal-context"

function parseWebhookResponse(json: unknown): string {
  if (Array.isArray(json)) {
    return ((json[0] as Record<string, unknown>)?.response ?? "").toString()
  }
  if (json && typeof json === "object") {
    return ((json as Record<string, unknown>)?.response ?? "").toString()
  }
  if (typeof json === "string") return json
  return ""
}

export const generateLoanPricingTool = tool({
  description:
    "Generate loan pricing across eligible programs. Calls the pricing engine for all active programs the user has access to and returns rate options per program.",
  inputSchema: z.object({
    dealId: z.string().describe("The deal UUID to price"),
    inputs: z
      .record(z.unknown())
      .describe("Mapped deal inputs keyed by input_code"),
    programIds: z
      .array(z.string())
      .optional()
      .describe("Optional: restrict to specific program IDs"),
  }),
  execute: async ({ dealId, inputs, programIds }, { experimental_context }) => {
    const ctx = experimental_context as DealAgentContext | undefined
    const orgId = ctx?.orgId

    if (!orgId) {
      return { error: "Missing organization context", programs: [] }
    }

    // Fetch active programs
    const { data: programRows } = await supabaseAdmin
      .from("programs")
      .select("id, internal_name, external_name")
      .eq("status", "active")
      .order("internal_name", { ascending: true })

    let programs = (programRows ?? []).map((p) => ({
      id: p.id as string,
      internal_name: (p.internal_name as string) ?? "",
      external_name: (p.external_name as string) ?? "",
    }))

    // Filter by requested program IDs if provided
    if (programIds && programIds.length > 0) {
      programs = programs.filter((p) => programIds.includes(p.id))
    }

    if (programs.length === 0) {
      return { error: "No programs available", programs: [] }
    }

    // Build prompt from inputs
    const inputSummary = Object.entries(inputs)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")

    const prompt = `Price this loan: ${inputSummary}`

    // Fire all pricing webhooks in parallel
    const webhookUrl =
      process.env.N8N_AI_CHAT_WEBHOOK_URL ||
      "https://n8n.axora.info/webhook/f567d7d1-8d33-4ac5-a7d8-ba6cfd6d720e"

    const results = await Promise.allSettled(
      programs.map(async (p) => {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            sessionId: `deal-agent:${dealId}`,
            program_id: p.id,
            prompt,
          }),
        })
        const json = await res.json().catch(() => res.text())
        return { programId: p.id, response: json }
      })
    )

    // Parse responses per program
    const programResults = programs.map((p, i) => {
      const result = results[i]
      if (!result || result.status === "rejected") {
        return {
          id: p.id,
          name: p.internal_name || p.external_name,
          pass: false,
          error: "Pricing engine did not respond",
          rateOptions: [],
        }
      }

      const responseText = cleanAiResponse(
        parseWebhookResponse(result.value.response)
      )

      if (!responseText.trim()) {
        return {
          id: p.id,
          name: p.internal_name || p.external_name,
          pass: false,
          error: "Empty response from pricing engine",
          rateOptions: [],
        }
      }

      // Try to extract structured data from the response
      // The n8n webhook returns rate options in arrays
      const raw = result.value.response
      const data =
        Array.isArray(raw)
          ? (raw[0] as Record<string, unknown>) ?? {}
          : typeof raw === "object" && raw !== null
            ? (raw as Record<string, unknown>)
            : {}

      const pass = data.pass !== false
      const interestRates = Array.isArray(data.interest_rate)
        ? data.interest_rate
        : []
      const loanPrices = Array.isArray(data.loan_price)
        ? data.loan_price
        : []
      const pitias = Array.isArray(data.pitia) ? data.pitia : []
      const dscrs = Array.isArray(data.dscr) ? data.dscr : []

      const maxLen = Math.max(
        interestRates.length,
        loanPrices.length,
        1
      )

      const rateOptions = []
      for (let j = 0; j < maxLen; j++) {
        rateOptions.push({
          rowIndex: j,
          interestRate: interestRates[j] != null ? String(interestRates[j]) : null,
          loanPrice: loanPrices[j] != null ? String(loanPrices[j]) : null,
          pitia: pitias[j] != null ? String(pitias[j]) : null,
          dscr: dscrs[j] != null ? String(dscrs[j]) : null,
        })
      }

      return {
        id: p.id,
        name: p.internal_name || p.external_name,
        pass,
        validations: Array.isArray(data.validations) ? data.validations : [],
        loanAmount: data.loan_amount != null ? String(data.loan_amount) : null,
        ltv: data.ltv != null ? String(data.ltv) : null,
        rateOptions,
        rawResponse: responseText,
      }
    })

    return {
      dealId,
      programs: programResults,
      totalPrograms: programs.length,
      passingPrograms: programResults.filter((p) => p.pass).length,
    }
  },
})
