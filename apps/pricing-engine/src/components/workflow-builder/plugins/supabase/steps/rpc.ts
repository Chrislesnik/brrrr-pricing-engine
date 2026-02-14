import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type RpcResult =
  | { success: true; data: { result: unknown } }
  | { success: false; error: { message: string } };

export type SupabaseRpcInput = StepInput & {
  integrationId?: string;
  functionName: string;
  params?: string | Record<string, unknown>;
};

async function stepHandler(input: SupabaseRpcInput): Promise<RpcResult> {
  if (!input.functionName?.trim()) {
    return { success: false, error: { message: "Function name is required" } };
  }

  let params: Record<string, unknown> = {};
  if (input.params) {
    try {
      params = typeof input.params === "string" ? JSON.parse(input.params) : input.params;
    } catch {
      return { success: false, error: { message: "Invalid JSON in params field" } };
    }
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    const { data, error } = await client.rpc(input.functionName.trim(), params);

    if (error) {
      return { success: false, error: { message: `RPC failed: ${error.message}` } };
    }

    return { success: true, data: { result: data } };
  } catch (error) {
    return { success: false, error: { message: `RPC failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseRpcStep(input: SupabaseRpcInput): Promise<RpcResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseRpcStep.maxRetries = 0;

export const _integrationType = "supabase";
