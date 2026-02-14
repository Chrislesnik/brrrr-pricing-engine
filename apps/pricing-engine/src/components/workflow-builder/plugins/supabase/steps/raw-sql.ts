import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchCredentials } from "@/components/workflow-builder/lib/credential-fetcher";

type RawSqlResult =
  | { success: true; data: { rows: unknown[]; count: number } }
  | { success: false; error: { message: string } };

export type SupabaseRawSqlInput = StepInput & {
  integrationId?: string;
  query: string;
};

async function stepHandler(input: SupabaseRawSqlInput): Promise<RawSqlResult> {
  if (!input.query?.trim()) {
    return { success: false, error: { message: "SQL query is required" } };
  }

  try {
    // For external projects, use their REST API
    if (input.integrationId) {
      const credentials = await fetchCredentials(input.integrationId);
      const url = credentials.SUPABASE_URL;
      const key = credentials.SUPABASE_KEY;

      if (url && key) {
        // Use the Supabase REST SQL endpoint (if available via pg_graphql or similar)
        // For now, try RPC approach
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await client.rpc("exec_sql" as never, { query: input.query.trim() });
        if (error) {
          return { success: false, error: { message: `SQL failed on external DB: ${error.message}` } };
        }
        const rows = Array.isArray(data) ? data : data ? [data] : [];
        return { success: true, data: { rows, count: rows.length } };
      }
    }

    // For own project, use supabaseAdmin with RPC
    const { data, error } = await supabaseAdmin.rpc("exec_sql" as never, {
      query: input.query.trim(),
    });

    if (error) {
      // If exec_sql doesn't exist, provide helpful error
      if (error.message.includes("does not exist")) {
        return {
          success: false,
          error: {
            message: "The exec_sql function is not available. Create it with: CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS json AS $$ BEGIN RETURN (SELECT json_agg(row_to_json(t)) FROM (EXECUTE query) AS t); END; $$ LANGUAGE plpgsql SECURITY DEFINER;",
          },
        };
      }
      return { success: false, error: { message: `SQL failed: ${error.message}` } };
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return { success: true, data: { rows, count: rows.length } };
  } catch (error) {
    return { success: false, error: { message: `SQL failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseRawSqlStep(input: SupabaseRawSqlInput): Promise<RawSqlResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseRawSqlStep.maxRetries = 0;

export const _integrationType = "supabase";
