"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { Badge } from "@repo/ui/shadcn/badge"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { cn } from "@repo/lib/cn"
import { ArrowLeft, Loader2, MoreHorizontal, Pencil, Plus, ArrowRightLeft } from "lucide-react"

interface ProgramRowRecord {
  id: number
  program_id: string
  display_name: string | null
  rent_spreadsheet_id: string | null
  rent_table_id: string | null
  compute_spreadsheet_id: string | null
  compute_table_id: string | null
  rows_order: string | null
  primary: boolean | null
  created_at: string
}

interface Props {
  programId: string
  programName: string
  onBack: () => void
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function RowFormDialog({
  open,
  onOpenChange,
  row,
  onSave,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: Partial<ProgramRowRecord> | null
  onSave: (values: Partial<ProgramRowRecord>) => Promise<void>
  mode: "create" | "edit"
}) {
  const [displayName, setDisplayName] = useState("")
  const [rentSpreadsheetId, setRentSpreadsheetId] = useState("")
  const [rentTableId, setRentTableId] = useState("")
  const [computeSpreadsheetId, setComputeSpreadsheetId] = useState("")
  const [computeTableId, setComputeTableId] = useState("")
  const [rowsOrder, setRowsOrder] = useState("ascending")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDisplayName(row?.display_name ?? "")
    setRentSpreadsheetId(row?.rent_spreadsheet_id ?? "")
    setRentTableId(row?.rent_table_id ?? "")
    setComputeSpreadsheetId(row?.compute_spreadsheet_id ?? "")
    setComputeTableId(row?.compute_table_id ?? "")
    setRowsOrder(row?.rows_order ?? "ascending")
  }, [open, row])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave({
        display_name: displayName.trim(),
        rent_spreadsheet_id: rentSpreadsheetId.trim() || null,
        rent_table_id: rentTableId.trim() || null,
        compute_spreadsheet_id: computeSpreadsheetId.trim() || null,
        compute_table_id: computeTableId.trim() || null,
        rows_order: rowsOrder,
      })
      onOpenChange(false)
    } catch {
      // error handled by caller
    } finally {
      setSaving(false)
    }
  }

  const isCreate = mode === "create"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isCreate ? "Add Row Configuration" : "Edit Row Configuration"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "Fill in the fields and click Add." : "Update the fields and click Save."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-3 p-4">
            <Label htmlFor="form-display-name">Display Name</Label>
            <Input
              id="form-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
            />

            <Label htmlFor="form-rent-spreadsheet">Rent Spreadsheet ID</Label>
            <Input
              id="form-rent-spreadsheet"
              value={rentSpreadsheetId}
              onChange={(e) => setRentSpreadsheetId(e.target.value)}
              placeholder="Rent Spreadsheet ID"
              className="font-mono text-xs"
            />

            <Label htmlFor="form-rent-table">Rent Table ID</Label>
            <Input
              id="form-rent-table"
              value={rentTableId}
              onChange={(e) => setRentTableId(e.target.value)}
              placeholder="Rent Table ID"
              className="font-mono text-xs"
            />

            <Label htmlFor="form-compute-spreadsheet">Compute Spreadsheet ID</Label>
            <Input
              id="form-compute-spreadsheet"
              value={computeSpreadsheetId}
              onChange={(e) => setComputeSpreadsheetId(e.target.value)}
              placeholder="Compute Spreadsheet ID"
              className="font-mono text-xs"
            />

            <Label htmlFor="form-compute-table">Compute Table ID</Label>
            <Input
              id="form-compute-table"
              value={computeTableId}
              onChange={(e) => setComputeTableId(e.target.value)}
              placeholder="Compute Table ID"
              className="font-mono text-xs"
            />

            <Label htmlFor="form-rows-order">Rows Order</Label>
            <Select value={rowsOrder} onValueChange={setRowsOrder}>
              <SelectTrigger id="form-rows-order">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ascending">Ascending</SelectItem>
                <SelectItem value="descending">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (isCreate ? "Adding..." : "Saving...") : (isCreate ? "Add" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProgramRowsDetail({ programId, programName, onBack }: Props) {
  const [rows, setRows] = useState<ProgramRowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editRow, setEditRow] = useState<ProgramRowRecord | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    async function fetchRows() {
      try {
        const res = await fetch(`/api/org/programs/${programId}/rows`)
        if (res.ok) {
          const data = await res.json()
          setRows(data.rows ?? [])
        }
      } catch (err) {
        console.error("Failed to fetch program rows:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRows()
  }, [programId])

  const handleSaveRow = async (updates: Partial<ProgramRowRecord>) => {
    if (!editRow) return

    const res = await fetch(`/api/org/programs/${programId}/rows`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowId: editRow.id, ...updates }),
    })

    if (!res.ok) throw new Error("Update failed")

    setRows((prev) =>
      prev.map((r) => (r.id === editRow.id ? { ...r, ...updates } : r))
    )
  }

  const handleCreateRow = async (values: Partial<ProgramRowRecord>) => {
    const res = await fetch(`/api/org/programs/${programId}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) throw new Error("Create failed")

    const data = await res.json()
    if (data.row) {
      setRows((prev) => [...prev, data.row])
    }
  }

  const handleSwitchPrimary = async (rowId: number) => {
    const res = await fetch(`/api/org/programs/${programId}/rows`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowId }),
    })

    if (!res.ok) return

    setRows((prev) =>
      prev.map((r) => ({ ...r, primary: r.id === rowId }))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button type="button" onClick={onBack} className="hover:underline">
                Programs
              </button>
              <span>/</span>
              <span className="text-foreground font-medium">{programName}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage row configurations for this program.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Display Name</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[30%]">Created At</TableHead>
                <TableHead className="w-[10%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.display_name || <span className="text-muted-foreground italic">Unnamed</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        row.primary
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {row.primary ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(row.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Row actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => setEditRow(row)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!row.primary && (
                          <DropdownMenuItem
                            onClick={() => handleSwitchPrimary(row.id)}
                            className="gap-2"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            Switch to Primary
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No row configurations found for this program.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {editRow && (
        <RowFormDialog
          open={!!editRow}
          onOpenChange={(open) => { if (!open) setEditRow(null) }}
          row={editRow}
          onSave={handleSaveRow}
          mode="edit"
        />
      )}

      <RowFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        row={null}
        onSave={handleCreateRow}
        mode="create"
      />
    </div>
  )
}
