"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, User } from "lucide-react"
import { LyteNyte } from "@/components/lytenyte-pro"
import { useClientRowDataSource, useLyteNyte } from "@/hooks/use-lytenyte-pro"
import type { Column, RowDetailRendererParams } from "@1771technologies/lytenyte-pro/types"
import type { EntityProfile } from "../data/types"
import { EntityRowActions } from "./entity-row-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircledIcon, Cross2Icon, CheckIcon } from "@radix-ui/react-icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type EntityOwner = {
	name: string | null
	title: string | null
	member_type: string | null
	ownership_percent: number | null
}

function formatEINDisplay(ein: string | null | undefined): string {
	const digits = String(ein ?? "").replace(/\D+/g, "").slice(0, 9)
	if (!digits) return "-"
	if (digits.length <= 2) return digits
	return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

function formatYmdToDisplay(ymd: string | null | undefined): string {
	const s = (ymd ?? "").toString()
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-"
	const [y, m, d] = s.split("-").map((p) => Number(p))
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	const mon = monthNames[(m || 1) - 1] ?? ""
	return `${String(d).padStart(2, "0")} ${mon}, ${y}`
}

type Props = {
	rows: EntityProfile[]
}

// Keep a single place to derive the map key for owners lookups so fetch and render
// use the same identifier. Prefer the entity UUID; fall back to display_id if ever missing.
function ownerKey(entity: EntityProfile | null | undefined): string | undefined {
	return entity?.id || (entity as any)?.display_id || undefined
}

export function EntitiesLyteNyteGrid({ rows }: Props) {
	const [ownersMap, setOwnersMap] = useState<Record<string, EntityOwner[] | null | undefined>>({})
	const [ownersVersion, setOwnersVersion] = useState(0)
	// Keep a row-level owners cache to bind owners to row data for rendering
	const [rowOwners, setRowOwners] = useState<Record<string, EntityOwner[] | null | undefined>>({})
	// Force a data refresh when owners change so the grid re-reads row data
	const [dataVersion, setDataVersion] = useState(0)
	const [search, setSearch] = useState("")
	const [assignedFilter, setAssignedFilter] = useState<string[]>([])

	// #region agent log
	fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			sessionId: "debug-session",
			runId: "pre-fix",
			hypothesisId: "H1",
			location: "entities-lytenyte-grid.tsx:entry",
			message: "component entry",
			data: { rowsCount: rows?.length ?? null },
			timestamp: Date.now(),
		}),
	}).catch(() => {})
	// #endregion

	// Load owners for entities that are missing in cache
	useEffect(() => {
		const ids = rows.map((r) => ownerKey(r)).filter(Boolean) as string[]
		const missing = ids.filter((id) => ownersMap[id] === undefined)
		// #region agent log
		fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sessionId: "debug-session",
				runId: "debug1",
				hypothesisId: "H1",
				location: "entities-grid:fetch-effect:missing",
				message: "owners fetch effect missing ids",
				data: { idsCount: ids.length, missingCount: missing.length, sampleMissing: missing.slice(0, 3) },
				timestamp: Date.now(),
			}),
		}).catch(() => {})
		// #endregion
		if (!missing.length) return
		let cancelled = false
		;(async () => {
			const entries: Array<[string, EntityOwner[] | null]> = []
			await Promise.all(
				missing.map(async (id) => {
					try {
						const res = await fetch(`/api/applicants/entities/${encodeURIComponent(id)}/owners`, { cache: "no-store" })
						if (!res.ok) {
							entries.push([id, null])
							return
						}
						const j = (await res.json().catch(() => ({}))) as { owners?: EntityOwner[] }
						entries.push([id, Array.isArray(j.owners) ? j.owners : []])
					} catch {
						entries.push([id, null])
					}
				})
			)
			if (cancelled) return
			// #region agent log
			fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId: "debug-session",
					runId: "debug1",
					hypothesisId: "H2",
					location: "entities-grid:fetch-effect:entries",
					message: "owners fetch entries",
					data: { count: entries.length, keys: entries.map((e) => e[0]).slice(0, 3) },
					timestamp: Date.now(),
				}),
			}).catch(() => {})
			// #endregion
			setOwnersMap((prev) => {
				const next = { ...prev }
				for (const [id, owners] of entries) next[id] = owners
				return next
			})
			setRowOwners((prev) => {
				const next = { ...prev }
				for (const [id, owners] of entries) next[id] = owners
				return next
			})
			setOwnersVersion((v) => v + 1)
			setDataVersion((v) => v + 1)
		})()
		return () => {
			cancelled = true
		}
	}, [rows, ownersMap])

	const rowsWithOwnersVersion = useMemo(() => {
		// Push a version marker into the row objects so the grid re-renders details
		// when ownersMap changes, and include per-row owners for direct access.
		return rows.map((r) => ({
			...r,
			__ownersVersion: ownersVersion,
			__owners: rowOwners[ownerKey(r) ?? ""],
		}))
	}, [rows, ownersVersion, rowOwners])

	// Build options for Assigned To filter
	const assignedOptions = useMemo(() => {
		const counts = new Map<string, number>()
		for (const r of rowsWithOwnersVersion ?? []) {
			for (const raw of Array.isArray(r.assigned_to_names) ? r.assigned_to_names : []) {
				const name = String(raw ?? "").trim()
				if (!name) continue
				counts.set(name, (counts.get(name) ?? 0) + 1)
			}
		}
		return Array.from(counts.entries())
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([label, count]) => ({ label, value: label, count }))
	}, [rowsWithOwnersVersion])

	// Filter rows by search and assigned filters
	const filteredRows = useMemo(() => {
		const term = search.trim().toLowerCase()
		const activeAssigned = assignedFilter.map((n) => n.toLowerCase())
		return rowsWithOwnersVersion.filter((r) => {
			const haystack = [
				r.display_id,
				r.entity_name,
				r.entity_type ?? "",
				(r.ein ?? "").replace(/\D+/g, ""),
				r.ein ?? "",
				(r.assigned_to_names ?? []).join(" "),
			]
				.join(" ")
				.toLowerCase()

			const matchesSearch = term === "" || haystack.includes(term)
			if (!matchesSearch) return false

			if (!activeAssigned.length) return true
			const names = (r.assigned_to_names ?? []).map((n) => String(n ?? "").toLowerCase())
			if (!names.length) return false
			return activeAssigned.some((needle) => names.some((n) => n.includes(needle)))
		})
	}, [rowsWithOwnersVersion, search, assignedFilter])

	const isFiltered = search.trim().length > 0 || assignedFilter.length > 0
	const dataForGrid = isFiltered ? filteredRows : rowsWithOwnersVersion

	const columns = useMemo<Column<EntityProfile>[]>(() => {
		return [
			{ id: "display_id", name: "ID", width: 120, type: "string" },
			{ id: "entity_name", name: "Entity Name", widthFlex: 1, widthMin: 180, type: "string" },
			{ id: "entity_type", name: "Entity Type", width: 130, type: "string" },
			{
				id: "ein",
				name: "EIN",
				width: 140,
				type: "string",
				cellRenderer: ({ row }) => formatEINDisplay((row as any).data?.ein),
			},
			{
				id: "date_formed",
				name: "Date Formed",
				width: 140,
				type: "string",
				cellRenderer: ({ row }) => formatYmdToDisplay((row as any).data?.date_formed),
			},
			{
				id: "assigned_to_names",
				name: "Assigned To",
				widthFlex: 1,
				widthMin: 180,
				type: "string",
				cellRenderer: ({ row }) => {
					const names = Array.isArray((row as any).data?.assigned_to_names) ? (row as any).data.assigned_to_names : []
					return <span className="truncate">{names.length ? names.join(", ") : "-"}</span>
				},
			},
			{
				id: "created_at",
				name: "Date Added",
				width: 140,
				type: "string",
				cellRenderer: ({ row }) => formatYmdToDisplay((row as any).data?.created_at),
			},
			{
				id: "actions",
				name: "",
				width: 40,
				widthMin: 36,
				widthMax: 44,
				pin: "end",
				cellRenderer: ({ row }) => {
					const data = (row.data ?? null) as EntityProfile | null
					if (!data) return null
					return (
						<div
							className="flex items-center justify-center"
							style={{ width: "100%", minWidth: 36, maxWidth: 44 }}
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-center w-full">
								<EntityRowActions entity={data} />
							</div>
						</div>
					)
				},
			},
		]
	}, [])

	const dataSource = useClientRowDataSource<EntityProfile>({
		data: dataForGrid,
		reflectData: true,
		rowIdLeaf: (leaf, idx) => leaf.data?.id ?? leaf.id ?? String(idx),
	})

	const lyte = useLyteNyte<EntityProfile>({
		gridId: "entities-grid",
		columns,
		rowDataSource: dataSource,
		rowSelectionMode: "single",
		rowDetailRenderer: ({ row }: RowDetailRendererParams<EntityProfile>) => {
			const data = (row.data ?? null) as EntityProfile | null
			if (!data) return null
			const key = ownerKey(data) ?? (row as any)?.id?.toString?.()
			const owners = key ? (data as any).__owners ?? rowOwners[key] ?? ownersMap[key] : undefined
			// #region agent log
			fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId: "debug-session",
					runId: "debug1",
					hypothesisId: "H3",
					location: "entities-grid:row-detail",
					message: "row detail owners state",
					data: {
						key,
						hasInjected: !!(data as any).__owners,
						ownersFrom: (data as any).__owners
							? "rowData"
							: rowOwners[key]
								? "rowOwners"
								: ownersMap[key]
									? "ownersMap"
									: "none",
						ownersType: owners === undefined ? "undefined" : owners === null ? "null" : "array",
						ownersLength: Array.isArray(owners) ? owners.length : null,
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {})
			// #endregion
			return (
				<div className="w-[320px] max-w-[320px] p-4 text-sm">
					{!key ? (
						<div className="text-muted-foreground">Missing entity id</div>
					) : owners === undefined ? (
						<div className="text-muted-foreground">Loading owners...</div>
					) : owners === null ? (
						<div className="text-muted-foreground">Unable to load owners</div>
					) : owners.length === 0 ? (
						<div className="text-muted-foreground">No owners captured</div>
					) : (
						<div className="space-y-3">
							{owners.map((o: EntityOwner, idx: number) => {
								const isEntity = (o?.member_type ?? "").toLowerCase() === "entity"
								return (
									<div
										key={`${data.id}-owner-${idx}`}
										className="flex items-center gap-3 rounded-md bg-background dark:bg-[#1f1f1f] px-4 py-3 shadow-sm"
									>
										<div
											className="flex h-12 w-12 items-center justify-center rounded-md bg-muted dark:bg-[#424242]"
										>
											{isEntity ? (
												<Building2 className="h-6 w-6 text-primary" />
											) : (
												<User className="h-6 w-6 text-primary" />
											)}
										</div>
										<div className="flex-1 space-y-1">
											<div className="text-lg font-semibold leading-tight">{o?.name || "-"}</div>
											<div className="text-muted-foreground text-sm leading-tight">{o?.title || "-"}</div>
											<div className="text-base font-semibold leading-tight">
												{o?.ownership_percent != null ? `${o.ownership_percent}%` : "-"}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
			)
		},
		rowDetailHeight: "auto",
	})

	// useLyteNyte returns the grid instance (not an object with grid)
	const grid = lyte as any

	// #region agent log
	fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			sessionId: "debug-session",
			runId: "fix-attempt-3",
			hypothesisId: "H2",
			location: "entities-lytenyte-grid.tsx:after-useLyteNyte",
			message: "grid presence after useLyteNyte",
			data: { hasLyte: !!lyte, gridType: typeof grid, hasGrid: !!grid, keys: grid ? Object.keys(grid).slice(0, 10) : [] },
			timestamp: Date.now(),
		}),
	}).catch(() => {})
	// #endregion

	// Guard against grid not being ready yet to avoid runtime errors while the
	// component mounts or the LyteNyte instance is still initializing.
	const selectedIds = grid?.state?.rowSelectedIds?.useValue?.() ?? []

	// #region agent log
	fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			sessionId: "debug-session",
			runId: "fix-attempt-3",
			hypothesisId: "H3",
			location: "entities-lytenyte-grid.tsx:selectedIds",
			message: "selected ids read",
			data: { hasGrid: !!grid, selectedCount: Array.isArray(selectedIds) ? selectedIds.length : null },
			timestamp: Date.now(),
		}),
	}).catch(() => {})
	// #endregion
	useEffect(() => {
		const detailExpansions = grid?.state?.rowDetailExpansions
		if (!detailExpansions) return
		detailExpansions.set(new Set(selectedIds))
	}, [grid, selectedIds])

	const toggleAssigned = (value: string) => {
		setAssignedFilter((prev) => {
			const next = new Set(prev)
			if (next.has(value)) next.delete(value)
			else next.add(value)
			return Array.from(next)
		})
	}

	if (!rows?.length) {
		return (
			<div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
				No entities yet.
			</div>
		)
	}

	if (!grid) {
		// #region agent log
		fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sessionId: "debug-session",
				runId: "fix-attempt-3",
				hypothesisId: "H4",
				location: "entities-lytenyte-grid.tsx:grid-missing",
				message: "grid not available yet",
				data: {},
				timestamp: Date.now(),
			}),
		}).catch(() => {})
		// #endregion
		return (
			<div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
				Loading grid...
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
				<Input
					placeholder="Search by ID, name, EIN, or type..."
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className="h-9 w-full sm:w-[240px] lg:w-[250px]"
				/>
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" className="h-8 border-dashed">
							<PlusCircledIcon className="h-4 w-4" />
							Assigned To
							{assignedFilter.length > 0 && (
								<>
									<Separator orientation="vertical" className="mx-2 h-4" />
									<Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
										{assignedFilter.length}
									</Badge>
									<div className="hidden space-x-1 lg:flex">
										{assignedFilter.length > 2 ? (
											<Badge variant="secondary" className="rounded-sm px-1 font-normal">
												{assignedFilter.length} selected
											</Badge>
										) : (
											assignedOptions
												.filter((o) => assignedFilter.includes(o.value))
												.map((o) => (
													<Badge
														variant="secondary"
														key={o.value}
														className="rounded-sm px-1 font-normal"
													>
														{o.label}
													</Badge>
												))
										)}
									</div>
								</>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[240px] p-0" align="start">
						<Command>
							<CommandInput placeholder="Assigned To" />
							<CommandList>
								<CommandEmpty>No results found.</CommandEmpty>
								<CommandGroup>
									{assignedOptions.map((option) => {
										const isSelected = assignedFilter.includes(option.value)
										return (
											<CommandItem key={option.value} onSelect={() => toggleAssigned(option.value)}>
												<div
													className={cn(
														"border-primary flex h-4 w-4 items-center justify-center rounded-sm border",
														isSelected
															? "bg-primary text-primary-foreground"
															: "opacity-50 [&_svg]:invisible"
													)}
												>
													<CheckIcon className="h-4 w-4" />
												</div>
												<span>{option.label}</span>
												{option.count ? (
													<span className="ml-auto flex h-4 w-6 items-center justify-center font-mono text-xs">
														{option.count}
													</span>
												) : null}
											</CommandItem>
										)
									})}
								</CommandGroup>
								{assignedFilter.length > 0 && (
									<>
										<CommandSeparator />
										<CommandGroup>
											<CommandItem
												onSelect={() => setAssignedFilter([])}
												className="justify-center text-center"
											>
												Clear filters
											</CommandItem>
										</CommandGroup>
									</>
								)}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => {
							setSearch("")
							setAssignedFilter([])
						}}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<Cross2Icon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<div className="h-full min-h-[320px]">
				<div className="min-h-[320px] h-[60vh] max-h-[70vh]">
					<LyteNyte key={`entities-grid-${dataVersion}-${dataForGrid.length}`} grid={grid} />
				</div>
			</div>
		</div>
	)
}
