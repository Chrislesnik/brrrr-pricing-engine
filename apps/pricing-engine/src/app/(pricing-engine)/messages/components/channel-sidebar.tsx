"use client";

import { useState, useMemo, useRef } from "react";
import {
  Search,
  Hash,
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Bell,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Skeleton } from "@repo/ui/shadcn/skeleton";
import useSWR from "swr";
import {
  ChannelDisplayOptions,
  usePersistedDisplaySettings,
  type ChannelDisplaySettings,
  type GroupByOption,
} from "./channel-display-options";

// ─── Types ───────────────────────────────────────────────────────────
interface ChannelMetadata {
  stage: { code: string; name: string; color: string | null } | null;
  loan_officer: { user_id: string; name: string } | null;
  broker: { user_id: string; name: string } | null;
  primary_user: { user_id: string; name: string } | null;
  archived: boolean;
  created_at: string;
}

interface EnrichedChannel {
  id: string;
  display_name: string;
  room_id: string;
  unread_count: number;
  metadata?: ChannelMetadata;
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

interface ChannelGroup {
  key: string;
  label: string;
  color: string | null;
  channels: EnrichedChannel[];
}

// ─── Fetcher ─────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Grouping Helpers ────────────────────────────────────────────────
function getGroupKey(
  channel: EnrichedChannel,
  groupBy: GroupByOption
): string {
  if (!channel.metadata || groupBy === "none") return "__all__";

  switch (groupBy) {
    case "stage":
      return channel.metadata.stage?.code ?? "__no_stage__";
    case "loan_officer":
      return channel.metadata.loan_officer?.user_id ?? "__unassigned__";
    case "broker":
      return channel.metadata.broker?.user_id ?? "__unassigned__";
    case "primary_user":
      return channel.metadata.primary_user?.user_id ?? "__unassigned__";
    case "archived":
      return channel.metadata.archived ? "archived" : "active";
    default:
      return "__all__";
  }
}

function getGroupLabel(
  channel: EnrichedChannel,
  groupBy: GroupByOption
): string {
  if (!channel.metadata || groupBy === "none") return "All Channels";

  switch (groupBy) {
    case "stage":
      return channel.metadata.stage?.name ?? "No Stage";
    case "loan_officer":
      return channel.metadata.loan_officer?.name ?? "Unassigned";
    case "broker":
      return channel.metadata.broker?.name ?? "Unassigned";
    case "primary_user":
      return channel.metadata.primary_user?.name ?? "Unassigned";
    case "archived":
      return channel.metadata.archived ? "Archived" : "Active";
    default:
      return "All Channels";
  }
}

function getGroupColor(
  channel: EnrichedChannel,
  groupBy: GroupByOption
): string | null {
  if (!channel.metadata || groupBy !== "stage") return null;
  return channel.metadata.stage?.color ?? null;
}

function sortChannels(
  channels: EnrichedChannel[],
  sortBy: ChannelDisplaySettings["sortBy"],
  ascending: boolean
): EnrichedChannel[] {
  const sorted = [...channels].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.display_name.localeCompare(b.display_name);
      case "created_at": {
        const dateA = a.metadata?.created_at ?? "";
        const dateB = b.metadata?.created_at ?? "";
        return dateA.localeCompare(dateB);
      }
      case "unread":
        return (a.unread_count ?? 0) - (b.unread_count ?? 0);
      default:
        return 0;
    }
  });
  return ascending ? sorted : sorted.reverse();
}

function groupChannels(
  channels: EnrichedChannel[],
  groupBy: GroupByOption
): ChannelGroup[] {
  if (groupBy === "none") {
    return [
      {
        key: "__all__",
        label: "Channels",
        color: null,
        channels,
      },
    ];
  }

  const groupMap = new Map<string, ChannelGroup>();
  const groupOrder: string[] = [];

  for (const channel of channels) {
    const key = getGroupKey(channel, groupBy);
    if (!groupMap.has(key)) {
      groupOrder.push(key);
      groupMap.set(key, {
        key,
        label: getGroupLabel(channel, groupBy),
        color: getGroupColor(channel, groupBy),
        channels: [],
      });
    }
    groupMap.get(key)!.channels.push(channel);
  }

  return groupOrder.map((key) => groupMap.get(key)!);
}

// ─── Channel Item Component ─────────────────────────────────────────
function ChannelItem({
  channel,
  isSelected,
  onSelect,
}: {
  channel: EnrichedChannel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors",
        isSelected
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-foreground/80 hover:bg-sidebar-accent/50"
      )}
    >
      {(channel.unread_count ?? 0) > 0 && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-info" />
      )}
      <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{channel.display_name}</span>
    </button>
  );
}

// ─── Collapsible Group Header ────────────────────────────────────────
function GroupHeader({
  group,
  collapsed,
  onToggle,
}: {
  group: ChannelGroup;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-1.5 px-1 py-1.5 cursor-pointer group"
    >
      <Icon className="h-3 w-3 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
      {group.color && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: group.color }}
        />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
        {group.label}
      </span>
      <span className="text-[10px] text-muted-foreground/50 ml-auto">
        {group.channels.length}
      </span>
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────
export function ChannelSidebar({
  selectedDealId,
  onSelectDeal,
}: ChannelSidebarProps) {
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [displaySettings, updateDisplaySettings] =
    usePersistedDisplaySettings();

  // Fetch enriched channels
  const { data: channelsData, isLoading } = useSWR<{
    channels: EnrichedChannel[];
  }>("/api/chat/channels?include_metadata=true", fetcher, {
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

  // Toggle group collapse
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Process channels: filter, sort, group
  const { needsAttentionChannels, groupedChannels } = useMemo(() => {
    // Step 1: Filter by search
    let filtered = search
      ? channels.filter((c) =>
          c.display_name.toLowerCase().includes(search.toLowerCase())
        )
      : channels;

    // Step 2: Filter archived
    if (!displaySettings.showArchived) {
      filtered = filtered.filter((c) => !c.metadata?.archived);
    }

    // Step 3: Sort
    const sorted = sortChannels(
      filtered,
      displaySettings.sortBy,
      displaySettings.sortAscending
    );

    // Step 4: Separate "Needs Attention" channels (unread > 0)
    const needsAttention = sorted.filter((c) => (c.unread_count ?? 0) > 0);

    // Step 5: Group remaining channels
    const grouped = groupChannels(sorted, displaySettings.groupBy);

    // Step 6: Filter empty groups if needed
    const finalGroups = displaySettings.showEmptyGroups
      ? grouped
      : grouped.filter((g) => g.channels.length > 0);

    return {
      needsAttentionChannels: needsAttention,
      groupedChannels: finalGroups,
    };
  }, [channels, search, displaySettings]);

  return (
    <div className="flex h-full w-[260px] min-w-[260px] flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Search + Display Options */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>
          <ChannelDisplayOptions
            settings={displaySettings}
            onUpdate={updateDisplaySettings}
          />
        </div>
      </div>

      {/* Channel List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading ? (
          /* Loading skeleton */
          <div className="space-y-1 px-1">
            <div className="px-1 py-1.5">
              <Skeleton className="h-3 w-16" />
            </div>
            {[60, 75, 55, 68, 50, 72].map((w, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-sm shrink-0" />
                <Skeleton className="h-4" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          /* Empty state */
          <div className="px-3 py-8 text-center">
            <Hash className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[13px] font-medium text-muted-foreground">
              No conversations yet
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Chat rooms are created for each deal
            </p>
          </div>
        ) : (
          <>
            {/* NEEDS ATTENTION Section */}
            {needsAttentionChannels.length > 0 && (
              <>
                <div className="px-1 py-1.5 flex items-center gap-1.5">
                  <Bell className="h-3 w-3 text-info" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-info">
                    Needs Attention
                  </span>
                  <span className="text-[10px] text-info/70 ml-auto">
                    {needsAttentionChannels.length}
                  </span>
                </div>
                {needsAttentionChannels.map((channel) => (
                  <ChannelItem
                    key={`attention-${channel.id}`}
                    channel={channel}
                    isSelected={selectedDealId === channel.id}
                    onSelect={() => onSelectDeal(channel.id)}
                  />
                ))}
                <div className="my-2 border-b border-border/50" />
              </>
            )}

            {/* Grouped Channel Sections */}
            {groupedChannels.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);
              const isFlat = displaySettings.groupBy === "none";

              return (
                <div key={group.key}>
                  {/* Group header */}
                  {isFlat ? (
                    <div className="px-1 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Channels
                      </span>
                    </div>
                  ) : (
                    <GroupHeader
                      group={group}
                      collapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.key)}
                    />
                  )}

                  {/* Channel items (hidden when collapsed) */}
                  {!isCollapsed &&
                    (group.channels.length > 0 ? (
                      group.channels.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isSelected={selectedDealId === channel.id}
                          onSelect={() => onSelectDeal(channel.id)}
                        />
                      ))
                    ) : displaySettings.showEmptyGroups ? (
                      <div className="px-3 py-2 text-[11px] text-muted-foreground/50 italic">
                        No channels
                      </div>
                    ) : null)}
                </div>
              );
            })}

            {/* No results from search */}
            {groupedChannels.every((g) => g.channels.length === 0) &&
              search && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No channels match your search
                </div>
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
          </>
        )}
      </div>
    </div>
  );
}
