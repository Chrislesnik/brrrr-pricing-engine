"use client";

import { useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command";
import {
  Sparkles,
  DollarSign,
  FileText,
  Hash,
  MessageCircle,
  Wand2,
  AtSign,
  Link2,
  Command,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface MessageCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerAiCommand?: (commandId: string) => void;
  onToggleAiPanel?: () => void;
  onSelectChannel?: (dealId: string) => void;
  channels?: Array<{ id: string; display_name: string }>;
  selectedDealId?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────
export function MessageCommandPalette({
  open,
  onOpenChange,
  onTriggerAiCommand,
  onToggleAiPanel,
  onSelectChannel,
  channels = [],
  selectedDealId,
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
        case "summarize":
        case "draft-response":
        case "ask-ai":
          // Open AI panel for these actions
          onToggleAiPanel?.();
          break;
        case "mention-agent":
          // Focus composer and insert @agent mention
          requestAnimationFrame(() => {
            const composer = document.querySelector<HTMLElement>(
              '[data-slate-editor="true"], [role="textbox"][contenteditable="true"]'
            );
            composer?.focus();
          });
          break;
        case "copy-deal-link":
          if (selectedDealId) {
            const url = `${window.location.origin}/messages?channel=deal:${selectedDealId}`;
            navigator.clipboard.writeText(url);
          }
          break;
        case "focus-composer":
          requestAnimationFrame(() => {
            const composer = document.querySelector<HTMLElement>(
              '[data-slate-editor="true"], [role="textbox"][contenteditable="true"], .lb-composer textarea'
            );
            composer?.focus();
          });
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
    [onOpenChange, onTriggerAiCommand, onToggleAiPanel, onSelectChannel, selectedDealId]
  );

  const hasChannel = !!selectedDealId;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands and channels..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem value="focus-composer" onSelect={handleSelect}>
            <Command className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Focus composer</span>
            <kbd className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
              ⌘/
            </kbd>
          </CommandItem>
          <CommandItem
            value="ai-panel"
            onSelect={handleSelect}
            disabled={!hasChannel}
          >
            <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Toggle AI panel</span>
            <kbd className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
              ⌘⇧A
            </kbd>
          </CommandItem>
          {hasChannel && (
            <CommandItem value="copy-deal-link" onSelect={handleSelect}>
              <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Copy channel link</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* AI & Loan Commands (only when a channel is selected) */}
        {hasChannel && (
          <>
            <CommandGroup heading="AI & Loan">
              <CommandItem value="get-loan-pricing" onSelect={handleSelect}>
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Get loan pricing</span>
              </CommandItem>
              <CommandItem value="generate-term-sheet" onSelect={handleSelect}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Generate term sheet</span>
              </CommandItem>
              <CommandItem value="summarize" onSelect={handleSelect}>
                <MessageCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Summarize conversation</span>
              </CommandItem>
              <CommandItem value="draft-response" onSelect={handleSelect}>
                <Wand2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Draft a response</span>
              </CommandItem>
              <CommandItem value="ask-ai" onSelect={handleSelect}>
                <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Ask AI about this deal</span>
              </CommandItem>
              <CommandItem value="mention-agent" onSelect={handleSelect}>
                <AtSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Mention @agent in chat</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />
          </>
        )}

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
                {ch.id === selectedDealId && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    current
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
