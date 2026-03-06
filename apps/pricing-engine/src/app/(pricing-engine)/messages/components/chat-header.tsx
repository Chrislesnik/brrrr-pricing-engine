"use client";

import { useState, useCallback } from "react";
import { useOthers } from "@liveblocks/react/suspense";
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Hash,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@repo/ui/shadcn/tooltip";

// ─── Types ───────────────────────────────────────────────────────────
interface ChatHeaderProps {
  dealId: string;
  dealName?: string;
  onToggleAiPanel: () => void;
  aiPanelOpen: boolean;
  isPopout: boolean;
  onOpenPopout: () => void;
}

// ─── Component ───────────────────────────────────────────────────────
export function ChatHeader({
  dealId,
  dealName,
  onToggleAiPanel,
  aiPanelOpen,
  isPopout,
  onOpenPopout,
}: ChatHeaderProps) {
  const others = useOthers();
  const onlineCount = others.length;
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/messages?channel=deal:${dealId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [dealId]);

  return (
    <TooltipProvider>
      <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
        {/* Left: Channel info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground truncate">
              {dealName || `Deal ${dealId.slice(0, 8)}`}
            </h2>
          </div>

          {/* Presence indicators */}
          {onlineCount > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex -space-x-1.5">
                {others.slice(0, 3).map((other) => (
                  <div
                    key={other.connectionId}
                    className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground"
                    title={
                      (other.info as { name?: string } | undefined)?.name ??
                      "User"
                    }
                  >
                    {(
                      (other.info as { name?: string } | undefined)?.name ?? "U"
                    ).charAt(0)}
                  </div>
                ))}
              </div>
              {onlineCount > 3 && (
                <span className="text-[11px] text-muted-foreground">
                  +{onlineCount - 3}
                </span>
              )}
              <div className="h-3 border-l border-border" />
              <span className="text-[11px] text-muted-foreground">
                {onlineCount + 1} online
              </span>
            </div>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Copy link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {copied ? "Copied!" : "Copy channel link"}
            </TooltipContent>
          </Tooltip>

          {/* AI panel toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  aiPanelOpen
                    ? "bg-info/10 text-info hover:bg-info/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={onToggleAiPanel}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {aiPanelOpen ? "Close AI panel" : "Open AI panel"}
              <kbd className="ml-2 text-[10px] bg-muted/60 rounded px-1 py-0.5">
                ⌘⇧A
              </kbd>
            </TooltipContent>
          </Tooltip>

          {/* Pop-out button (only in main window) */}
          {!isPopout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onOpenPopout}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open in new window</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
