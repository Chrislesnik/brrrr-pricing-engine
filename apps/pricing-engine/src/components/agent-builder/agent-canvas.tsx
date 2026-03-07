"use client";

import { useCallback, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type OnConnect,
  addEdge,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAtom, useSetAtom } from "jotai";
import { nanoid } from "nanoid";
import {
  agentNodesAtom,
  agentEdgesAtom,
  onAgentNodesChangeAtom,
  onAgentEdgesChangeAtom,
  addAgentNodeAtom,
  hasUnsavedAgentChangesAtom,
  type AgentNode,
  type AgentNodeType,
} from "./lib/agent-store";
import { StartNode } from "./nodes/start-node";
import { AgentLLMNode } from "./nodes/agent-node";
import { EndNode } from "./nodes/end-node";
import { NoteNode } from "./nodes/note-node";

const nodeTypes: NodeTypes = {
  start: StartNode as any,
  agent: AgentLLMNode as any,
  end: EndNode as any,
  note: NoteNode as any,
};

export function AgentCanvas() {
  const [nodes] = useAtom(agentNodesAtom);
  const [edges, setEdges] = useAtom(agentEdgesAtom);
  const onNodesChange = useSetAtom(onAgentNodesChangeAtom);
  const onEdgesChange = useSetAtom(onAgentEdgesChangeAtom);
  const addNode = useSetAtom(addAgentNodeAtom);
  const setUnsaved = useSetAtom(hasUnsavedAgentChangesAtom);

  const onConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
      setUnsaved(true);
    },
    [setEdges, setUnsaved]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/agentnode") as AgentNodeType;
      if (!type) return;

      const reactFlowBounds = (event.target as HTMLElement)
        .closest(".react-flow")
        ?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 80,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const defaults: Record<string, Partial<AgentNode["data"]>> = {
        start: { label: "Start", type: "start" },
        agent: { label: "Agent", type: "agent", config: { model: "gpt-4.1-mini", systemPrompt: "", temperature: 0 } },
        end: { label: "End", type: "end" },
        note: { label: "", type: "note" },
      };

      addNode({
        id: nanoid(),
        type,
        position,
        data: { ...defaults[type], status: "idle" } as any,
      });
    },
    [addNode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      onDragOver={onDragOver}
      onDrop={onDrop}
      connectionMode={ConnectionMode.Loose}
      fitView
      deleteKeyCode={["Backspace", "Delete"]}
      className="bg-muted/30"
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
