"use client"

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
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
import { Check, ChevronDown, ChevronLeft, ChevronRight, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  AnimatedDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { ApplicationRow } from "../data/fetch-applications"
import { cn } from "@/lib/utils"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import MultiStepForm from "@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm"
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

type AppRow = ApplicationRow & { progress?: number }

interface Props {
  data: ApplicationRow[]
}

export function ApplicationsTable({ data }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const pageSize = 5
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [linkedRows, setLinkedRows] = useState<Record<string, boolean>>({})
  const [uploadContext, setUploadContext] = useState<{ id: string; borrower?: string | null } | null>(null)
  const [startModalRow, setStartModalRow] = useState<AppRow | null>(null)
  const [liveData, setLiveData] = useState<Record<string, Pick<AppRow, "signingProgressPct" | "signingSigned" | "signingTotal">>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const poll = async () => {
      try {
        const res = await fetch("/api/applications/progress", { cache: "no-store", signal: controller.signal })
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
          const next: Record<string, Pick<AppRow, "signingProgressPct" | "signingSigned" | "signingTotal">> = {}
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

  const toggleLinked = (rowId: string) =>
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
                className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "-rotate-90")}
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
        cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("id") || "-"}</span>,
      },
      {
        header: "Property Address",
        accessorKey: "propertyAddress",
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("propertyAddress") || "-"}</span>,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
          const progressVal = row.original.progress ?? 0
          const normalized = Math.max(0, Math.min(100, progressVal))
          const derivedStatus =
            normalized >= 100 ? "received" : normalized > 0 ? "pending" : "draft"

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
      },
      {
        header: "Progress",
        accessorKey: "progress",
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
                setUploadContext({ id: row.id, borrower: row.original.borrowerEntityName })
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
  }, [expandedRows, linkedRows])

  const augmentedData = useMemo<AppRow[]>(
    () =>
      data.map((row) => {
        const live = liveData[row.id]
        const progressPct = live?.signingProgressPct ?? row.signingProgressPct ?? 0
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
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2,
  })

  return (
    <div className="w-full border rounded-lg">
      <div className="border-b">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-medium">Applications</span>
          <Filter column={table.getColumn("search")!} />
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12 border-t">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-muted-foreground first:pl-4 last:pr-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                        const interactive = (e.target as HTMLElement).closest("button, a, input, select, textarea")
                        if (interactive) return
                        toggleRow(row.id)
                      }}
                      aria-expanded={isOpen}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="h-14 first:pl-4 last:pr-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                            initialEntityName={row.original.borrowerEntityName ?? undefined}
                            initialGuarantors={row.original.guarantors ?? []}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No applications yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-4 max-sm:flex-col md:max-lg:flex-col">
        <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
          Showing{" "}
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{" "}
          of <span>{table.getRowCount().toString()} entries</span>
        </p>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  className="disabled:pointer-events-none disabled:opacity-50"
                  variant={"ghost"}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                  Previous
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map((page) => {
                const isActive = page === table.getState().pagination.pageIndex + 1

                return (
                  <PaginationItem key={page}>
                    <Button
                      size="icon"
                      className={!isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  className="disabled:pointer-events-none disabled:opacity-50"
                  variant={"ghost"}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  Next
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
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
  const columnHeader = typeof column.columnDef.header === "string" ? column.columnDef.header : "Search"

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

function UploadWidget() {
  return (
    <FileUpload className="space-y-4" maxFiles={2} maxSize={5 * 1024 * 1024} accept="image/*,application/pdf">
      <FileUploadDropzone className="w-full border-dashed">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Drag & drop files here</span>
            <span className="text-xs text-muted-foreground">Or click to browse (max 2 files, up to 5MB each)</span>
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
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        No files added yet.
      </div>
    )
  }

  return (
    <FileUploadList>
      {files.map(({ file }) => (
        <FileUploadItem key={`${file.name}-${file.lastModified}`} value={file} className="items-center gap-3">
          <FileUploadItemPreview />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <FileUploadItemMetadata />
            <FileUploadItemProgress />
          </div>
          <FileUploadItemDelete className="ml-auto text-muted-foreground hover:text-destructive">
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
    <AnimatedDialogContent
      open={open}
      onOpenChange={onOpenChange}
      className="w-[75vw] max-w-[1100px] sm:max-w-[1200px] h-[90vh] p-0 border-none shadow-2xl"
    >
      <div ref={scrollRef} className="h-full overflow-hidden">
        <span className="sr-only">Application workflow</span>
        <MultiStepForm entityName={row.borrowerEntityName} guarantors={row.guarantors} />
      </div>
    </AnimatedDialogContent>
  )
}
