"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { ChannelSidebar } from "./components/channel-sidebar";
import { ChatArea } from "./components/chat-area";
import { PrivateAiPanel } from "./components/private-ai-panel";
import { AiDealChat } from "./components/ai-deal-chat";
import { MessageCommandPalette } from "./components/message-command-palette";
import { Loader2 } from "lucide-react";
import useSWR from "swr";

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const channelParam = searchParams.get("channel");
  const threadParam = searchParams.get("thread");
  const isPopout = searchParams.get("popout") === "true";

  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeAiCommand, setActiveAiCommand] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  // Fetch channels for command palette + deal name resolution
  const { data: channelsData } = useSWR<{
    channels: Array<{ id: string; display_name: string }>;
  }>("/api/chat/channels", (url: string) => fetch(url).then((r) => r.json()), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  // Resolve selected deal name from channels data
  const selectedDealName = useMemo(() => {
    if (!selectedDealId || !channelsData?.channels) return undefined;
    const channel = channelsData.channels.find(
      (ch) => ch.id === selectedDealId
    );
    return channel?.display_name;
  }, [selectedDealId, channelsData]);

  // Parse channel param on mount and when it changes
  useEffect(() => {
    if (channelParam) {
      // Channel format: deal:{dealId}
      const match = channelParam.match(/^deal:(.+)$/);
      if (match) {
        setSelectedDealId(match[1]);
      }
    }
  }, [channelParam]);

  // Parse thread param
  useEffect(() => {
    setActiveThreadId(threadParam || null);
  }, [threadParam]);

  // Update URL when channel changes
  const handleSelectDeal = useCallback(
    (dealId: string) => {
      setSelectedDealId(dealId);
      setActiveThreadId(null);
      const params = new URLSearchParams();
      params.set("channel", `deal:${dealId}`);
      if (isPopout) params.set("popout", "true");
      router.replace(`/messages?${params.toString()}`);
    },
    [router, isPopout]
  );

  // Handle @agent mention — post to agent-respond API with visual feedback
  const handleAgentMention = useCallback(
    async (content: string) => {
      if (!selectedDealId) return;

      setAgentStatus("sending");

      try {
        const res = await fetch("/api/chat/agent-respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId: selectedDealId,
            message: content,
            roomId: `deal_chat:${selectedDealId}`,
          }),
        });

        if (res.status === 429) {
          setAgentStatus("error");
          setTimeout(() => setAgentStatus("idle"), 3000);
          return;
        }

        if (!res.ok) {
          setAgentStatus("error");
          setTimeout(() => setAgentStatus("idle"), 3000);
          return;
        }

        setAgentStatus("sent");
        setTimeout(() => setAgentStatus("idle"), 3000);
      } catch (err) {
        console.error("[agent-mention] Failed to invoke agent:", err);
        setAgentStatus("error");
        setTimeout(() => setAgentStatus("idle"), 3000);
      }
    },
    [selectedDealId]
  );

  // Keyboard shortcuts: Cmd+K (palette), Cmd+Shift+A (AI panel), Cmd+/ (focus composer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isMod && e.shiftKey && e.key === "A") {
        e.preventDefault();
        if (selectedDealId) setAiPanelOpen((prev) => !prev);
        return;
      }

      if (isMod && e.key === "/") {
        e.preventDefault();
        const composer = document.querySelector<HTMLElement>(
          '[data-slate-editor="true"], [role="textbox"][contenteditable="true"], .lb-composer textarea'
        );
        composer?.focus();
        return;
      }

      if (e.key === "Escape") {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (activeAiCommand) {
          setActiveAiCommand(null);
        } else if (aiPanelOpen) {
          setAiPanelOpen(false);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDealId, commandPaletteOpen, activeAiCommand, aiPanelOpen]);

  // Update document title for pop-out mode
  useEffect(() => {
    if (isPopout) {
      document.title = selectedDealName
        ? `Messages — ${selectedDealName}`
        : "Messages — Pop-out window";
    }
  }, [isPopout, selectedDealName]);

  const roomId = selectedDealId ? `deal:${selectedDealId}` : null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Pop-out header bar */}
      {isPopout && (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between bg-muted/20 px-3 py-1 text-xs text-muted-foreground border-b border-border">
          <span>
            Messages{selectedDealName ? ` — ${selectedDealName}` : " — Pop-out window"}
          </span>
          <a
            href="/messages"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline"
          >
            Return to app
          </a>
        </div>
      )}

      <div
        className={`flex h-full w-full overflow-hidden ${isPopout ? "pt-6" : ""}`}
      >
        {/* Channel Sidebar */}
        <ChannelSidebar
          selectedDealId={selectedDealId}
          onSelectDeal={handleSelectDeal}
        />

        {/* Chat Area */}
        <ChatArea
          roomId={roomId}
          dealId={selectedDealId}
          dealName={selectedDealName}
          activeThreadId={activeThreadId}
          onToggleAiPanel={() => setAiPanelOpen(!aiPanelOpen)}
          aiPanelOpen={aiPanelOpen}
          isPopout={isPopout}
          onOpenPopout={() => {
            const params = new URLSearchParams();
            if (roomId) params.set("channel", roomId);
            params.set("popout", "true");
            window.open(
              `/messages?${params.toString()}`,
              "_blank",
              "width=1200,height=800"
            );
          }}
          onTriggerAiCommand={(commandId) => {
            setActiveAiCommand(commandId);
            setAiPanelOpen(false);
          }}
          onAgentMention={handleAgentMention}
        />

        {/* AI Deal Chat Panel (slash commands → agentic chat) */}
        {activeAiCommand && selectedDealId && (
          <AiDealChat
            dealId={selectedDealId}
            initialCommand={activeAiCommand}
            onClose={() => setActiveAiCommand(null)}
          />
        )}

        {/* Private AI Panel */}
        {aiPanelOpen && !activeAiCommand && selectedDealId && (
          <PrivateAiPanel
            dealId={selectedDealId}
            onClose={() => setAiPanelOpen(false)}
          />
        )}
      </div>

      {/* Agent status toast */}
      {agentStatus !== "idle" && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${
              agentStatus === "sending"
                ? "border-info/30 bg-info/10 text-info"
                : agentStatus === "sent"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {agentStatus === "sending" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Agent is processing...</span>
              </>
            )}
            {agentStatus === "sent" && (
              <span>Agent response posted to chat</span>
            )}
            {agentStatus === "error" && (
              <span>Agent failed — please try again</span>
            )}
          </div>
        </div>
      )}

      {/* Command Palette (Cmd+K) */}
      <MessageCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onTriggerAiCommand={(commandId) => {
          setActiveAiCommand(commandId);
          setAiPanelOpen(false);
        }}
        onToggleAiPanel={() => {
          if (selectedDealId) setAiPanelOpen((prev) => !prev);
        }}
        onSelectChannel={handleSelectDeal}
        channels={channelsData?.channels ?? []}
        selectedDealId={selectedDealId}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
