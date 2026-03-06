"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"

interface CreditReportRow {
  id: string
  name: string
  created_at: string
  status: string
  url?: string | null
}

function getReportStatus(createdAt: string | null): { label: string; colorVar: string; bgVar: string } {
  if (!createdAt) return { label: "Unknown", colorVar: "--muted-foreground", bgVar: "--muted" }
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays > 90) return { label: "Expired", colorVar: "--danger", bgVar: "--danger-muted" }
  if (ageDays >= 75) return { label: "Expiring Soon", colorVar: "--warning", bgVar: "--warning-muted" }
  return { label: "Valid", colorVar: "--success", bgVar: "--success-muted" }
}

export function BorrowerCreditReportsTab({
  borrowerId,
}: {
  borrowerId: string
}) {
  const [reports, setReports] = useState<CreditReportRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(
          `/api/credit-reports?borrowerId=${encodeURIComponent(borrowerId)}`,
          { cache: "no-store" },
        )
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled) setReports(j.documents ?? [])
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
        Loading credit reports...
      </div>
    )
  }

  if (!reports.length) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No credit reports found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Document Name</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => {
            const { label, colorVar, bgVar } = getReportStatus(r.created_at)
            return (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4">{r.name || "Credit Report"}</td>
              <td className="py-2.5 pr-4">
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `hsl(var(${bgVar}))`,
                    color: `hsl(var(${colorVar}))`,
                  }}
                >
                  {label}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="py-2.5">
                {r.url ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={r.url}
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
