"use client"

import * as React from "react"
import { format } from "date-fns"
import { IconDots, IconArchive } from "@tabler/icons-react"
import { useAuth } from "@clerk/nextjs"
import { ColumnDef } from "@tanstack/react-table"
import {
  Calculator,
  ClipboardList,
  FileSignature,
  Users,
  History,
  Filter,
  FileText,
  Download,
  Share2,
  UserPlus,
  UserMinus,
  FileEdit,
  Save,
  Loader2,
  MousePointerClick,
  Clipboard,
  CircleCheck,
  CircleX,
} from "lucide-react"
import Link from "next/link"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { cn } from "@repo/lib/cn"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/shadcn/alert-dialog"
import { Avatar, AvatarFallback } from "@repo/ui/shadcn/avatar"
import { Badge } from "@repo/ui/shadcn/badge"
import { Button } from "@repo/ui/shadcn/button"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { Input } from "@repo/ui/shadcn/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import { Switch } from "@repo/ui/shadcn/switch"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import { CopyButton } from "@repo/ui/custom/copy-button"
import LongText from "@repo/ui/custom/long-text"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import { LoanRow } from "../data/fetch-loans"
import { AssignMembersDialog } from "./assign-members-dialog"

const statusStyles: Record<string, string> = {
  active: "bg-success-muted text-success border-success/30",
  dead: "bg-danger-muted text-danger border-danger/30",
  inactive: "bg-danger-muted text-danger border-danger/30",
}

const statusLabels: Record<string, string> = {
  active: "Active",
  dead: "Inactive",
}

export const pipelineColumns: ColumnDef<LoanRow>[] = [
  // Hidden combined search column to enable single-input OR filtering across fields
  {
    id: "search",
    accessorFn: (row) => {
      const borrowerFirst =
        (row as { firstName?: string; borrowerFirstName?: string }).firstName ??
        (row as { firstName?: string; borrowerFirstName?: string })
          .borrowerFirstName ??
        ""
      const borrowerLast =
        (row as { lastName?: string; borrowerLastName?: string }).lastName ??
        (row as { lastName?: string; borrowerLastName?: string })
          .borrowerLastName ??
        ""
      const borrower = [borrowerFirst, borrowerLast]
        .filter(Boolean)
        .join(" ")
        .trim()
      const guarantors = Array.isArray(
        (row as { guarantors?: string[] }).guarantors
      )
        ? ((row as { guarantors?: string[] }).guarantors as string[]).join(", ")
        : ""
      const address =
        (row as { propertyAddress?: string }).propertyAddress ?? ""
      const id = (row as { id?: string }).id ?? ""
      return [id, address, borrower, guarantors]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
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
      const addr =
        (row.getValue("propertyAddress") as string | undefined) ?? "-"
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
        (row as { firstName?: string; borrowerFirstName?: string })
          .borrowerFirstName
      const lastName =
        (row as { lastName?: string; borrowerLastName?: string }).lastName ??
        (row as { lastName?: string; borrowerLastName?: string })
          .borrowerLastName
      const display = [firstName, lastName].filter(Boolean).join(" ").trim()
      return display
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borrower" />
    ),
    cell: ({ row }) => {
      const firstName =
        // Prefer canonical keys if present, otherwise fall back to alternate names
        (row.original as { firstName?: string; borrowerFirstName?: string })
          .firstName ??
        (row.original as { firstName?: string; borrowerFirstName?: string })
          .borrowerFirstName
      const lastName =
        (row.original as { lastName?: string; borrowerLastName?: string })
          .lastName ??
        (row.original as { lastName?: string; borrowerLastName?: string })
          .borrowerLastName
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
      return (
        <LongText className="max-w-48">
          {gs.length ? gs.join(", ") : "-"}
        </LongText>
      )
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
      const raw = (
        row.getValue("loanType") as string | undefined
      )?.toLowerCase()
      const display =
        raw === "dscr" ? "DSCR" : raw === "bridge" ? "Bridge" : raw ? raw : "-"
      return <div>{display}</div>
    },
    // OR matching across selected values (e.g., DSCR OR Bridge)
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue)
        ? (filterValue as string[])
        : []
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
        raw.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      return <div>{title}</div>
    },
    // OR matching for selected transaction types
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue)
        ? (filterValue as string[])
        : []
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rate" />
    ),
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
      <StatusCell
        id={row.getValue("id") as string}
        initialStatus={row.getValue("status") as string}
      />
    ),
    // OR matching for status
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue)
        ? (filterValue as string[])
        : []
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
      const selected = Array.isArray(filterValue)
        ? (filterValue as string[])
        : []
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
      return (
        <div className="w-fit text-nowrap">{format(date, "dd MMM, yyyy")}</div>
      )
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
      return (
        <div className="w-fit text-nowrap">{format(date, "dd MMM, yyyy")}</div>
      )
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row }) => {
      const status = (
        row.getValue("status") as string | undefined
      )?.toLowerCase()
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
  // DB stores "active" / "dead"; UI displays "Active" / "Inactive"
  const isActive = (localStatus ?? "").toLowerCase() === "active"
  const oppositeDb = isActive ? "dead" : "active"
  const oppositeLabel = isActive ? "Inactive" : "Active"
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [appOpen, setAppOpen] = React.useState(false)
  const [floifyEnabled, setFloifyEnabled] = React.useState<boolean | null>(null)
  const [guarantors, setGuarantors] = React.useState<
    Array<{ id: string | null; name: string; email: string | null }>
  >([])
  const [entityIds, setEntityIds] = React.useState<string[]>([])
  const [entityName, setEntityName] = React.useState<string | null>(null)
  const [loadingGuarantors, setLoadingGuarantors] = React.useState(false)
  const [activityOpen, setActivityOpen] = React.useState(false)
  React.useEffect(() => {
    let active = true
    async function load() {
      if (!appOpen) return
      setLoadingGuarantors(true)
      try {
        const res = await fetch(`/api/applications/${id}?loanId=${id}`, {
          cache: "no-store",
        })
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
        const j = (await res.json().catch(() => ({}))) as {
          rows?: Array<{ type: string; status: boolean }>
        }
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
      window.dispatchEvent(
        new CustomEvent("loan-status-updated", { detail: { id, status: next } })
      )
    } catch {
      alert(`Failed to update status`)
    }
  }

  async function deleteLoan() {
    try {
      const res = await fetch(`/api/loans/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const t = await res.text()
        alert(`Failed to archive: ${t || res.status}`)
        return
      }
      window.location.reload()
    } catch {
      alert(`Failed to archive`)
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
          <DropdownMenuItem
            onClick={() => (window.location.href = `/pricing?loanId=${id}`)}
            className="gap-2"
          >
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
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setActivityOpen(true)
            }}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Activity Log
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setStatus(oppositeDb)}
            className="gap-2"
          >
            {oppositeDb === "active" ? (
              <CircleCheck className="h-4 w-4 text-success" />
            ) : (
              <CircleX className="h-4 w-4 text-danger" />
            )}
            {`Set to ${oppositeLabel}`}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 gap-2"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <IconArchive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={appOpen} onOpenChange={setAppOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application</DialogTitle>
            <DialogDescription>
              Share or send the borrower application link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {floifyEnabled ? null : (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Application Link</label>
                <div className="relative flex items-center gap-2">
                  <Input
                    readOnly
                    value={`https://apply.whitelabellender.com/${id}`}
                  />
                  <CopyButton
                    text={`https://apply.whitelabellender.com/${id}`}
                  />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <span className="text-sm font-medium">E-Sign Request</span>
              <div className="space-y-3">
                {loadingGuarantors ? (
                  <span className="text-muted-foreground text-sm">
                    Loading guarantors…
                  </span>
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
            <AlertDialogTitle>Archive loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive this loan and its primary scenario. It can be restored later.
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
              Archive
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
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Activity Log</DialogTitle>
          </DialogHeader>
          <ActivityLogContent loanId={id} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Activity Log Types
interface ActivityLog {
  id: string
  loan_id: string
  scenario_id: string | null
  activity_type:
    | "input_changes"
    | "selection_changed"
    | "user_assignment"
    | "term_sheet"
  action: "changed" | "added" | "deleted" | "downloaded" | "shared"
  created_at: string
  user_id: string
  user_name: string
  user_initials: string
  assigned_to_changes: string[] | null
  assigned_names: string[]
  inputs: Record<string, unknown> | null
  outputs: Record<string, unknown>[] | null
  selected: Record<string, unknown> | null
  term_sheet_original_path: string | null
  term_sheet_edit_path: string | null
}

// Format activity type and action to natural language
function formatActivityDescription(log: ActivityLog): {
  action: string
  detail?: string
} {
  const { activity_type, action, assigned_names } = log

  switch (activity_type) {
    case "input_changes":
      if (action === "added") {
        return { action: "created a new scenario" }
      }
      return { action: "updated scenario inputs" }

    case "selection_changed":
      if (action === "added") {
        return { action: "selected a program" }
      }
      return { action: "changed selected program" }

    case "user_assignment":
      if (action === "added" && assigned_names.length > 0) {
        const names = assigned_names.join(", ")
        return { action: "added", detail: names + " to loan" }
      }
      if (action === "deleted" && assigned_names.length > 0) {
        const names = assigned_names.join(", ")
        return { action: "removed", detail: names + " from loan" }
      }
      return {
        action:
          action === "added"
            ? "added users to loan"
            : "removed users from loan",
      }

    case "term_sheet":
      if (action === "downloaded") {
        return { action: "downloaded term sheet" }
      }
      if (action === "shared") {
        return { action: "shared term sheet" }
      }
      return { action: `${action} term sheet` }

    default:
      return { action: `${action}` }
  }
}

// Get icon for activity type
function getActivityTypeIcon(log: ActivityLog) {
  const { activity_type, action } = log

  switch (activity_type) {
    case "input_changes":
      return action === "added" ? (
        <Save className="text-muted-foreground h-4 w-4" />
      ) : (
        <FileEdit className="text-muted-foreground h-4 w-4" />
      )
    case "selection_changed":
      return <MousePointerClick className="text-muted-foreground h-4 w-4" />
    case "user_assignment":
      return action === "added" ? (
        <UserPlus className="text-muted-foreground h-4 w-4" />
      ) : (
        <UserMinus className="text-muted-foreground h-4 w-4" />
      )
    case "term_sheet":
      return action === "shared" ? (
        <Share2 className="text-muted-foreground h-4 w-4" />
      ) : (
        <Download className="text-muted-foreground h-4 w-4" />
      )
    default:
      return <FileText className="text-muted-foreground h-4 w-4" />
  }
}

// Format activity data for clipboard copy
function formatActivityDataForClipboard(log: ActivityLog): string {
  const lines: string[] = []
  lines.push("--- Pricing Activity ---")
  lines.push(`Date: ${format(new Date(log.created_at), "PPpp")}`)
  lines.push("")

  // Format inputs
  if (log.inputs && Object.keys(log.inputs).length > 0) {
    lines.push("INPUTS:")
    for (const [key, value] of Object.entries(log.inputs)) {
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
      const formatted =
        typeof value === "number" ? value.toLocaleString() : String(value ?? "")
      lines.push(`  - ${label}: ${formatted}`)
    }
    lines.push("")
  }

  // Format outputs
  if (log.outputs && Object.keys(log.outputs).length > 0) {
    lines.push("OUTPUTS:")
    const outputData = Array.isArray(log.outputs) ? log.outputs[0] : log.outputs
    if (outputData && typeof outputData === "object") {
      for (const [key, value] of Object.entries(outputData)) {
        if (
          value !== null &&
          value !== undefined &&
          typeof value !== "object"
        ) {
          const label = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
          const formatted =
            typeof value === "number" ? value.toLocaleString() : String(value)
          lines.push(`  - ${label}: ${formatted}`)
        }
      }
    }
    lines.push("")
  }

  // Format selected
  if (log.selected && Object.keys(log.selected).length > 0) {
    lines.push("SELECTED:")
    for (const [key, value] of Object.entries(log.selected)) {
      if (value !== null && value !== undefined && typeof value !== "object") {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
        const formatted =
          typeof value === "number" ? value.toLocaleString() : String(value)
        lines.push(`  - ${label}: ${formatted}`)
      }
    }
  }

  return lines.join("\n")
}

// Interactive tag widget for activity log items
function ActivityTagWidget({
  log,
  isBroker,
}: {
  log: ActivityLog
  isBroker: boolean
}) {
  const [downloading, setDownloading] = React.useState(false)
  const [copying, setCopying] = React.useState(false)

  // Handle term sheet download
  const handleTermSheetDownload = async () => {
    const path = log.term_sheet_edit_path ?? log.term_sheet_original_path
    if (!path) {
      toast({ title: "No term sheet available", variant: "destructive" })
      return
    }

    setDownloading(true)
    try {
      const res = await fetch(
        `/api/activity/term-sheet/download?path=${encodeURIComponent(path)}`
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? "Failed to get download URL")
      }
      const { url } = await res.json()

      // Trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = `term-sheet-${format(new Date(log.created_at), "yyyy-MM-dd")}.pdf`
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Download failed"
      toast({
        title: "Download failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  // Handle clipboard copy for inputs/selection
  const handleCopyToClipboard = async () => {
    setCopying(true)
    try {
      const text = formatActivityDataForClipboard(log)
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Pricing data copied successfully",
      })
    } catch (_e) {
      toast({ title: "Copy failed", variant: "destructive" })
    } finally {
      setCopying(false)
    }
  }

  // Render based on activity type
  if (log.activity_type === "term_sheet") {
    // Brokers cannot download term sheets
    if (isBroker) return null
    const hasTermSheet =
      log.term_sheet_edit_path || log.term_sheet_original_path
    return (
      <div className="mt-2 flex items-center gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "cursor-pointer gap-1.5 transition-all",
            hasTermSheet
              ? "hover:bg-primary hover:text-primary-foreground"
              : "cursor-not-allowed opacity-50"
          )}
          onClick={hasTermSheet ? handleTermSheetDownload : undefined}
        >
          {downloading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          Term Sheet
        </Badge>
      </div>
    )
  }

  if (
    log.activity_type === "input_changes" ||
    log.activity_type === "selection_changed"
  ) {
    // Brokers cannot copy input changes or selection changes
    if (isBroker) return null
    const hasData = log.inputs || log.outputs || log.selected
    const label =
      log.activity_type === "input_changes"
        ? "Input Changes"
        : "Selection Changed"
    return (
      <div className="mt-2 flex items-center gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "cursor-pointer gap-1.5 transition-all",
            hasData
              ? "hover:bg-primary hover:text-primary-foreground"
              : "cursor-not-allowed opacity-50"
          )}
          onClick={hasData ? handleCopyToClipboard : undefined}
        >
          {copying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Clipboard className="h-3 w-3" />
          )}
          {label}
        </Badge>
      </div>
    )
  }

  // Default: user_assignment or other types - show static badge
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
        {getActivityTypeIcon(log)}
      </div>
      <span className="text-muted-foreground text-xs capitalize">
        {log.activity_type.replace(/_/g, " ")}
      </span>
    </div>
  )
}

// Format date for grouping header: "SUNDAY, 06 MARCH"
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, "EEEE, dd MMMM").toUpperCase()
}

// Format time: "06:20 PM"
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, "hh:mm a")
}

// Group logs by date
function groupLogsByDate(logs: ActivityLog[]): Map<string, ActivityLog[]> {
  const groups = new Map<string, ActivityLog[]>()
  for (const log of logs) {
    const dateKey = formatDateHeader(log.created_at)
    const existing = groups.get(dateKey) ?? []
    existing.push(log)
    groups.set(dateKey, existing)
  }
  return groups
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: "input_changes", label: "Input Changes" },
  { value: "selection_changed", label: "Selection Changed" },
  { value: "user_assignment", label: "User Assignment" },
  { value: "term_sheet", label: "Term Sheet" },
] as const

type ActivityType = (typeof ACTIVITY_TYPE_OPTIONS)[number]["value"]

function ActivityLogContent({ loanId }: { loanId: string }) {
  const { userId, orgRole } = useAuth()
  const isBroker = orgRole === "org:broker" || orgRole === "broker"
  const [logs, setLogs] = React.useState<ActivityLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showMyActivity, setShowMyActivity] = React.useState(false)
  const [selectedActivityTypes, setSelectedActivityTypes] = React.useState<
    Set<ActivityType>
  >(new Set(ACTIVITY_TYPE_OPTIONS.map((o) => o.value)))

  // Fetch initial data
  React.useEffect(() => {
    let active = true

    async function fetchLogs() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/loans/${loanId}/activity`, {
          cache: "no-store",
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error ?? `Failed to fetch: ${res.status}`)
        }
        const data = (await res.json()) as { logs: ActivityLog[] }
        if (active) {
          setLogs(data.logs ?? [])
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Unknown error")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchLogs()
    return () => {
      active = false
    }
  }, [loanId])

  // Real-time subscription
  React.useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel(`activity-log-${loanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pricing_activity_log",
          filter: `loan_id=eq.${loanId}`,
        },
        async (_payload) => {
          // Refetch to get user name info
          const res = await fetch(`/api/loans/${loanId}/activity`, {
            cache: "no-store",
          })
          if (res.ok) {
            const data = (await res.json()) as { logs: ActivityLog[] }
            setLogs(data.logs ?? [])
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loanId])

  const groupedLogs = React.useMemo(() => {
    let filtered = logs

    // Filter by activity type
    if (selectedActivityTypes.size < ACTIVITY_TYPE_OPTIONS.length) {
      filtered = filtered.filter((log) =>
        selectedActivityTypes.has(log.activity_type as ActivityType)
      )
    }

    // Filter by current user
    if (showMyActivity && userId) {
      filtered = filtered.filter((log) => log.user_id === userId)
    }

    return groupLogsByDate(filtered)
  }, [logs, showMyActivity, userId, selectedActivityTypes])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-2 text-sm">
          Loading activity...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-red-500">Error: {error}</span>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <History className="text-muted-foreground/50 mb-3 h-12 w-12" />
        <span className="text-muted-foreground text-sm">No activity yet</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Filter Controls */}
      <div className="mb-6 flex items-center justify-end gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="my-activity"
            checked={showMyActivity}
            onCheckedChange={setShowMyActivity}
          />
          <label
            htmlFor="my-activity"
            className="text-muted-foreground cursor-pointer text-sm"
          >
            My Activity
          </label>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {selectedActivityTypes.size < ACTIVITY_TYPE_OPTIONS.length && (
                <span className="bg-primary absolute -top-1 -right-1 h-2 w-2 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56">
            <div className="space-y-3">
              <div className="text-sm font-medium">Filter by Activity Type</div>
              <div className="space-y-2">
                {ACTIVITY_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${option.value}`}
                      checked={selectedActivityTypes.has(option.value)}
                      onCheckedChange={(checked) => {
                        setSelectedActivityTypes((prev) => {
                          const next = new Set(prev)
                          if (checked) {
                            next.add(option.value)
                          } else {
                            next.delete(option.value)
                          }
                          return next
                        })
                      }}
                    />
                    <label
                      htmlFor={`filter-${option.value}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {selectedActivityTypes.size < ACTIVITY_TYPE_OPTIONS.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() =>
                    setSelectedActivityTypes(
                      new Set(ACTIVITY_TYPE_OPTIONS.map((o) => o.value))
                    )
                  }
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4 md:space-y-6">
        {Array.from(groupedLogs.entries()).map(([dateHeader, dateGroup]) => (
          <div key={dateHeader}>
            {/* Date Header */}
            <div className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase md:mb-4 md:text-sm">
              {dateHeader}
            </div>

            {/* Activities for this date */}
            {dateGroup.map((log, idx) => {
              const { action, detail } = formatActivityDescription(log)
              const isLastInGroup = idx === dateGroup.length - 1

              return (
                <div key={log.id} className="mb-4">
                  {/* Activity Item */}
                  <div className="relative flex gap-2 md:gap-3">
                    {/* Timeline Line */}
                    {!isLastInGroup && (
                      <div className="bg-border absolute top-10 bottom-0 left-3 w-px md:top-12 md:left-4" />
                    )}

                    {/* Avatar */}
                    <div className="relative z-10">
                      <Avatar className="h-6 w-6 md:h-8 md:w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                          {log.user_initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-foreground font-medium">
                            {log.user_name}
                          </span>
                          <span className="text-muted-foreground">
                            {action}
                          </span>
                          {detail && (
                            <span className="text-foreground font-medium">
                              {detail}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs whitespace-nowrap md:text-sm">
                          {formatTime(log.created_at)}
                        </span>
                      </div>

                      {/* Activity type interactive tag widget */}
                      <ActivityTagWidget log={log} isBroker={isBroker} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusCell({
  id,
  initialStatus,
}: {
  id: string
  initialStatus: string
}) {
  const [status, setStatus] = React.useState<string>(initialStatus)
  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<{ id: string; status: string }>
      if (ce.detail?.id === id) {
        setStatus(ce.detail.status)
      }
    }
    window.addEventListener("loan-status-updated", onUpdate as EventListener)
    return () =>
      window.removeEventListener(
        "loan-status-updated",
        onUpdate as EventListener
      )
  }, [id])
  const badgeColor = statusStyles[status] ?? statusStyles.inactive
  return (
    <Badge variant="outline" className={cn("capitalize", badgeColor)}>
      {statusLabels[status] ?? status}
    </Badge>
  )
}
