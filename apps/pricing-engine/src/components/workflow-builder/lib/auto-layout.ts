import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

const NODE_WIDTH = 192;
const NODE_HEIGHT = 192;

/**
 * Computes a clean left-to-right dagre layout for the given nodes and edges.
 * Placeholder "add" nodes are excluded from layout and returned unchanged.
 */
export function getLayoutedElements<T extends Node>(
  nodes: T[],
  edges: Edge[]
): T[] {
  const realNodes = nodes.filter((n) => n.type !== "add");
  const addNodes = nodes.filter((n) => n.type === "add");

  if (realNodes.length === 0) {
    return nodes;
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 120 });

  for (const node of realNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const realNodeIds = new Set(realNodes.map((n) => n.id));
  for (const edge of edges) {
    if (realNodeIds.has(edge.source) && realNodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const layoutedNodes = realNodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return [...layoutedNodes, ...addNodes];
}
