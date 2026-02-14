import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type EdgeFunctionResult =
  | { success: true; data: { data: unknown; status: number } }
  | { success: false; error: { message: string } };

export type SupabaseEdgeFunctionInput = StepInput & {
  integrationId?: string;
  functionName: string;
  body?: string | Record<string, unknown>;
  method?: string;
};

async function stepHandler(input: SupabaseEdgeFunctionInput): Promise<EdgeFunctionResult> {
  if (!input.functionName?.trim()) {
    return { success: false, error: { message: "Function name is required" } };
  }

  let bodyData: Record<string, unknown> = {};
  if (input.body) {
    try {
      bodyData = typeof input.body === "string" ? JSON.parse(input.body) : input.body;
    } catch {
      return { success: false, error: { message: "Invalid JSON in body field" } };
    }
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    const { data, error } = await client.functions.invoke(input.functionName.trim(), {
      body: bodyData,
      method: (input.method as "POST" | "GET") || "POST",
    });

    if (error) {
      return { success: false, error: { message: `Edge Function failed: ${error.message}` } };
    }

    return { success: true, data: { data, status: 200 } };
  } catch (error) {
    return { success: false, error: { message: `Edge Function failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseEdgeFunctionStep(input: SupabaseEdgeFunctionInput): Promise<EdgeFunctionResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseEdgeFunctionStep.maxRetries = 0;

export const _integrationType = "supabase";
