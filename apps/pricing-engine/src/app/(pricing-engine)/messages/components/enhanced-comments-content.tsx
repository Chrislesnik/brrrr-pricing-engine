"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useThreads, useOthers } from "@liveblocks/react/suspense";
import { Thread, Comment, Composer } from "@liveblocks/react-ui";
import {
  MessageSquare,
  MessageCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import type { ThreadData } from "@liveblocks/client";
import { ComposerWithAi } from "./composer-with-ai";
import { TypingIndicator } from "./typing-indicator";

// ─── Constants ───────────────────────────────────────────────────────
const COMPOSER_OVERRIDES = {
  COMPOSER_PLACEHOLDER: "Write a message...",
} as const;

// ─── useEnableSubmitWithAttachments ──────────────────────────────────
// Replicates the hook from comments-panel.tsx for attachment-only submits
function useEnableSubmitWithAttachments(
  containerRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const hasComposerAttachments = (form: HTMLElement): boolean => {
      return (
        form.querySelector(
          ".lb-composer-attachment, .lb-composer-attachments, .lb-attachments"
        ) !== null
      );
    };

    const enableButtons = () => {
      el.querySelectorAll<HTMLElement>(
        "form.lb-composer-form, .lb-composer"
      ).forEach((form) => {
        if (!hasComposerAttachments(form)) return;
        form
          .querySelectorAll<HTMLButtonElement>('button[type="submit"]')
          .forEach((btn) => {
            if (btn.disabled) {
              btn.disabled = false;
              btn.removeAttribute("disabled");
            }
          });
      });
    };

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>('button[type="submit"]');
      if (!btn) return;

      const form = btn.closest<HTMLFormElement>("form");
      if (!form) return;
      if (!hasComposerAttachments(form)) return;

      const editable = form.querySelector<HTMLElement>(
        '[data-slate-editor="true"], [role="textbox"][contenteditable="true"]'
      );
      if (editable && editable.textContent?.trim() === "") {
        const textNode = document.createTextNode("\u200B");
        const firstChild = editable.querySelector("p, span, [data-slate-node]");
        if (firstChild) {
          firstChild.appendChild(textNode);
        } else {
          editable.appendChild(textNode);
        }

        editable.dispatchEvent(new InputEvent("input", { bubbles: true }));
        btn.disabled = false;
        btn.removeAttribute("disabled");

        requestAnimationFrame(() => {
          btn.disabled = false;
          try {
            form.requestSubmit(btn);
          } catch {
            btn.click();
          }
        });
      }
    };

    const hideEmptyBodies = () => {
      el.querySelectorAll<HTMLElement>(".lb-comment-body").forEach((body) => {
        const text = body.textContent
          ?.replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
          .trim();
        if (!text) {
          body.style.display = "none";
        }
      });
    };

    el.addEventListener("click", handleClick, true);
    const interval = setInterval(() => {
      enableButtons();
      hideEmptyBodies();
    }, 150);

    return () => {
      el.removeEventListener("click", handleClick, true);
      clearInterval(interval);
    };
  }, [containerRef]);
}

// ─── ChatListView ────────────────────────────────────────────────────
function ChatListView({
  threads,
  onOpenThread,
  dealId,
  onTriggerAiCommand,
  onAgentMention,
}: {
  threads: ThreadData[];
  onOpenThread: (thread: ThreadData) => void;
  dealId: string;
  onTriggerAiCommand?: (commandId: string) => void;
  onAgentMention?: (content: string) => void;
}) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEnableSubmitWithAttachments(chatContainerRef);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [threads.length]);

  return (
    <div ref={chatContainerRef} className="flex flex-1 flex-col min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground">
              Start the conversation below.
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const rootComment = thread.comments[0];
            const replyCount = thread.comments.length - 1;

            if (!rootComment) return null;

            // Check if this is an AI message
            const isAi = rootComment.userId === "ai-assistant";
            // Check if this is an automated thread
            const isAutoThread =
              (thread.metadata as Record<string, string>)?.autoThread ===
              "true";
            const sourceType = (
              thread.metadata as Record<string, string>
            )?.sourceType;

            return (
              <div
                key={thread.id}
                className={`group relative ${
                  isAi
                    ? "bg-info/5 border-l-2 border-info rounded-r-md px-3 py-2"
                    : ""
                }`}
              >
                {/* Automated thread indicator */}
                {isAutoThread && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    {sourceType === "document" ? "📄" : "✅"}
                    <span>
                      {(thread.metadata as Record<string, string>)
                        ?.sourceName ?? "Linked thread"}
                    </span>
                  </div>
                )}

                {/* AI message badge */}
                {isAi && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-info/10">
                      <span className="text-[10px] text-info">✨</span>
                    </div>
                    <span className="text-xs font-medium text-info">
                      AI Assistant
                    </span>
                  </div>
                )}

                {/* Root comment */}
                <div className="[&_.lb-comment]:mb-0 [&_.lb-comment]:pb-1 [&_.lb-comment-reactions]:relative [&_.lb-comment-reactions]:z-20">
                  <Comment
                    comment={rootComment}
                    showActions="hover"
                    showReactions={true}
                  />
                </div>

                {/* Reply count / open thread button */}
                {replyCount > 0 ? (
                  <button
                    onClick={() => onOpenThread(thread)}
                    className="relative z-10 flex items-center gap-1.5 px-3 py-1 ml-10 mb-1 text-xs font-medium text-primary hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenThread(thread)}
                    className="relative z-10 flex items-center gap-1.5 px-3 py-1 ml-10 mb-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Reply
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator />

      {/* Composer */}
      <ComposerWithAi
        dealId={dealId}
        onTriggerAiCommand={onTriggerAiCommand}
        onAgentMention={onAgentMention}
      />
    </div>
  );
}

// ─── ThreadDetailView ────────────────────────────────────────────────
function ThreadDetailView({
  thread,
  onBack,
  dealId,
}: {
  thread: ThreadData;
  onBack: () => void;
  dealId: string;
}) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEnableSubmitWithAttachments(chatContainerRef);

  return (
    <div ref={chatContainerRef} className="flex flex-1 flex-col min-h-0">
      {/* Thread header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">Thread</span>
        <span className="text-xs text-muted-foreground">
          {thread.comments.length}{" "}
          {thread.comments.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto">
        <Thread thread={thread} showComposer={true} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export function EnhancedCommentsContent({
  dealId,
  activeThreadId,
  onTriggerAiCommand,
  onAgentMention,
}: {
  dealId: string;
  activeThreadId: string | null;
  onTriggerAiCommand?: (commandId: string) => void;
  onAgentMention?: (content: string) => void;
}) {
  const { threads } = useThreads();
  const [activeThread, setActiveThread] = useState<ThreadData | null>(null);

  // If an activeThreadId is provided (from URL), find and set it
  useEffect(() => {
    if (activeThreadId) {
      const found = threads.find((t) => t.id === activeThreadId);
      if (found) setActiveThread(found);
    }
  }, [activeThreadId, threads]);

  // Keep active thread in sync with latest data
  const currentThread = activeThread
    ? threads.find((t) => t.id === activeThread.id) ?? activeThread
    : null;

  if (currentThread) {
    return (
      <ThreadDetailView
        thread={currentThread}
        onBack={() => setActiveThread(null)}
        dealId={dealId}
      />
    );
  }

  return (
    <ChatListView
      threads={threads}
      onOpenThread={(thread) => setActiveThread(thread)}
      dealId={dealId}
      onTriggerAiCommand={onTriggerAiCommand}
      onAgentMention={onAgentMention}
    />
  );
}
