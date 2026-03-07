import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import { cn } from "@repo/lib/cn";
import type { AgentNodeData } from "../lib/agent-store";

function AgentNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const model = (nodeData.config?.model as string) ?? "gpt-4.1-mini";
  const prompt = (nodeData.config?.systemPrompt as string) ?? "";

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-background px-4 py-3 shadow-sm min-w-[200px] max-w-[280px]",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
        nodeData.status === "running" && "border-amber-500 animate-pulse",
        nodeData.status === "success" && "border-emerald-500",
        nodeData.status === "error" && "border-red-500"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
            {nodeData.label || "Agent"}
          </p>
          <p className="text-[10px] text-muted-foreground">{model}</p>
        </div>
      </div>
      {prompt && (
        <p className="text-[10px] text-muted-foreground truncate">
          {prompt.substring(0, 60)}{prompt.length > 60 ? "..." : ""}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-violet-500 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}

export const AgentLLMNode = memo(AgentNodeComponent);
