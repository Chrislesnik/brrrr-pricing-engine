/**
 * Executable step function for Database Query action
 *
 * Executes raw SQL queries using the Supabase admin client's rpc,
 * or against a user-provided DATABASE_URL via fetch to a proxy.
 */
import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchCredentials } from "../credential-fetcher";
import { type StepInput, withStepLogging } from "./step-handler";

type DatabaseQueryResult =
  | { success: true; rows: unknown; count: number }
  | { success: false; error: string };

export type DatabaseQueryInput = StepInput & {
  integrationId?: string;
  dbQuery?: string;
  query?: string;
};

function validateInput(input: DatabaseQueryInput): string | null {
  const queryString = input.dbQuery || input.query;

  if (!queryString || queryString.trim() === "") {
    return "SQL query is required";
  }

  return null;
}

/**
 * Database query logic
 * Uses Supabase admin client to execute raw SQL via the postgres connection
 */
async function databaseQuery(
  input: DatabaseQueryInput
): Promise<DatabaseQueryResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const queryString = (input.dbQuery || input.query) as string;

  // If an integrationId is provided, the user wants to query their own database
  // For now, we execute against the Supabase project database using the admin client
  if (input.integrationId) {
    const credentials = await fetchCredentials(input.integrationId);
    if (!credentials.DATABASE_URL) {
      return {
        success: false,
        error: "DATABASE_URL is not configured. Please add it in Project Integrations.",
      };
    }
    // For external databases, we'd need a postgres client.
    // For now, return an informative error.
    return {
      success: false,
      error: "External database connections are not yet supported. Use the default project database or configure a Database Query via HTTP Request to your database's REST API.",
    };
  }

  // Execute against the Supabase project database
  try {
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      query: queryString,
    }).maybeSingle();

    if (error) {
      // If the exec_sql function doesn't exist, fall back to a simpler approach
      if (error.message.includes("function") && error.message.includes("does not exist")) {
        // Try using the Supabase REST API directly
        const { data: restData, error: restError } = await supabaseAdmin
          .from("_metadata_placeholder_")
          .select()
          .limit(0);

        // This won't work for arbitrary SQL, so give a helpful error
        return {
          success: false,
          error: "Raw SQL execution requires the exec_sql database function. Please use structured queries or the HTTP Request action to call your database's REST API.",
        };
      }
      return { success: false, error: `Database query failed: ${error.message}` };
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return {
      success: true,
      rows,
      count: rows.length,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown database error";
    return { success: false, error: `Database query failed: ${msg}` };
  }
}

/**
 * Database Query Step
 * Executes a SQL query against a PostgreSQL database
 */
// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function databaseQueryStep(
  input: DatabaseQueryInput
): Promise<DatabaseQueryResult> {
  "use step";
  return withStepLogging(input, () => databaseQuery(input));
}
databaseQueryStep.maxRetries = 0;
