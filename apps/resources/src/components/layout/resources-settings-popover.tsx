"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/shadcn/popover";
import { ThemeToggle } from "@repo/ui/custom/theme-toggle";

interface ResourcesSettingsPopoverProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResourcesSettingsPopover({
  trigger,
  open,
  onOpenChange,
}: ResourcesSettingsPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const popoverOpen = isControlled ? open : internalOpen;
  const setPopoverOpen = isControlled
    ? onOpenChange || (() => {})
    : setInternalOpen;

  const defaultTrigger = (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
      aria-label="Settings"
    >
      <Settings2 className="h-5 w-5" />
    </button>
  );

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-0"
        sideOffset={8}
      >
        <div className="flex flex-col">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Preferences
            </p>
          </div>
          <div className="px-1 pb-2">
            <div className="flex items-center justify-between rounded-md px-2 py-1.5">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18" />
                  <path d="M12 9l4.65 -4.65" />
                  <path d="M12 14.3l7.37 -7.37" />
                  <path d="M12 19.6l8.85 -8.85" />
                </svg>
                <span className="text-sm text-foreground">Theme</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
