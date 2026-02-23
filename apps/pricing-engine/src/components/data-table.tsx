"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Archive,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClipboardList,
  ColumnsIcon,
  FilesIcon,
  FolderOpenIcon,
  Loader2,
  MoreHorizontal,
  Upload,
  Users,
} from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import { Input } from "@repo/ui/shadcn/input"
import { createPipelineColumns, type StarredInput as PEStarredInput, type AddressInput } from "@/app/(pricing-engine)/scenarios/components/pipeline-columns"
import type { LoanRow } from "@/app/(pricing-engine)/scenarios/data/fetch-loans"
import type { ApplicationRow } from "@/app/(pricing-engine)/applications/data/fetch-applications"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import { CopyButton } from "@repo/ui/custom/copy-button"
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DealWithRelations {
  id: string
  inputs: Record<string, unknown> | null
  [key: string]: unknown
}

interface StarredInput {
  id: string
  input_label: string
  input_type: string
  dropdown_options: string[] | null
  starred: boolean
  display_order: number
}

type AppRow = ApplicationRow & { progress?: number }

/* -------------------------------------------------------------------------- */
/*  SWR fetcher                                                                */
/* -------------------------------------------------------------------------- */

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/* -------------------------------------------------------------------------- */
/*  Dynamic cell renderer (deals)                                              */
/* -------------------------------------------------------------------------- */

function renderDynamicCell(value: unknown, inputType: string): React.ReactNode {
  if (value == null || value === "")
    return <span className="text-muted-foreground">—</span>

  switch (inputType) {
    case "currency": {
      const num = typeof value === "number" ? value : Number(value)
      if (isNaN(num)) return <span className="text-muted-foreground">—</span>
      return (
        <div>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(num)}
        </div>
      )
    }
    case "number":
      return <div>{String(value)}</div>
    case "percentage":
      return <div>{String(value)}%</div>
    case "date": {
      const str = String(value)
      try {
        return <div>{new Date(str).toLocaleDateString()}</div>
      } catch {
        return <div>{str}</div>
      }
    }
    case "dropdown": {
      const display = String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
      return <Badge variant="outline">{display}</Badge>
    }
    case "boolean": {
      const bool = value === true || value === "true"
      return (
        <Badge variant={bool ? "default" : "outline"}>
          {bool ? "Yes" : "No"}
        </Badge>
      )
    }
    case "text":
    default:
      return <div className="max-w-[200px] truncate">{String(value)}</div>
  }
}

/* -------------------------------------------------------------------------- */
/*  Deals columns builder                                                      */
/* -------------------------------------------------------------------------- */

function buildDealsColumns(
  starredInputs: StarredInput[],
  router: { push: (path: string) => void },
  openAssignDialog: (dealId: string) => void,
): ColumnDef<DealWithRelations>[] {
  const dynamicCols: ColumnDef<DealWithRelations>[] = starredInputs.map(
    (input) => ({
      id: input.id,
      accessorFn: (row: DealWithRelations) => row.inputs?.[input.id] ?? null,
      header: input.input_label,
      cell: ({ getValue }: { getValue: () => unknown }) =>
        renderDynamicCell(getValue(), input.input_type),
      enableHiding: true,
    }),
  )

  const actionsCol: ColumnDef<DealWithRelations> = {
    id: "actions",
    header: () => null,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const deal = row.original
      const dealId = String(deal.id)

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push(`/deals/${deal.id}`)}
                >
                  <FolderOpenIcon
                    size={16}
                    className="opacity-60"
                    aria-hidden="true"
                  />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openAssignDialog(dealId)}
                >
                  <Users
                    size={16}
                    className="opacity-60"
                    aria-hidden="true"
                  />
                  Assigned To
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(deal.id.toString())
                  }
                >
                  <FilesIcon
                    size={16}
                    className="opacity-60"
                    aria-hidden="true"
                  />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Archive size={16} aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  }

  return [...dynamicCols, actionsCol]
}

/* -------------------------------------------------------------------------- */
/*  Applications columns builder                                               */
/* -------------------------------------------------------------------------- */

function buildApplicationsColumns(
  router: { push: (path: string) => void },
): ColumnDef<AppRow>[] {
  return [
    {
      header: "Application ID",
      accessorKey: "appDisplayId",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.getValue("appDisplayId") || "-"}
        </span>
      ),
    },
    {
      header: "Loan ID",
      accessorKey: "displayId",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.getValue("displayId") || "-"}
        </span>
      ),
    },
    {
      header: "Property Address",
      accessorKey: "propertyAddress",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("propertyAddress") || "-"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
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
              badgeClasses[derivedStatus] || badgeClasses.default,
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
        const val = row.original.progress ?? 0
        return (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {Math.round(val)}%{total > 0 ? ` (${signed}/${total})` : ""}
            </span>
            <Progress
              value={val}
              className="w-40"
              indicatorClassName={
                val >= 100
                  ? "bg-success"
                  : val > 0
                    ? "bg-warning"
                    : undefined
              }
            />
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
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="default"
            className="min-w-[90px]"
            onClick={() => router.push(`/applications/${row.original.id}`)}
          >
            Start
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "row_actions",
      header: () => null,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <AppRowActions id={row.original.id} />
      ),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*  Application row actions (3-dot menu with Application dialog only)          */
/* -------------------------------------------------------------------------- */

function AppRowActions({ id }: { id: string }) {
  const [appOpen, setAppOpen] = React.useState(false)
  const [guarantors, setGuarantors] = React.useState<
    Array<{ id: string | null; name: string; email: string | null }>
  >([])
  const [entityIds, setEntityIds] = React.useState<string[]>([])
  const [entityName, setEntityName] = React.useState<string | null>(null)
  const [loadingGuarantors, setLoadingGuarantors] = React.useState(false)
  const [floifyEnabled, setFloifyEnabled] = React.useState<boolean | null>(null)

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
        }
        if (!active) return
        if (res.ok) {
          setGuarantors(j?.guarantors ?? [])
          setEntityIds(j?.entityId ? [j.entityId] : [])
          setEntityName(j?.entityName ?? null)
        }
      } catch {
        if (!active) return
        setGuarantors([])
      } finally {
        if (active) setLoadingGuarantors(false)
      }
    }
    void load()
    return () => { active = false }
  }, [appOpen, id])

  React.useEffect(() => {
    let active = true
    async function loadFloify() {
      try {
        const res = await fetch("/api/integrations", { cache: "no-store" })
        if (!res.ok) return
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
    return () => { active = false }
  }, [])

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
                    Loading guarantors...
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
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Generic table renderer                                                     */
/* -------------------------------------------------------------------------- */

function TabTable<T>({
  data,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  sorting,
  onSortingChange,
  emptyMessage,
}: {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  sorting: SortingState
  onSortingChange: (s: SortingState) => void
  emptyMessage?: string
}) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    getRowId: (row: T) =>
      (row as Record<string, unknown>).id?.toString() ?? "",
    onSortingChange: onSortingChange as any,
    onColumnVisibilityChange: onColumnVisibilityChange as any,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage ?? "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredRowModel().rows.length} row(s) total
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main DataTable component                                                   */
/* -------------------------------------------------------------------------- */

export function DataTable() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("scenarios")

  // ── Deals state ──────────────────────────────────────────────────────
  const [dealsVisibility, setDealsVisibility] =
    React.useState<VisibilityState>({})
  const [dealsSorting, setDealsSorting] = React.useState<SortingState>([])
  const [assignDealId, setAssignDealId] = React.useState<string | null>(null)

  // ── Scenarios state ──────────────────────────────────────────────────
  const [scenariosVisibility, setScenariosVisibility] =
    React.useState<VisibilityState>({
      search: false,
      guarantors: false,
      transactionType: false,
      createdAt: false,
      updatedAt: false,
      borrower: false,
    })
  const [scenariosSorting, setScenariosSorting] = React.useState<SortingState>(
    [],
  )

  // ── Applications state ───────────────────────────────────────────────
  const [appsVisibility, setAppsVisibility] = React.useState<VisibilityState>({
    displayId: false,
  })
  const [appsSorting, setAppsSorting] = React.useState<SortingState>([])

  // ── SWR data fetching ────────────────────────────────────────────────
  const { data: dealsRes, isLoading: dealsLoading } = useSWR<{
    deals: DealWithRelations[]
  }>("/api/pipeline?view=deals", fetcher)

  const { data: inputsRes } = useSWR<StarredInput[]>("/api/inputs", fetcher)

  const { data: scenariosRes, isLoading: scenariosLoading } = useSWR<{
    items: LoanRow[]
    starredInputs?: PEStarredInput[]
    addressInputs?: AddressInput[]
  }>("/api/pipeline", fetcher)

  const { data: appsRes, isLoading: appsLoading } = useSWR<{
    items: ApplicationRow[]
  }>("/api/applications/list", fetcher)

  // ── Derived data ─────────────────────────────────────────────────────
  const deals = dealsRes?.deals ?? []

  const starredInputs = React.useMemo(() => {
    const all = Array.isArray(inputsRes)
      ? (inputsRes as StarredInput[])
      : []
    return all
      .filter((i) => i.starred)
      .sort((a, b) => a.display_order - b.display_order)
  }, [inputsRes])

  const scenarios = scenariosRes?.items ?? []
  const peStarredInputs = scenariosRes?.starredInputs ?? []
  const peAddressInputs = scenariosRes?.addressInputs ?? []

  const applications: AppRow[] = React.useMemo(() => {
    const items = appsRes?.items ?? []
    return items.map((row) => {
      const progressPct = row.signingProgressPct ?? 0
      return {
        ...row,
        progress: Math.max(0, Math.min(100, Math.round(progressPct * 100))),
      }
    })
  }, [appsRes])

  // ── Columns ──────────────────────────────────────────────────────────
  const openAssignDialog = React.useCallback(
    (dealId: string) => setAssignDealId(dealId),
    [],
  )

  const dealsColumns = React.useMemo(
    () => buildDealsColumns(starredInputs, router, openAssignDialog),
    [starredInputs, router, openAssignDialog],
  )

  const scenariosColumns = React.useMemo(
    () => createPipelineColumns(peStarredInputs, peAddressInputs) as ColumnDef<LoanRow, unknown>[],
    [peStarredInputs, peAddressInputs],
  )

  const appsColumns = React.useMemo(
    () => buildApplicationsColumns(router),
    [router],
  )

  // ── Count badges ─────────────────────────────────────────────────────
  const dealsCount = deals.length
  const scenariosCount = scenarios.length
  const appsCount = applications.length

  const isLoading =
    (activeTab === "deals" && dealsLoading) ||
    (activeTab === "scenarios" && scenariosLoading) ||
    (activeTab === "applications" && appsLoading)

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger
              className="@4xl/main:hidden flex w-fit"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deals">Deals</SelectItem>
              <SelectItem value="scenarios">Loan Scenarios</SelectItem>
              <SelectItem value="applications">Applications</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="@4xl/main:flex hidden">
            <TabsTrigger value="deals" className="gap-1">
              Deals
              {dealsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/30 px-1.5"
                >
                  {dealsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-1">
              Loan Scenarios
              {scenariosCount > 0 && (
                <Badge
                  variant="secondary"
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/30 px-1.5"
                >
                  {scenariosCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-1">
              Applications
              {appsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/30 px-1.5"
                >
                  {appsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              activeTab={activeTab}
              dealsColumns={dealsColumns}
              dealsData={deals}
              dealsVisibility={dealsVisibility}
              onDealsVisibilityChange={setDealsVisibility}
              scenariosColumns={scenariosColumns}
              scenariosData={scenarios}
              scenariosVisibility={scenariosVisibility}
              onScenariosVisibilityChange={setScenariosVisibility}
              appsColumns={appsColumns}
              appsData={applications}
              appsVisibility={appsVisibility}
              onAppsVisibilityChange={setAppsVisibility}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        ) : (
          <>
            <TabsContent
              value="deals"
            >
              <TabTable<DealWithRelations>
                data={deals}
                columns={dealsColumns}
                columnVisibility={dealsVisibility}
                onColumnVisibilityChange={setDealsVisibility}
                sorting={dealsSorting}
                onSortingChange={setDealsSorting}
                emptyMessage="No deals found."
              />
            </TabsContent>
            <TabsContent
              value="scenarios"
            >
              <TabTable<LoanRow>
                data={scenarios}
                columns={scenariosColumns}
                columnVisibility={scenariosVisibility}
                onColumnVisibilityChange={setScenariosVisibility}
                sorting={scenariosSorting}
                onSortingChange={setScenariosSorting}
                emptyMessage="No loan scenarios found."
              />
            </TabsContent>
            <TabsContent
              value="applications"
            >
              <TabTable<AppRow>
                data={applications}
                columns={appsColumns}
                columnVisibility={appsVisibility}
                onColumnVisibilityChange={setAppsVisibility}
                sorting={appsSorting}
                onSortingChange={setAppsSorting}
                emptyMessage="No applications found."
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Deals role assignment dialog */}
      {assignDealId && (
        <RoleAssignmentDialog
          resourceType="deal"
          resourceId={assignDealId}
          open={!!assignDealId}
          onOpenChange={(open) => {
            if (!open) setAssignDealId(null)
          }}
          onSaved={() => setAssignDealId(null)}
        />
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Column visibility dropdown                                                 */
/* -------------------------------------------------------------------------- */

function ColumnVisibilityDropdown({
  activeTab,
  dealsColumns,
  dealsData,
  dealsVisibility,
  onDealsVisibilityChange,
  scenariosColumns,
  scenariosData,
  scenariosVisibility,
  onScenariosVisibilityChange,
  appsColumns,
  appsData,
  appsVisibility,
  onAppsVisibilityChange,
}: {
  activeTab: string
  dealsColumns: ColumnDef<DealWithRelations, unknown>[]
  dealsData: DealWithRelations[]
  dealsVisibility: VisibilityState
  onDealsVisibilityChange: (v: VisibilityState) => void
  scenariosColumns: ColumnDef<LoanRow, unknown>[]
  scenariosData: LoanRow[]
  scenariosVisibility: VisibilityState
  onScenariosVisibilityChange: (v: VisibilityState) => void
  appsColumns: ColumnDef<AppRow, unknown>[]
  appsData: AppRow[]
  appsVisibility: VisibilityState
  onAppsVisibilityChange: (v: VisibilityState) => void
}) {
  const getTable = () => {
    switch (activeTab) {
      case "deals":
        return {
          columns: dealsColumns as ColumnDef<unknown, unknown>[],
          data: dealsData as unknown[],
          visibility: dealsVisibility,
          onChange: onDealsVisibilityChange,
        }
      case "scenarios":
        return {
          columns: scenariosColumns as ColumnDef<unknown, unknown>[],
          data: scenariosData as unknown[],
          visibility: scenariosVisibility,
          onChange: onScenariosVisibilityChange,
        }
      case "applications":
        return {
          columns: appsColumns as ColumnDef<unknown, unknown>[],
          data: appsData as unknown[],
          visibility: appsVisibility,
          onChange: onAppsVisibilityChange,
        }
      default:
        return null
    }
  }

  const config = getTable()
  if (!config) return null

  const table = useReactTable({
    data: config.data,
    columns: config.columns,
    state: { columnVisibility: config.visibility },
    onColumnVisibilityChange: config.onChange as any,
    getCoreRowModel: getCoreRowModel(),
  })

  const toggleableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    )

  if (toggleableColumns.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ColumnsIcon />
          <span className="hidden lg:inline">Customize Columns</span>
          <span className="lg:hidden">Columns</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {toggleableColumns.map((column) => {
          const header = column.columnDef.header
          const label = typeof header === "string" ? header : column.id
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

