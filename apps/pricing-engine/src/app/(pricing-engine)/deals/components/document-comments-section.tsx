"use client";

import { useEffect, useRef, useState } from "react";
import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useThreads } from "@liveblocks/react/suspense";
import { Comment, Composer } from "@liveblocks/react-ui";
import {
  MessageSquare,
  MessageCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import type { ThreadData } from "@liveblocks/client";
import { useCommentBridge } from "@/hooks/use-comment-bridge";

// ─── Constants ───────────────────────────────────────────────────────
const DOCUMENT_COMPOSER_OVERRIDES = {
  COMPOSER_PLACEHOLDER: "Comment on this document...",
} as const;

// ─── Types ───────────────────────────────────────────────────────────
interface DocumentCommentsSectionProps {
  documentId: string;
  documentName: string;
  dealId: string;
}

// ─── Inner Comments List ─────────────────────────────────────────────
function DocumentCommentsInner({
  documentId,
  documentName,
  dealId,
}: DocumentCommentsSectionProps) {
  const { threads } = useThreads();
  const [activeThread, setActiveThread] = useState<ThreadData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomId = `deal_document:${documentId}`;

  // Comment bridge for syncing to deal channel
  const { bridgeComment } = useCommentBridge({
    sourceRoomId: roomId,
    dealId,
    sourceType: "document",
    sourceId: documentId,
    sourceName: documentName,
  });

  // Auto-scroll on new threads
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [threads.length]);

  // Thread detail view
  if (activeThread) {
    const current =
      threads.find((t) => t.id === activeThread.id) ?? activeThread;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setActiveThread(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Thread</span>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {current.comments.map((comment) => (
            <div
              key={comment.id}
              className="[&_.lb-comment]:mb-0 [&_.lb-comment]:pb-1"
            >
              <Comment comment={comment} showActions="hover" />
            </div>
          ))}
        </div>
        <div className="border-t border-border px-3 py-3">
          <Composer overrides={DOCUMENT_COMPOSER_OVERRIDES} />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Document Comments
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No comments yet. Start the discussion.
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const rootComment = thread.comments[0];
            const replyCount = thread.comments.length - 1;

            if (!rootComment) return null;

            return (
              <div key={thread.id} className="group relative">
                <div className="[&_.lb-comment]:mb-0 [&_.lb-comment]:pb-1 [&_.lb-comment-reactions]:relative [&_.lb-comment-reactions]:z-20">
                  <Comment
                    comment={rootComment}
                    showActions="hover"
                    showReactions={true}
                  />
                </div>

                {replyCount > 0 && (
                  <button
                    onClick={() => setActiveThread(thread)}
                    className="relative z-10 flex items-center gap-1.5 px-3 py-1 ml-10 mb-1 text-xs font-medium text-primary hover:bg-primary/5 rounded-md cursor-pointer transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border px-3 py-3">
        <Composer overrides={DOCUMENT_COMPOSER_OVERRIDES} />
      </div>
    </div>
  );
}

// ─── Wrapper with RoomProvider ────────────────────────────────────────
export function DocumentCommentsSection(props: DocumentCommentsSectionProps) {
  const roomId = `deal_document:${props.documentId}`;

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense
        fallback={
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Document Comments
              </span>
            </div>
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Loading comments...
              </span>
            </div>
          </div>
        }
      >
        <DocumentCommentsInner {...props} />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
