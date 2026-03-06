import { tool } from "ai"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import type { DealAgentContext } from "../deal-context"

export const generateTermSheetTool = tool({
  description:
    "Generate a term sheet for a selected pricing row. Evaluates term sheet templates and returns matching results.",
  inputSchema: z.object({
    dealId: z.string().describe("The deal UUID"),
    programId: z.string().describe("The program UUID that was selected"),
    selectedRate: z.object({
      interestRate: z.string().nullable().describe("Selected interest rate"),
      loanPrice: z.string().nullable().describe("Selected loan price"),
      rowIndex: z.number().describe("Row index in the rate options table"),
    }),
  }),
  execute: async (
    { dealId, programId, selectedRate },
    { experimental_context }
  ) => {
    const ctx = experimental_context as DealAgentContext | undefined
    const orgId = ctx?.orgId

    if (!orgId) {
      return { error: "Missing organization context" }
    }

    // Fetch deal inputs to build the input_values map for term sheet evaluation
    const { data: dealInputs } = await supabaseAdmin
      .from("deal_inputs")
      .select("input_code, value_text, value_numeric, value_date, value_bool")
      .eq("deal_id", dealId)

    const inputValues: Record<string, unknown> = {}
    for (const di of dealInputs ?? []) {
      const code = di.input_code as string
      inputValues[code] =
        di.value_text ?? di.value_numeric ?? di.value_date ?? di.value_bool
    }

    // Add pricing-specific values
    inputValues.interest_rate = selectedRate.interestRate
    inputValues.loan_price = selectedRate.loanPrice
    inputValues.program_id = programId

    // Call the term sheet evaluation endpoint internally
    // Rather than making an HTTP call, replicate the core logic
    const { data: termSheets, error: tsErr } = await supabaseAdmin
      .from("pe_term_sheets")
      .select(
        "id, document_template_id, status, display_order, document_templates(id, name)"
      )
      .eq("status", "active")
      .order("display_order", { ascending: true })

    if (tsErr || !termSheets || termSheets.length === 0) {
      return {
        error: tsErr
          ? `Failed to fetch term sheets: ${tsErr.message}`
          : "No active term sheet templates found",
        termSheets: [],
      }
    }

    // For the agent, we return the list of available term sheet templates
    // The actual PDF generation happens client-side via the template studio
    const availableSheets = termSheets.map((ts) => {
      const raw = ts.document_templates as unknown
      const tmpl = Array.isArray(raw) ? (raw[0] as { id: string; name: string } | undefined) : (raw as { id: string; name: string } | null)

      return {
        id: String(ts.id),
        templateName: tmpl?.name ?? "Unknown Template",
        templateId: tmpl?.id ?? null,
      }
    })

    return {
      dealId,
      programId,
      selectedRate,
      availableTermSheets: availableSheets,
      totalTemplates: availableSheets.length,
      message:
        availableSheets.length > 0
          ? `Found ${availableSheets.length} term sheet template(s). The user can generate and download term sheets from the deal page.`
          : "No term sheet templates are configured yet.",
    }
  },
})
