"use client";

import { Suspense } from "react";
import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Skeleton } from "@repo/ui/shadcn/skeleton";
import { Button } from "@repo/ui/shadcn/button";
import { ChatHeader } from "./chat-header";
import { ChatErrorBoundary } from "./chat-error-boundary";
import { EnhancedCommentsContent } from "./enhanced-comments-content";

// ─── Types ───────────────────────────────────────────────────────────
interface ChatAreaProps {
  roomId: string | null;
  dealId: string | null;
  dealName?: string;
  activeThreadId: string | null;
  onToggleAiPanel: () => void;
  aiPanelOpen: boolean;
  isPopout: boolean;
  onOpenPopout: () => void;
  onTriggerAiCommand?: (commandId: string) => void;
  onAgentMention?: (content: string) => void;
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
        <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">
          Select a channel
        </h3>
        <p className="text-[13px] text-muted-foreground">
          Choose a deal channel from the sidebar to start messaging.
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-1">
        Press{" "}
        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>{" "}
        to search channels
      </p>
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header skeleton */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center -space-x-1.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-6 w-6 rounded-md" />
          ))}
        </div>
      </div>
      {/* Message skeletons */}
      <div className="flex-1 px-4 py-3 space-y-4">
        {[80, 45, 90, 60].map((w, i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="h-7 w-7 rounded-md shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4" style={{ width: `${w}%` }} />
            </div>
          </div>
        ))}
      </div>
      {/* Composer skeleton */}
      <div className="border-t border-border px-4 py-3">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

// ─── Room Connection Error ───────────────────────────────────────────
function RoomError() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4 text-center max-w-sm w-full">
        <p className="text-sm font-medium text-destructive">
          Unable to connect to this channel
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          The real-time connection could not be established. This may be a temporary issue.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 h-8 text-[12px]"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-1.5 h-3 w-3" />
          Reload page
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export function ChatArea({
  roomId,
  dealId,
  dealName,
  activeThreadId,
  onToggleAiPanel,
  aiPanelOpen,
  isPopout,
  onOpenPopout,
  onTriggerAiCommand,
  onAgentMention,
}: ChatAreaProps) {
  if (!roomId || !dealId) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background min-w-0">
      <RoomProvider
        id={roomId}
        initialPresence={{ isTyping: false, cursor: null }}
      >
        <ChatErrorBoundary>
          <ClientSideSuspense fallback={<LoadingState />}>
            <ChatHeader
              dealId={dealId}
              dealName={dealName}
              onToggleAiPanel={onToggleAiPanel}
              aiPanelOpen={aiPanelOpen}
              isPopout={isPopout}
              onOpenPopout={onOpenPopout}
            />
            <EnhancedCommentsContent
              dealId={dealId}
              activeThreadId={activeThreadId}
              onTriggerAiCommand={onTriggerAiCommand}
              onAgentMention={onAgentMention}
            />
          </ClientSideSuspense>
        </ChatErrorBoundary>
      </RoomProvider>
    </div>
  );
}
