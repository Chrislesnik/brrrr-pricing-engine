"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  BookOpen,
  ChevronsUpDown,
  Check,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";
import { useSidebar } from "../shadcn/sidebar";

interface Workspace {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  href: string;
  prefixes: string[];
  port?: number; // For local development
}

const workspaces: Workspace[] = [
  {
    id: "lender-platform",
    label: "Lender Platform",
    shortLabel: "Lender Platform",
    description: "Lender Platform",
    icon: Building2,
    href: "/pipeline",
    prefixes: [
      "/dashboard",
      "/balance-sheet",
      "/platform-settings",
      "/pipeline",
      "/pricing",
      "/applications",
      "/applicants",
      "/brokers",
      "/users",
      "/settings",
      "/ai-agent",
    ],
    port: 3000,
  },
  {
    id: "docs",
    label: "Documentation",
    shortLabel: "Docs",
    description: "API & developer docs",
    icon: FileText,
    href: "/docs",
    prefixes: ["/docs", "/test-basehub"],
    port: 3002,
  },
  {
    id: "resources",
    label: "Resources",
    shortLabel: "Resources",
    description: "Resources",
    icon: BookOpen,
    href: "/resources",
    prefixes: ["/resources"],
    port: 3001,
  },
];

export function WorkspaceSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const currentWorkspace =
    workspaces.find((ws) => ws.prefixes.some((p) => pathname.startsWith(p))) ||
    workspaces[0];

  const handleWorkspaceChange = (workspace: Workspace) => {
    // In development, navigate to the appropriate port
    if (process.env.NODE_ENV === "development" && workspace.port) {
      const isDifferentApp = !workspace.prefixes.some((p) =>
        pathname.startsWith(p)
      );

      if (isDifferentApp) {
        window.location.href = `http://localhost:${workspace.port}${workspace.href}`;
        return;
      }
    }

    // Same app navigation
    router.push(workspace.href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-sidebar-accent/10 px-2.5 py-1 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-sidebar-ring w-fit">
          <currentWorkspace.icon className="size-3.5" />
          <span>{currentWorkspace.shortLabel}</span>
          <ChevronsUpDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={4}
      >
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => handleWorkspaceChange(ws)}
            className="gap-3 p-2.5"
          >
            <div className="flex size-8 items-center justify-center rounded-md border bg-background">
              <ws.icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="font-medium">{ws.label}</span>
              <span className="text-xs text-muted-foreground">
                {ws.description}
              </span>
            </div>
            {currentWorkspace.id === ws.id && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
