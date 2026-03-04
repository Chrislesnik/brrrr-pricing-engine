"use client";

import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { Loader2 } from "lucide-react";
import { CommentsContent } from "./comments-panel";

interface InlineAppraisalCommentsPanelProps {
  appraisalId: string;
}

export function InlineAppraisalCommentsPanel({
  appraisalId,
}: InlineAppraisalCommentsPanelProps) {
  const roomId = `appraisal:${appraisalId}`;

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
