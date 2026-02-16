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
  MessageSquare,
  Monitor,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

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
      // Force page reload to ensure clean state
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign out error:", error);
      // Force redirect even if signOut fails
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
            <Table>
              <TableHeader>
                <TableRow className="[&_div]:flex [&_div]:items-center [&_div]:justify-center [&_div]:gap-1.5 [&_div]:font-semibold [&_div]:text-muted-foreground/80 [&_div_svg]:size-4">
                  <TableHead>
                    <div className="!justify-start">
                      <Bell className="size-4" /> Notify me about
                    </div>
                  </TableHead>
                  <TableHead>
                    <div>
                      <Mail className="size-4" /> Email
                    </div>
                  </TableHead>
                  <TableHead>
                    <div>
                      <MessageSquare className="size-4" /> SMS
                    </div>
                  </TableHead>
                  <TableHead>
                    <div>
                      <Hash className="size-4" /> Slack
                    </div>
                  </TableHead>
                  <TableHead>
                    <div>
                      <Monitor className="size-4" /> Teams
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {NOTIFICATION_SETTINGS.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-xs font-medium text-muted-foreground/70">
                        {n.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox defaultChecked={n.email} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox defaultChecked={n.sms} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox defaultChecked={n.slack} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox defaultChecked={n.teams} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const NOTIFICATION_SETTINGS = [
  {
    id: "mentions",
    title: "Direct Mentions",
    description: "Get notified when a team member tags you with @.",
    email: true,
    sms: false,
    slack: true,
    teams: false,
  },
  {
    id: "comments",
    title: "Comments",
    description: "Receive updates when someone comments on a loan, deal, or task you're involved in.",
    email: true,
    sms: false,
    slack: true,
    teams: false,
  },
  {
    id: "task-assignment",
    title: "Task Assignments",
    description: "Get notified when a task is assigned to you or your team.",
    email: true,
    sms: false,
    slack: true,
    teams: true,
  },
  {
    id: "loan-assignment",
    title: "Loan Assignments",
    description: "Get notified when a loan scenario is assigned to you.",
    email: true,
    sms: false,
    slack: true,
    teams: true,
  },
  {
    id: "deal-assignment",
    title: "Deal Assignments",
    description: "Get notified when you're added to a deal as an assignee.",
    email: true,
    sms: false,
    slack: true,
    teams: true,
  },
  {
    id: "application-completed",
    title: "Application Completed",
    description: "Get notified when a borrower completes and submits their application.",
    email: true,
    sms: true,
    slack: true,
    teams: false,
  },
  {
    id: "deal-status",
    title: "Deal Status Changes",
    description: "Get notified when a deal moves to a new stage in the pipeline.",
    email: true,
    sms: false,
    slack: true,
    teams: false,
  },
];
