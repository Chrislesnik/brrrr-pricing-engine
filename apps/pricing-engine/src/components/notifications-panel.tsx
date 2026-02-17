"use client"

import {
  BellIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  UsersIcon,
  FileTextIcon,
  ArrowRightLeftIcon,
  ClockIcon,
  UserPlusIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  time: string
  unread: boolean
}

const notifications: Notification[] = [
  {
    id: 1,
    icon: <FileTextIcon className="size-4 text-info" />,
    title: "New deal submitted",
    description: "Deal #1042 — 123 Main St was submitted for review.",
    time: "12 min ago",
    unread: true,
  },
  {
    id: 2,
    icon: <CheckCircle2Icon className="size-4 text-success" />,
    title: "Task completed",
    description: "Appraisal review marked as done by Eddie Lake.",
    time: "34 min ago",
    unread: true,
  },
  {
    id: 3,
    icon: <UserPlusIcon className="size-4 text-primary" />,
    title: "Member joined",
    description: "Chris Lesnik accepted the invitation to Brrrr Funder LLC.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 4,
    icon: <ArrowRightLeftIcon className="size-4 text-chart-1" />,
    title: "Deal stage changed",
    description: "Deal #1038 moved from Processing to Underwriting.",
    time: "2 hours ago",
    unread: false,
  },
  {
    id: 5,
    icon: <AlertTriangleIcon className="size-4 text-warning" />,
    title: "Task overdue",
    description: "Title search for Deal #1035 is 2 days past due.",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: 6,
    icon: <UsersIcon className="size-4 text-info" />,
    title: "Broker assigned",
    description: "Aaron Kraut was assigned as account manager for Broker 2 LLC.",
    time: "5 hours ago",
    unread: false,
  },
  {
    id: 7,
    icon: <ShieldCheckIcon className="size-4 text-success" />,
    title: "Policy approved",
    description: "LTV limit policy was approved and is now active.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 8,
    icon: <ClockIcon className="size-4 text-muted-foreground" />,
    title: "Scenario expired",
    description: "Rate lock for Scenario #892 expired. Re-price to continue.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 9,
    icon: <FileTextIcon className="size-4 text-info" />,
    title: "Document uploaded",
    description: "Borrower uploaded appraisal report for Deal #1040.",
    time: "2 days ago",
    unread: false,
  },
  {
    id: 10,
    icon: <CheckCircle2Icon className="size-4 text-success" />,
    title: "Deal funded",
    description: "Deal #1029 — 456 Oak Ave was marked as funded.",
    time: "2 days ago",
    unread: false,
  },
]

export function NotificationsPanel() {
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex-none border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-[10px] font-semibold">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col">
            {notifications.map((notification, idx) => (
              <div key={notification.id}>
                <div
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    notification.unread ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="mt-0.5 flex-none">{notification.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${notification.unread ? "font-semibold" : "font-medium"}`}>
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <span className="mt-1 flex-none size-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {notification.time}
                    </p>
                  </div>
                </div>
                {idx < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
