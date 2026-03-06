"use client";

import { useState } from "react";
import { cn } from "@repo/lib/cn";
import { Hash, Search } from "lucide-react";
import { Input } from "@repo/ui/shadcn/input";

export interface Channel {
  id: string;
  roomId: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  assignees: { id: string; name: string | null }[];
}

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  loading?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ChannelSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 h-8 animate-pulse">
      <div className="h-3 w-3 rounded bg-muted" />
      <div className="h-3 flex-1 rounded bg-muted" />
      <div className="h-3 w-6 rounded bg-muted" />
    </div>
  );
}

export function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  loading,
}: ChannelListProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? channels.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : channels;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5">
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <ChannelSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-1.5">
            <Hash className="h-5 w-5 text-muted-foreground/25" />
            <p className="text-xs">{search ? "No results" : "No channels"}</p>
          </div>
        ) : (
          <div className="space-y-px">
            {filtered.map((channel) => {
              const isActive = activeChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2.5 h-8 rounded-md text-left transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Hash className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground/50"
                  )} />
                  <span className="text-[13px] truncate flex-1">
                    {channel.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                    {formatRelativeTime(channel.updatedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
