"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PdfThumbnail, FileThumbnail } from "@/components/pdf-thumbnail"
import { cn } from "@/lib/utils"

export interface ProgramRow {
  id: string
  loan_type: "dscr" | "bridge" | string
  internal_name: string
  external_name: string
  webhook_url: string | null
  status: "active" | "inactive"
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: ProgramRow
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>
  orgId?: string | null
}

export function EditProgramDialog({ open, onOpenChange, program, action, orgId }: Props) {
  const [loanType, setLoanType] = useState<"" | "dscr" | "bridge">("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [internalName, setInternalName] = useState("")
  const [externalName, setExternalName] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [existingDocs, setExistingDocs] = useState<
    { id: string; title: string | null; storage_path: string; status: string; mime_type?: string | null }[]
  >([])
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [deleteIds, setDeleteIds] = useState<Record<string, boolean>>({})
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setLoanType((program.loan_type as "dscr" | "bridge") || "")
    setStatus(program.status)
    setInternalName(program.internal_name)
    setExternalName(program.external_name)
    setWebhookUrl(program.webhook_url ?? "")
    setSignedUrls({})
    // Load current documents
    ;(async () => {
      try {
        const res = await fetch(`/api/programs/${program.id}/documents`, { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          const docs = json.documents || []
          setExistingDocs(docs)
          // Fetch signed URLs for each document
          const urls: Record<string, string> = {}
          await Promise.all(
            docs.map(async (d: { storage_path: string }) => {
              try {
                const urlRes = await fetch(
                  `/api/programs/${program.id}/documents/url?path=${encodeURIComponent(d.storage_path)}`
                )
                if (urlRes.ok) {
                  const urlJson = await urlRes.json()
                  if (urlJson.url) {
                    urls[d.storage_path] = urlJson.url
                  }
                }
              } catch {
                // ignore individual failures
              }
            })
          )
          setSignedUrls(urls)
        } else {
          setExistingDocs([])
        }
      } catch {
        setExistingDocs([])
      }
      setFilesToUpload([])
      setDeleteIds({})
    })()
  }, [open, program])

  const canSave =
    !!loanType && internalName.trim().length > 0 && externalName.trim().length > 0

  const onSubmit = () => {
    if (!canSave) return
    const fd = new FormData()
    fd.set("id", program.id)
    if (orgId) fd.set("orgId", orgId)
    fd.set("loanType", loanType)
    fd.set("status", status)
    fd.set("internalName", internalName.trim())
    fd.set("externalName", externalName.trim())
    fd.set("webhookUrl", webhookUrl.trim())
    // mark deletions
    const ids = Object.keys(deleteIds).filter((k) => deleteIds[k])
    fd.set("deleteDocumentIds", JSON.stringify(ids))
    // files
    for (const f of filesToUpload) {
      fd.append("files", f)
    }
    setError(null)
    startTransition(async () => {
      const res = await action(fd)
      if (!res.ok) {
        setError(res.error ?? "Failed to save")
        return
      }
      onOpenChange(false)
    })
  }

  const pendingDeleteCount = useMemo(() => Object.values(deleteIds).filter(Boolean).length, [deleteIds])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit program</DialogTitle>
          <DialogDescription>Update the fields and click Save.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Label htmlFor="id">ID</Label>
          <Input id="id" value={program.id} readOnly className="font-mono text-xs" />

          <Label htmlFor="loanType">Loan Type</Label>
          <Select
            value={loanType}
            onValueChange={(v) => setLoanType(v as "dscr" | "bridge")}
          >
            <SelectTrigger id="loanType">
              <SelectValue placeholder="Select loan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dscr">DSCR</SelectItem>
              <SelectItem value="bridge">Bridge</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="activeStatus">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
            <SelectTrigger id="activeStatus">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="inactive">inactive</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="internalName">Internal name</Label>
          <Input
            id="internalName"
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            placeholder="Internal name"
          />
          <Label htmlFor="externalName">External name</Label>
          <Input
            id="externalName"
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            placeholder="External name"
          />
          <Label htmlFor="webhookUrl">Webhook URL</Label>
          <Input
            id="webhookUrl"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Webhook URL"
          />
          {/* Documents section */}
          <div className="mt-2 rounded-md border p-3 overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <Label>Documents (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {existingDocs.length} saved{pendingDeleteCount ? `, ${pendingDeleteCount} to remove` : ""}
                {filesToUpload.length ? `, ${filesToUpload.length} new` : ""}
              </span>
            </div>
            
            {/* Existing documents grid */}
            {existingDocs.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {existingDocs.map((d) => {
                  const isPdf = d.mime_type === "application/pdf" || d.storage_path.endsWith(".pdf")
                  const filename = d.title || d.storage_path.split("/").at(-1) || "Document"
                  const isMarkedForDelete = !!deleteIds[d.id]
                  const signedUrl = signedUrls[d.storage_path]

                  return (
                    <div
                      key={d.id}
                      className={cn(
                        "relative flex flex-col items-center rounded-md border bg-muted/30 p-2 transition-opacity",
                        isMarkedForDelete && "opacity-50"
                      )}
                    >
                      {/* Thumbnail */}
                      {isPdf && signedUrl ? (
                        <PdfThumbnail
                          url={signedUrl}
                          title={filename}
                          width={100}
                          height={130}
                          className="mb-2"
                        />
                      ) : (
                        <div className="mb-2 flex h-[130px] w-[100px] items-center justify-center rounded-sm border bg-white shadow-md">
                          <span className="text-2xl text-muted-foreground">📄</span>
                        </div>
                      )}

                      {/* Filename */}
                      <span
                        className="w-full truncate text-center text-xs font-medium"
                        title={filename}
                      >
                        {filename}
                      </span>

                      {/* Status badge */}
                      <Badge
                        variant={d.status === "indexed" ? "default" : "secondary"}
                        className="mt-1 text-[10px]"
                      >
                        {d.status}
                      </Badge>

                      {/* Remove checkbox */}
                      <label className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox
                          checked={isMarkedForDelete}
                          onCheckedChange={(checked) =>
                            setDeleteIds((m) => ({
                              ...m,
                              [d.id]: !!checked,
                            }))
                          }
                        />
                        Remove
                      </label>
                    </div>
                  )
                })}
              </div>
            )}

            {existingDocs.length === 0 && filesToUpload.length === 0 && (
              <p className="mb-3 text-sm text-muted-foreground">No documents uploaded yet.</p>
            )}

            {/* New files to upload grid */}
            {filesToUpload.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filesToUpload.map((file, idx) => {
                  const filename = file.name

                  return (
                    <div
                      key={`new-${idx}`}
                      className="relative flex flex-col items-center rounded-md border border-dashed border-primary/50 bg-primary/5 p-2"
                    >
                      <FileThumbnail file={file} width={100} height={130} className="mb-2" />

                      <span
                        className="w-full truncate text-center text-xs font-medium"
                        title={filename}
                      >
                        {filename}
                      </span>

                      <Badge variant="outline" className="mt-1 text-[10px]">
                        new
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}

            <Input
              id="programDocs"
              type="file"
              multiple
              accept=".pdf"
              className="truncate"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                setFilesToUpload(files)
              }}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSave || pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


