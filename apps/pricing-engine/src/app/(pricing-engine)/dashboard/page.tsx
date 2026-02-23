"use client"

import { useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { NotificationsPanel } from "@/components/notifications-panel"
import { InlineCommentsPanel } from "@/components/liveblocks/comments-panel"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function DashboardPage() {
  const [chatDealId, setChatDealId] = useState<string | null>(null)

  return (
    <div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[1fr_320px] lg:px-6">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <ChartAreaInteractive />
          <DataTable />
        </div>
        <NotificationsPanel onOpenChat={(dealId) => setChatDealId(dealId)} />
      </div>

      <Sheet
        open={chatDealId !== null}
        onOpenChange={(open) => {
          if (!open) setChatDealId(null)
        }}
      >
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              {chatDealId ? `Deal ${chatDealId.slice(0, 8)}...` : "Deal Comments"}
            </SheetTitle>
            <SheetDescription>
              View and add comments for this deal
            </SheetDescription>
          </SheetHeader>
          {chatDealId && (
            <div className="min-h-0 flex-1">
              <InlineCommentsPanel dealId={chatDealId} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
