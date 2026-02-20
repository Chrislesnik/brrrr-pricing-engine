"use client"

import { useCallback } from "react"
import {
  BellIcon,
  CheckCircle2Icon,
  UserPlusIcon,
  ArrowRightLeftIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  LinkIcon,
  Loader2,
} from "lucide-react"
import {
  useInboxNotifications,
  useMarkAllInboxNotificationsAsRead,
  useMarkInboxNotificationAsRead,
} from "@liveblocks/react/suspense"
import { ClientSideSuspense } from "@liveblocks/react/suspense"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { InboxNotificationData } from "@liveblocks/client"

function getNotificationIcon(kind: string) {
  switch (kind) {
    case "thread":
    case "textMention":
      return <FileTextIcon className="size-4 text-info" />
    case "$taskAssignment":
      return <ClipboardCheckIcon className="size-4 text-primary" />
    case "$loanAssignment":
      return <LinkIcon className="size-4 text-chart-1" />
    case "$dealAssignment":
      return <UserPlusIcon className="size-4 text-primary" />
    case "$applicationCompleted":
      return <CheckCircle2Icon className="size-4 text-success" />
    case "$dealStatusChange":
      return <ArrowRightLeftIcon className="size-4 text-chart-1" />
    default:
      return <BellIcon className="size-4 text-muted-foreground" />
  }
}

function getNotificationContent(notification: InboxNotificationData) {
  const kind = notification.kind
  const activities = notification.activities ?? []
  const latestActivity = activities[activities.length - 1] as Record<string, unknown> | undefined

  switch (kind) {
    case "thread":
      return {
        title: "New comment activity",
        description: "You have new activity in a comment thread.",
      }
    case "textMention":
      return {
        title: "You were mentioned",
        description: "Someone mentioned you in a comment.",
      }
    case "$taskAssignment": {
      const taskName = (latestActivity?.taskName as string) || "a task"
      const assignerName = (latestActivity?.assignerName as string) || "Someone"
      return {
        title: "Task assigned to you",
        description: `${assignerName} assigned you to ${taskName}.`,
      }
    }
    case "$loanAssignment": {
      const assignerName = (latestActivity?.assignerName as string) || "Someone"
      return {
        title: "Loan scenario assigned",
        description: `${assignerName} assigned a loan scenario to you.`,
      }
    }
    case "$dealAssignment": {
      const dealName = (latestActivity?.dealName as string) || "a deal"
      const assignerName = (latestActivity?.assignerName as string) || "Someone"
      return {
        title: "Added to a deal",
        description: `${assignerName} added you to ${dealName}.`,
      }
    }
    case "$applicationCompleted": {
      const borrowerName = (latestActivity?.borrowerName as string) || "A borrower"
      return {
        title: "Application completed",
        description: `${borrowerName} completed and submitted their application.`,
      }
    }
    case "$dealStatusChange": {
      const dealName = (latestActivity?.dealName as string) || "A deal"
      const newStage = (latestActivity?.newStage as string) || "a new stage"
      return {
        title: "Deal stage changed",
        description: `${dealName} moved to ${newStage}.`,
      }
    }
    default:
      return {
        title: "Notification",
        description: "You have a new notification.",
      }
  }
}

function formatTime(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

function NotificationsList() {
  const { inboxNotifications } = useInboxNotifications()
  const markAsRead = useMarkInboxNotificationAsRead()
  const markAllAsRead = useMarkAllInboxNotificationsAsRead()

  const unreadCount = inboxNotifications.filter((n) => !n.readAt).length

  const handleClick = useCallback(
    (notification: InboxNotificationData) => {
      if (!notification.readAt) {
        markAsRead(notification.id)
      }
      // Navigate to the relevant page if the notification has a roomId
      if (notification.roomId?.startsWith("deal:")) {
        const dealId = notification.roomId.slice(5)
        window.location.href = `/deals/${dealId}`
      }
    },
    [markAsRead]
  )

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex-none border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Badge
                  variant="secondary"
                  className="h-5 rounded-full px-1.5 text-[10px] font-semibold"
                >
                  {unreadCount}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => markAllAsRead()}
                >
                  Mark all read
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col">
            {inboxNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellIcon className="mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              inboxNotifications.map((notification, idx) => {
                const isUnread = !notification.readAt
                const { title, description } = getNotificationContent(notification)
                const icon = getNotificationIcon(notification.kind)

                return (
                  <div key={notification.id}>
                    <button
                      type="button"
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        isUnread ? "bg-muted/30" : ""
                      }`}
                      onClick={() => handleClick(notification)}
                    >
                      <div className="mt-0.5 flex-none">{icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-tight ${
                              isUnread ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {title}
                          </p>
                          {isUnread && (
                            <span className="mt-1 flex-none size-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {description}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {formatTime(notification.notifiedAt)}
                        </p>
                      </div>
                    </button>
                    {idx < inboxNotifications.length - 1 && <Separator />}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function NotificationsPanel() {
  return (
    <ClientSideSuspense
      fallback={
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="flex-none border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <BellIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center p-0">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }
    >
      <NotificationsList />
    </ClientSideSuspense>
  )
}
