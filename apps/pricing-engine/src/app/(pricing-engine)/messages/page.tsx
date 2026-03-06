"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RouteProtection } from "@/components/auth/route-protection";
import { ChannelList, type Channel } from "./components/channel-list";
import { ChannelView, EmptyChannelView } from "./components/channel-view";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealIdParam = searchParams.get("deal");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchChannels() {
      try {
        const res = await fetch("/api/channels");
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`[messages] /api/channels ${res.status}:`, body);
          throw new Error(`channels ${res.status}`);
        }
        const data = await res.json();

        if (cancelled) return;
        setChannels(data.channels ?? []);

        if (dealIdParam) {
          const match = data.channels.find(
            (c: Channel) => c.id === dealIdParam
          );
          if (match) setActiveChannel(match);
        }
      } catch (err) {
        console.error("[messages] failed to load channels:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChannels();
    return () => {
      cancelled = true;
    };
  }, [dealIdParam]);

  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setActiveChannel(channel);
      router.replace(`/messages?deal=${channel.id}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden" data-layout="fixed">
      {/* Channel sidebar */}
      <div className="w-[260px] shrink-0 border-r flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 h-[49px] border-b shrink-0">
          <h1 className="text-sm font-semibold">Channels</h1>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {channels.length}
          </span>
        </div>
        <ChannelList
          channels={channels}
          activeChannelId={activeChannel?.id ?? null}
          onSelectChannel={handleSelectChannel}
          loading={loading}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {activeChannel ? (
          <ChannelView channel={activeChannel} />
        ) : (
          <EmptyChannelView />
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RouteProtection>
      <MessagesContent />
    </RouteProtection>
  );
}
