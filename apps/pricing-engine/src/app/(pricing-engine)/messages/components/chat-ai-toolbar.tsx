"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  FileText,
  MessageCircle,
  DollarSign,
  Wand2,
  Send,
  Check,
  X,
  Loader2,
  Copy,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

// ─── Types ───────────────────────────────────────────────────────────
type ToolbarView = "menu" | "prompt" | "result";

interface ChatAiToolbarProps {
  position: { top: number; left: number };
  onClose: () => void;
  dealId: string;
}

interface AiAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  promptRequired: boolean;
}

// ─── AI Actions ──────────────────────────────────────────────────────
const AI_ACTIONS: AiAction[] = [
  {
    id: "summarize",
    title: "Summarize Conversation",
    description: "Get a summary of recent messages",
    icon: <FileText className="h-4 w-4" />,
    promptRequired: false,
  },
  {
    id: "draft",
    title: "Draft a Message",
    description: "AI drafts a message for you",
    icon: <Wand2 className="h-4 w-4" />,
    promptRequired: true,
  },
  {
    id: "explain",
    title: "Explain this Deal",
    description: "Get an overview of deal details",
    icon: <MessageCircle className="h-4 w-4" />,
    promptRequired: false,
  },
  {
    id: "pricing",
    title: "Get Loan Pricing",
    description: "Pull inputs and generate pricing",
    icon: <DollarSign className="h-4 w-4" />,
    promptRequired: false,
  },
  {
    id: "custom",
    title: "Custom Prompt",
    description: "Ask AI anything about this deal",
    icon: <Sparkles className="h-4 w-4" />,
    promptRequired: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

// ─── Component ───────────────────────────────────────────────────────
export function ChatAiToolbar({
  position,
  onClose,
  dealId,
}: ChatAiToolbarProps) {
  const [view, setView] = useState<ToolbarView>("menu");
  const [selectedAction, setSelectedAction] = useState<AiAction | null>(null);
  const [prompt, setPrompt] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/ai-comment",
        body: { dealId, postToChat: false },
      }),
    [dealId]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Extract the last assistant response text
  const lastAssistantMsg = messages.findLast((m) => m.role === "assistant");
  const result = lastAssistantMsg
    ? getMessageText(
        lastAssistantMsg.parts as Array<{ type: string; text?: string }>
      )
    : "";

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Focus prompt input when switching to prompt view
  useEffect(() => {
    if (view === "prompt") {
      requestAnimationFrame(() => promptInputRef.current?.focus());
    }
  }, [view]);

  // Execute AI action via useChat
  const executeAiAction = useCallback(
    (actionId: string, customPrompt: string) => {
      setView("result");
      setPostError(null);

      const text = customPrompt || `Action: ${actionId}`;
      sendMessage(
        { text },
        { body: { action: actionId, prompt: customPrompt } }
      );
    },
    [sendMessage]
  );

  // Handle action selection
  const handleSelectAction = useCallback(
    (action: AiAction) => {
      setSelectedAction(action);
      setPostError(null);

      if (action.promptRequired) {
        setView("prompt");
        return;
      }

      executeAiAction(action.id, "");
    },
    [executeAiAction]
  );

  // Handle prompt submit
  const handlePromptSubmit = useCallback(() => {
    if (!selectedAction || !prompt.trim()) return;
    executeAiAction(selectedAction.id, prompt.trim());
  }, [selectedAction, prompt, executeAiAction]);

  // Post result to chat as a Liveblocks comment
  const handlePostToChat = useCallback(async () => {
    if (!result) return;

    try {
      await fetch("/api/chat/ai-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          roomId: `deal_chat:${dealId}`,
          content: result,
          postToChat: true,
        }),
      });
      onClose();
    } catch {
      setPostError("Failed to post to chat.");
    }
  }, [result, dealId, onClose]);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result);
  }, [result]);

  // Position the dropdown above the trigger
  const style: React.CSSProperties = {
    position: "fixed",
    bottom: `${window.innerHeight - position.top}px`,
    left: `${Math.max(16, Math.min(position.left, window.innerWidth - 340))}px`,
    zIndex: 9999,
  };

  const displayError = postError || (error ? error.message : null);

  return createPortal(
    <div
      ref={containerRef}
      style={style}
      className="w-[320px] rounded-lg border border-border bg-popover shadow-lg"
    >
      {/* Menu View */}
      {view === "menu" && (
        <div className="p-1 max-h-[380px] overflow-y-auto">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            AI Actions
          </div>
          {AI_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleSelectAction(action)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span className="text-muted-foreground shrink-0">
                {action.icon}
              </span>
              <div className="flex-1 text-left">
                <div className="text-[13px] font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Prompt View */}
      {view === "prompt" && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {selectedAction?.icon}
            <span>{selectedAction?.title}</span>
          </div>
          <textarea
            ref={promptInputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePromptSubmit();
              }
            }}
            placeholder="Type your prompt..."
            className="w-full min-h-[80px] resize-none rounded-md border border-border bg-muted/30 p-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setView("menu");
                setPrompt("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePromptSubmit}
              disabled={!prompt.trim()}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      )}

      {/* Result View */}
      {view === "result" && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {selectedAction?.icon}
            <span>{selectedAction?.title}</span>
          </div>

          {/* Response area */}
          <div className="max-h-[200px] overflow-y-auto rounded-md bg-muted/20 p-3 text-sm">
            {status === "submitted" && !result ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            ) : displayError ? (
              <p className="text-destructive">{displayError}</p>
            ) : (
              <p className="whitespace-pre-wrap text-foreground">
                {result}
                {status === "streaming" && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/60 animate-pulse" />
                )}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {!isLoading && result && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="mr-1 h-3 w-3" />
                Discard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
              <Button size="sm" onClick={handlePostToChat}>
                <Check className="mr-1 h-3 w-3" />
                Post to Chat
              </Button>
            </div>
          )}

          {/* Error retry */}
          {displayError && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedAction)
                    executeAiAction(selectedAction.id, prompt);
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
