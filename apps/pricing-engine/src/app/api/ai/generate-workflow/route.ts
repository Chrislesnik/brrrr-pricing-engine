import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { generateAIActionPrompts } from "@/components/workflow-builder/plugins";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 120;

type ExistingWorkflow = {
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: {
      label?: string;
      type: string;
      description?: string;
      config?: Record<string, unknown>;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
  }>;
  name?: string;
};

type InputDef = { id: number; input_code: string; input_label: string; input_type: string; category: string };

function formatInputList(title: string, webhookType: string, inputs: InputDef[]): string {
  if (inputs.length === 0) return "";
  const byCategory = new Map<string, InputDef[]>();
  for (const inp of inputs) {
    const cat = inp.category || "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(inp);
  }
  const lines: string[] = [`## ${title}`, "", `When using "Respond to Webhook" with webhookType "${webhookType}", these are the available inputs. Use the exact id, input_code, and input_type when building inputMappings:`, ""];
  for (const [cat, catInputs] of byCategory) {
    lines.push(`### ${cat}`);
    for (const inp of catInputs) {
      lines.push(`- id: ${inp.id}, code: "${inp.input_code}", label: "${inp.input_label}", type: "${inp.input_type}"`);
    }
  }
  return lines.join("\n");
}

function buildSystemPrompt(availableIntegrations: string[], pricingEngineInputs: InputDef[], dealInputs: InputDef[]): string {
  const pluginActions = generateAIActionPrompts();

  return `You are an expert workflow automation architect. Given a user's description, generate (or modify) a workflow as a JSON object with nodes and edges for a React Flow canvas.

## Output Format

Return ONLY valid JSON — no explanation, no markdown fences, no comments. The response must parse directly with JSON.parse().

The JSON shape:
{
  "name": "Short Workflow Name",
  "description": "One-line description of what the workflow does",
  "nodes": [ ... ],
  "edges": [ ... ]
}

## Node Structure

Every node MUST have this exact shape:
{
  "id": "<unique-id>",
  "type": "trigger" or "action",
  "position": { "x": <number>, "y": <number> },
  "data": {
    "label": "<Human-readable name>",
    "type": "trigger" or "action",
    "description": "<Brief description of what this step does>",
    "config": { ... }
  }
}

CRITICAL: The "type" field at the top level AND inside "data" must both be either "trigger" or "action". There is no "condition" type — Condition, Switch, and Filter are action nodes with specific actionType values.

## Edge Structure

{
  "id": "<unique-id>",
  "source": "<source-node-id>",
  "target": "<target-node-id>",
  "sourceHandle": null
}

For branching nodes, use sourceHandle to route:
- Condition node: "true" or "false"
- Switch node: the output name (e.g., "output_0", "output_1") or the rule output name
- Filter node: "kept" or "rejected"
- Loop Over Batches: "batch" (loop body) or "done" (after loop)

## Layout Rules

- Trigger node at position {x: 250, y: 50}
- Each subsequent node ~150px below the previous
- For branches (Condition/Switch), offset paths by ~200px horizontally from center
- After branches merge, return to center x: 250

## Trigger Types

Every workflow needs exactly ONE trigger node. The trigger's config must include "triggerType".

### Manual Trigger
{ "triggerType": "manual" }

### Schedule Trigger
{ "triggerType": "schedule", "scheduleCron": "0 9 * * *", "scheduleTimezone": "America/New_York" }

### Webhook Trigger
{ "triggerType": "webhook", "webhookType": "pricing_engine" }
webhookType values: "pricing_engine" (for loan scenario inputs) or "deal" (for deal inputs). Always set webhookType when the workflow involves writing to pricing engine or deal inputs via Respond to Webhook.

## Built-in Action Types

Action nodes must set "actionType" in their config. Here are all built-in (system) actions:

### HTTP Request
{ "actionType": "HTTP Request", "httpMethod": "POST", "endpoint": "https://api.example.com/data", "httpHeaders": "{\\"Content-Type\\": \\"application/json\\"}", "httpBody": "{\\"key\\": \\"value\\"}", "httpQueryParams": "{}" }

### Database Query
{ "actionType": "Database Query", "dbQuery": "SELECT * FROM users WHERE active = true" }

### Condition (branching — use sourceHandle "true"/"false" on edges)
{ "actionType": "Condition", "condition": "{{@trigger_1:Trigger.amount}} > 1000" }

### Set Fields (transform data by setting new fields)
{ "actionType": "Set Fields", "fields": "[{\\"name\\": \\"fullName\\", \\"type\\": \\"string\\", \\"mode\\": \\"fixed\\", \\"value\\": \\"John Doe\\"}]", "includeInputFields": "false" }

### Code (custom JavaScript — runs in a sandbox)
{ "actionType": "Code", "mode": "runOnceAllItems", "code": "const items = $input.all();\\nreturn items.map(item => ({json: {...item.json, processed: true}}));" }

### Wait
{ "actionType": "Wait", "waitAmount": "5", "waitUnit": "seconds" }

### Switch (multi-branch routing — use sourceHandle per output)
{ "actionType": "Switch", "switchMode": "rules", "switchValue": "{{@trigger_1:Trigger.status}}", "rules": "[{\\"output\\": \\"active\\", \\"operator\\": \\"equals\\", \\"value\\": \\"active\\"}, {\\"output\\": \\"inactive\\", \\"operator\\": \\"equals\\", \\"value\\": \\"inactive\\"}]" }

### Filter (keep/reject items — use sourceHandle "kept"/"rejected")
{ "actionType": "Filter", "condition": "{{@action_1:HTTP Request.data.status}} == 200" }

### DateTime
{ "actionType": "DateTime", "operation": "getCurrent", "outputFormat": "ISO" }
Operations: "getCurrent", "format", "addSubtract", "compare", "parse"

### Split Out (explode an array into individual items)
{ "actionType": "Split Out", "fieldPath": "{{@action_1:HTTP Request.data.items}}", "includeOtherFields": "false" }

### Limit
{ "actionType": "Limit", "maxItems": "10", "from": "beginning" }

### Aggregate
{ "actionType": "Aggregate", "operation": "count" }
Operations: "count", "sum", "average", "min", "max", "groupBy"

### Merge (combine data from multiple branches)
{ "actionType": "Merge", "mode": "append" }
Modes: "append", "byPosition", "byField"

### Sort
{ "actionType": "Sort", "sortField": "{{@action_1:Set Fields.createdAt}}", "direction": "ascending", "dataType": "auto" }

### Remove Duplicates
{ "actionType": "Remove Duplicates", "dedupField": "{{@action_1:HTTP Request.data.email}}", "keep": "first" }

### Loop Over Batches (use sourceHandle "batch"/"done" on edges)
{ "actionType": "Loop Over Batches", "batchSize": "10" }

### Respond to Webhook
Maps incoming webhook data to pricing engine inputs or deal inputs and writes them to the database.

Config fields:
- "actionType": "Respond to Webhook"
- "recordId": template string for the scenario/deal ID, e.g. "{{@trigger_1:Webhook Trigger.body.scenario_id}}"
- "responseStatusCode": HTTP status to return, e.g. "200"
- "responseBody": JSON string for the webhook response body, e.g. "{\\"success\\": true}"
- "inputMappings": JSON-encoded array of input mapping objects. Each mapping has:
  - "id": unique string (use a descriptive id like "map_1")
  - "inputId": the pricing engine input ID (number as string)
  - "inputCode": the input_code from pricing_engine_inputs
  - "inputType": the input_type (e.g. "currency", "number", "dropdown", "text", "date", "boolean", "percentage", "table", "tags")
  - "value": template string pulling from webhook body, e.g. "{{@trigger_1:Webhook Trigger.body.purchase_price}}"

IMPORTANT: The trigger node must have "triggerType": "webhook" and "webhookType": "pricing_engine" (or "deal") for this action to work.

Example:
{ "actionType": "Respond to Webhook", "recordId": "{{@trigger_1:Webhook Trigger.body.scenario_id}}", "responseStatusCode": "200", "responseBody": "{\\"success\\": true}", "inputMappings": "[{\\"id\\":\\"map_1\\",\\"inputId\\":\\"16\\",\\"inputCode\\":\\"purchase_price\\",\\"inputType\\":\\"currency\\",\\"value\\":\\"{{@trigger_1:Webhook Trigger.body.purchase_price}}\\"},{\\"id\\":\\"map_2\\",\\"inputId\\":\\"8\\",\\"inputCode\\":\\"fico_score\\",\\"inputType\\":\\"number\\",\\"value\\":\\"{{@trigger_1:Webhook Trigger.body.fico_score}}\\"}]" }

${formatInputList("Available Pricing Engine Inputs", "pricing_engine", pricingEngineInputs)}

${formatInputList("Available Deal Inputs", "deal", dealInputs)}

## Plugin Action Types (Integration Actions)

These require the user to have the integration configured. Use the full namespaced actionType (e.g., "resend/send-email").
${availableIntegrations.length > 0 ? `\nThe user has these integrations configured: ${availableIntegrations.join(", ")}. Prefer these when relevant.\n` : "\nNo integrations are currently configured. You can still suggest plugin actions — the user will need to set up the integration.\n"}
${pluginActions}

## Template Syntax

Reference upstream node outputs using: {{@<nodeId>:<NodeLabel>.<fieldPath>}}

Examples:
- {{@trigger_1:Webhook Trigger.body.email}} — access webhook body field
- {{@action_1:HTTP Request.data.name}} — access HTTP response field
- {{@action_2:Get Row.row.status}} — access Supabase row field
- {{@action_1:Code.items[0].json.result}} — access code output

Templates can be used in any string config field. Use them to pass data between nodes.

## Rules

1. Always start with exactly ONE trigger node.
2. Every action node MUST have a valid "actionType" in config — either a built-in name or a namespaced plugin ID.
3. Every trigger node MUST have "triggerType" in config.
4. Node IDs should be descriptive: "trigger_1", "action_1", "action_2", "condition_1", etc.
5. Use templates to connect data between nodes.
6. For branching (Condition, Switch, Filter), create edges with the correct sourceHandle values.
7. Config values that are JSON (fields, rules, httpHeaders, httpBody, httpQueryParams) must be JSON-encoded strings.
8. Generate a concise, descriptive workflow name.
9. Keep workflows practical and efficient — don't add unnecessary steps.
10. When the user says "condition" or "if/else", use the Condition action type with branching edges.
11. When the user mentions sending emails, use "resend/send-email" if Resend is available, otherwise use HTTP Request.
12. When the user mentions AI/LLM, use "ai-gateway/generate-text" if available.
13. When the user mentions Slack, use "slack/send-slack-message" if available.`;
}

function buildUserMessage(
  prompt: string,
  existingWorkflow?: ExistingWorkflow,
): string {
  let message = prompt.trim();

  if (existingWorkflow) {
    const summary = existingWorkflow.nodes
      .map((n) => {
        const label = n.data.label || n.id;
        const actionType =
          (n.data.config?.actionType as string) ||
          (n.data.config?.triggerType as string) ||
          n.data.type;
        return `  - ${n.id}: "${label}" (${actionType})`;
      })
      .join("\n");

    message += `

## Existing Workflow${existingWorkflow.name ? ` — "${existingWorkflow.name}"` : ""}

Current nodes:
${summary}

IMPORTANT: You are MODIFYING this existing workflow. Here is the full current workflow data:

${JSON.stringify({ nodes: existingWorkflow.nodes, edges: existingWorkflow.edges }, null, 2)}

Rules for modification:
- Keep existing node IDs when preserving nodes
- Only add, remove, or reconfigure nodes as needed by the user's request
- Preserve the overall structure unless the user asks to rebuild
- Return the COMPLETE updated workflow (all nodes and edges, not just changes)`;
  }

  return message;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause && typeof cause === "object") {
      const c = cause as Record<string, unknown>;
      if (typeof c.message === "string") return c.message;
      if (typeof c.error === "object" && c.error && typeof (c.error as Record<string, unknown>).message === "string") {
        return (c.error as Record<string, unknown>).message as string;
      }
    }
    return err.message || String(err);
  }
  if (typeof err === "string") return err;
  return String(err);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, existingWorkflow, availableIntegrations } = body as {
      prompt?: string;
      existingWorkflow?: ExistingWorkflow;
      availableIntegrations?: string[];
    };

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const openai = createOpenAI({ apiKey: openaiKey });

    const [{ data: peInputsRaw }, { data: dealInputsRaw }] = await Promise.all([
      supabaseAdmin
        .from("pricing_engine_inputs")
        .select("id, input_code, input_label, input_type, category")
        .is("archived_at", null)
        .order("category_id")
        .order("display_order"),
      supabaseAdmin
        .from("inputs")
        .select("id, input_code, input_label, input_type, category")
        .is("archived_at", null)
        .order("category_id")
        .order("display_order"),
    ]);

    const toInputDef = (r: Record<string, unknown>): InputDef => ({
      id: r.id as number,
      input_code: r.input_code as string,
      input_label: r.input_label as string,
      input_type: r.input_type as string,
      category: r.category as string,
    });
    const peInputs = (peInputsRaw ?? []).map(toInputDef);
    const dealInputs = (dealInputsRaw ?? []).map(toInputDef);

    const systemPrompt = buildSystemPrompt(availableIntegrations ?? [], peInputs, dealInputs);
    const userMessage = buildUserMessage(prompt, existingWorkflow);

    let text = "";
    try {
      console.log(`[AI generate-workflow] Calling gpt-4o. Prompt length: ${userMessage.length}`);
      const result = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.3,
        maxOutputTokens: 16384,
      });
      text = result.text;
      console.log(`[AI generate-workflow] gpt-4o responded. Length: ${text.length}`);
    } catch (err) {
      const msg = extractErrorMessage(err);
      console.error("[AI generate-workflow] gpt-4o failed:", msg);
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Model returned empty response" }, { status: 503 });
    }

    // Stream the text to the client in chunks for incremental parsing
    const encoder = new TextEncoder();
    const chunkSize = 200;
    const stream = new ReadableStream({
      start(controller) {
        for (let i = 0; i < text.length; i += chunkSize) {
          controller.enqueue(encoder.encode(text.slice(i, i + chunkSize)));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[POST /api/ai/generate-workflow]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
