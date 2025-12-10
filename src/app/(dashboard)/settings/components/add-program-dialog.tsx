"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        Add Pipeline Record
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pipeline record</DialogTitle>
            <DialogDescription>Fill in the details and click Save.</DialogDescription>
          </DialogHeader>
          {!canCreate ? (
            <p className="text-sm text-amber-600">
              Select or create an organization from the switcher to add programs.
            </p>
          ) : null}
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
              <div className="mb-2 flex items-center justify-between">
                <Label>Documents (optional)</Label>
                <span className="text-xs text-muted-foreground">
                  {newFilesCount ? `${newFilesCount} new` : "none selected"}
                </span>
              </div>
              <Input
                id="programDocsNew"
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  setFilesToUpload(files)
                }}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <DialogFooter>
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


