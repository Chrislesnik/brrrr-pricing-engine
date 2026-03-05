import * as React from "react";
import { Suspense } from "react";
import { Separator } from "@repo/ui/shadcn/separator";
import { SidebarTrigger } from "@repo/ui/shadcn/sidebar";
import { SearchForm } from "@/components/layout/search-form";
import { ThemeSwitch } from "@/components/theme-switch";
import { DocsBreadcrumb } from "./docs-breadcrumb";

export function DocsHeader() {
  return (
    <Suspense
      fallback={
        <header className="bg-background/95 backdrop-blur-sm flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 rounded-tl-xl rounded-tr-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="bg-border shrink-0 w-[1px] mr-2 h-4"
          />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
          <div className="flex items-center gap-4 ml-auto flex-shrink-0">
            <div className="h-8 w-8" />
            <div className="h-8 w-8" />
          </div>
        </header>
      }
    >
      <header className="bg-background/95 backdrop-blur-sm flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 rounded-tl-xl rounded-tr-xl">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="bg-border shrink-0 w-[1px] mr-2 h-4"
        />
        <div className="min-w-0 flex-1">
          <DocsBreadcrumb />
        </div>
        <div className="flex items-center gap-4 ml-auto flex-shrink-0">
          <SearchForm className="w-full max-w-56 xl:max-w-64" />
          <ThemeSwitch />
        </div>
      </header>
    </Suspense>
  );
}
