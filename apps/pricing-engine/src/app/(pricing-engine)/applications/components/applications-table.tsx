"use client"

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Trash2, Upload } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command"
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
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import {
  FileUpload,
  FileUploadClear,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
  useFileUpload,
} from "@/components/ui/file-upload"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import { Progress } from "@repo/ui/shadcn/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import MultiStepForm from "@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm"
import { DataTablePagination } from "../../users/components/data-table-pagination"
import { ApplicationRow } from "../data/fetch-applications"

type AppRow = ApplicationRow & { progress?: number }

interface Props {
  data: ApplicationRow[]
}

export function ApplicationsTable({ data }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [linkedRows, setLinkedRows] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [uploadContext, setUploadContext] = useState<{
    id: string
    borrower?: string | null
  } | null>(null)
  const [startModalRow, setStartModalRow] = useState<AppRow | null>(null)
  const [liveData, setLiveData] = useState<
    Record<
      string,
      Pick<AppRow, "signingProgressPct" | "signingSigned" | "signingTotal">
    >
  >({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const poll = async () => {
      try {
        const res = await fetch("/api/applications/progress", {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as {
          rows?: Array<{
            loan_id: string
            signingProgressPct?: number
            signingSigned?: number
            signingTotal?: number
          }>
        }
        if (Array.isArray(j?.rows)) {
          const next: Record<
            string,
            Pick<
              AppRow,
              "signingProgressPct" | "signingSigned" | "signingTotal"
            >
          > = {}
          j.rows.forEach((r) => {
            next[r.loan_id] = {
              signingProgressPct: r.signingProgressPct ?? 0,
              signingSigned: r.signingSigned ?? 0,
              signingTotal: r.signingTotal ?? 0,
            }
          })
          setLiveData(next)
        }
      } catch {
        // ignore fetch errors
      }
    }

    // initial load
    poll()
    pollRef.current = setInterval(poll, 5000)

    return () => {
      controller.abort()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const toggleRow = (rowId: string) =>
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))

  const _toggleLinked = (rowId: string) =>
    setLinkedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))

  const columns = useMemo<ColumnDef<AppRow>[]>(() => {
    return [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => {
          const isOpen = !!expandedRows[row.id]
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleRow(row.id)}
              aria-label={isOpen ? "Collapse row" : "Expand row"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen ? "rotate-180" : "-rotate-90"
                )}
                aria-hidden="true"
              />
            </Button>
          )
        },
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-12 pl-3" },
      },
      {
        id: "search",
        accessorFn: (row) =>
          `${row.id ?? ""} ${row.propertyAddress ?? ""} ${row.borrowerEntityName ?? ""}`.toLowerCase(),
        header: () => null,
        cell: () => null,
        enableSorting: false,
        enableHiding: true,
        filterFn: (row, columnId, filterValue) => {
          const value = (row.getValue<string>(columnId) ?? "").toString()
          const q = (filterValue ?? "").toString().toLowerCase().trim()
          if (!q) return true
          return value.includes(q)
        },
        meta: { className: "hidden" },
      },
      {
        header: "Loan ID",
        accessorKey: "id",
        meta: { className: "w-[18%]" },
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.getValue("id") || "-"}
          </span>
        ),
      },
      {
        header: "Property Address",
        accessorKey: "propertyAddress",
        meta: { className: "w-[32%]" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.getValue("propertyAddress") || "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: ({ column }) => (
          <StatusFilterMenu
            label="Status"
            options={[
              { id: "draft", label: "Draft" },
              { id: "pending", label: "Pending" },
              { id: "received", label: "Received" },
            ]}
            selected={statusFilter}
            onChange={(next) => {
              setStatusFilter(next)
              column.setFilterValue(next)
            }}
          />
        ),
        accessorFn: (row) => {
          const val = row.progress ?? 0
          const normalized = Math.max(0, Math.min(100, val))
          return normalized >= 100
            ? "received"
            : normalized > 0
              ? "pending"
              : "draft"
        },
        cell: ({ getValue }) => {
          const derivedStatus = (getValue() as string) ?? "draft"
          const badgeClasses: Record<string, string> = {
            draft: "bg-gray-100 text-gray-700 border-transparent",
            pending: "bg-amber-100 text-amber-700 border-transparent",
            received: "bg-green-100 text-green-700 border-transparent",
            default: "bg-muted text-muted-foreground border-transparent",
          }
          return (
            <span
              className={cn(
                "inline-flex min-w-[70px] items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize",
                badgeClasses[derivedStatus] || badgeClasses.default
              )}
            >
              {derivedStatus}
            </span>
          )
        },
        filterFn: (row, columnId, filterValue) => {
          const val = (row.getValue<string>(columnId) ?? "")
            .toString()
            .toLowerCase()
          const arr = Array.isArray(filterValue) ? filterValue : []
          if (!arr.length) return true
          return arr.includes(val)
        },
      },
      {
        header: "Progress",
        accessorKey: "progress",
        meta: { className: "w-[18%]" },
        cell: ({ row }) => {
          const signed = row.original.signingSigned ?? 0
          const total = row.original.signingTotal ?? 0
          const val = (row.original.progress ?? 0) || 0
          return (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                {Math.round(val)}% {total > 0 ? `(${signed}/${total})` : ""}
              </span>
              <Progress value={val} className="w-40" />
            </div>
          )
        },
      },
      {
        header: () => <div className="w-full text-center">Actions</div>,
        id: "actions",
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              aria-label="Upload documents"
              onClick={(e) => {
                e.stopPropagation()
                setUploadContext({
                  id: row.id,
                  borrower: row.original.borrowerEntityName,
                })
              }}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="default"
              className="min-w-[90px]"
              onClick={(e) => {
                e.stopPropagation()
                setStartModalRow(row.original)
              }}
            >
              Start
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ]
  }, [expandedRows, linkedRows, statusFilter])

  const augmentedData = useMemo<AppRow[]>(
    () =>
      data.map((row) => {
        const live = liveData[row.id]
        const progressPct =
          live?.signingProgressPct ?? row.signingProgressPct ?? 0
        const signed = live?.signingSigned ?? row.signingSigned ?? 0
        const total = live?.signingTotal ?? row.signingTotal ?? 0
        return {
          ...row,
          signingProgressPct: progressPct,
          signingSigned: signed,
          signingTotal: total,
          progress: Math.max(0, Math.min(100, Math.round(progressPct * 100))),
        }
      }),
    [data, liveData]
  )

  // Keep pagination in bounds when data changes
  const totalPages = Math.ceil(augmentedData.length / pageSize)
  useEffect(() => {
    if (pagination.pageIndex >= totalPages && totalPages > 0) {
      setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
    }
  }, [totalPages, pagination.pageIndex, pageSize])

  const table = useReactTable({
    data: augmentedData,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    // Prevent automatic page reset when data changes (e.g., from polling)
    autoResetPageIndex: false,
    // Use row.id as the stable row identifier to preserve state across data updates
    getRowId: (row) => row.id,
  })

  return (
    <div className="w-full rounded-lg border">
      <div className="border-b">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-medium">Applications</span>
          <div className="flex flex-wrap items-center gap-3">
            <Filter column={table.getColumn("search")!} />
          </div>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12 border-t">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground first:pl-4 last:pr-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isOpen = !!expandedRows[row.id]
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                      onClick={(e) => {
                        const interactive = (e.target as HTMLElement).closest(
                          "button, a, input, select, textarea"
                        )
                        if (interactive) return
                        toggleRow(row.id)
                      }}
                      aria-expanded={isOpen}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="h-14 first:pl-4 last:pr-4"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isOpen ? (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={columns.length} className="p-4">
                          <ApplicationPartyEditor
                            loanId={row.original.id}
                            showBorrowerEntity={row.original.showBorrowerEntity}
                            initialEntityId={row.original.entityId}
                            initialEntityName={
                              row.original.borrowerEntityName ?? undefined
                            }
                            initialGuarantors={row.original.guarantors ?? []}
                            initialSignedEmails={
                              row.original.signedEmails ?? []
                            }
                            initialSentEmails={row.original.sentEmails ?? []}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No applications yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
      <Dialog
        open={!!uploadContext}
        onOpenChange={(open) => {
          if (!open) setUploadContext(null)
        }}
      >
        <DialogContent className="w-[65vw] max-w-[900px] sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>Upload documents</DialogTitle>
            <DialogDescription>
              {uploadContext?.borrower
                ? `Attach files for ${uploadContext.borrower}.`
                : "Attach files to this application."}
            </DialogDescription>
          </DialogHeader>
          <UploadWidget />
        </DialogContent>
      </Dialog>
      <StartModal
        row={startModalRow}
        open={!!startModalRow}
        onOpenChange={(open) => {
          if (!open) setStartModalRow(null)
        }}
      />
      <style jsx global>{`
        @keyframes email-shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-4px);
          }
          40% {
            transform: translateX(4px);
          }
          60% {
            transform: translateX(-3px);
          }
          80% {
            transform: translateX(3px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

function Filter({ column }: { column: any }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const columnHeader =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : "Search"

  return (
    <div>
      <Label htmlFor={`${id}-input`} className="sr-only">
        {columnHeader}
      </Label>
      <Input
        id={`${id}-input`}
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Search applications`}
        type="text"
      />
    </div>
  )
}

interface StatusFilterMenuProps {
  label: string
  options: Array<{ id: string; label: string }>
  selected: string[]
  onChange: (next: string[]) => void
}

function StatusFilterMenu({
  label,
  options,
  selected,
  onChange,
}: StatusFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="data-[state=open]:bg-muted/80 text-muted-foreground flex h-9 items-center gap-2 px-2 text-sm font-medium"
        >
          <span>{label}</span>
          <ChevronDown className="h-4 w-4 opacity-70" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-0">
        <Command loop>
          <CommandInput placeholder={label} className="h-9" />
          <CommandList>
            <CommandEmpty className="text-muted-foreground px-3 py-2 text-xs">
              No status found.
            </CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((opt) => {
                const checked = selected.includes(opt.id)
                return (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => {
                      const next = new Set(selected)
                      if (checked) next.delete(opt.id)
                      else next.add(opt.id)
                      onChange(Array.from(next))
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={checked} className="h-4 w-4" />
                      <span className="capitalize">{opt.label}</span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup className="p-1">
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="text-muted-foreground text-xs"
                  >
                    Clear all
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UploadWidget() {
  return (
    <FileUpload
      className="space-y-4"
      maxFiles={2}
      maxSize={5 * 1024 * 1024}
      accept="image/*,application/pdf"
    >
      <FileUploadDropzone className="w-full border-dashed">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm font-medium">
              Drag & drop files here
            </span>
            <span className="text-muted-foreground text-xs">
              Or click to browse (max 2 files, up to 5MB each)
            </span>
          </div>
          <FileUploadTrigger asChild>
            <Button size="sm" variant="secondary">
              Browse files
            </Button>
          </FileUploadTrigger>
        </div>
      </FileUploadDropzone>
      <UploadList />
      <div className="flex justify-end">
        <FileUploadClear asChild>
          <Button variant="ghost" size="sm">
            Clear
          </Button>
        </FileUploadClear>
      </div>
    </FileUpload>
  )
}

function UploadList() {
  const files = useFileUpload((state) => Array.from(state.files.values()))

  if (!files.length) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
        No files added yet.
      </div>
    )
  }

  return (
    <FileUploadList>
      {files.map(({ file }) => (
        <FileUploadItem
          key={`${file.name}-${file.lastModified}`}
          value={file}
          className="items-center gap-3"
        >
          <FileUploadItemPreview />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <FileUploadItemMetadata />
            <FileUploadItemProgress />
          </div>
          <FileUploadItemDelete className="text-muted-foreground hover:text-destructive ml-auto">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </FileUploadItemDelete>
        </FileUploadItem>
      ))}
    </FileUploadList>
  )
}

interface StartModalProps {
  row: AppRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StartModal({ row, open, onOpenChange }: StartModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [open])

  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[75vw] max-w-[1100px] border-none p-0 shadow-2xl sm:max-w-[1200px]">
        <DialogTitle className="sr-only">Application workflow</DialogTitle>
        <div ref={scrollRef} className="h-full overflow-hidden">
          <MultiStepForm
            entityName={row.borrowerEntityName}
            guarantors={row.guarantors ?? undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
