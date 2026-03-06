"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Copy,
  Square,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { cn } from "@repo/lib/cn";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

// ─── Types ───────────────────────────────────────────────────────────
interface PrivateAiPanelProps {
  dealId: string;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Component ───────────────────────────────────────────────────────
export function PrivateAiPanel({ dealId, onClose }: PrivateAiPanelProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [messageTimestamps, setMessageTimestamps] = useState<
    Record<string, Date>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/ai-private",
        body: { dealId },
      }),
    [dealId]
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Track message timestamps
  useEffect(() => {
    setMessageTimestamps((prev) => {
      const next = { ...prev };
      for (const msg of messages) {
        if (!next[msg.id]) {
          next[msg.id] = new Date();
        }
      }
      return next;
    });
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      setLastUserMessage(trimmed);
      sendMessage({ text: trimmed });
      setInput("");
    },
    [input, isLoading, sendMessage]
  );

  const handleRetry = useCallback(() => {
    if (!lastUserMessage || isLoading) return;
    sendMessage({ text: lastUserMessage });
  }, [lastUserMessage, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleCopyToClipboard = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="flex h-full w-[380px] min-w-[380px] flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-info" />
          <h3 className="text-sm font-semibold text-foreground">
            AI Assistant
          </h3>
          <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
            Private
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Ask me anything about this deal.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Your conversation is private and not visible to others.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const text = getMessageText(
            msg.parts as Array<{ type: string; text?: string }>
          );
          if (!text && msg.role !== "user") return null;

          const isUser = msg.role === "user";
          const ts = messageTimestamps[msg.id];
          const msgTime = ts ? formatTime(ts) : null;

          return (
            <div key={msg.id} className="space-y-1">
              {/* Timestamp */}
              {msgTime && (
                <div
                  className={cn(
                    "text-[10px] text-muted-foreground/50 px-1",
                    isUser ? "text-right" : "text-left"
                  )}
                >
                  {msgTime}
                </div>
              )}

              <div
                className={cn(
                  "flex",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative group max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/40 text-foreground rounded-bl-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap">{text}</p>
                  {!isUser && text && (
                    <button
                      onClick={() => handleCopyToClipboard(text, msg.id)}
                      className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator (submitted but no content yet) */}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted/40 px-3 py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {error && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-destructive/10 px-3 py-2 space-y-2">
              <p className="text-sm text-destructive">
                {error.message || "Something went wrong. Please try again."}
              </p>
              {lastUserMessage && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this deal..."
            rows={1}
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            style={{ maxHeight: "120px" }}
          />
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 bottom-1.5 h-7 w-7"
              onClick={stop}
              aria-label="Stop generation"
            >
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 bottom-1.5 h-7 w-7"
              disabled={!input.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </form>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <span className="text-[10px] text-muted-foreground/50">
            Shift+Enter for new line
          </span>
          {isLoading && status === "streaming" && (
            <span className="text-[10px] text-muted-foreground/50 animate-pulse">
              streaming...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
