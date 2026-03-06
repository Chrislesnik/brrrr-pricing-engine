"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Sparkles, Send, Square } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import type { DealAgentUIMessage } from "@/lib/ai/agents/deal-agent";

import { ToolLoadingIndicator } from "./tool-loading-indicator";
import { DealInputsSummary } from "./deal-inputs-summary";
import { PricingArtifactV2 } from "./pricing-artifact-v2";
import { TermSheetResult } from "./term-sheet-result";

// ─── Types ───────────────────────────────────────────────────────────
interface AiDealChatProps {
  dealId: string;
  initialCommand?: string;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────
export function AiDealChat({
  dealId,
  initialCommand,
  onClose,
}: AiDealChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialSent = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/ai-deal",
        body: { dealId },
      }),
    [dealId]
  );

  const { messages, sendMessage, status, stop, error } =
    useChat<DealAgentUIMessage>({
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-send initial command
  useEffect(() => {
    if (initialCommand && !initialSent.current) {
      initialSent.current = true;
      const commandPrompts: Record<string, string> = {
        "get-loan-pricing":
          "Get loan pricing for this deal. First fetch the deal inputs, then generate pricing for all eligible programs.",
        "generate-term-sheet":
          "Help me generate a term sheet for this deal.",
      };
      const text =
        commandPrompts[initialCommand] ??
        `Run command: ${initialCommand}`;
      sendMessage({ text });
    }
  }, [initialCommand, sendMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;
      sendMessage({ text: trimmed });
      setInput("");
    },
    [input, isLoading, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSelectRate = useCallback(
    (programId: string, rate: { interestRate: string | null; loanPrice: string | null; rowIndex: number }) => {
      sendMessage({
        text: `Generate a term sheet for program ${programId} at rate ${rate.interestRate ?? "N/A"} / price ${rate.loanPrice ?? "N/A"} (row ${rate.rowIndex})`,
      });
    },
    [sendMessage]
  );

  return (
    <div className="flex h-full w-[420px] min-w-[420px] flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-[13px] font-medium text-foreground">
            AI Agent
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
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-md bg-primary/10 px-3 py-2 text-[13px] text-foreground">
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{part.text}</span>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {message.role === "assistant" && (
              <div className="space-y-3">
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return part.text ? (
                        <p
                          key={i}
                          className="text-[13px] text-foreground whitespace-pre-wrap"
                        >
                          {part.text}
                        </p>
                      ) : null;

                    case "tool-getDealInputs":
                      switch (part.state) {
                        case "input-streaming":
                        case "input-available":
                          return (
                            <ToolLoadingIndicator
                              key={part.toolCallId}
                              toolName="getDealInputs"
                            />
                          );
                        case "output-available":
                          return (
                            <DealInputsSummary
                              key={part.toolCallId}
                              output={part.output as Record<string, unknown>}
                            />
                          );
                        case "output-error":
                          return (
                            <div
                              key={part.toolCallId}
                              className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[12px] text-destructive"
                            >
                              Error fetching deal inputs:{" "}
                              {part.errorText}
                            </div>
                          );
                      }
                      break;

                    case "tool-generateLoanPricing":
                      switch (part.state) {
                        case "input-streaming":
                        case "input-available":
                          return (
                            <ToolLoadingIndicator
                              key={part.toolCallId}
                              toolName="generateLoanPricing"
                            />
                          );
                        case "output-available":
                          return (
                            <PricingArtifactV2
                              key={part.toolCallId}
                              output={part.output as Record<string, unknown>}
                              dealId={dealId}
                              onSelectRate={handleSelectRate}
                            />
                          );
                        case "output-error":
                          return (
                            <div
                              key={part.toolCallId}
                              className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[12px] text-destructive"
                            >
                              Pricing generation failed:{" "}
                              {part.errorText}
                            </div>
                          );
                      }
                      break;

                    case "tool-generateTermSheet":
                      switch (part.state) {
                        case "input-streaming":
                        case "input-available":
                          return (
                            <ToolLoadingIndicator
                              key={part.toolCallId}
                              toolName="generateTermSheet"
                            />
                          );
                        case "output-available":
                          return (
                            <TermSheetResult
                              key={part.toolCallId}
                              output={part.output as Record<string, unknown>}
                            />
                          );
                        case "output-error":
                          return (
                            <div
                              key={part.toolCallId}
                              className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[12px] text-destructive"
                            >
                              Term sheet generation failed:{" "}
                              {part.errorText}
                            </div>
                          );
                      }
                      break;

                    case "step-start":
                      return (
                        <div
                          key={i}
                          className="border-t border-border/50 my-3"
                        />
                      );

                    default:
                      return null;
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}

        {/* Submitted state */}
        {status === "submitted" && messages.length === 0 && (
          <ToolLoadingIndicator toolName="" />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-[12px] font-medium text-destructive">
              Something went wrong
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {error.message}
            </p>
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
            placeholder="Ask about pricing, inputs, or term sheets..."
            rows={1}
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
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
      </div>
    </div>
  );
}
