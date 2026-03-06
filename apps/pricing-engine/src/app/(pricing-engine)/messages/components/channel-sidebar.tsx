"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Hash,
  MessageSquare,
  FileText,
  CheckSquare,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Skeleton } from "@repo/ui/shadcn/skeleton";
import useSWR from "swr";

// ─── Types ───────────────────────────────────────────────────────────
interface DealChannel {
  id: string;
  display_name: string;
  room_id: string;
  unread_count?: number;
}

interface AutomatedThread {
  id: string;
  source_type: "document" | "task";
  source_name: string;
  deal_id: string;
  thread_id: string;
  unread_count?: number;
}

interface ChannelSidebarProps {
  selectedDealId: string | null;
  onSelectDeal: (dealId: string) => void;
}

// ─── Fetcher ─────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Component ───────────────────────────────────────────────────────
export function ChannelSidebar({
  selectedDealId,
  onSelectDeal,
}: ChannelSidebarProps) {
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch channels (deals the user has access to)
  const { data: channelsData, isLoading } = useSWR<{
    channels: DealChannel[];
  }>("/api/chat/channels", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  // Fetch automated threads
  const { data: threadsData } = useSWR<{
    threads: AutomatedThread[];
  }>(
    selectedDealId
      ? `/api/chat/channels/${selectedDealId}/automated-threads`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const channels = channelsData?.channels ?? [];
  const automatedThreads = threadsData?.threads ?? [];

  // Filter channels by search
  const filteredChannels = search
    ? channels.filter((c) =>
        c.display_name.toLowerCase().includes(search.toLowerCase())
      )
    : channels;

  return (
    <div className="flex h-full w-[260px] min-w-[260px] flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
      </div>

      {/* Channel List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2"
        style={{ scrollbarWidth: "none" }}
      >
        {/* CHANNELS Section */}
        <div className="px-1 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Channels
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-1 px-1">
            {[60, 75, 55, 68, 50, 72].map((w, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-sm shrink-0" />
                <Skeleton className="h-4" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            {search ? "No channels match your search" : "No channels available"}
          </div>
        ) : (
          filteredChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectDeal(channel.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors",
                selectedDealId === channel.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-foreground/80 hover:bg-sidebar-accent/50"
              )}
            >
              {/* Unread indicator */}
              {(channel.unread_count ?? 0) > 0 && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-info" />
              )}
              <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{channel.display_name}</span>
            </button>
          ))
        )}

        {/* AUTOMATED Section */}
        {automatedThreads.length > 0 && (
          <>
            <div className="mt-4 px-1 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Automated
              </span>
            </div>
            {automatedThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectDeal(thread.deal_id)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground/80 hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
              >
                {thread.source_type === "document" ? (
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <CheckSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{thread.source_name}</span>
                {(thread.unread_count ?? 0) > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-info">
                    {thread.unread_count}
                  </span>
                )}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
