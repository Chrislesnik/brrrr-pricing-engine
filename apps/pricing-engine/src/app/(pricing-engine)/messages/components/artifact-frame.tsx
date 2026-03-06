"use client";

import { X } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";

// ─── Types ───────────────────────────────────────────────────────────
interface ArtifactFrameProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────
export function ArtifactFrame({
  title,
  onClose,
  children,
}: ArtifactFrameProps) {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md hover:bg-accent"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content area */}
      <div className="p-0">{children}</div>
    </div>
  );
}
