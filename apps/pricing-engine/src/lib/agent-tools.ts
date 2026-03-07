import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-ada-002";

/* -------------------------------------------------------------------------- */
/*  vectorSearch: retrieve document chunks via embedding similarity            */
/* -------------------------------------------------------------------------- */

export const vectorSearchTool = tool(
  async ({ query, document_file_id, top_k }) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const embRes = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const embedding = embRes.data[0].embedding;

    const { data, error } = await supabaseAdmin.rpc(
      "match_llama_document_chunks",
      {
        query_embedding: JSON.stringify(embedding),
        match_count: top_k ?? 12,
        filter: { document_id: document_file_id },
      }
    );

    if (error) return JSON.stringify({ error: error.message });

    const chunks = (data ?? []).map((c: any) => ({
      id: c.id,
      content: c.content?.substring(0, 1000),
      page: c.metadata?.page,
      bbox: c.metadata?.bbox,
      similarity: c.similarity,
    }));

    return JSON.stringify(chunks);
  },
  {
    name: "vectorSearch",
    description:
      "Search document chunks by semantic similarity. Returns the most relevant text passages from a specific document.",
    schema: z.object({
      query: z.string().describe("The search query"),
      document_file_id: z.number().describe("The document file ID to search within"),
      top_k: z.number().optional().default(12).describe("Number of results to return"),
    }),
  }
);

/* -------------------------------------------------------------------------- */
/*  queryDealInputs: read current deal input values                            */
/* -------------------------------------------------------------------------- */

export const queryDealInputsTool = tool(
  async ({ deal_id, input_ids }) => {
    let query = supabaseAdmin
      .from("deal_inputs")
      .select("input_id, input_type, value_text, value_numeric, value_date, value_bool")
      .eq("deal_id", deal_id);

    if (input_ids && input_ids.length > 0) {
      query = query.in("input_id", input_ids);
    }

    const { data, error } = await query;
    if (error) return JSON.stringify({ error: error.message });

    return JSON.stringify(data ?? []);
  },
  {
    name: "queryDealInputs",
    description:
      "Read current deal input values. Returns all input values for a deal, or specific inputs if input_ids are provided.",
    schema: z.object({
      deal_id: z.string().describe("The deal UUID"),
      input_ids: z.array(z.number()).optional().describe("Specific input IDs to fetch"),
    }),
  }
);

/* -------------------------------------------------------------------------- */
/*  supabaseQuery: run a read-only database query                              */
/* -------------------------------------------------------------------------- */

const ALLOWED_TABLES = [
  "inputs",
  "input_categories",
  "deal_documents",
  "document_files",
  "document_types",
  "document_categories",
  "deal_document_ai_input",
  "deal_document_ai_condition",
  "document_type_ai_input",
  "document_type_ai_condition",
  "borrowers",
  "entities",
  "deals",
  "loans",
];

export const supabaseQueryTool = tool(
  async ({ table, select, filters, limit }) => {
    if (!ALLOWED_TABLES.includes(table)) {
      return JSON.stringify({ error: `Table '${table}' is not allowed. Allowed: ${ALLOWED_TABLES.join(", ")}` });
    }

    let query = supabaseAdmin.from(table).select(select || "*");

    if (filters) {
      for (const f of filters) {
        if (f.operator === "eq") query = query.eq(f.column, f.value);
        else if (f.operator === "neq") query = query.neq(f.column, f.value);
        else if (f.operator === "gt") query = query.gt(f.column, f.value);
        else if (f.operator === "lt") query = query.lt(f.column, f.value);
        else if (f.operator === "in") query = query.in(f.column, f.value as any[]);
        else if (f.operator === "ilike") query = query.ilike(f.column, f.value as string);
      }
    }

    query = query.limit(limit ?? 50);

    const { data, error } = await query;
    if (error) return JSON.stringify({ error: error.message });

    return JSON.stringify(data ?? []);
  },
  {
    name: "supabaseQuery",
    description:
      "Run a read-only database query against allowed tables. Use this to look up document metadata, borrower info, or other deal data.",
    schema: z.object({
      table: z.string().describe("Table name to query"),
      select: z.string().optional().describe("Columns to select (default: *)"),
      filters: z
        .array(
          z.object({
            column: z.string(),
            operator: z.enum(["eq", "neq", "gt", "lt", "in", "ilike"]),
            value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]),
          })
        )
        .optional()
        .describe("Filter conditions"),
      limit: z.number().optional().default(50).describe("Max rows to return"),
    }),
  }
);

/* -------------------------------------------------------------------------- */
/*  webSearch: search the web via Perplexity                                   */
/* -------------------------------------------------------------------------- */

export const webSearchTool = tool(
  async ({ query }) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" });
    }

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: query }],
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      return JSON.stringify({ error: `Perplexity API error: ${res.status}` });
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "No results";
  },
  {
    name: "webSearch",
    description:
      "Search the web for real-time information. Use for market data, public records, comparable sales, or any external information.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

/* -------------------------------------------------------------------------- */
/*  calculator: evaluate math expressions safely                               */
/* -------------------------------------------------------------------------- */

export const calculatorTool = tool(
  async ({ expression }) => {
    try {
      // Safe math evaluation using Function constructor with restricted scope
      const sanitized = expression.replace(/[^0-9+\-*/().,%\s]/g, "");
      if (!sanitized.trim()) return JSON.stringify({ error: "Invalid expression" });

      const fn = new Function(`"use strict"; return (${sanitized});`);
      const result = fn();

      if (typeof result !== "number" || !isFinite(result)) {
        return JSON.stringify({ error: "Expression did not produce a valid number" });
      }

      return JSON.stringify({ result, expression: sanitized });
    } catch (err) {
      return JSON.stringify({ error: `Calculation failed: ${(err as Error).message}` });
    }
  },
  {
    name: "calculator",
    description:
      "Evaluate mathematical expressions. Use for DSCR calculations, LTV ratios, debt yield, and other financial computations.",
    schema: z.object({
      expression: z
        .string()
        .describe("Math expression to evaluate, e.g. '500000 / 650000' or '(7700 * 12) / 1000000'"),
    }),
  }
);

/* -------------------------------------------------------------------------- */
/*  Tool registry: get tools by name                                           */
/* -------------------------------------------------------------------------- */

export const TOOL_REGISTRY: Record<string, any> = {
  vector_search: vectorSearchTool,
  query_deal_inputs: queryDealInputsTool,
  supabase_query: supabaseQueryTool,
  web_search: webSearchTool,
  calculator: calculatorTool,
};

export function getToolsForAgent(toolConfigs: Array<{ type: string; config?: Record<string, unknown> }>): any[] {
  return toolConfigs
    .map((tc) => TOOL_REGISTRY[tc.type])
    .filter(Boolean);
}
