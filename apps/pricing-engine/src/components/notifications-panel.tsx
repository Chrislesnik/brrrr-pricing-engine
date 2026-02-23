"use client"

import { useCallback } from "react"
import {
  BellIcon,
  Loader2,
} from "lucide-react"
import {
  useInboxNotifications,
  useMarkAllInboxNotificationsAsRead,
  useMarkInboxNotificationAsRead,
} from "@liveblocks/react/suspense"
import { ClientSideSuspense } from "@liveblocks/react/suspense"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { InboxNotificationData } from "@liveblocks/client"
import TeamNotifications, {
  type NotificationType,
  type TeamNotification,
} from "@/components/ui/team-notifications"

function mapKindToType(kind: string): NotificationType {
  switch (kind) {
    case "thread":
    case "textMention":
      return "mention"
    case "$taskAssignment":
      return "system"
    case "$dealAssignment":
    case "$loanAssignment":
    case "$dealStatusChange":
      return "project_updated"
    case "$applicationCompleted":
      return "system"
    default:
      return "system"
  }
}

function getNotificationContent(notification: InboxNotificationData) {
  const kind = notification.kind
  const activities = (notification as Record<string, unknown>).activities as unknown[] | undefined
  const latestActivity = activities?.[activities.length - 1] as Record<string, unknown> | undefined

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

function NotificationsList({ onOpenChat }: { onOpenChat?: (dealId: string) => void }) {
  const { inboxNotifications } = useInboxNotifications()
  const markAsRead = useMarkInboxNotificationAsRead()
  const markAllAsRead = useMarkAllInboxNotificationsAsRead()

  const mapped: TeamNotification[] = inboxNotifications.map((n) => {
    const { title, description } = getNotificationContent(n)
    const dealId = n.roomId?.startsWith("deal:") ? n.roomId.slice(5) : undefined
    return {
      id: n.id,
      type: mapKindToType(n.kind),
      title,
      message: description,
      read: !!n.readAt,
      timestamp: n.notifiedAt,
      link: dealId ? `/deals/${dealId}` : undefined,
      metadata: { kind: n.kind, dealId },
    }
  })

  const handleNotificationClick = useCallback(
    (notification: TeamNotification) => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
      const kind = notification.metadata?.kind as string | undefined
      const dealId = notification.metadata?.dealId as string | undefined

      if ((kind === "thread" || kind === "textMention") && dealId && onOpenChat) {
        onOpenChat(dealId)
      } else if (notification.link) {
        window.location.href = notification.link
      }
    },
    [markAsRead, onOpenChat]
  )

  return (
    <TeamNotifications
      notifications={mapped}
      onNotificationClick={handleNotificationClick}
      onMarkAsRead={async (id) => markAsRead(id)}
      onMarkAllAsRead={async () => markAllAsRead()}
      showFilters={true}
      className="flex h-full flex-col overflow-hidden"
    />
  )
}

interface NotificationsPanelProps {
  onOpenChat?: (dealId: string) => void
}

export function NotificationsPanel({ onOpenChat }: NotificationsPanelProps) {
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
      <NotificationsList onOpenChat={onOpenChat} />
    </ClientSideSuspense>
  )
}
