"use client";

import Link from "next/link";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import {
  Plug,
  ExternalLink,
  Code,
  Settings2,
  SunMoon,
  Building2,
  Users,
  Globe,
  Shield,
  ShieldCheck,
  ChevronRight,
  ArrowRightLeft,
  FileCode2,
  Mail,
  Wand2,
  LayoutGrid,
  TextCursorInput,
  FileText,
  ListChecks,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/shadcn/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";
import { ThemeToggle } from "@repo/ui/custom/theme-toggle";

interface PlatformSettingsPopoverProps {
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Organization settings navigation items
const ORG_SETTINGS_ITEMS = [
  { id: "general", label: "General", icon: Building2, path: "?tab=general" },
  { id: "members", label: "Members", icon: Users, path: "?tab=members" },
  { id: "domains", label: "Domains", icon: Globe, path: "?tab=domains" },
  {
    id: "permissions",
    label: "Permissions",
    icon: Shield,
    path: "/permissions",
  },
  {
    id: "policies",
    label: "Policies",
    icon: ShieldCheck,
    path: "/policies",
  },
  { id: "programs", label: "Programs", icon: LayoutGrid, path: "?tab=programs" },
  { id: "inputs", label: "Inputs", icon: TextCursorInput, path: "?tab=inputs" },
  { id: "documents", label: "Documents", icon: FileText, path: "?tab=documents" },
  { id: "tasks", label: "Tasks & Actions", icon: ListChecks, path: "?tab=tasks" },
  { id: "themes", label: "Themes", icon: SunMoon, path: "?tab=themes" },
] as const;

export function PlatformSettingsPopover({
  trigger,
  open,
  onOpenChange,
}: PlatformSettingsPopoverProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [orgSettingsOpen, setOrgSettingsOpen] = React.useState(true);
  const [integrationsOpen, setIntegrationsOpen] = React.useState(true);
  const [whiteLabelOpen, setWhiteLabelOpen] = React.useState(true);
  const [templateStudioOpen, setTemplateStudioOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const popoverOpen = isControlled ? open : internalOpen;
  const setPopoverOpen = isControlled
    ? onOpenChange || (() => {})
    : setInternalOpen;

  // Check if integration routes are active (for highlighting active menu items)
  const isIntegrationsActive = pathname.startsWith(
    "/settings/integrations",
  );
  const isTemplateEditorActive = pathname.startsWith(
    "/platform-settings/integrations/template-editor",
  );

  // Check if org settings routes are active
  const isOrgSettingsActive =
    organization && pathname.includes(`/org/${organization.id}/settings`);

  // Build org settings base URL
  const orgSettingsBaseUrl = organization
    ? `/org/${organization.id}/settings`
    : null;

  const handleIntegrationsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push("/settings/integrations");
    setPopoverOpen(false);
  };

  const handleTemplateEditorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push("/platform-settings/integrations/template-editor");
    setPopoverOpen(false);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-56 p-0"
          sideOffset={8}
          style={{ zIndex: 200000 }}
          avoidCollisions={false}
        >
          <div className="flex flex-col">
            {/* Organization Settings Section */}
            {organization && orgSettingsBaseUrl && (
              <>
                <Collapsible
                  open={orgSettingsOpen}
                  onOpenChange={setOrgSettingsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        Organization Settings
                      </p>
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                          orgSettingsOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="px-1 pb-2">
                      {ORG_SETTINGS_ITEMS.map((item) => {
                        const href = `${orgSettingsBaseUrl}${item.path}`;
                        // For external links (like permissions), check pathname
                        // For tab-based items, check current tab param
                        const currentTab = searchParams.get("tab") || "general";
                        const isActive = item.path.startsWith("/")
                          ? pathname.includes(item.path)
                          : pathname.includes("/settings") && currentTab === item.id;

                        return (
                          <Link
                            key={item.id}
                            href={href}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(href);
                              setPopoverOpen(false);
                            }}
                            className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground"
                            }`}
                          >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="h-px bg-border" />
              </>
            )}

            {/* Integrations Section */}
            <Collapsible
              open={integrationsOpen}
              onOpenChange={setIntegrationsOpen}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Integrations
                  </p>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                      integrationsOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                <div className="px-1 pb-2">
                  <Link
                    href="/settings/integrations"
                    onClick={handleIntegrationsClick}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isIntegrationsActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    <Plug className="h-4 w-4 text-muted-foreground" />
                    <span>Integrations</span>
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* White Label Section */}
            <Collapsible open={whiteLabelOpen} onOpenChange={setWhiteLabelOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    White Label
                  </p>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                      whiteLabelOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                <div className="px-1 pb-2">
                  <Collapsible
                    open={templateStudioOpen}
                    onOpenChange={setTemplateStudioOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="flex items-center gap-3">
                          <Wand2 className="h-4 w-4 text-muted-foreground" />
                          <span>Template Studio</span>
                        </div>
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                            templateStudioOpen ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <div className="pl-6 pr-1 pb-1">
                        <Link
                          href="/platform-settings/integrations/template-editor"
                          onClick={handleTemplateEditorClick}
                          className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                            isTemplateEditorActive
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground"
                          }`}
                        >
                          <FileCode2 className="h-4 w-4 text-muted-foreground" />
                          <span>Documents (HTML)</span>
                        </Link>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: Add email template editor route
                            console.log("Email templates - coming soon");
                          }}
                        >
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>Emails</span>
                        </button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <button
                    type="button"
                    onClick={() => console.log("Custom code editor coming soon")}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span>Custom Code</span>
                    </div>
                  </button>
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
    </>
  );
}
