"use client";

import { useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";
import {
  Sparkles,
  DollarSign,
  FileText,
  MessageSquare,
  Hash,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface MessageCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerAiCommand?: (commandId: string) => void;
  onToggleAiPanel?: () => void;
  onSelectChannel?: (dealId: string) => void;
  channels?: Array<{ id: string; display_name: string }>;
}

// ─── Component ───────────────────────────────────────────────────────
export function MessageCommandPalette({
  open,
  onOpenChange,
  onTriggerAiCommand,
  onToggleAiPanel,
  onSelectChannel,
  channels = [],
}: MessageCommandPaletteProps) {
  const handleSelect = useCallback(
    (value: string) => {
      onOpenChange(false);

      switch (value) {
        case "ai-panel":
          onToggleAiPanel?.();
          break;
        case "get-loan-pricing":
        case "generate-term-sheet":
          onTriggerAiCommand?.(value);
          break;
        default:
          // Check if it's a channel selection
          if (value.startsWith("channel:")) {
            const dealId = value.slice(8);
            onSelectChannel?.(dealId);
          }
          break;
      }
    },
    [onOpenChange, onTriggerAiCommand, onToggleAiPanel, onSelectChannel]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands and channels..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem value="ai-panel" onSelect={handleSelect}>
            <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Open AI panel</span>
            <kbd className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
              ⌘⇧A
            </kbd>
          </CommandItem>
          <CommandItem value="get-loan-pricing" onSelect={handleSelect}>
            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Get loan pricing</span>
          </CommandItem>
          <CommandItem value="generate-term-sheet" onSelect={handleSelect}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Generate term sheet</span>
          </CommandItem>
        </CommandGroup>

        {/* Channels */}
        {channels.length > 0 && (
          <CommandGroup heading="Switch channel">
            {channels.map((ch) => (
              <CommandItem
                key={ch.id}
                value={`channel:${ch.id} ${ch.display_name}`}
                onSelect={() => {
                  onOpenChange(false);
                  onSelectChannel?.(ch.id);
                }}
              >
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{ch.display_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
