"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Sparkles,
  ShieldCheck,
  GitBranch,
  Scale,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import { Switch } from "@/components/ui/switch";
import { AIAgentConfigSheet } from "./ai-agent-config-sheet";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  model: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
}

const AGENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Bot; className: string }> = {
  extraction: { label: "Extraction", icon: Sparkles, className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  validation: { label: "Validation", icon: ShieldCheck, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cross_reference: { label: "Cross-Reference", icon: GitBranch, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  decision: { label: "Decision", icon: Scale, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export function AIAgentsSettings() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents ?? []);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleCreate = () => {
    setEditingAgentId(null);
    setSheetOpen(true);
  };

  const handleEdit = (agentId: string) => {
    setEditingAgentId(agentId);
    setSheetOpen(true);
  };

  const handleToggleActive = async (agent: Agent) => {
    await fetch("/api/ai-agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agent.id, is_active: !agent.is_active }),
    });
    await fetchAgents();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch("/api/ai-agents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchAgents();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Agents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage AI agents for document analysis and underwriting.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-medium mb-1">No agents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first AI agent to automate document extraction and underwriting decisions.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => {
            const typeConfig = AGENT_TYPE_CONFIG[agent.agent_type] ?? {
              label: agent.agent_type,
              icon: Bot,
              className: "bg-muted text-muted-foreground",
            };
            const TypeIcon = typeConfig.icon;
            const cfg = (agent.config ?? {}) as Record<string, unknown>;
            const toolCount = Array.isArray(cfg.enabled_tools)
              ? (cfg.enabled_tools as string[]).length
              : 0;

            return (
              <div
                key={agent.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                  !agent.is_active && "opacity-50"
                )}
                onClick={() => handleEdit(agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{agent.name}</p>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] shrink-0", typeConfig.className)}
                        >
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                      </div>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {agent.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {agent.model}
                        </span>
                        {toolCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            &middot; {toolCount} tool{toolCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={agent.is_active}
                      onCheckedChange={() => handleToggleActive(agent)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(agent.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deletingId === agent.id}
                    >
                      {deletingId === agent.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent Config Sheet */}
      <AIAgentConfigSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        agentId={editingAgentId}
        onSaved={fetchAgents}
      />
    </div>
  );
}
