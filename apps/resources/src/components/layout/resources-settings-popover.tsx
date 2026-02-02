"use client";

import React from "react";
import { Settings2, SunMoon, Eye, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/shadcn/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";
import { ThemeSwitch } from "@/components/theme-switch";
import { BaseHubToolbarWrapper } from "@/components/basehub-toolbar-wrapper";

interface ResourcesSettingsPopoverProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  toolbarComponent?: React.ReactNode;
}

export function ResourcesSettingsPopover({
  trigger,
  open,
  onOpenChange,
  toolbarComponent,
}: ResourcesSettingsPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [contentManagementOpen, setContentManagementOpen] = React.useState(true);
  const [showToolbar, setShowToolbar] = React.useState(false);
  
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
          {/* Content Management Section */}
          <Collapsible
            open={contentManagementOpen}
            onOpenChange={setContentManagementOpen}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Content Management
                </p>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                    contentManagementOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="px-1 pb-2">
                {/* Draft Mode Toggle Link */}
                <button
                  type="button"
                  onClick={() => setShowToolbar(!showToolbar)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Draft Mode</span>
                    <span className="text-xs text-muted-foreground">
                      Preview unpublished changes
                    </span>
                  </div>
                  <ChevronRight
                    className={`ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                      showToolbar ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* BaseHub Toolbar (shown when toggled) */}
                {showToolbar && toolbarComponent && (
                  <div className="mt-2 px-2 py-2 rounded-md bg-accent/50">
                    {toolbarComponent}
                  </div>
                )}
                
                {/* Show loading state if toolbar is toggled but component not ready */}
                {showToolbar && !toolbarComponent && (
                  <div className="mt-2 px-2 py-1.5">
                    <div className="text-xs text-muted-foreground italic">
                      Loading toolbar...
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Preferences Section */}
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Preferences
            </p>
          </div>
          <div className="px-1 pb-2">
            {/* Theme Row */}
            <div className="flex items-center justify-between rounded-md px-2 py-1.5">
              <div className="flex items-center gap-3">
                <SunMoon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Theme</span>
              </div>
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
