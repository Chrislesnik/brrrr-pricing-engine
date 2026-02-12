"use client";

import * as React from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SlashIcon, Settings, ChevronDown } from "lucide-react";
import { Separator } from "@repo/ui/shadcn/separator";
import { SidebarTrigger } from "@repo/ui/shadcn/sidebar";
import { TeamSwitcherV2 } from "@/components/layout/team-switcher-v2";
import { useUser } from "@clerk/nextjs";
import { getBreadcrumbSegments } from "@/app/(pricing-engine)/config/navigation";

// Dynamic imports with ssr: false to prevent hydration mismatches
const SearchForm = dynamic(
  () => import("@/components/layout/search-form").then((mod) => mod.SearchForm),
  { ssr: false },
);
const ThemeSwitch = dynamic(
  () => import("@/components/theme-switch").then((mod) => mod.ThemeSwitch),
  { ssr: false },
);
const PlatformSettingsPopover = dynamic(
  () =>
    import("@/components/layout/platform-settings-popover").then(
      (mod) => mod.PlatformSettingsPopover,
    ),
  { ssr: false },
);
const ImpersonationSwitcher = dynamic(
  () =>
    import("@/components/layout/impersonation-switcher").then(
      (mod) => mod.ImpersonationSwitcher,
    ),
  { ssr: false },
);

import { Button } from "@repo/ui/shadcn/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/shadcn/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/shadcn/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";

interface SiteHeaderProps {
  breadcrumb?: React.ReactNode;
  dealName?: string;
}

function generateBreadcrumbs(pathname: string): React.ReactNode {
  const segments = getBreadcrumbSegments(pathname);

  // Handle simple single-segment breadcrumbs (like Dashboard)
  if (segments.length === 1) {
    const title = segments[0].label;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <h1 className="text-base font-medium truncate flex-shrink min-w-0 max-w-md cursor-default">
              {title}
            </h1>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <p className="max-w-xs">{title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const breadcrumbElements = segments.flatMap((segment, index) => {
    const isLast = index === segments.length - 1;
    const itemKey = `item-${index}`;
    const separatorKey = `sep-${index}`;

    const item = (
      <BreadcrumbItem key={itemKey}>
        {isLast || !segment.href ? (
          <BreadcrumbPage
            className={!isLast ? "text-muted-foreground" : undefined}
          >
            {segment.label}
          </BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={segment.href}>{segment.label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    );

    if (isLast) {
      return [item];
    }

    return [
      item,
      <BreadcrumbSeparator key={separatorKey}>
        <SlashIcon />
      </BreadcrumbSeparator>,
    ];
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbElements}</BreadcrumbList>
    </Breadcrumb>
  );
}

function SiteHeaderContent({ breadcrumb, dealName }: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showTeamSwitcher, setShowTeamSwitcher] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { user } = useUser();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    user?.organizationMemberships?.[0]?.role === "org:admin";

  const handleOpenTeamSwitcher = () => {
    setShowTeamSwitcher(true);
  };

  return (
    <>
      <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 rounded-tl-xl rounded-tr-xl">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="bg-border shrink-0 w-[1px] mr-2 h-4"
        />
        {mounted ? (
          breadcrumb || generateBreadcrumbs(pathname)
        ) : (
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        )}
        <div className="flex items-center gap-4 ml-auto flex-shrink-0">
          {mounted ? (
            <>
              <SearchForm
                className="w-full max-w-56 xl:max-w-64"
                onOpenTeamSwitcher={handleOpenTeamSwitcher}
              />
              {isAdmin && <ImpersonationSwitcher />}
              <PlatformSettingsPopover
                trigger={
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Platform Settings</span>
                  </Button>
                }
              />
              <ThemeSwitch />
            </>
          ) : (
            <>
              <div className="w-full max-w-56 xl:max-w-64 h-8" />
              <div className="h-8 w-8" />
              <div className="h-8 w-8" />
            </>
          )}
        </div>
      </header>

      {/* Team Switcher Dialog */}
      <Dialog open={showTeamSwitcher} onOpenChange={setShowTeamSwitcher}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Organization</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <TeamSwitcherV2 />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SiteHeader({ breadcrumb, dealName }: SiteHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 rounded-tl-xl rounded-tr-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="bg-border shrink-0 w-[1px] mr-2 h-4"
          />
          <div className="flex items-center gap-4 ml-auto flex-shrink-0">
            <div className="h-8 w-8" />
            <div className="h-8 w-8" />
          </div>
        </header>
      }
    >
      <SiteHeaderContent breadcrumb={breadcrumb} dealName={dealName} />
    </Suspense>
  );
}
