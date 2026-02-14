"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { AppCommandDialog } from "@/components/layout/app-command-dialog";
import { cn } from "@repo/lib/cn";

interface SearchFormProps extends React.ComponentProps<"div"> {
  onOpenTeamSwitcher?: () => void;
  variant?: "default" | "sidebar";
  disableShortcut?: boolean;
}

export function SearchForm({
  className,
  onOpenTeamSwitcher,
  variant = "default",
  disableShortcut = false,
  ...props
}: SearchFormProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (disableShortcut) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [disableShortcut]);

  return (
    <>
      <div className={className} {...props}>
        <Button
          variant="outline"
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-4 py-2 relative h-8 w-full justify-start rounded-md text-sm font-normal shadow-none sm:pr-12",
            variant === "default"
              ? "border border-input bg-muted/25 text-muted-foreground hover:bg-muted/50 hover:text-accent-foreground focus-visible:ring-ring md:w-40 lg:w-56 xl:w-64"
              : "border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring md:w-full lg:w-full xl:w-full",
            variant === "sidebar" && "group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center"
          )}
          onClick={() => setOpen(true)}
        >
          <Search 
            className={cn(
              "absolute top-1/2 left-1.5 -translate-y-1/2 size-4",
              variant === "sidebar" && "group-data-[collapsible=icon]:static group-data-[collapsible=icon]:translate-y-0"
            )} 
          />
          <span 
            className={cn(
              "ml-3",
              variant === "sidebar" && "group-data-[collapsible=icon]:hidden"
            )}
          >
            Search
          </span>
          <kbd 
            className={cn(
              "pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex",
              variant === "default" 
                ? "bg-muted"
                : "bg-sidebar-accent border-sidebar-border",
              variant === "sidebar" && "group-data-[collapsible=icon]:hidden"
            )}
          >
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
      <AppCommandDialog
        open={open}
        onOpenChange={setOpen}
        onOpenTeamSwitcher={onOpenTeamSwitcher}
      />
    </>
  );
}
