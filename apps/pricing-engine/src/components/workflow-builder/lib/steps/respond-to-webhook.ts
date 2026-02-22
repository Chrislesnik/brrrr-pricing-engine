/**
 * Respond to Webhook step
 *
 * Writes mapped values into deal_inputs or loan_scenario_inputs based on
 * the trigger's webhookType, then returns a webhook response config so the
 * calling webhook endpoint can send the appropriate HTTP response.
 */
import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { type StepInput, withStepLogging } from "./step-handler";

type InputMapping = {
  id: string;
  inputId: string;
  inputCode: string;
  inputType: string;
  value: string;
};

export type RespondToWebhookInput = StepInput & {
  recordId?: string;
  inputMappings?: string;
  responseStatusCode?: string;
  responseBody?: string;
  _webhookType?: string;
};

type RespondToWebhookResult = {
  success: boolean;
  _webhookResponse: {
    statusCode: number;
    body: unknown;
  };
  data?: Record<string, unknown>;
  error?: string;
};

function buildValueColumns(inputType: string, value: unknown): Record<string, unknown> {
  const cols: Record<string, unknown> = {
    value_text: null,
    value_numeric: null,
    value_date: null,
    value_bool: null,
    value_array: null,
  };

  if (value === undefined || value === null || value === "") return cols;

  switch (inputType) {
    case "number":
    case "currency":
    case "percentage":
    case "calc_currency": {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        cols.value_numeric = num;
      } else {
        cols.value_text = String(value);
      }
      break;
    }
    case "boolean":
      cols.value_bool = value === true || value === "true" || value === "yes" || value === "Yes";
      break;
    case "date":
      cols.value_date = String(value);
      break;
    case "table":
    case "tags":
      cols.value_array = Array.isArray(value) ? JSON.stringify(value) : String(value);
      break;
    default:
      cols.value_text = String(value);
      break;
  }

  return cols;
}

async function executeRespondToWebhook(
  input: RespondToWebhookInput
): Promise<RespondToWebhookResult> {
  const { recordId, _webhookType } = input;

  let mappings: InputMapping[] = [];
  try {
    mappings = input.inputMappings ? JSON.parse(input.inputMappings) : [];
  } catch {
    // ignore parse errors
  }

  const statusCode = Number(input.responseStatusCode) || 200;
  let parsedResponseBody: Record<string, unknown> = { success: true };
  if (input.responseBody) {
    try {
      const parsed = JSON.parse(input.responseBody);
      parsedResponseBody = typeof parsed === "object" && parsed !== null ? parsed : { success: true };
    } catch {
      parsedResponseBody = { message: input.responseBody };
    }
  }

  if (!_webhookType) {
    return {
      success: false,
      error: "Webhook type not configured on trigger node",
      _webhookResponse: { statusCode, body: parsedResponseBody },
    };
  }

  const validMappings = mappings.filter((m) => m.inputId && m.value !== undefined);

  try {
    if (_webhookType === "deal") {
      if (!recordId) {
        return {
          success: false,
          error: "Deal ID is required",
          _webhookResponse: { statusCode, body: parsedResponseBody },
        };
      }

      if (validMappings.length === 0) {
        return {
          success: true,
          _webhookResponse: { statusCode, body: parsedResponseBody },
          data: { written: 0 },
        };
      }

      const rows = validMappings.map((m) => ({
        deal_id: recordId,
        input_id: Number(m.inputId),
        input_type: m.inputType || "text",
        ...buildValueColumns(m.inputType, m.value),
      }));

      const { error } = await supabaseAdmin
        .from("deal_inputs")
        .upsert(rows, { onConflict: "deal_id,input_id" });

      if (error) {
        return {
          success: false,
          error: `Failed to write deal inputs: ${error.message}`,
          _webhookResponse: { statusCode, body: parsedResponseBody },
        };
      }

      return {
        success: true,
        _webhookResponse: { statusCode, body: parsedResponseBody },
        data: { written: validMappings.length, type: "deal", recordId },
      };
    }

    if (_webhookType === "pricing_engine") {
      const inputsMap: Record<string, unknown> = {};
      for (const m of validMappings) {
        if (m.inputCode) inputsMap[m.inputCode] = m.value;
      }

      const responseWithInputs = { ...parsedResponseBody, inputs: inputsMap };

      if (recordId && validMappings.length > 0) {
        const rows = validMappings.map((m) => ({
          loan_scenario_id: recordId,
          pricing_engine_input_id: Number(m.inputId),
          input_type: m.inputType || "text",
          ...buildValueColumns(m.inputType, m.value),
        }));

        const { error } = await supabaseAdmin
          .from("loan_scenario_inputs")
          .upsert(rows, { onConflict: "loan_scenario_id,pricing_engine_input_id" });

        if (error) {
          return {
            success: false,
            error: `Failed to write scenario inputs: ${error.message}`,
            _webhookResponse: { statusCode, body: responseWithInputs },
          };
        }
      }

      return {
        success: true,
        _webhookResponse: { statusCode, body: responseWithInputs },
        data: {
          written: recordId ? validMappings.length : 0,
          type: "pricing_engine",
          recordId: recordId || null,
          inputs: inputsMap,
        },
      };
    }

    return {
      success: false,
      error: `Unknown webhook type: ${_webhookType}`,
      _webhookResponse: { statusCode, body: parsedResponseBody },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Failed to process inputs: ${msg}`,
      _webhookResponse: { statusCode, body: parsedResponseBody },
    };
  }
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function respondToWebhookStep(
  input: RespondToWebhookInput
): Promise<RespondToWebhookResult> {
  "use step";
  return withStepLogging(input, () => executeRespondToWebhook(input));
}
respondToWebhookStep.maxRetries = 0;
