import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSchemaContext } from "@/lib/schema-context";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-6";

/* -------------------------------------------------------------------------- */
/*  System prompt builder                                                      */
/* -------------------------------------------------------------------------- */

function buildSystemPrompt(schemaContext: string): string {
  return `You are an expert PostgreSQL SQL assistant for a lending and mortgage pricing engine application built on Supabase.

## Your Role
You write precise, production-ready SQL queries based on user descriptions. You have deep knowledge of the database schema provided below.

## Database Schema
${schemaContext}

## Domain Context
This is a commercial lending platform. Key concepts:
- **Deals** are loan applications that move through a pipeline of stages (Loan Setup, Processing, QC, Underwriting, etc.)
- **Borrowers** and **Entities** are linked to deals via deal_entity_owners and deal_roles
- **Properties** are linked to deals via deal_property
- **Tasks** (deal_tasks) track required actions on deals, controlled by task_templates and task_logic rules
- **Inputs** (deal_inputs) store form field values for each deal
- **Documents** (deal_documents, document_files) track required document uploads
- **Organizations** own deals, users, and settings

## SQL Guidelines
1. Write valid PostgreSQL syntax only
2. Queries should be self-contained and ready to execute
3. For task logic conditions: the query should return rows when the condition is TRUE and no rows when FALSE
4. Use proper JOINs when referencing related tables
5. Prefer explicit column names over SELECT *
6. Use appropriate WHERE clauses for filtering
7. Handle NULLs appropriately with IS NULL / IS NOT NULL
8. Use parameterized-safe patterns (no SQL injection vectors)

## Output Rules
- Output ONLY the SQL query
- Do NOT include markdown code fences, explanations, or comments
- Do NOT include a trailing semicolon
- If the user request is unclear, write the best possible query and add a brief SQL comment at the top explaining your interpretation`;
}

/* -------------------------------------------------------------------------- */
/*  POST /api/sql-agent/generate                                               */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response("prompt is required", { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch database schema context
    const schemaContext = await getSchemaContext();

    // Call Anthropic Messages API directly with streaming
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0,
        system: buildSystemPrompt(schemaContext),
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[sql-agent] Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse SSE stream from Anthropic and forward as plain text chunks
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
            // Keep the last incomplete line in the buffer
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
                  console.error("[sql-agent] Stream error:", event.error);
                  controller.error(new Error(event.error?.message || "Stream error"));
                  return;
                }
              } catch {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        } catch (err) {
          console.error("[sql-agent] Stream read error:", err);
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
    console.error("[POST /api/sql-agent/generate]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
