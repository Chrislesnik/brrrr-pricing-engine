"use client";

import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  MoreVertical,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export type NotificationType =
  | "mention"
  | "ai_event"
  | "member_joined"
  | "file_shared"
  | "note_updated"
  | "project_updated"
  | "system";

export interface TeamNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  link?: string;
  read: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TeamNotificationsProps {
  notifications?: TeamNotification[];
  onNotificationClick?: (notification: TeamNotification) => void;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onDelete?: (notificationId: string) => Promise<void>;
  onClearAll?: () => Promise<void>;
  className?: string;
  showFilters?: boolean;
  unreadCount?: number;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "mention":
      return MessageSquare;
    case "ai_event":
      return Bell;
    default:
      return Bell;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeamNotifications({
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  className,
  showFilters = true,
  unreadCount,
}: TeamNotificationsProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredNotifications = notifications.filter((notification) => {
    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && !notification.read) ||
      (statusFilter === "read" && notification.read);
    return matchesType && matchesStatus;
  });

  const unreadNotifications = filteredNotifications.filter((n) => !n.read);
  const displayUnreadCount = unreadCount ?? unreadNotifications.length;

  return (
    <Card className={cn("w-full shadow-xs", className)}>
      <CardHeader className="flex-none border-b px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                Notifications
              </CardTitle>
              {displayUnreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 rounded-full px-1.5 text-[10px] font-semibold"
                >
                  {displayUnreadCount}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {onMarkAllAsRead && displayUnreadCount > 0 && (
                <Button
                  onClick={onMarkAllAsRead}
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </Button>
              )}
              {onClearAll && (
                <Button
                  onClick={onClearAll}
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="flex gap-2">
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="mention">Mentions</SelectItem>
                  <SelectItem value="ai_event">AI Events</SelectItem>
                  <SelectItem value="member_joined">Members</SelectItem>
                  <SelectItem value="file_shared">Files</SelectItem>
                  <SelectItem value="note_updated">Notes</SelectItem>
                  <SelectItem value="project_updated">Projects</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {filteredNotifications.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell className="size-6" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">
                  {typeFilter !== "all" || statusFilter !== "all"
                    ? "No notifications match your filters"
                    : "No notifications yet"}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col">
              {filteredNotifications.map((notification, idx) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div key={notification.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        !notification.read && "bg-muted/30",
                        "hover:bg-muted/50",
                        onNotificationClick && "cursor-pointer"
                      )}
                      onClick={() => onNotificationClick?.(notification)}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          notification.read
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {notification.user ? (
                          <Avatar className="size-8">
                            <AvatarImage
                              alt={notification.user.name}
                              src={notification.user.avatar}
                            />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(notification.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={cn(
                              "text-sm leading-tight",
                              !notification.read
                                ? "font-semibold"
                                : "font-medium"
                            )}
                          >
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label="More options"
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="size-6 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read && onMarkAsRead && (
                            <DropdownMenuItem
                              onClick={() => onMarkAsRead(notification.id)}
                            >
                              <Check className="size-4" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                          {notification.link && (
                            <DropdownMenuItem asChild>
                              <a href={notification.link}>
                                <MessageSquare className="size-4" />
                                View
                              </a>
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => onDelete(notification.id)}
                              className="text-destructive focus:text-destructive"
                            >
                                <X className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </button>
                    {idx < filteredNotifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
