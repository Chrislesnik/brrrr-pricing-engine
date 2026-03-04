import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSchemaContext } from "@/lib/schema-context";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-6";

/* -------------------------------------------------------------------------- */
/*  System prompt builder                                                      */
/* -------------------------------------------------------------------------- */

function buildSystemPrompt(
  mode: string,
  workflowContext: string,
  dbSchema: string,
): string {
  const modeDescription =
    mode === "runOnceEachItem"
      ? "The code runs once PER ITEM. The variable 'item' contains the current item ({json: {...}}). Return the transformed item or a new item."
      : "The code runs ONCE with all items available via $input.all(). Return an array of items.";

  return `You are an expert JavaScript developer writing code for a workflow automation Code node.

## Code Node API

### Input Access
- $input.all() — returns all items from the previous node as [{json: {...}}, ...]
- $input.first() — returns the first item {json: {...}}
- $input.last() — returns the last item
- $input.item — alias for first()

### Node Access
- $node['NodeName'].json.fieldName — access any upstream node's output by its label
- Example: $node['Get Row'].json.row.status

### Console
- console.log(), console.warn(), console.error() — captured in step logs for debugging

### Return Format
- Must return an array of items: [{json: {key: value}}, ...]
- For simple transforms: return [{json: {myField: someValue}}]
- For passing through modified items: return items.map(item => ({json: {...item.json, newField: value}}))
- For each-item mode: return the single item, e.g. return {json: {...item.json, newField: value}}

### Current Mode: ${mode === "runOnceEachItem" ? "Run Once for Each Item" : "Run Once for All Items"}
${modeDescription}

${workflowContext}

## Database Schema (for reference, in case you need to understand data shapes)
${dbSchema}

## Rules
- Output ONLY valid JavaScript code
- Do NOT include markdown code fences, backticks, or explanations
- Do NOT include comments like "// Here's the code" — just the code itself
- Use $input and $node to access data from the workflow
- Always return items in the correct format
- Handle null/undefined values gracefully with optional chaining (?.) or defaults
- Use const/let, not var
- Write clean, readable code`;
}

/* -------------------------------------------------------------------------- */
/*  POST /api/code-agent/generate                                              */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { prompt, mode, workflowContext } = body as {
      prompt?: string;
      mode?: string;
      workflowContext?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch DB schema for context
    const dbSchema = await getSchemaContext();

    // Call Anthropic Messages API with streaming
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
        system: buildSystemPrompt(
          mode || "runOnceAllItems",
          workflowContext || "No workflow context provided.",
          dbSchema,
        ),
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[code-agent] Anthropic API error:", errorText);
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
                  console.error("[code-agent] Stream error:", event.error);
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
          console.error("[code-agent] Stream read error:", err);
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
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[code-agent] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
