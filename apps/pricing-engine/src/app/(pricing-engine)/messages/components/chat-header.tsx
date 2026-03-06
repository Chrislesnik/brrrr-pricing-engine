"use client";

import { useOthers } from "@liveblocks/react/suspense";
import {
  Sparkles,
  PanelRight,
  ExternalLink,
  Copy,
  Users,
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
  onToggleAiPanel: () => void;
  aiPanelOpen: boolean;
  isPopout: boolean;
  onOpenPopout: () => void;
}

// ─── Component ───────────────────────────────────────────────────────
export function ChatHeader({
  dealId,
  onToggleAiPanel,
  aiPanelOpen,
  isPopout,
  onOpenPopout,
}: ChatHeaderProps) {
  const others = useOthers();
  const onlineCount = others.length;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/messages?channel=deal:${dealId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <TooltipProvider>
      <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
        {/* Left: Channel info */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            # Deal Channel
          </h2>

          {/* Presence avatars */}
          {onlineCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {others.slice(0, 3).map((other) => (
                  <div
                    key={other.connectionId}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground"
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
                <span className="text-xs text-muted-foreground">
                  +{onlineCount - 3}
                </span>
              )}
            </div>
          )}

          <span className="text-xs text-muted-foreground">
            <Users className="mr-1 inline h-3 w-3" />
            {onlineCount + 1} online
          </span>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          {/* Copy link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy channel link</TooltipContent>
          </Tooltip>

          {/* AI toolbar trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleAiPanel}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {aiPanelOpen ? "Close AI panel" : "Open AI panel"}
            </TooltipContent>
          </Tooltip>

          {/* Toggle AI Panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${aiPanelOpen ? "bg-accent" : ""}`}
                onClick={onToggleAiPanel}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle AI panel</TooltipContent>
          </Tooltip>

          {/* Pop-out button (only in main window) */}
          {!isPopout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onOpenPopout}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in new window</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
