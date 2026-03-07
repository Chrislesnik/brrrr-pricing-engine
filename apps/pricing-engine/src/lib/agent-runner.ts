import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getToolsForAgent, TOOL_REGISTRY } from "@/lib/agent-tools";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AgentConfig {
  id: string;
  name: string;
  agent_type: string;
  model: string;
  system_prompt: string | null;
  tools: Array<{ type: string; config?: Record<string, unknown> }>;
  config: Record<string, unknown>;
}

interface RunContext {
  deal_id?: string;
  deal_document_id?: number;
  document_file_id?: number;
  trigger?: string;
  depth?: number; // prevents infinite recursion for callAgent
}

interface AgentRunResult {
  run_id: string;
  output: unknown;
  status: "complete" | "failed";
  error?: string;
  duration_ms: number;
}

/* -------------------------------------------------------------------------- */
/*  Build the LangGraph ReAct agent graph                                      */
/* -------------------------------------------------------------------------- */

function buildAgentGraph(agentConfig: AgentConfig, context: RunContext) {
  const tools = getToolsForAgent(agentConfig.tools);

  // Add callAgent tool dynamically if configured and depth allows
  if (
    agentConfig.tools.some((t) => t.type === "call_agent") &&
    (context.depth ?? 0) < 3
  ) {
    const { tool: toolFn } = require("@langchain/core/tools");
    const { z } = require("zod");

    const callAgentTool = toolFn(
      async ({ agent_id, input }: { agent_id: string; input: string }) => {
        const result = await runAgent(agent_id, input, {
          ...context,
          depth: (context.depth ?? 0) + 1,
        });
        return JSON.stringify(result.output);
      },
      {
        name: "callAgent",
        description: "Invoke another AI agent as a sub-task. Provide the agent ID and input message.",
        schema: z.object({
          agent_id: z.string().describe("UUID of the agent to call"),
          input: z.string().describe("Input message for the sub-agent"),
        }),
      }
    );
    tools.push(callAgentTool);
  }

  const model = new ChatOpenAI({
    modelName: agentConfig.model || "gpt-4.1-mini",
    temperature: (agentConfig.config?.temperature as number) ?? 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const modelWithTools = tools.length > 0 ? model.bindTools(tools) : model;

  // Agent node: call the LLM
  async function agentNode(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const response = await modelWithTools.invoke(messages);
    return { messages: [response] };
  }

  // Conditional routing: if the LLM returned tool calls, go to tools node; otherwise end
  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray((lastMessage as any).tool_calls) &&
      (lastMessage as any).tool_calls.length > 0
    ) {
      return "tools";
    }
    return END;
  }

  const toolNode = tools.length > 0 ? new ToolNode(tools) : null;

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode);

  if (toolNode) {
    graph
      .addNode("tools", toolNode)
      .addEdge("tools", "agent")
      .addConditionalEdges("agent", shouldContinue, {
        tools: "tools",
        [END]: END,
      });
  } else {
    graph.addEdge("agent", END);
  }

  graph.setEntryPoint("agent");

  return graph.compile();
}

/* -------------------------------------------------------------------------- */
/*  Run an agent                                                               */
/* -------------------------------------------------------------------------- */

export async function runAgent(
  agentId: string,
  input: string,
  context: RunContext = {}
): Promise<AgentRunResult> {
  const startTime = Date.now();

  // 1. Load agent config
  const { data: agent, error: agentErr } = await supabaseAdmin
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (agentErr || !agent) {
    throw new Error(`Agent ${agentId} not found: ${agentErr?.message}`);
  }

  // 2. Create the run record
  const { data: runRow, error: runErr } = await supabaseAdmin
    .from("ai_agent_runs")
    .insert({
      agent_id: agentId,
      deal_id: context.deal_id ?? null,
      deal_document_id: context.deal_document_id ?? null,
      trigger: context.trigger ?? "manual",
      input: { message: input, context },
      status: "running",
    })
    .select("id")
    .single();

  if (runErr || !runRow) {
    throw new Error(`Failed to create run record: ${runErr?.message}`);
  }

  const runId = runRow.id;

  try {
    // 3. Build and execute the graph
    const agentConfig: AgentConfig = {
      id: agent.id,
      name: agent.name,
      agent_type: agent.agent_type,
      model: agent.model,
      system_prompt: agent.system_prompt,
      tools: (agent.tools as any[]) ?? [],
      config: (agent.config as Record<string, unknown>) ?? {},
    };

    const compiled = buildAgentGraph(agentConfig, context);

    const messages: any[] = [];
    if (agentConfig.system_prompt) {
      messages.push(new SystemMessage(agentConfig.system_prompt));
    }
    messages.push(new HumanMessage(input));

    const result = await compiled.invoke({ messages });

    // Extract the final response
    const lastMessage = result.messages[result.messages.length - 1];
    const output =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Try to parse as JSON if possible
    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(output);
    } catch {
      parsedOutput = output;
    }

    const durationMs = Date.now() - startTime;

    // 4. Update run record with success
    await supabaseAdmin
      .from("ai_agent_runs")
      .update({
        output: parsedOutput,
        status: "complete",
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq("id", runId);

    console.log(
      `[runAgent] ${agent.name} completed in ${durationMs}ms`
    );

    return {
      run_id: runId,
      output: parsedOutput,
      status: "complete",
      duration_ms: durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Update run record with failure
    await supabaseAdmin
      .from("ai_agent_runs")
      .update({
        status: "failed",
        error: errorMsg,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq("id", runId);

    console.error(`[runAgent] ${agent?.name ?? agentId} failed:`, err);

    return {
      run_id: runId,
      output: null,
      status: "failed",
      error: errorMsg,
      duration_ms: durationMs,
    };
  }
}
