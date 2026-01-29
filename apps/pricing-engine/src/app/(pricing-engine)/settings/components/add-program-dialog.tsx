"use client"

import { useMemo, useState, useTransition } from "react"
import { Upload } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import { Badge } from "@repo/ui/shadcn/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@repo/ui/shadcn/file-upload"
import { FileThumbnail } from "@/components/pdf-thumbnail"

interface Props {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>
  canCreate?: boolean
  orgId?: string | null
}

export function AddProgramDialog({ action, canCreate = true, orgId }: Props) {
  const [open, setOpen] = useState(false)
  const [loanType, setLoanType] = useState<"" | "dscr" | "bridge">("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [internalName, setInternalName] = useState("")
  const [externalName, setExternalName] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])

  const canAdd =
    !!loanType && internalName.trim().length > 0 && externalName.trim().length > 0

  const onSubmit = () => {
    if (!canAdd) return
    const fd = new FormData()
    if (orgId) fd.set("orgId", orgId)
    fd.set("loanType", loanType)
    fd.set("status", status)
    fd.set("internalName", internalName.trim())
    fd.set("externalName", externalName.trim())
    fd.set("webhookUrl", webhookUrl.trim())
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
      setLoanType("")
      setStatus("active")
      setInternalName("")
      setExternalName("")
      setWebhookUrl("")
      setFilesToUpload([])
      setOpen(false)
    })
  }

  const newFilesCount = useMemo(() => filesToUpload.length, [filesToUpload])

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="whitespace-nowrap"
        disabled={!canCreate}
        title={!canCreate ? "Select or create an organization first" : undefined}
      >
        Add Program
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Program</DialogTitle>
            <DialogDescription>Fill in the details and click Save.</DialogDescription>
          </DialogHeader>
          {!canCreate ? (
            <p className="text-sm text-amber-600">
              Select or create an organization from the switcher to add programs.
            </p>
          ) : null}
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-3 py-2">
            <Label htmlFor="loanType">Loan Type</Label>
            <Select value={loanType} onValueChange={(v) => setLoanType(v as "dscr" | "bridge")}>
              <SelectTrigger id="loanType">
                <SelectValue placeholder="Select loan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dscr">DSCR</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="activeStatus">Active</Label>
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
            <div className="mt-2 rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <Label>Documents (optional)</Label>
                <span className="text-xs text-muted-foreground">
                  {newFilesCount ? `${newFilesCount} selected` : "none selected"}
                </span>
              </div>

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

              <FileUpload
                accept=".pdf,application/pdf"
                multiple
                maxSize={5 * 1024 * 1024}
                onValueChange={(files) => setFilesToUpload(files)}
              >
                <FileUploadDropzone className="w-full border-dashed">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed text-muted-foreground">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">Drag & drop PDF files here</span>
                      <span className="text-xs text-muted-foreground">Or click to browse (max 5MB each)</span>
                    </div>
                    <FileUploadTrigger asChild>
                      <Button size="sm" variant="secondary">
                        Browse files
                      </Button>
                    </FileUploadTrigger>
                  </div>
                </FileUploadDropzone>
              </FileUpload>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!canAdd || pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


