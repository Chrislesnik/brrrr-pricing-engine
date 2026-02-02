"use client";

import * as React from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Separator } from "@repo/ui/shadcn/separator";
import { SidebarTrigger } from "@repo/ui/shadcn/sidebar";

const ThemeSwitch = dynamic(
  () => import("@/components/theme-switch").then((mod) => mod.ThemeSwitch),
  { ssr: false },
);

interface ResourcesHeaderProps {
  breadcrumb?: React.ReactNode;
  title?: string;
}

function ResourcesHeaderContent({ breadcrumb, title }: ResourcesHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayTitle = title || "Lender Resources";

  return (
    <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 rounded-tl-xl rounded-tr-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="bg-border shrink-0 w-[1px] mr-2 h-4"
      />
      {mounted ? (
        breadcrumb || (
          <h1 className="text-base font-medium truncate flex-shrink min-w-0 max-w-md">
            {displayTitle}
          </h1>
        )
      ) : (
        <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
      )}
      <div className="flex items-center gap-4 ml-auto flex-shrink-0">
        <ThemeSwitch />
      </div>
    </header>
  );
}

export function ResourcesHeader({ breadcrumb, title }: ResourcesHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 rounded-tl-xl rounded-tr-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="bg-border shrink-0 w-[1px] mr-2 h-4"
          />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        </header>
      }
    >
      <ResourcesHeaderContent breadcrumb={breadcrumb} title={title} />
    </Suspense>
  );
}
