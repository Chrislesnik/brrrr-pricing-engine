"use client";

import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { ArrowLeft, Save, Play, Loader2, Bot, Flag, StickyNote, PlayCircle } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Separator } from "@repo/ui/shadcn/separator";
import {
  currentAgentNameAtom,
  isSavingAgentAtom,
  hasUnsavedAgentChangesAtom,
} from "./lib/agent-store";
import type { AgentNodeType } from "./lib/agent-store";
import type { DragEvent } from "react";

const NODE_PALETTE: { type: AgentNodeType; label: string; icon: typeof Bot }[] = [
  { type: "agent", label: "Agent", icon: Bot },
  { type: "end", label: "End", icon: Flag },
  { type: "note", label: "Note", icon: StickyNote },
];

export function AgentToolbar({
  onSave,
  onRun,
}: {
  onSave: () => void;
  onRun?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useAtom(currentAgentNameAtom);
  const [isSaving] = useAtom(isSavingAgentAtom);
  const [hasUnsaved] = useAtom(hasUnsavedAgentChangesAtom);

  const onDragStart = (event: DragEvent, nodeType: AgentNodeType) => {
    event.dataTransfer.setData("application/agentnode", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-2 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 w-48 text-sm font-medium border-none shadow-none focus-visible:ring-0 px-1"
          placeholder="Agent name..."
        />
        {hasUnsaved && (
          <span className="text-xs text-muted-foreground">Unsaved</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Drag-to-add node palette */}
        <div className="flex items-center gap-1 mr-2">
          {NODE_PALETTE.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                className="flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs cursor-grab hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {onRun && (
          <Button variant="outline" size="sm" onClick={onRun}>
            <PlayCircle className="h-4 w-4 mr-1" />
            Run
          </Button>
        )}
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
