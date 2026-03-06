"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import { Badge } from "@repo/ui/shadcn/badge"

interface BackgroundReportRow {
  id: string
  name: string
  type: string
  createdAt: string
  downloadUrl: string | null
}

export function BorrowerBackgroundReportsTab({
  borrowerId,
}: {
  borrowerId: string
}) {
  const [reports, setReports] = useState<BackgroundReportRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(
          `/api/background-reports/by-borrower?borrowerId=${encodeURIComponent(borrowerId)}`,
          { cache: "no-store" },
        )
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled) setReports(j.reports ?? [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [borrowerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading background reports...
      </div>
    )
  }

  if (!reports.length) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No background reports found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Document Name</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4">{r.name || "Background Report"}</td>
              <td className="py-2.5 pr-4">
                <Badge
                  variant={r.type === "entity" ? "default" : "secondary"}
                  className="text-xs capitalize"
                >
                  {r.type || "—"}
                </Badge>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="py-2.5">
                {r.downloadUrl ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={r.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
