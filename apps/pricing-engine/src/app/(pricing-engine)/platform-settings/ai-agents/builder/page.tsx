"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Provider as JotaiProvider, useAtom, useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { AgentCanvas } from "@/components/agent-builder/agent-canvas";
import { AgentToolbar } from "@/components/agent-builder/agent-toolbar";
import { AgentConfigPanel } from "@/components/agent-builder/agent-config-panel";
import {
  agentNodesAtom,
  agentEdgesAtom,
  currentAgentIdAtom,
  currentAgentNameAtom,
  currentAgentTypeAtom,
  selectedAgentNodeAtom,
  isSavingAgentAtom,
  hasUnsavedAgentChangesAtom,
  agentNotFoundAtom,
  type AgentNode,
  type AgentEdge,
} from "@/components/agent-builder/lib/agent-store";

function AgentBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = searchParams.get("agent");

  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useAtom(agentNodesAtom);
  const [edges, setEdges] = useAtom(agentEdgesAtom);
  const [, setCurrentId] = useAtom(currentAgentIdAtom);
  const [currentName, setCurrentName] = useAtom(currentAgentNameAtom);
  const [, setCurrentType] = useAtom(currentAgentTypeAtom);
  const [selectedNode] = useAtom(selectedAgentNodeAtom);
  const setSaving = useSetAtom(isSavingAgentAtom);
  const setUnsaved = useSetAtom(hasUnsavedAgentChangesAtom);
  const [notFound, setNotFound] = useAtom(agentNotFoundAtom);

  // Load agent
  useEffect(() => {
    if (!agentId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/ai-agents`);
        if (!res.ok) throw new Error("Failed to load agents");
        const data = await res.json();
        const agent = (data.agents ?? []).find((a: any) => a.id === agentId);

        if (!agent) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCurrentId(agent.id);
        setCurrentName(agent.name);
        setCurrentType(agent.agent_type);

        const graphData = agent.graph_data as { nodes?: AgentNode[]; edges?: AgentEdge[] } | null;

        if (graphData?.nodes?.length) {
          setNodes(graphData.nodes);
          setEdges(graphData.edges ?? []);
        } else {
          // Default: start node
          setNodes([
            {
              id: nanoid(),
              type: "start",
              position: { x: 250, y: 50 },
              data: { label: "Start", type: "start", status: "idle" },
            },
          ]);
          setEdges([]);
        }

        setUnsaved(false);
      } catch (err) {
        console.error("Failed to load agent:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [agentId, setCurrentId, setCurrentName, setCurrentType, setNodes, setEdges, setUnsaved, setNotFound]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!agentId) return;
    setSaving(true);
    try {
      await fetch("/api/ai-agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agentId,
          name: currentName || "Agent",
          graph_data: { nodes, edges },
        }),
      });
      setUnsaved(false);
    } catch (err) {
      console.error("Failed to save agent:", err);
    } finally {
      setSaving(false);
    }
  }, [agentId, currentName, nodes, edges, setSaving, setUnsaved]);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium">Agent not found</p>
          <button
            className="text-sm text-primary mt-2 hover:underline"
            onClick={() => router.back()}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AgentToolbar onSave={handleSave} />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1">
          <AgentCanvas />
        </div>
        {selectedNode && <AgentConfigPanel />}
      </div>
    </div>
  );
}

export default function AgentBuilderPage() {
  return (
    <JotaiProvider>
      <ReactFlowProvider>
        <AgentBuilderContent />
      </ReactFlowProvider>
    </JotaiProvider>
  );
}
