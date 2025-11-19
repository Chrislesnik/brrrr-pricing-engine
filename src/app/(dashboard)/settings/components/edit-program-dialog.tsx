"use client"

import { useEffect, useState, useTransition } from "react"
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

  useEffect(() => {
    if (!open) return
    setLoanType((program.loan_type as "dscr" | "bridge") || "")
    setStatus(program.status)
    setInternalName(program.internal_name)
    setExternalName(program.external_name)
    setWebhookUrl(program.webhook_url ?? "")
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


