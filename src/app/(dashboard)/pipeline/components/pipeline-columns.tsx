"use client"

import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import LongText from "@/components/long-text"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import { LoanRow } from "../data/fetch-loans"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/copy-button"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import { IconDots } from "@tabler/icons-react"
import { Calculator, ClipboardList, FileSignature, Users, Trash2 } from "lucide-react"
import { AssignMembersDialog } from "./assign-members-dialog"
import Link from "next/link"

const statusClass: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  dead: "bg-red-100 text-red-800 border-red-200",
}

export const pipelineColumns: ColumnDef<LoanRow>[] = [
  // Hidden combined search column to enable single-input OR filtering across fields
  {
    id: "search",
    accessorFn: (row) => {
      const borrowerFirst =
        (row as { firstName?: string; borrowerFirstName?: string }).firstName ??
        (row as { firstName?: string; borrowerFirstName?: string }).borrowerFirstName ??
        ""
      const borrowerLast =
        (row as { lastName?: string; borrowerLastName?: string }).lastName ??
        (row as { lastName?: string; borrowerLastName?: string }).borrowerLastName ??
        ""
      const borrower = [borrowerFirst, borrowerLast].filter(Boolean).join(" ").trim()
      const guarantors = Array.isArray((row as { guarantors?: string[] }).guarantors)
        ? ((row as { guarantors?: string[] }).guarantors as string[]).join(", ")
        : ""
      const address = (row as { propertyAddress?: string }).propertyAddress ?? ""
      const id = (row as { id?: string }).id ?? ""
      return [id, address, borrower, guarantors].filter(Boolean).join(" ").toLowerCase()
    },
    header: () => null,
    cell: () => null,
    filterFn: (row, columnId, filterValue) => {
      const haystack = String(row.getValue(columnId) ?? "")
      const needle = String(filterValue ?? "").toLowerCase()
      if (!needle) return true
      return haystack.includes(needle)
    },
    // Hide via CSS so it doesn't affect layout or visibility
    meta: { className: "hidden" },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <LongText className="max-w-28">{row.getValue("id")}</LongText>
    ),
    meta: { className: "w-28" },
    enableSorting: false,
  },
  {
    accessorKey: "propertyAddress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Property Address" />
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as string | undefined
      const addr = (row.getValue("propertyAddress") as string | undefined) ?? "-"
      if (!id || addr === "-") {
        return <LongText className="max-w-[520px]">{addr}</LongText>
      }
      const href = `/pricing?loanId=${encodeURIComponent(id)}`
      return (
        <Link
          href={href}
          className="text-primary hover:underline"
          aria-label={`Open pricing engine for loan ${id}`}
        >
          <LongText className="max-w-[520px]">{addr}</LongText>
        </Link>
      )
    },
    enableSorting: false,
  },
  {
    id: "borrower",
    accessorFn: (row) => {
      const firstName =
        // Prefer canonical keys if present, otherwise fall back to alternate names
        (row as { firstName?: string; borrowerFirstName?: string }).firstName ??
        (row as { firstName?: string; borrowerFirstName?: string }).borrowerFirstName
      const lastName =
        (row as { lastName?: string; borrowerLastName?: string }).lastName ??
        (row as { lastName?: string; borrowerLastName?: string }).borrowerLastName
      const display = [firstName, lastName].filter(Boolean).join(" ").trim()
      return display
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borrower" />
    ),
    cell: ({ row }) => {
      const firstName =
        // Prefer canonical keys if present, otherwise fall back to alternate names
        (row.original as { firstName?: string; borrowerFirstName?: string }).firstName ??
        (row.original as { firstName?: string; borrowerFirstName?: string }).borrowerFirstName
      const lastName =
        (row.original as { lastName?: string; borrowerLastName?: string }).lastName ??
        (row.original as { lastName?: string; borrowerLastName?: string }).borrowerLastName
      const display =
        [firstName, lastName].filter(Boolean).join(" ").trim() || "-"
      return <div>{display}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "guarantors",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guarantor(s)" />
    ),
    cell: ({ row }) => {
      const gs = (row.getValue("guarantors") as string[]) ?? []
      return <LongText className="max-w-48">{gs.length ? gs.join(", ") : "-"}</LongText>
    },
    filterFn: (row, columnId, filterValue) => {
      const term = String(filterValue ?? "").toLowerCase()
      if (!term) return true
      const gs = (row.getValue(columnId) as string[]) ?? []
      const joined = gs.join(", ").toLowerCase()
      return joined.includes(term)
    },
    enableSorting: false,
  },
  {
    accessorKey: "loanType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Type" />
    ),
    cell: ({ row }) => {
      const raw = (row.getValue("loanType") as string | undefined)?.toLowerCase()
      const display =
        raw === "dscr" ? "DSCR" : raw === "bridge" ? "Bridge" : raw ? raw : "-"
      return <div>{display}</div>
    },
    // OR matching across selected values (e.g., DSCR OR Bridge)
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue) ? (filterValue as string[]) : []
      if (selected.length === 0) return true
      const cell = String(row.getValue(columnId) ?? "").toLowerCase()
      return selected.some((s) => cell === String(s).toLowerCase())
    },
    enableSorting: false,
  },
  {
    accessorKey: "transactionType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Type" />
    ),
    cell: ({ row }) => {
      const raw = (row.getValue("transactionType") as string | undefined) ?? ""
      if (!raw) return <div>-</div>
      const lower = raw.toLowerCase()
      const mapping: Record<string, string> = {
        "delayed-purchase": "Delayed Purchase",
        "rt-refi": "Refinance Rate/Term",
        "co-refi": "Refinance Cash Out",
        purchase: "Purchase",
      }
      const title =
        mapping[lower] ??
        raw
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      return <div>{title}</div>
    },
    // OR matching for selected transaction types
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue) ? (filterValue as string[]) : []
      if (selected.length === 0) return true
      const cell = String(row.getValue(columnId) ?? "").toLowerCase()
      return selected.some((s) => cell === String(s).toLowerCase())
    },
    enableSorting: false,
  },
  {
    accessorKey: "loanAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Amount" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("loanAmount") as number | undefined
      if (val == null) return <div>-</div>
      const currency = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
      return <div>{currency.format(val)}</div>
    },
  },
  {
    accessorKey: "rate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
    cell: ({ row }) => {
      const val = row.getValue("rate") as number | undefined
      return <div>{val != null ? `${Number(val).toFixed(3)}%` : "-"}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <StatusCell id={row.getValue("id") as string} initialStatus={row.getValue("status") as string} />
    ),
    // OR matching for status
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue) ? (filterValue as string[]) : []
      if (selected.length === 0) return true
      const cell = String(row.getValue(columnId) ?? "").toLowerCase()
      return selected.some((s) => cell === String(s).toLowerCase())
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "assignedTo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned To" />
    ),
    cell: ({ row }) => <div>{row.getValue("assignedTo") ?? "-"}</div>,
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue) ? (filterValue as string[]) : []
      if (selected.length === 0) return true
      const cell = String(row.getValue(columnId) ?? "").toLowerCase()
      return selected.some((name) => cell.includes(String(name).toLowerCase()))
    },
    enableSorting: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Edited" />
    ),
    cell: ({ row }) => {
      const raw = row.getValue("updatedAt") as string | Date
      const date = typeof raw === "string" ? new Date(raw) : (raw as Date)
      return <div className="w-fit text-nowrap">{format(date, "dd MMM, yyyy")}</div>
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string | Date
      const date = typeof raw === "string" ? new Date(raw) : (raw as Date)
      return <div className="w-fit text-nowrap">{format(date, "dd MMM, yyyy")}</div>
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row }) => {
      const status = (row.getValue("status") as string | undefined)?.toLowerCase()
      const id = row.getValue("id") as string
      return <RowActions id={id} status={status} />
    },
    meta: { className: "w-10 text-right sticky right-0 bg-background z-10" },
    enableSorting: false,
    enableHiding: false,
  },
]

function RowActions({ id, status }: { id: string; status?: string }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [localStatus, setLocalStatus] = React.useState(status ?? "active")
  const opposite = (localStatus ?? "").toLowerCase() === "active" ? "dead" : "active"
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [appOpen, setAppOpen] = React.useState(false)
  const [floifyEnabled, setFloifyEnabled] = React.useState<boolean | null>(null)
  const [guarantors, setGuarantors] = React.useState<Array<{ id: string | null; name: string; email: string | null }>>([])
  const [entityIds, setEntityIds] = React.useState<string[]>([])
  const [entityName, setEntityName] = React.useState<string | null>(null)
  const [loadingGuarantors, setLoadingGuarantors] = React.useState(false)
  React.useEffect(() => {
    let active = true
    async function load() {
      if (!appOpen) return
      setLoadingGuarantors(true)
      try {
        const res = await fetch(`/api/applications/${id}?loanId=${id}`, { cache: "no-store" })
        const j = (await res.json().catch(() => ({}))) as {
          guarantors?: Array<{ id: string; name: string; email: string | null }>
          entityId?: string | null
          entityName?: string | null
          error?: string
        }
        if (!active) return
        if (res.ok) {
          setGuarantors(j?.guarantors ?? [])
          setEntityIds(j?.entityId ? [j.entityId] : [])
          setEntityName(j?.entityName ?? null)
        } else {
          console.error("applications fetch failed", j?.error ?? res.status)
          setGuarantors([])
          setEntityIds([])
          setEntityName(null)
        }
      } catch {
        if (!active) return
        setGuarantors([])
      } finally {
        if (active) setLoadingGuarantors(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [appOpen, id])

  // Prefetch Floify enablement so the dialog renders without a flash
  React.useEffect(() => {
    let active = true
    async function loadFloify() {
      try {
        const res = await fetch("/api/integrations", { cache: "no-store" })
        if (!res.ok) throw new Error(await res.text())
        const j = (await res.json().catch(() => ({}))) as { rows?: Array<{ type: string; status: boolean }> }
        if (!active) return
        const floifyRow = (j.rows ?? []).find((r) => r.type === "floify")
        setFloifyEnabled(Boolean(floifyRow?.status))
      } catch {
        if (!active) return
        setFloifyEnabled(null)
      }
    }
    void loadFloify()
    return () => {
      active = false
    }
  }, [])

  async function setStatus(next: string) {
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const t = await res.text()
        alert(`Failed to update status: ${t || res.status}`)
        return
      }
      // Optimistic local update + notify other cells
      setLocalStatus(next)
      window.dispatchEvent(new CustomEvent("loan-status-updated", { detail: { id, status: next } }))
    } catch {
      alert(`Failed to update status`)
    }
  }

  async function deleteLoan() {
    try {
      const res = await fetch(`/api/loans/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const t = await res.text()
        alert(`Failed to delete: ${t || res.status}`)
        return
      }
      window.location.reload()
    } catch {
      alert(`Failed to delete`)
    }
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <IconDots className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => (window.location.href = `/pricing?loanId=${id}`)} className="gap-2">
            <Calculator className="h-4 w-4" />
            Pricing Engine
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setAppOpen(true)
            }}
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Application
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <FileSignature className="h-4 w-4" />
            Term Sheets
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setAssignOpen(true)
            }}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Assigned To
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setStatus(opposite)}>{`Set to ${opposite}`}</DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={appOpen} onOpenChange={setAppOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application</DialogTitle>
            <DialogDescription>Share or send the borrower application link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {floifyEnabled ? null : (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Application Link</label>
                <div className="relative flex items-center gap-2">
                  <Input readOnly value={`https://apply.whitelabellender.com/${id}`} />
                  <CopyButton text={`https://apply.whitelabellender.com/${id}`} />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <span className="text-sm font-medium">E-Sign Request</span>
              <div className="space-y-3">
                {loadingGuarantors ? (
                  <span className="text-sm text-muted-foreground">Loading guarantors…</span>
                ) : (
                  <ApplicationPartyEditor
                    loanId={id}
                    showBorrowerEntity
                    initialEntityId={entityIds[0] ?? null}
                    initialEntityName={entityName ?? undefined}
                    initialGuarantors={guarantors}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this loan and its primary scenario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setConfirmOpen(false)
                void deleteLoan()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AssignMembersDialog
        loanId={id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSaved={() => {}}
      />
    </div>
  )
}

function StatusCell({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = React.useState<string>(initialStatus)
  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<{ id: string; status: string }>
      if (ce.detail?.id === id) {
        setStatus(ce.detail.status)
      }
    }
    window.addEventListener("loan-status-updated", onUpdate as EventListener)
    return () => window.removeEventListener("loan-status-updated", onUpdate as EventListener)
  }, [id])
  const badgeColor = statusClass[status] ?? ""
  return (
    <div className="flex space-x-2">
      <Badge variant="outline" className={cn("capitalize", badgeColor)}>
        {status}
      </Badge>
    </div>
  )
}


