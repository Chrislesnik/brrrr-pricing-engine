import type { Edge, EdgeChange, Node, NodeChange } from "@xyflow/react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { atom } from "jotai";

export type AgentNodeType = "start" | "agent" | "end" | "note";

export type AgentNodeData = {
  label: string;
  description?: string;
  type: AgentNodeType;
  config?: Record<string, unknown>;
  status?: "idle" | "running" | "success" | "error";
};

export type AgentNode = Node<AgentNodeData>;
export type AgentEdge = Edge;

export const agentNodesAtom = atom<AgentNode[]>([]);
export const agentEdgesAtom = atom<AgentEdge[]>([]);
export const selectedAgentNodeAtom = atom<string | null>(null);
export const selectedAgentEdgeAtom = atom<string | null>(null);
export const currentAgentIdAtom = atom<string | null>(null);
export const currentAgentNameAtom = atom<string>("");
export const currentAgentTypeAtom = atom<string>("extraction");
export const isSavingAgentAtom = atom(false);
export const hasUnsavedAgentChangesAtom = atom(false);
export const agentNotFoundAtom = atom(false);

export const onAgentNodesChangeAtom = atom(
  null,
  (get, set, changes: NodeChange[]) => {
    const currentNodes = get(agentNodesAtom);

    // Prevent deletion of start nodes
    const filteredChanges = changes.filter((change) => {
      if (change.type === "remove") {
        const node = currentNodes.find((n) => n.id === change.id);
        return node?.data.type !== "start";
      }
      return true;
    });

    const newNodes = applyNodeChanges(filteredChanges, currentNodes) as AgentNode[];
    set(agentNodesAtom, newNodes);

    const selectedNode = newNodes.find((n) => n.selected);
    if (selectedNode) {
      set(selectedAgentNodeAtom, selectedNode.id);
      set(selectedAgentEdgeAtom, null);
    } else if (get(selectedAgentNodeAtom)) {
      const current = get(selectedAgentNodeAtom);
      if (!newNodes.find((n) => n.id === current)) {
        set(selectedAgentNodeAtom, null);
      }
    }

    const hadStructural = filteredChanges.some(
      (c) => c.type === "remove" || (c.type === "position" && c.dragging === false)
    );
    if (hadStructural) set(hasUnsavedAgentChangesAtom, true);
  }
);

export const onAgentEdgesChangeAtom = atom(
  null,
  (get, set, changes: EdgeChange[]) => {
    const currentEdges = get(agentEdgesAtom);
    const newEdges = applyEdgeChanges(changes, currentEdges) as AgentEdge[];
    set(agentEdgesAtom, newEdges);

    const selectedEdge = newEdges.find((e) => e.selected);
    if (selectedEdge) {
      set(selectedAgentEdgeAtom, selectedEdge.id);
      set(selectedAgentNodeAtom, null);
    } else if (get(selectedAgentEdgeAtom)) {
      const current = get(selectedAgentEdgeAtom);
      if (!newEdges.find((e) => e.id === current)) {
        set(selectedAgentEdgeAtom, null);
      }
    }

    if (changes.some((c) => c.type === "remove")) {
      set(hasUnsavedAgentChangesAtom, true);
    }
  }
);

export const addAgentNodeAtom = atom(null, (get, set, node: AgentNode) => {
  const currentNodes = get(agentNodesAtom);
  const updatedNodes = currentNodes.map((n) => ({ ...n, selected: false }));
  set(agentNodesAtom, [...updatedNodes, { ...node, selected: true }]);
  set(selectedAgentNodeAtom, node.id);
  set(hasUnsavedAgentChangesAtom, true);
});

export const updateAgentNodeDataAtom = atom(
  null,
  (get, set, { id, data }: { id: string; data: Partial<AgentNodeData> }) => {
    const nodes = get(agentNodesAtom);
    set(
      agentNodesAtom,
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
    );
    if (!data.status) set(hasUnsavedAgentChangesAtom, true);
  }
);

export const deleteAgentNodeAtom = atom(null, (get, set, nodeId: string) => {
  const nodes = get(agentNodesAtom);
  const node = nodes.find((n) => n.id === nodeId);
  if (node?.data.type === "start") return;

  const edges = get(agentEdgesAtom);
  set(agentNodesAtom, nodes.filter((n) => n.id !== nodeId));
  set(agentEdgesAtom, edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
  if (get(selectedAgentNodeAtom) === nodeId) set(selectedAgentNodeAtom, null);
  set(hasUnsavedAgentChangesAtom, true);
});
