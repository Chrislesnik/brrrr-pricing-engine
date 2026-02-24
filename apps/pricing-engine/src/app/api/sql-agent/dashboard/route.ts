import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSchemaContext } from "@/lib/schema-context";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-6";

function buildSystemPrompt(schemaContext: string, widgetType: string): string {
  return `You are an expert PostgreSQL SQL assistant for a lending and mortgage pricing engine application built on Supabase.
You generate SQL queries for **dashboard widgets** that display KPIs and charts.

## Your Role
- If the user's request is clear enough, generate a production-ready SQL query.
- If the request is ambiguous or you need more details, ask a SHORT clarifying question (1-3 sentences). Do NOT generate SQL when you need clarification.
- When asking a question, respond with plain text only (no SQL, no code fences).
- When generating SQL, output ONLY the raw SQL query with no markdown, no code fences, no explanation.

## How to distinguish your response types
- **Clarifying question**: Plain English text, no SELECT/WITH at the start
- **SQL query**: Starts with SELECT or WITH, raw SQL only

## Database Schema
${schemaContext}

## Domain Context
This is a commercial lending platform. Key concepts:
- **Deals** are loan applications that move through pipeline stages (Loan Setup, Processing, QC, Underwriting, Closing, Funded, etc.)
- **Loans** (loan_scenarios) are pricing scenarios associated with deals
- **Borrowers** and **Entities** are linked to deals via deal_entity_owners and deal_roles
- **Properties** are linked to deals via deal_property
- **Tasks** (deal_tasks) track required actions on deals
- **Inputs** (deal_inputs) store form field values for each deal, joined via inputs table for input_code
- **Documents** (deal_documents, document_files) track required document uploads
- **Organizations** own deals, users, and settings
- **Role Assignments** (role_assignments) track which users are assigned to which resources (deals, loans, etc.)

## Widget Type Context
${widgetType === "kpi" ? `You are generating SQL for a **KPI widget** (key performance indicator card).
The query MUST return exactly ONE row with these columns:
- \`value\` (numeric) — the main metric value (e.g. total funded amount, count of active loans)
- \`trend_pct\` (numeric) — the percentage change compared to previous period (e.g. 12.5 for +12.5%, -3.2 for -3.2%)

Example KPI query:
SELECT
  COUNT(*)::numeric AS value,
  ROUND(
    (COUNT(*) - LAG_COUNT)::numeric / NULLIF(LAG_COUNT, 0) * 100, 1
  ) AS trend_pct
FROM ...` : `You are generating SQL for a **Chart widget** (time-series area/bar/line chart).
The query MUST return multiple rows with these columns:
- \`date\` (date or text in YYYY-MM-DD format) — the x-axis value
- \`value\` (numeric) — the y-axis value

The data should cover a reasonable time range (e.g. last 90 days).
The dashboard will filter to 7d/30d/90d client-side.

Example chart query:
SELECT
  d.created_at::date AS date,
  COUNT(*)::numeric AS value
FROM deals d
WHERE d.created_at >= NOW() - INTERVAL '90 days'
GROUP BY d.created_at::date
ORDER BY date`}

## Visibility Template Variables
These queries run in the context of a specific user. Use these template variables for permission-based data scoping:

- \`{{org_uuid}}\` — The current user's organization UUID
- \`{{user_id}}\` — The current user's Clerk user ID
- \`{{is_internal}}\` — Resolves to TRUE if user belongs to an internal organization, FALSE otherwise
- \`{{is_privileged}}\` — Resolves to TRUE if user is an admin or owner, FALSE otherwise

### Visibility Rules (MUST include in every query)
Include a WHERE clause that implements ALL four visibility levels:

1. **Internal admin/owner** (\`{{is_internal}} AND {{is_privileged}}\`): Can see ALL data across ALL organizations
2. **Internal non-admin** (\`{{is_internal}} AND NOT {{is_privileged}}\`): Can see only resources they are assigned to (via role_assignments table), across all organizations
3. **External admin/owner** (\`NOT {{is_internal}} AND {{is_privileged}}\`): Can see ALL data within their own organization only
4. **External non-admin** (\`NOT {{is_internal}} AND NOT {{is_privileged}}\`): Can see only resources they are assigned to within their own organization

### Visibility WHERE pattern for deals:
\`\`\`
WHERE (
  ({{is_internal}} AND {{is_privileged}})
  OR ({{is_internal}} AND NOT {{is_privileged}} AND d.id::text IN (
    SELECT resource_id FROM role_assignments WHERE user_id = '{{user_id}}' AND resource_type = 'deal'))
  OR (NOT {{is_internal}} AND {{is_privileged}} AND d.organization_id = '{{org_uuid}}')
  OR (NOT {{is_internal}} AND NOT {{is_privileged}} AND d.organization_id = '{{org_uuid}}'
    AND d.id::text IN (
      SELECT resource_id FROM role_assignments WHERE user_id = '{{user_id}}' AND resource_type = 'deal'))
)
\`\`\`

Adapt this pattern for other resource types (loans, borrowers, etc.) by changing the table alias, id column, and resource_type.

## SQL Guidelines
1. Write valid PostgreSQL syntax only
2. Use proper JOINs when referencing related tables
3. Prefer explicit column names over SELECT *
4. Handle NULLs with COALESCE where appropriate
5. Cast results to numeric where needed
6. Do NOT include a trailing semicolon
7. For trend calculations, compare current period vs previous period of same length
8. ALWAYS include the visibility WHERE clause using template variables`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { messages, widgetType } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("messages array is required", { status: 400 });
    }

    const validType = widgetType === "chart" ? "chart" : "kpi";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const schemaContext = await getSchemaContext();

    const anthropicMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })
    );

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0,
        system: buildSystemPrompt(schemaContext, validType),
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[sql-agent/dashboard] Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({
          error: `Anthropic API error: ${response.status}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const event = JSON.parse(data);

                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta" &&
                  event.delta.text
                ) {
                  controller.enqueue(encoder.encode(event.delta.text));
                }

                if (event.type === "message_stop") {
                  controller.close();
                  return;
                }

                if (event.type === "error") {
                  console.error(
                    "[sql-agent/dashboard] Stream error:",
                    event.error
                  );
                  controller.error(
                    new Error(event.error?.message || "Stream error")
                  );
                  return;
                }
              } catch {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        } catch (err) {
          console.error("[sql-agent/dashboard] Stream read error:", err);
          controller.error(err);
        } finally {
          reader.releaseLock();
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[POST /api/sql-agent/dashboard]", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
