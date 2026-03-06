import { tool } from "ai"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { DealAgentContext } from "../deal-context"

export const getDealInputsTool = tool({
  description:
    "Fetch all deal inputs and map them to pricing engine fields. Returns mapped fields, missing required fields, and whether all required fields are filled.",
  inputSchema: z.object({
    dealId: z.string().describe("The deal UUID to fetch inputs for"),
  }),
  execute: async ({ dealId }, { experimental_context }) => {
    const ctx = experimental_context as DealAgentContext | undefined
    const orgId = ctx?.orgId

    if (!orgId) {
      return { error: "Missing organization context", mappedFields: [], missingRequired: [], allRequiredFilled: false }
    }

    // Fetch deal inputs
    const { data: dealInputs, error: inputsError } = await supabaseAdmin
      .from("deal_inputs")
      .select(
        "id, input_code, value_text, value_numeric, value_date, value_bool, value_array"
      )
      .eq("deal_id", dealId)

    if (inputsError) {
      return { error: `Failed to fetch deal inputs: ${inputsError.message}`, mappedFields: [], missingRequired: [], allRequiredFilled: false }
    }

    // Fetch pricing engine input configuration
    const { data: pricingFields, error: fieldsError } = await supabaseAdmin
      .from("pricing_engine_inputs")
      .select("id, input_code, display_name, data_type, is_required, options")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (fieldsError) {
      return { error: `Failed to fetch pricing fields: ${fieldsError.message}`, mappedFields: [], missingRequired: [], allRequiredFilled: false }
    }

    // Map deal inputs to pricing fields
    const dealInputMap = new Map(
      (dealInputs ?? []).map((di) => [di.input_code, di])
    )

    const mappedFields: Array<{
      input_code: string
      display_name: string
      value: unknown
      source: "deal_input" | "missing"
      is_required: boolean
    }> = []

    const missingRequired: Array<{
      input_code: string
      display_name: string
      data_type: string
    }> = []

    for (const field of pricingFields ?? []) {
      const dealInput = dealInputMap.get(field.input_code)

      if (dealInput) {
        const value =
          dealInput.value_text ??
          dealInput.value_numeric ??
          dealInput.value_date ??
          dealInput.value_bool ??
          dealInput.value_array

        mappedFields.push({
          input_code: field.input_code as string,
          display_name: field.display_name as string,
          value,
          source: "deal_input",
          is_required: (field.is_required as boolean) ?? false,
        })
      } else if (field.is_required) {
        missingRequired.push({
          input_code: field.input_code as string,
          display_name: field.display_name as string,
          data_type: field.data_type as string,
        })

        mappedFields.push({
          input_code: field.input_code as string,
          display_name: field.display_name as string,
          value: null,
          source: "missing",
          is_required: true,
        })
      }
    }

    return {
      dealId,
      mappedFields,
      missingRequired,
      allRequiredFilled: missingRequired.length === 0,
      totalFields: (pricingFields ?? []).length,
      filledFields: mappedFields.filter((f) => f.source === "deal_input").length,
    }
  },
})
