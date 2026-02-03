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
import { 
  useSidebar, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "../shadcn/sidebar";

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
    href: "/pricing",
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
      "/org",
      "/contacts",
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
  const { isMobile, state } = useSidebar();

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

  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton 
              tooltip={currentWorkspace.label}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <currentWorkspace.icon />
              <span>{currentWorkspace.shortLabel}</span>
              {!isCollapsed && <ChevronsUpDown className="ml-auto size-4 shrink-0" />}
            </SidebarMenuButton>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
