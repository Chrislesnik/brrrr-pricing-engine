"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Hash,
  Mail,
  Monitor,
  Loader2,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useNotificationSettings } from "@liveblocks/react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/shadcn/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";

type Channel = "email" | "slack" | "teams";
type Kind = "thread" | "textMention" | "$taskAssignment" | "$loanAssignment" | "$dealAssignment" | "$applicationCompleted" | "$dealStatusChange";

const CHANNELS: { key: Channel; label: string; icon: React.ReactNode }[] = [
  { key: "email", label: "Email", icon: <Mail className="size-4" /> },
  { key: "slack", label: "Slack", icon: <Hash className="size-4" /> },
  { key: "teams", label: "Teams", icon: <Monitor className="size-4" /> },
];

const NOTIFICATION_KINDS: { kind: Kind; title: string; description: string }[] = [
  {
    kind: "textMention",
    title: "Direct Mentions",
    description: "Get notified when a team member tags you with @.",
  },
  {
    kind: "thread",
    title: "Comments",
    description: "Receive updates when someone comments on a loan, deal, or task you're involved in.",
  },
  {
    kind: "$taskAssignment",
    title: "Task Assignments",
    description: "Get notified when a task is assigned to you or your team.",
  },
  {
    kind: "$loanAssignment",
    title: "Loan Assignments",
    description: "Get notified when a loan scenario is assigned to you.",
  },
  {
    kind: "$dealAssignment",
    title: "Deal Assignments",
    description: "Get notified when you're added to a deal as an assignee.",
  },
  {
    kind: "$applicationCompleted",
    title: "Application Completed",
    description: "Get notified when a borrower completes and submits their application.",
  },
  {
    kind: "$dealStatusChange",
    title: "Deal Status Changes",
    description: "Get notified when a deal moves to a new stage in the pipeline.",
  },
];

function NotificationSettingsTable() {
  const [{ isLoading, error, settings }, updateSettings] =
    useNotificationSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading preferences...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load notification preferences.
      </div>
    );
  }

  function getChecked(channel: Channel, kind: Kind): boolean {
    const channelSettings = settings?.[channel] as Record<string, boolean> | null | undefined;
    if (!channelSettings) return false;
    return Boolean(channelSettings[kind]);
  }

  function handleToggle(channel: Channel, kind: Kind, checked: boolean) {
    updateSettings({ [channel]: { [kind]: checked } });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="[&_div]:flex [&_div]:items-center [&_div]:justify-center [&_div]:gap-1.5 [&_div]:font-semibold [&_div]:text-muted-foreground/80 [&_div_svg]:size-4">
          <TableHead>
            <div className="!justify-start">
              <Bell className="size-4" /> Notify me about
            </div>
          </TableHead>
          {CHANNELS.map((ch) => (
            <TableHead key={ch.key}>
              <div>
                {ch.icon} {ch.label}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {NOTIFICATION_KINDS.map((n) => (
          <TableRow key={n.kind}>
            <TableCell>
              <p className="font-semibold">{n.title}</p>
              <p className="text-xs font-medium text-muted-foreground/70">
                {n.description}
              </p>
            </TableCell>
            {CHANNELS.map((ch) => {
              const channelSettings = settings?.[ch.key];
              if (!channelSettings) {
                return (
                  <TableCell key={ch.key} className="text-center">
                    <Checkbox disabled checked={false} />
                  </TableCell>
                );
              }
              return (
                <TableCell key={ch.key} className="text-center">
                  <Checkbox
                    checked={getChecked(ch.key, n.kind)}
                    onCheckedChange={(checked) =>
                      handleToggle(ch.key, n.kind, Boolean(checked))
                    }
                  />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile, state } = useSidebar();
  const { signOut, openUserProfile } = useClerk();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: "/sign-in" });
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/sign-in";
    }
  };

  const handleAccountClick = () => {
    openUserProfile();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-lg hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-button"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="grid flex-1 text-left">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {user.email}
                  </span>
                </div>
              )}
              {!isCollapsed && <ChevronsUpDown className="ml-auto size-4" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleAccountClick}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              {/* Billing hidden for now
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setNotificationsOpen(true);
                }}
              >
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
              <p className="text-sm font-medium text-muted-foreground">
                Manage your notification preferences
              </p>
            </DialogHeader>
            <NotificationSettingsTable />
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
