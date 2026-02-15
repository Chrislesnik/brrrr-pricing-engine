import { supabaseAdmin } from "@/lib/supabase-admin";

/* -------------------------------------------------------------------------- */
/*  In-memory cache                                                            */
/* -------------------------------------------------------------------------- */

let cachedSchema: string | null = null;
let cachedInputCodes: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/* -------------------------------------------------------------------------- */
/*  getSchemaContext                                                            */
/*  Fetches all public tables and their columns from Supabase, formats them   */
/*  as a structured text block suitable for an LLM system prompt.              */
/* -------------------------------------------------------------------------- */

export async function getSchemaContext(): Promise<string> {
  const now = Date.now();
  if (cachedSchema && now - cachedAt < CACHE_TTL_MS) {
    return cachedSchema;
  }

  // Fetch all public tables
  const { data: tableRows, error: tablesErr } = await supabaseAdmin.rpc(
    "list_public_tables"
  );

  if (tablesErr || !tableRows) {
    console.error("[schema-context] list_public_tables error:", tablesErr?.message);
    return cachedSchema ?? "Schema unavailable.";
  }

  const tableNames: string[] = (tableRows as { table_name: string }[]).map(
    (r) => r.table_name
  );

  // Fetch columns for each table in parallel
  const tableSchemas = await Promise.all(
    tableNames.map(async (tableName) => {
      const { data: colRows, error: colErr } = await supabaseAdmin.rpc(
        "list_table_columns",
        { p_table_name: tableName }
      );

      if (colErr || !colRows) {
        return `Table: ${tableName}\n  (columns unavailable)`;
      }

      const columns = (
        colRows as {
          column_name: string;
          data_type: string;
          is_nullable: boolean;
        }[]
      )
        .map(
          (c) =>
            `  - ${c.column_name} (${c.data_type}${c.is_nullable ? ", nullable" : ""})`
        )
        .join("\n");

      return `Table: ${tableName}\n${columns}`;
    })
  );

  const schema = tableSchemas.join("\n\n");
  cachedSchema = schema;
  cachedAt = now;

  return schema;
}

/* -------------------------------------------------------------------------- */
/*  getInputCodesContext                                                        */
/*  Fetches all input definitions and formats them as a reference table.        */
/* -------------------------------------------------------------------------- */

export async function getInputCodesContext(): Promise<string> {
  const now = Date.now();
  if (cachedInputCodes && now - cachedAt < CACHE_TTL_MS) {
    return cachedInputCodes;
  }

  const { data: rows, error } = await supabaseAdmin
    .from("inputs")
    .select("id, input_code, input_label, input_type")
    .order("input_code", { ascending: true });

  if (error || !rows || rows.length === 0) {
    console.error("[schema-context] inputs fetch error:", error?.message);
    return cachedInputCodes ?? "No inputs available.";
  }

  const lines = (
    rows as {
      id: number;
      input_code: string;
      input_label: string;
      input_type: string;
    }[]
  ).map(
    (r) =>
      `  - {{input:${r.input_code}}} → "${r.input_label}" (${r.input_type}, id=${r.id})`
  );

  const result = lines.join("\n");
  cachedInputCodes = result;

  return result;
}
