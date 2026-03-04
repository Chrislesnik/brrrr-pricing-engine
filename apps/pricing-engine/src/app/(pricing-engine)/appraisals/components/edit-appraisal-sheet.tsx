"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/shadcn/sheet"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import { Separator } from "@repo/ui/shadcn/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command"
import { Badge } from "@repo/ui/shadcn/badge"
import { cn } from "@repo/lib/cn"
import {
  ChevronsUpDown,
  X,
  Plus,
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { DateInput } from "@/components/date-input"
import { Calendar } from "@/components/ui/calendar"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BorrowerOption {
  id: string
  first_name: string
  last_name: string
}

interface DealOption {
  id: string
  heading: string | null
}

interface StatusOption {
  id: number
  status_id: string | null
  status_name: string | null
  revision_requested: boolean | null
}

interface AppraisalDocument {
  id: number
  file_name: string
  file_size: number | null
  mime_type: string | null
  uploaded_by_name?: string
  created_at: string
}

export interface EditAppraisalSheetOrder {
  id: number
  deal_id: string | null
  order_status: string | null
  priority: string | null
  date_due: string | null
  appraisal_borrowers: { borrower_id: string; borrowers: BorrowerOption | null }[] | null
}

interface EditAppraisalSheetProps {
  order: EditAppraisalSheetOrder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fullName(b: BorrowerOption) {
  return [b.first_name, b.last_name].filter(Boolean).join(" ").trim() || "Unknown"
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseDateStr(dateStr: string | null): Date | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr + "T00:00:00")
  return isNaN(d.getTime()) ? undefined : d
}

function toDateStr(d: Date | undefined): string | null {
  if (!d || isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/* -------------------------------------------------------------------------- */
/*  Sub-components: Searchable selects                                         */
/* -------------------------------------------------------------------------- */

function SearchableDealSelect({
  deals,
  value,
  onValueChange,
}: {
  deals: DealOption[]
  value: string
  onValueChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const selected = deals.find((d) => d.id === value)
  const label = selected ? (selected.heading || selected.id.slice(0, 8) + "...") : null

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal h-9 text-sm">
          <span className={cn("truncate", !label && "text-muted-foreground")}>
            {label || "Select deal..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder="Search deals..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No deals found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => { onValueChange(""); setOpen(false) }}>
                <span className="text-sm text-muted-foreground">No deal</span>
              </CommandItem>
              {deals.map((d) => (
                <CommandItem key={d.id} value={`${d.heading ?? ""} ${d.id}`} onSelect={() => { onValueChange(d.id); setOpen(false) }}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{d.heading || "Untitled Deal"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{d.id.slice(0, 8)}...</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function SearchableBorrowerSelect({
  borrowers,
  value,
  onValueChange,
  excludeIds,
}: {
  borrowers: BorrowerOption[]
  value: string
  onValueChange: (value: string) => void
  excludeIds: Set<string>
}) {
  const [open, setOpen] = React.useState(false)
  const filtered = borrowers.filter((b) => !excludeIds.has(b.id))
  const selected = borrowers.find((b) => b.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal h-9 text-sm">
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? fullName(selected) : "Select borrower..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder="Search borrowers..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No borrowers found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((b) => (
                <CommandItem key={b.id} value={`${b.first_name} ${b.last_name} ${b.id}`} onSelect={() => { onValueChange(b.id); setOpen(false) }}>
                  <span className="text-sm">{fullName(b)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function EditAppraisalSheet({ order, open, onOpenChange, onSaved }: EditAppraisalSheetProps) {
  const appraisalId = String(order.id)

  // --- Order details state ---
  const [statuses, setStatuses] = React.useState<StatusOption[]>([])
  const [orderStatus, setOrderStatus] = React.useState(order.order_status ?? "")
  const [priority, setPriority] = React.useState(order.priority ?? "")
  const [dueDate, setDueDate] = React.useState<Date | undefined>(parseDateStr(order.date_due))
  const [dueDateMonth, setDueDateMonth] = React.useState<Date>(dueDate ?? new Date())

  // --- Deal & borrower state ---
  const currentBorrowers = React.useMemo(() => {
    return (order.appraisal_borrowers ?? [])
      .map((ab) => ab.borrowers)
      .filter((b): b is BorrowerOption => b !== null)
  }, [order.appraisal_borrowers])

  const [dealId, setDealId] = React.useState(order.deal_id ?? "")
  const [selectedBorrowers, setSelectedBorrowers] = React.useState<BorrowerOption[]>(currentBorrowers)
  const [allDeals, setAllDeals] = React.useState<DealOption[]>([])
  const [allBorrowers, setAllBorrowers] = React.useState<BorrowerOption[]>([])
  const [addingRow, setAddingRow] = React.useState(false)

  // --- Documents state ---
  const [documents, setDocuments] = React.useState<AppraisalDocument[]>([])
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // --- General state ---
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset state and fetch data when sheet opens
  React.useEffect(() => {
    if (!open) return
    setOrderStatus(order.order_status ?? "")
    setPriority(order.priority ?? "")
    setDueDate(parseDateStr(order.date_due))
    setDueDateMonth(parseDateStr(order.date_due) ?? new Date())
    setDealId(order.deal_id ?? "")
    setSelectedBorrowers(currentBorrowers)
    setAddingRow(false)
    setError(null)

    async function fetchAll() {
      setLoading(true)
      try {
        const [dRes, bRes, sRes, docRes] = await Promise.all([
          fetch("/api/deals"),
          fetch("/api/applicants/borrowers/list"),
          fetch(`/api/appraisal-orders/${appraisalId}/statuses`),
          fetch(`/api/appraisal-orders/${appraisalId}/documents`),
        ])

        if (dRes.ok) {
          const json = await dRes.json()
          setAllDeals(json.deals ?? [])
        }
        if (bRes.ok) {
          const json = await bRes.json()
          const list = json.items ?? json.borrowers ?? []
          setAllBorrowers(
            (Array.isArray(list) ? list : []).map((b: Record<string, unknown>) => ({
              id: b.id as string,
              first_name: (b.first_name as string) ?? "",
              last_name: (b.last_name as string) ?? "",
            }))
          )
        }
        if (sRes.ok) {
          const json = await sRes.json()
          setStatuses(json.statuses ?? [])
        }
        if (docRes.ok) {
          const json = await docRes.json()
          setDocuments(json.documents ?? [])
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [open, order, appraisalId, currentBorrowers])

  // --- Dirty check ---
  const isDirty = React.useMemo(() => {
    if (orderStatus !== (order.order_status ?? "")) return true
    if (priority !== (order.priority ?? "")) return true
    if (toDateStr(dueDate) !== (order.date_due ?? null)) return true
    if ((dealId || null) !== (order.deal_id || null)) return true
    const currentIds = new Set(currentBorrowers.map((b) => b.id))
    const selectedIds = new Set(selectedBorrowers.map((b) => b.id))
    if (currentIds.size !== selectedIds.size) return true
    for (const id of currentIds) {
      if (!selectedIds.has(id)) return true
    }
    return false
  }, [orderStatus, priority, dueDate, dealId, selectedBorrowers, order, currentBorrowers])

  // --- Handlers ---

  const handleRemoveBorrower = (id: string) => {
    setSelectedBorrowers((prev) => prev.filter((b) => b.id !== id))
  }

  const handleAddBorrower = (borrowerId: string) => {
    const borrower = allBorrowers.find((b) => b.id === borrowerId)
    if (borrower && !selectedBorrowers.some((b) => b.id === borrowerId)) {
      setSelectedBorrowers((prev) => [...prev, borrower])
    }
    setAddingRow(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      if (orderStatus !== (order.order_status ?? "")) payload.order_status = orderStatus || null
      if (priority !== (order.priority ?? "")) payload.priority = priority || null
      if (toDateStr(dueDate) !== (order.date_due ?? null)) payload.date_due = toDateStr(dueDate)
      if ((dealId || null) !== (order.deal_id || null)) payload.deal_id = dealId || null

      const currentIds = new Set(currentBorrowers.map((b) => b.id))
      const selectedIds = new Set(selectedBorrowers.map((b) => b.id))
      const borrowersDirty =
        currentIds.size !== selectedIds.size || [...currentIds].some((id) => !selectedIds.has(id))
      if (borrowersDirty) payload.borrower_ids = selectedBorrowers.map((b) => b.id)

      if (Object.keys(payload).length === 0) return

      const res = await fetch(`/api/appraisal-orders/${appraisalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Failed to save")
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleRequestRevision = async () => {
    const revisionStatus = statuses.find((s) => s.revision_requested)
    if (!revisionStatus?.status_name) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/appraisal-orders/${appraisalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: revisionStatus.status_name }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Failed to request revision")
      }
      setOrderStatus(revisionStatus.status_name)
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request revision")
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/appraisal-orders/${appraisalId}/documents`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Upload failed")
      }
      const json = await res.json()
      if (json.document) {
        setDocuments((prev) => [...prev, json.document])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    try {
      const res = await fetch(`/api/appraisal-orders/${appraisalId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      })
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId))
      }
    } catch {
      /* ignore */
    }
  }

  const handleDownloadDocument = async (docId: number, fileName: string) => {
    try {
      const res = await fetch(`/api/appraisal-orders/${appraisalId}/documents/${docId}/url`)
      if (!res.ok) return
      const data = await res.json()
      if (data.url) {
        const a = document.createElement("a")
        a.href = data.url
        a.download = data.fileName || fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch {
      /* ignore */
    }
  }

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) handleFileUpload(files[0])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appraisalId]
  )

  const excludeIds = new Set(selectedBorrowers.map((b) => b.id))
  const revisionStatus = statuses.find((s) => s.revision_requested)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Edit Appraisal #{order.id}</SheetTitle>
          <SheetDescription>
            Update order details, manage borrowers, and attach documents.
          </SheetDescription>
        </SheetHeader>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {/* ── Section 1: Order Details ── */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Order Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Status</Label>
                  {statuses.length > 0 ? (
                    <Select value={orderStatus} onValueChange={setOrderStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.status_name ?? ""}>
                            {s.status_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="h-9"
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      placeholder="Order status"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Rush">Rush</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <DateInput value={dueDate} onChange={setDueDate} emptyOnMount className="h-9" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        month={dueDateMonth}
                        onMonthChange={setDueDateMonth}
                        onSelect={(d) => d && setDueDate(d)}
                        captionLayout="label"
                        className="rounded-md border min-w-[264px]"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Section 2: Quick Actions ── */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!revisionStatus?.status_name || saving}
                  onClick={handleRequestRevision}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Request Revision
                  {revisionStatus?.status_name && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                      {revisionStatus.status_name}
                    </Badge>
                  )}
                </Button>
              </div>
              {!revisionStatus && statuses.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No revision status configured for this integration.
                </p>
              )}
            </div>

            <Separator />

            {/* ── Section 3: Deal & Borrowers ── */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Deal & Borrowers</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Deal</Label>
                  <SearchableDealSelect deals={allDeals} value={dealId} onValueChange={setDealId} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Borrowers</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingRow(true)}
                      disabled={addingRow}
                      className="h-6 gap-1 text-xs text-muted-foreground px-2"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedBorrowers.map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                          {fullName(b)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveBorrower(b.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}

                    {addingRow && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableBorrowerSelect
                            borrowers={allBorrowers}
                            value=""
                            onValueChange={handleAddBorrower}
                            excludeIds={excludeIds}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setAddingRow(false)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )}

                    {selectedBorrowers.length === 0 && !addingRow && (
                      <p className="text-sm text-muted-foreground py-1">No borrowers linked.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Section 4: Documents ── */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Documents</h3>

              {/* Upload zone */}
              <div
                className={cn(
                  "rounded-md border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ""
                  }}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">Drop a file here or click to upload</span>
                  </div>
                )}
              </div>

              {/* Document list */}
              {documents.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm group">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                          {doc.uploaded_by_name ? ` · ${doc.uploaded_by_name}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                      >
                        <Download className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No documents attached.</p>
              )}

              {/* Deal documents link */}
              {order.deal_id && (
                <p className="text-xs text-muted-foreground mt-3">
                  This appraisal is linked to a deal. View deal documents on the{" "}
                  <a href={`/deals/${order.deal_id}?tab=documents`} className="underline hover:text-foreground">
                    deal page
                  </a>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!loading && (
          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !isDirty}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
