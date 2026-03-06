"use client";

import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { CommentsContent } from "@/components/liveblocks/comments-panel";
import { Hash, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Avatar, AvatarFallback } from "@repo/ui/shadcn/avatar";
import Link from "next/link";
import type { Channel } from "./channel-list";

interface ChannelViewProps {
  channel: Channel;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ChannelHeader({ channel }: { channel: Channel }) {
  return (
    <div className="flex items-center justify-between px-4 h-[49px] border-b shrink-0 bg-background">
      <div className="flex items-center gap-2.5 min-w-0">
        <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold truncate">{channel.name}</span>
        {channel.assignees.length > 0 && (
          <div className="flex items-center gap-1.5 border-l pl-2.5 ml-0.5">
            <div className="flex -space-x-1">
              {channel.assignees.slice(0, 3).map((a) => (
                <Avatar key={a.id} className="h-5 w-5 border border-background">
                  <AvatarFallback className="text-[8px] bg-muted">
                    {getInitials(a.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {channel.assignees.length}
            </span>
          </div>
        )}
      </div>
      <Link href={`/deals/${channel.id}`}>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3 w-3" />
          Open Deal
        </Button>
      </Link>
    </div>
  );
}

export function ChannelView({ channel }: ChannelViewProps) {
  return (
    <div className="flex flex-col h-full">
      <ChannelHeader channel={channel} />
      <div className="flex-1 min-h-0">
        <RoomProvider id={channel.roomId} key={channel.roomId}>
          <ClientSideSuspense
            fallback={
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Loading messages...
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

export function EmptyChannelView() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
      <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center">
        <Hash className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Select a channel</p>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Choose a deal channel from the sidebar to start messaging your team.
        </p>
      </div>
    </div>
  );
}
