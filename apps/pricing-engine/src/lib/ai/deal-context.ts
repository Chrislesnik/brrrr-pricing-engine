import { supabaseAdmin } from "@/lib/supabase-admin"

export interface DealAgentContext {
  dealId: string
  userId: string
  orgId: string
  dealName: string
}

export interface DealContext {
  dealId: string
  dealName: string
  dealNumber: string | null
  status: string | null
  propertyAddress: string | null
  inputs: Array<{ code: string; label: string; value: unknown }>
}

export async function fetchDealContext(dealId: string): Promise<DealContext> {
  const [dealRes, inputsRes] = await Promise.all([
    supabaseAdmin
      .from("deals")
      .select("id, name, deal_number, status")
      .eq("id", dealId)
      .maybeSingle(),
    supabaseAdmin
      .from("deal_inputs")
      .select("input_id, input_code, input_type, value_text, value_numeric, value_date, value_bool")
      .eq("deal_id", dealId)
      .limit(30),
  ])

  const deal = dealRes.data
  const dealInputs = inputsRes.data ?? []

  // Try to extract property address from deal inputs
  const addressInput = dealInputs.find(
    (i) => i.input_code === "property_address" || i.input_code === "address"
  )
  const propertyAddress =
    (addressInput?.value_text as string) ?? null

  const inputs = dealInputs
    .filter((i) => {
      const val =
        i.value_text ?? i.value_numeric ?? i.value_date ?? i.value_bool
      return val !== null && val !== undefined
    })
    .map((i) => ({
      code: i.input_code as string,
      label: (i.input_code as string).replace(/_/g, " "),
      value: i.value_text ?? i.value_numeric ?? i.value_date ?? i.value_bool,
    }))

  return {
    dealId,
    dealName:
      (deal?.name as string) ??
      (deal?.deal_number as string) ??
      `Deal ${dealId.slice(0, 8)}`,
    dealNumber: (deal?.deal_number as string) ?? null,
    status: (deal?.status as string) ?? null,
    propertyAddress,
    inputs,
  }
}

export function buildDealSystemPrompt(ctx: DealContext): string {
  const inputSummary =
    ctx.inputs.length > 0
      ? ctx.inputs
          .slice(0, 15)
          .map((i) => `  - ${i.code}: ${i.value}`)
          .join("\n")
      : "  (no inputs recorded yet)"

  return `You are a deal analyst agent embedded in a mortgage pricing platform.

Current deal: "${ctx.dealName}"${ctx.dealNumber ? ` (#${ctx.dealNumber})` : ""}
${ctx.propertyAddress ? `Property: ${ctx.propertyAddress}` : ""}
${ctx.status ? `Status: ${ctx.status}` : ""}

Key deal inputs:
${inputSummary}

When asked to get loan pricing:
1. First call getDealInputs to fetch and validate deal data against pricing engine requirements
2. Review the inputs - if required fields are missing, explain what's needed
3. If all required fields are present, call generateLoanPricing
4. Present results clearly and offer to generate term sheets for selected rates

When asked to generate a term sheet:
1. Call generateTermSheet with the deal, program, and selected rate info
2. Present the result with a download link

Always be concise and professional. Use markdown formatting for readability.`
}
