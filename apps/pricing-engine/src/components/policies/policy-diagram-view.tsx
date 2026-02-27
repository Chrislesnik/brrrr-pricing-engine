"use client";

import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  MarkerType,
  type NodeProps,
  Handle,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { Badge } from "@repo/ui/shadcn/badge";
import { cn } from "@repo/lib/cn";
import {
  type OrgPolicyRow,
  type ResourceType,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/constants";
import {
  Shield,
  ShieldX,
  Database,
  FolderArchive,
  Zap,
  Route,
  Users,
  Blocks,
  Radio,
  Lock,
  Globe,
  User,
  Building2,
} from "lucide-react";

// ============================================================================
// Dagre auto-layout
// ============================================================================

function getNodeSize(node: Node): { w: number; h: number } {
  if (node.type === "condition") {
    const label = String(node.data.label ?? "");
    const lines = label.split(" & ").length;
    return { w: 280, h: 36 + lines * 20 };
  }
  if (node.type === "resource-group") {
    const count = (node.data.resources as string[])?.length ?? 1;
    const rows = Math.min(count, 6);
    return { w: 240, h: 52 + rows * 22 };
  }
  if (node.type === "enforcement") {
    return { w: 200, h: 56 };
  }
  if (node.type === "policy") {
    const hasEnforcement = node.data.enforcementLayer != null;
    const hasRoomScope = node.data.roomScopeLevel != null;
    const hasLbPerm = node.data.lbPermission != null;
    const extraLines = (hasEnforcement ? 1 : 0) + (hasRoomScope ? 1 : 0) + (hasLbPerm ? 1 : 0);
    return { w: 220, h: 48 + extraLines * 18 };
  }
  return { w: 200, h: 52 };
}

function layoutElements(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 30, ranksep: 140 });

  for (const node of nodes) {
    const { w, h } = getNodeSize(node);
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const { w, h } = getNodeSize(node);
    return {
      ...node,
      position: { x: pos.x - w / 2, y: pos.y - h / 2 },
    };
  });
}

// ============================================================================
// Custom node components
// ============================================================================

const RESOURCE_ICONS: Record<ResourceType, React.ElementType> = {
  table: Database,
  storage_bucket: FolderArchive,
  feature: Zap,
  route: Route,
  liveblocks: Blocks,
};

const RESOURCE_COLORS: Record<
  ResourceType,
  { border: string; bg: string; text: string }
> = {
  table: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
  },
  storage_bucket: {
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    text: "text-purple-500",
  },
  feature: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  },
  route: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  liveblocks: {
    border: "border-pink-500/40",
    bg: "bg-pink-500/10",
    text: "text-pink-500",
  },
};

const LB_ACTION_LABELS: Record<string, string> = {
  room_write: "room:write",
  room_read: "room:read",
  room_presence_write: "room:presence:write",
  room_private: "no access",
  all: "all",
};

const LB_PERM_DESCRIPTION: Record<string, string> = {
  room_write: "Full access",
  room_read: "Read-only",
  room_presence_write: "Presence only",
  room_private: "Denied",
};

function ResourceGroupNode({ data }: NodeProps) {
  const rType = (data.resourceType as ResourceType) ?? "table";
  const Icon = RESOURCE_ICONS[rType] ?? Database;
  const colors = RESOURCE_COLORS[rType] ?? RESOURCE_COLORS.table;
  const resources = (data.resources as string[]) ?? [];
  const maxShow = 6;
  const overflow = resources.length - maxShow;

  return (
    <div
      className={cn(
        "rounded-lg border-2 px-3 py-2.5 min-w-[200px] max-w-[260px] shadow-sm",
        colors.border,
        colors.bg,
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-muted-foreground/50 !w-2 !h-2"
      />
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4 shrink-0", colors.text)} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {String(data.typeLabel ?? rType).replace("_", " ")}
        </span>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] px-1.5 py-0 tabular-nums"
        >
          {resources.length}
        </Badge>
      </div>
      <div className="space-y-0.5">
        {resources.slice(0, maxShow).map((r) => (
          <div key={r} className="text-xs text-foreground truncate pl-6">
            {r}
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-[10px] text-muted-foreground pl-6">
            +{overflow} more
          </div>
        )}
      </div>
    </div>
  );
}

function PolicyNode({ data }: NodeProps) {
  const isAllow = data.effect === "ALLOW";
  const count = (data.count as number) ?? 1;
  const enforcementLayer = data.enforcementLayer as string | undefined;
  const roomScopeLevel = data.roomScopeLevel as string | undefined;
  const lbPermission = data.lbPermission as string | undefined;
  const action = String(data.action ?? "");
  const isLiveblocks = data.isLiveblocks === true;

  const actionLabel = isLiveblocks
    ? LB_ACTION_LABELS[action] ?? action
    : action;

  return (
    <div
      className={cn(
        "rounded-lg border-2 px-3 py-2 min-w-[180px] shadow-sm",
        isAllow
          ? "border-emerald-500/40 bg-emerald-500/8"
          : "border-red-500/40 bg-red-500/8",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-muted-foreground/50 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground/50 !w-2 !h-2"
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        {isAllow ? (
          <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        ) : (
          <ShieldX className="h-3.5 w-3.5 text-red-500 shrink-0" />
        )}
        <Badge
          className={cn(
            "text-[10px] px-1.5 py-0",
            isAllow
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
          )}
        >
          {String(data.effect ?? "ALLOW")}
        </Badge>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-mono"
        >
          {actionLabel}
        </Badge>
        {count > 1 && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 ml-auto tabular-nums"
          >
            ×{count}
          </Badge>
        )}
      </div>

      {/* Liveblocks enforcement details */}
      {enforcementLayer && (
        <div className="flex items-center gap-1 mt-1.5">
          {enforcementLayer === "Session Auth" ? (
            <Globe className="h-3 w-3 text-sky-500 shrink-0" />
          ) : (
            <Radio className="h-3 w-3 text-violet-500 shrink-0" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {enforcementLayer}
          </span>
        </div>
      )}
      {roomScopeLevel && (
        <div className="flex items-center gap-1 mt-0.5">
          {roomScopeLevel === "user" ? (
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {roomScopeLevel === "user"
              ? "User-scoped rooms"
              : "Org-scoped rooms"}
          </span>
        </div>
      )}
      {lbPermission && (
        <div className="flex items-center gap-1 mt-0.5">
          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground font-mono">
            {lbPermission}
          </span>
        </div>
      )}

      {typeof data.scope === "string" &&
      data.scope !== "all" &&
      !isLiveblocks ? (
        <div className="text-[10px] text-muted-foreground mt-1">
          Scope: {(data.scope as string).replace("_", " ")}
        </div>
      ) : null}
    </div>
  );
}

function ConditionNode({ data }: NodeProps) {
  const label = String(data.label ?? "All users");
  const parts = label.split(" & ");

  return (
    <div className="rounded-lg border-2 border-muted-foreground/20 bg-muted/40 px-4 py-2.5 min-w-[200px] max-w-[320px] shadow-sm">
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground/50 !w-2 !h-2"
      />
      <div className="flex items-start gap-2">
        <Users className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <div className="text-xs text-foreground font-medium leading-relaxed">
          {parts.map((part, i) => (
            <div key={i}>{part}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  "resource-group": ResourceGroupNode,
  policy: PolicyNode,
  condition: ConditionNode,
};

// ============================================================================
// Transform policies -> grouped nodes + edges
// ============================================================================

function summarizeConditions(policy: OrgPolicyRow): string {
  const def = policy.definition_json as {
    conditions?: Array<{
      field?: string;
      operator?: string;
      values?: string[];
    }>;
  } | null;
  const conditions = def?.conditions;
  if (!conditions || conditions.length === 0) return "All users";

  return conditions
    .map((c) => {
      const field = (c.field ?? "")
        .replace("org_role", "Organization Role")
        .replace("member_role", "Member Role")
        .replace("org_type", "Organization Type")
        .replace("internal_user", "Internal User");
      const vals = (c.values ?? []).join(", ");
      return `${field} ${c.operator ?? "is"} ${vals}`;
    })
    .join(" & ");
}

function extractRoomScope(
  policy: OrgPolicyRow,
): { level: string; dealRoleTypeIds: number[] | null } | null {
  const def = policy.definition_json as Record<string, unknown> | null;
  const rs = def?.room_scope as
    | { level: string; deal_role_type_ids?: number[] | null }
    | undefined;
  if (!rs) return null;
  return { level: rs.level, dealRoleTypeIds: rs.deal_role_type_ids ?? null };
}

function lbPermissionLabel(action: string): string {
  switch (action) {
    case "room_write":
      return "Full access";
    case "room_read":
      return "Read-only";
    case "room_presence_write":
      return "Presence only";
    case "room_private":
      return "Denied";
    case "all":
      return "Full access";
    default:
      return action;
  }
}

const TYPE_LABELS: Record<string, string> = {
  table: "Tables",
  storage_bucket: "Storage Buckets",
  feature: "Features",
  route: "Routes",
  liveblocks: "Liveblocks Rooms",
};

type PolicyGroup = {
  condLabel: string;
  effect: string;
  action: string;
  scope: string;
  resourceType: ResourceType;
  resources: string[];
  count: number;
  isLiveblocks: boolean;
  roomScopeLevel: string | null;
  enforcementLayer: string | null;
  lbPermission: string | null;
};

function policiesToFlow(
  policies: OrgPolicyRow[],
): { nodes: Node[]; edges: Edge[] } {
  const activePolicies = policies.filter((p) => p.is_active);

  const groups = new Map<string, PolicyGroup>();

  for (const p of activePolicies) {
    const condLabel = summarizeConditions(p);
    const isLb = p.resource_type === "liveblocks";
    const roomScope = isLb ? extractRoomScope(p) : null;
    const roomScopeLevel = roomScope?.level ?? null;

    let enforcementLayer: string | null = null;
    if (isLb) {
      enforcementLayer = roomScopeLevel
        ? `Room Sync (${roomScopeLevel})`
        : "Session Auth";
    }

    const groupKey = [
      condLabel,
      p.effect,
      p.action,
      p.scope,
      p.resource_type,
      roomScopeLevel ?? "none",
    ].join("||");

    const existing = groups.get(groupKey);
    const rName =
      p.resource_name === "*"
        ? `All ${TYPE_LABELS[p.resource_type]?.toLowerCase() ?? p.resource_type}`
        : p.resource_name;

    if (existing) {
      existing.resources.push(rName);
      existing.count++;
    } else {
      groups.set(groupKey, {
        condLabel,
        effect: p.effect ?? "ALLOW",
        action: p.action,
        scope: p.scope ?? "all",
        resourceType: p.resource_type,
        resources: [rName],
        count: 1,
        isLiveblocks: isLb,
        roomScopeLevel,
        enforcementLayer,
        lbPermission: isLb ? lbPermissionLabel(p.action) : null,
      });
    }
  }

  const conditionIds = new Map<string, string>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let groupIdx = 0;
  for (const [, group] of groups) {
    if (!conditionIds.has(group.condLabel)) {
      const condId = `cond-${conditionIds.size}`;
      conditionIds.set(group.condLabel, condId);
      nodes.push({
        id: condId,
        type: "condition",
        position: { x: 0, y: 0 },
        data: { label: group.condLabel },
      });
    }

    const policyId = `group-policy-${groupIdx}`;
    nodes.push({
      id: policyId,
      type: "policy",
      position: { x: 0, y: 0 },
      data: {
        effect: group.effect,
        action: group.action,
        scope: group.scope,
        count: group.count,
        isLiveblocks: group.isLiveblocks,
        enforcementLayer: group.enforcementLayer,
        roomScopeLevel: group.roomScopeLevel,
        lbPermission: group.lbPermission,
      },
    });

    const resGroupId = `res-group-${groupIdx}`;
    nodes.push({
      id: resGroupId,
      type: "resource-group",
      position: { x: 0, y: 0 },
      data: {
        resourceType: group.resourceType,
        typeLabel: TYPE_LABELS[group.resourceType] ?? group.resourceType,
        resources: group.resources,
      },
    });

    const condId = conditionIds.get(group.condLabel)!;
    const isLb = group.isLiveblocks;

    edges.push({
      id: `e-${condId}-${policyId}`,
      source: condId,
      target: policyId,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: "hsl(var(--muted-foreground))",
        strokeWidth: 1.5,
        opacity: 0.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: "hsl(var(--muted-foreground))",
      },
    });

    const isAllow = group.effect === "ALLOW";
    edges.push({
      id: `e-${policyId}-${resGroupId}`,
      source: policyId,
      target: resGroupId,
      type: "smoothstep",
      animated: isLb,
      style: {
        stroke: isAllow
          ? "hsl(var(--success))"
          : "hsl(var(--danger))",
        strokeWidth: 2,
        opacity: 0.6,
        ...(isLb ? { strokeDasharray: "6 3" } : {}),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: isAllow
          ? "hsl(var(--success))"
          : "hsl(var(--danger))",
      },
    });

    groupIdx++;
  }

  const layouted = layoutElements(nodes, edges);
  return { nodes: layouted, edges };
}

// ============================================================================
// Main component
// ============================================================================

export function PolicyDiagramView({
  policies,
}: {
  policies: OrgPolicyRow[];
}) {
  const { nodes, edges } = useMemo(
    () => policiesToFlow(policies),
    [policies],
  );

  const onInit = useCallback(
    (instance: { fitView: () => void }) => {
      setTimeout(() => instance.fitView(), 50);
    },
    [],
  );

  if (policies.filter((p) => p.is_active).length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
        No active policies to visualize
      </div>
    );
  }

  const hasLiveblocks = policies.some(
    (p) => p.is_active && p.resource_type === "liveblocks",
  );

  return (
    <div className="h-[600px] w-full rounded-lg border bg-background/50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={20} size={1} className="opacity-30" />
        <Controls
          showInteractive={false}
          className="!shadow-sm !border !border-border !rounded-lg"
        />
      </ReactFlow>

      {/* Legend for Liveblocks enforcement layers */}
      {hasLiveblocks && (
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-[10px] space-y-1.5 shadow-sm z-10">
          <div className="font-semibold text-foreground text-[11px] mb-1">
            Liveblocks Enforcement
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="h-3 w-3 text-sky-500 shrink-0" />
            <span>Session Auth — evaluated at connection time via RPC</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Radio className="h-3 w-3 text-violet-500 shrink-0" />
            <span>Room Sync — per-room usersAccesses via sync functions</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span>User-scoped — rooms where user holds a deal role</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span>Org-scoped — rooms where any org member holds a deal role</span>
          </div>
        </div>
      )}
    </div>
  );
}
