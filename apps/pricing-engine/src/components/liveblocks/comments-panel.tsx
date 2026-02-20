"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useThreads } from "@liveblocks/react/suspense";
import { Thread, Comment, Composer } from "@liveblocks/react-ui";
import { Button } from "@repo/ui/shadcn/button";
import { MessageSquare, X, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import type { ThreadData } from "@liveblocks/client";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const COMPOSER_OVERRIDES = {
  COMPOSER_PLACEHOLDER: "Write a message...",
} as const;

/**
 * Hook that enables sending attachment-only messages in Liveblocks Composer.
 *
 * Liveblocks has TWO guards preventing attachment-only sends:
 * 1. `canSubmit = !isEmpty && !isUploadingAttachments` — disables the button
 * 2. `handleSubmit` checks `isEmpty(editor)` and calls `event.preventDefault()`
 *
 * Both check the Slate text editor's empty state, ignoring file attachments.
 *
 * This hook works around both by:
 * - Polling to force-enable disabled submit buttons when attachments exist
 * - Injecting a zero-width space into the Slate editor before submission so
 *   isEmpty returns false, allowing the form to process attachments
 * - Using CSS (in globals.css) to ensure pointer-events reach the button
 */
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

    // Poll to force-enable disabled submit buttons when attachments exist
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

    // Click handler: inject a zero-width space into the Slate editor so
    // isEmpty() returns false, then trigger form submission.
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>(
        'button[type="submit"]'
      );
      if (!btn) return;

      const form = btn.closest<HTMLFormElement>("form");
      if (!form) return;
      if (!hasComposerAttachments(form)) return;

      // Find the Slate editable element within this composer
      const editable = form.querySelector<HTMLElement>(
        '[data-slate-editor="true"], [role="textbox"][contenteditable="true"]'
      );
      if (editable && editable.textContent?.trim() === "") {
        // Inject a zero-width space so Liveblocks' isEmpty check passes
        const textNode = document.createTextNode("\u200B");
        // Find or create a text node in the first paragraph
        const firstChild = editable.querySelector("p, span, [data-slate-node]");
        if (firstChild) {
          firstChild.appendChild(textNode);
        } else {
          editable.appendChild(textNode);
        }

        // Dispatch an input event so Slate picks up the change
        editable.dispatchEvent(new InputEvent("input", { bubbles: true }));

        // Force enable and submit after a tick
        btn.disabled = false;
        btn.removeAttribute("disabled");

        // Use requestAnimationFrame to let Slate process the input event
        requestAnimationFrame(() => {
          btn.disabled = false;
          try {
            form.requestSubmit(btn);
          } catch {
            // fallback
            btn.click();
          }
        });
      }
    };

    // Hide empty comment bodies that only contain a zero-width space
    // (from our attachment-only workaround)
    const hideEmptyBodies = () => {
      el.querySelectorAll<HTMLElement>(".lb-comment-body").forEach((body) => {
        const text = body.textContent?.replace(/[\u200B\u200C\u200D\uFEFF]/g, "").trim();
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

/* -------------------------------------------------------------------------- */
/*  Thread detail view — full thread with replies + composer                  */
/* -------------------------------------------------------------------------- */

function ThreadDetailView({
  thread,
  onBack,
}: {
  thread: ThreadData;
  onBack: () => void;
}) {
  const threadContainerRef = useRef<HTMLDivElement>(null);
  useEnableSubmitWithAttachments(threadContainerRef);

  return (
    <div ref={threadContainerRef} className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">Thread</span>
      </div>

      {/* Full thread with all replies */}
      <div className="flex-1 overflow-y-auto">
        <Thread
          thread={thread}
          showComposer={true}
          showActions="hover"
          showReactions={true}
          overrides={COMPOSER_OVERRIDES}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main chat list — shows root messages only, Slack-style                    */
/* -------------------------------------------------------------------------- */

function ChatListView({
  threads,
  onOpenThread,
}: {
  threads: ThreadData[];
  onOpenThread: (thread: ThreadData) => void;
}) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEnableSubmitWithAttachments(chatContainerRef);

  return (
    <div ref={chatContainerRef} className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p>No messages yet.</p>
            <p className="text-xs">Start the conversation below.</p>
          </div>
        ) : (
          threads.map((thread) => {
            const rootComment = thread.comments[0];
            const replyCount = thread.comments.length - 1;

            if (!rootComment) return null;

            return (
              <div key={thread.id} className="group relative">
                {/* Root comment only — no reply composer */}
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
                    className="relative z-10 flex items-center gap-1.5 px-3 py-1 ml-10 mb-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Reply
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Composer at the bottom — creates new threads */}
      <div className="border-t bg-background px-3 py-3">
        <Composer overrides={COMPOSER_OVERRIDES} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inner content — must be rendered inside RoomProvider                       */
/* -------------------------------------------------------------------------- */

function CommentsContent() {
  const { threads } = useThreads();
  const [activeThread, setActiveThread] = useState<ThreadData | null>(null);

  // If viewing a thread, find the latest version from the threads list
  const currentThread = activeThread
    ? threads.find((t) => t.id === activeThread.id) ?? activeThread
    : null;

  if (currentThread) {
    return (
      <ThreadDetailView
        thread={currentThread}
        onBack={() => setActiveThread(null)}
      />
    );
  }

  return (
    <ChatListView
      threads={threads}
      onOpenThread={(thread) => setActiveThread(thread)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  CommentsPanel — inline side panel (controlled by parent)                  */
/* -------------------------------------------------------------------------- */

interface CommentsPanelProps {
  dealId: string;
  /** Whether the panel is open */
  open: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

function useDealUsersVersion(dealId: string, enabled: boolean) {
  const [version, setVersion] = useState(0);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`deal-users-mentions-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deal_users",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          setVersion((v) => v + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, dealId, enabled]);

  return version;
}

export function CommentsPanel({
  dealId,
  open,
  onClose,
}: CommentsPanelProps) {
  const membersVersion = useDealUsersVersion(dealId, open);
  const roomId = `deal:${dealId}`;

  if (!open) return null;

  return (
    <div className="w-[380px] shrink-0 border-l bg-background flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Chat</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Room-scoped content */}
      <div className="flex-1 min-h-0">
        <RoomProvider id={roomId} key={`${roomId}-v${membersVersion}`}>
          <ClientSideSuspense
            fallback={
              <div className="flex items-center justify-center h-40 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading chat...
                </span>
              </div>
            }
          >
            <CommentsContent />
          </ClientSideSuspense>
        </RoomProvider>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  InlineCommentsPanel — for embedding inside a sheet (deals list)           */
/* -------------------------------------------------------------------------- */

interface InlineCommentsPanelProps {
  dealId: string;
}

export function InlineCommentsPanel({ dealId }: InlineCommentsPanelProps) {
  const roomId = `deal:${dealId}`;

  return (
    <div className="flex flex-col h-full">
      <RoomProvider id={roomId}>
        <ClientSideSuspense
          fallback={
            <div className="flex items-center justify-center h-40 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Loading chat...
              </span>
            </div>
          }
        >
          <CommentsContent />
        </ClientSideSuspense>
      </RoomProvider>
    </div>
  );
}
