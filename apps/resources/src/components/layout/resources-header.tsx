import * as React from "react";
import { Suspense } from "react";
import { Settings } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Separator } from "@repo/ui/shadcn/separator";
import { SidebarTrigger } from "@repo/ui/shadcn/sidebar";
import { SearchForm } from "@/components/layout/search-form";
import { ResourcesSettingsPopover } from "./resources-settings-popover";
import { ThemeSwitch } from "@/components/theme-switch";

interface ResourcesHeaderProps {
  breadcrumb?: React.ReactNode;
  title?: string;
  toolbarComponent?: React.ReactNode;
}

export function ResourcesHeader({
  breadcrumb,
  title,
  toolbarComponent,
}: ResourcesHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="bg-background/95 flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="bg-border shrink-0 w-[1px] mr-2 h-4"
          />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        </header>
      }
    >
      <header className="bg-background/95 flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="bg-border shrink-0 w-[1px] mr-2 h-4"
        />
        {breadcrumb || (
          <span className="text-sm font-medium text-muted-foreground truncate flex-shrink min-w-0">
            {title || "Resource Hub"}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <SearchForm className="w-full max-w-48 xl:max-w-56" />
          <ResourcesSettingsPopover
            toolbarComponent={toolbarComponent}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            }
          />
          <ThemeSwitch />
        </div>
      </header>
    </Suspense>
  );
}
