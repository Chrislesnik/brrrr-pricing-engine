"use client"

import * as React from "react"
import { Button } from "@repo/ui/shadcn/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
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
import { Label } from "@repo/ui/shadcn/label"
import { ChevronsUpDown, X, Plus } from "lucide-react"
import { cn } from "@repo/lib/cn"

interface BorrowerOption {
  id: string
  first_name: string
  last_name: string
}

interface DealOption {
  id: string
  heading: string | null
}

interface EditAppraisalDialogProps {
  appraisalId: string
  currentDealId: string | null
  currentBorrowers: BorrowerOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function fullName(b: BorrowerOption) {
  return [b.first_name, b.last_name].filter(Boolean).join(" ").trim() || "Unknown"
}

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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className={cn("truncate", !label && "text-muted-foreground")}>
            {label || "Select deal..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search deals..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No deals found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onValueChange("")
                  setOpen(false)
                }}
              >
                <span className="text-sm text-muted-foreground">No deal</span>
              </CommandItem>
              {deals.map((d) => (
                <CommandItem
                  key={d.id}
                  value={`${d.heading ?? ""} ${d.id}`}
                  onSelect={() => {
                    onValueChange(d.id)
                    setOpen(false)
                  }}
                >
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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? fullName(selected) : "Select borrower..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search borrowers..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No borrowers found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.first_name} ${b.last_name} ${b.id}`}
                  onSelect={() => {
                    onValueChange(b.id)
                    setOpen(false)
                  }}
                >
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

export function EditAppraisalDialog({
  appraisalId,
  currentDealId,
  currentBorrowers,
  open,
  onOpenChange,
  onSaved,
}: EditAppraisalDialogProps) {
  const [dealId, setDealId] = React.useState(currentDealId ?? "")
  const [selectedBorrowers, setSelectedBorrowers] = React.useState<BorrowerOption[]>(currentBorrowers)
  const [allDeals, setAllDeals] = React.useState<DealOption[]>([])
  const [allBorrowers, setAllBorrowers] = React.useState<BorrowerOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [addingRow, setAddingRow] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setDealId(currentDealId ?? "")
    setSelectedBorrowers(currentBorrowers)
    setAddingRow(false)
    setError(null)

    async function fetchOptions() {
      setLoading(true)
      try {
        const [dRes, bRes] = await Promise.all([
          fetch("/api/deals"),
          fetch("/api/applicants/borrowers/list"),
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
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchOptions()
  }, [open, currentDealId, currentBorrowers])

  const isDirty = React.useMemo(() => {
    if ((dealId || null) !== (currentDealId || null)) return true
    const currentIds = new Set(currentBorrowers.map((b) => b.id))
    const selectedIds = new Set(selectedBorrowers.map((b) => b.id))
    if (currentIds.size !== selectedIds.size) return true
    for (const id of currentIds) {
      if (!selectedIds.has(id)) return true
    }
    return false
  }, [dealId, currentDealId, selectedBorrowers, currentBorrowers])

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
      const res = await fetch(`/api/appraisal-orders/${appraisalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId || null,
          borrower_ids: selectedBorrowers.map((b) => b.id),
        }),
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

  const excludeIds = new Set(selectedBorrowers.map((b) => b.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Appraisal</DialogTitle>
          <DialogDescription>
            Change the linked deal and manage borrowers for this appraisal.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deal</Label>
              <SearchableDealSelect
                deals={allDeals}
                value={dealId}
                onValueChange={setDealId}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Borrowers</Label>
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
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingRow(true)}
            disabled={addingRow || loading}
            className="gap-1 text-xs text-muted-foreground"
          >
            <Plus className="size-3" />
            Add Borrower
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={loading || saving || !isDirty}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
