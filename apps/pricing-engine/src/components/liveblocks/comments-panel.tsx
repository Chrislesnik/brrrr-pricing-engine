"use client";

import { useEffect, useRef, useState } from "react";
import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useThreads } from "@liveblocks/react/suspense";
import { Thread, Comment, Composer } from "@liveblocks/react-ui";
import { Button } from "@repo/ui/shadcn/button";
import { MessageSquare, X, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import type { ThreadData } from "@liveblocks/client";

const COMPOSER_OVERRIDES = {
  COMPOSER_PLACEHOLDER: "Write a message...",
} as const;

/**
 * MutationObserver hook that enables the submit button inside Liveblocks
 * Composer components when attachments are present but no text has been typed.
 * The default Composer disables submit when the editor is empty, even if files
 * are attached — this workaround removes the `disabled` attribute so users can
 * send attachment-only messages.
 */
function useEnableSubmitWithAttachments(
  containerRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      el.querySelectorAll<HTMLElement>(".lb-composer").forEach((composer) => {
        // Liveblocks renders attachments with class names containing "attachment"
        const hasAttachments =
          composer.querySelector("[class*='attachment']") !== null;
        const submitBtn = composer.querySelector<HTMLButtonElement>(
          'button[type="submit"]:disabled'
        );
        if (submitBtn && hasAttachments) {
          submitBtn.disabled = false;
        }
      });
    };

    const observer = new MutationObserver(check);
    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled"],
    });

    return () => observer.disconnect();
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

export function CommentsPanel({
  dealId,
  open,
  onClose,
}: CommentsPanelProps) {
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
        <RoomProvider id={roomId}>
          <ClientSideSuspense
            fallback={
              <div className="flex items-center justify-center h-40 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading comments...
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
                Loading comments...
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
