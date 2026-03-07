"use client";

import { useAtom, useSetAtom } from "jotai";
import { X } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Textarea } from "@repo/ui/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  agentNodesAtom,
  selectedAgentNodeAtom,
  updateAgentNodeDataAtom,
  deleteAgentNodeAtom,
} from "./lib/agent-store";

const MODELS = [
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
];

export function AgentConfigPanel() {
  const [nodes] = useAtom(agentNodesAtom);
  const [selectedId, setSelectedId] = useAtom(selectedAgentNodeAtom);
  const updateNodeData = useSetAtom(updateAgentNodeDataAtom);
  const deleteNode = useSetAtom(deleteAgentNodeAtom);

  const node = nodes.find((n) => n.id === selectedId);
  if (!node) return null;

  const config = (node.data.config ?? {}) as Record<string, unknown>;

  const updateConfig = (key: string, value: unknown) => {
    updateNodeData({
      id: node.id,
      data: { config: { ...config, [key]: value } },
    });
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col shrink-0">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold capitalize">{node.data.type} Node</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSelectedId(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input
            value={node.data.label ?? ""}
            onChange={(e) => updateNodeData({ id: node.id, data: { label: e.target.value } })}
            placeholder="Node label..."
            className="h-8 text-sm"
          />
        </div>

        {/* Agent (LLM) node config */}
        {node.data.type === "agent" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Model</Label>
              <Select
                value={(config.model as string) ?? "gpt-4.1-mini"}
                onValueChange={(v) => updateConfig("model", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={(config.systemPrompt as string) ?? ""}
                onChange={(e) => updateConfig("systemPrompt", e.target.value)}
                placeholder="You are an AI agent..."
                rows={6}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Temperature</Label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={(config.temperature as number) ?? 0}
                onChange={(e) => updateConfig("temperature", parseFloat(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </>
        )}

        {/* Start node config */}
        {node.data.type === "start" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={node.data.description ?? ""}
              onChange={(e) => updateNodeData({ id: node.id, data: { description: e.target.value } })}
              placeholder="Describe the input this agent receives..."
              rows={3}
              className="text-sm"
            />
          </div>
        )}

        {/* End node config */}
        {node.data.type === "end" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Output Format</Label>
            <Select
              value={(config.outputFormat as string) ?? "text"}
              onValueChange={(v) => updateConfig("outputFormat", v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Note node config */}
        {node.data.type === "note" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Textarea
              value={node.data.label ?? ""}
              onChange={(e) => updateNodeData({ id: node.id, data: { label: e.target.value } })}
              placeholder="Write a note..."
              rows={4}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Delete button (not for start nodes) */}
      {node.data.type !== "start" && (
        <div className="p-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => deleteNode(node.id)}
          >
            Delete Node
          </Button>
        </div>
      )}
    </div>
  );
}
