"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"

interface DocumentRow {
  id: number
  uuid: string
  documentName: string | null
  fileType: string | null
  uploadedAt: string | null
  downloadUrl: string | null
  documentCategoryId: number | null
}

export function EntityDocumentsTab({
  entityId,
  categoryId,
}: {
  entityId: string
  categoryId: number
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(
          `/api/entities/${encodeURIComponent(entityId)}/documents?categoryId=${categoryId}`,
          { cache: "no-store" },
        )
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled) setDocuments(j.documents ?? [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [entityId, categoryId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading documents...
      </div>
    )
  }

  if (!documents.length) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No documents found.
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
            <th className="pb-2 pr-4 font-medium">Date Uploaded</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4">{doc.documentName || "Untitled"}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {doc.fileType || "—"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {doc.uploadedAt
                  ? new Date(doc.uploadedAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="py-2.5">
                {doc.downloadUrl ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={doc.downloadUrl}
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
