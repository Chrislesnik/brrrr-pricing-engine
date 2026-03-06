"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Composer } from "@liveblocks/react-ui";
import { useSelf, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { Sparkles, Slash } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { ChatSlashCommands } from "./chat-slash-commands";
import { ChatAiToolbar } from "./chat-ai-toolbar";

// ─── Constants ───────────────────────────────────────────────────────
const COMPOSER_OVERRIDES = {
  COMPOSER_PLACEHOLDER: "Write a message... (type / for commands)",
} as const;

// ─── Types ───────────────────────────────────────────────────────────
interface ComposerWithAiProps {
  dealId: string;
  onTriggerAiCommand?: (commandId: string) => void;
  onAgentMention?: (content: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────
export function ComposerWithAi({
  dealId,
  onTriggerAiCommand,
  onAgentMention,
}: ComposerWithAiProps) {
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [showAiToolbar, setShowAiToolbar] = useState(false);
  const [slashPosition, setSlashPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [aiToolbarPosition, setAiToolbarPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const updatePresence = useUpdateMyPresence();
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track typing presence
  const handleComposerInput = useCallback(() => {
    updatePresence({ isTyping: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      updatePresence({ isTyping: false });
    }, 2000);
  }, [updatePresence]);

  // Intercept "/" key in Slate editor
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Get the editor element
        const editor = el.querySelector<HTMLElement>(
          '[data-slate-editor="true"]'
        );
        if (!editor) return;

        // Check if the editor is empty or cursor is at start
        const text = editor.textContent?.trim() ?? "";
        if (text === "" || text === "\u200B") {
          // Position the slash commands dropdown
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSlashPosition({
              top: rect.bottom + 4,
              left: rect.left,
            });
            // Don't prevent default — let the "/" be typed
            // We'll clear it on command selection
            requestAnimationFrame(() => setShowSlashCommands(true));
          }
        }
      }

      // Escape closes dropdowns
      if (e.key === "Escape") {
        setShowSlashCommands(false);
        setShowAiToolbar(false);
      }
    };

    el.addEventListener("keydown", handleKeyDown, true);
    // Track input for typing indicator
    el.addEventListener("input", handleComposerInput, true);

    return () => {
      el.removeEventListener("keydown", handleKeyDown, true);
      el.removeEventListener("input", handleComposerInput, true);
    };
  }, [handleComposerInput]);

  // Toggle AI toolbar
  const handleToggleAiToolbar = useCallback(() => {
    if (showAiToolbar) {
      setShowAiToolbar(false);
      return;
    }

    const btn = aiButtonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setAiToolbarPosition({
        top: rect.top - 8,
        left: rect.left,
      });
    }
    setShowSlashCommands(false);
    setShowAiToolbar(true);
  }, [showAiToolbar]);

  // Handle slash command selection
  const handleSlashCommand = useCallback(
    (commandId: string) => {
      setShowSlashCommands(false);

      // Clear the "/" from the editor
      const editor = composerRef.current?.querySelector<HTMLElement>(
        '[data-slate-editor="true"]'
      );
      if (editor) {
        // Remove the "/" character
        const text = editor.textContent ?? "";
        if (text.endsWith("/")) {
          // Find the text node and remove the last character
          const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null
          );
          let lastTextNode: Text | null = null;
          while (walker.nextNode()) {
            lastTextNode = walker.currentNode as Text;
          }
          if (lastTextNode && lastTextNode.data.endsWith("/")) {
            lastTextNode.data = lastTextNode.data.slice(0, -1);
            editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
          }
        }
      }

      // Agent commands — open the AI Deal Chat panel
      if (commandId === "get-loan-pricing" || commandId === "generate-term-sheet") {
        onTriggerAiCommand?.(commandId);
        return;
      }

      // AI toolbar commands — open the inline AI toolbar
      if (
        commandId === "ask-ai" ||
        commandId === "summarize" ||
        commandId === "draft-response" ||
        commandId === "translate"
      ) {
        handleToggleAiToolbar();
        return;
      }

      // Mention command — focus composer for @mention
      if (commandId === "mention") {
        const editorEl = composerRef.current?.querySelector<HTMLElement>(
          '[data-slate-editor="true"]'
        );
        if (editorEl) {
          editorEl.focus();
          // Insert @ to trigger Liveblocks mention suggestions
          document.execCommand("insertText", false, "@");
        }
        return;
      }

      // Share deal link — copy to clipboard
      if (commandId === "share-link") {
        const url = `${window.location.origin}/messages?channel=deal:${dealId}`;
        navigator.clipboard.writeText(url);
      }
    },
    [handleToggleAiToolbar, onTriggerAiCommand, dealId]
  );

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      {/* Composer wrapper */}
      <div ref={composerRef} className="relative">
        <Composer overrides={COMPOSER_OVERRIDES} />
      </div>

      {/* Toolbar row below composer */}
      <div className="flex items-center gap-1 pt-1.5">
        <button
          onClick={() => {
            const editor = composerRef.current?.querySelector<HTMLElement>(
              '[data-slate-editor="true"]'
            );
            if (editor) {
              const rect = editor.getBoundingClientRect();
              setSlashPosition({ top: rect.top - 8, left: rect.left });
              setShowSlashCommands(true);
            }
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground bg-muted/40 transition-colors"
        >
          <Slash className="h-3 w-3" />
          Commands
        </button>

        <Button
          ref={aiButtonRef}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-info"
          onClick={handleToggleAiToolbar}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Slash Commands Dropdown */}
      {showSlashCommands && slashPosition && (
        <ChatSlashCommands
          position={slashPosition}
          onSelect={handleSlashCommand}
          onClose={() => setShowSlashCommands(false)}
          dealId={dealId}
        />
      )}

      {/* AI Toolbar Dropdown */}
      {showAiToolbar && aiToolbarPosition && (
        <ChatAiToolbar
          position={aiToolbarPosition}
          onClose={() => setShowAiToolbar(false)}
          dealId={dealId}
        />
      )}
    </div>
  );
}
