"use client"

import { GlobeLock, Sparkles } from "lucide-react"

export function WebsitesTab() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6">
        <GlobeLock className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium">Landing Page Builder</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Design and publish branded landing pages for your deals,
          listings, and marketing campaigns.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3 w-3" />
        Coming Soon
      </span>
    </div>
  )
}
