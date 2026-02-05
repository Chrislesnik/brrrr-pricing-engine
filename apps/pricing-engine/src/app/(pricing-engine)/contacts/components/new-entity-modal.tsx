"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/shadcn/dialog"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/shadcn/select"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { DateInput } from "@/components/date-input"
import { Calendar } from "@repo/ui/shadcn/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/shadcn/popover"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { cn } from "@repo/lib/cn"
import {
	IconTrash,
	IconEye,
	IconEyeOff,
	IconShare,
	IconCopy,
	IconMail,
	IconBrandWhatsapp,
	IconBrandFacebook,
	IconBrandTwitter,
	IconBrandLinkedin,
	IconMessages,
} from "@tabler/icons-react"
import { toast } from "@/hooks/use-toast"

const schema = z.object({
	legal_name: z.string().min(1, "Legal name is required"),
	members: z.coerce.number().int().nonnegative().optional(),
	ein: z.string().optional().or(z.literal("")),
	entity_type: z
		.enum([
			"Corporation",
			"General Partnership",
			"Limited Liability Company",
			"Limited Partnership",
			"Sole Proprietorship",
			"Revocable Trust",
		])
		.optional(),
	date_formed: z.date().optional(),
	state_formed: z.string().optional().or(z.literal("")),
	address_line1: z.string().optional().or(z.literal("")),
	address_line2: z.string().optional().or(z.literal("")),
	city: z.string().optional().or(z.literal("")),
	state: z.string().optional().or(z.literal("")),
	zip: z.string().regex(/^[0-9]{5}$/).optional().or(z.literal("")),
	county: z.string().optional().or(z.literal("")),
	bank_name: z.string().optional().or(z.literal("")),
	account_balances: z.string().optional().or(z.literal("")),
	owners: z.array(z.object({ name: z.string(), percent: z.coerce.number().int().min(0).max(100) })).optional(),
})

type FormValues = z.infer<typeof schema>

type LinkableKind = "borrower" | "entity"

type LinkableOption = {
	id: string
	label: string
	kind: LinkableKind
}

function formatEINMasked(input: string) {
	const d = input.replace(/\D+/g, "").slice(0, 9)
	if (d.length <= 2) return d
	return `${d.slice(0, 2)}-${d.slice(2)}`
}
function formatSSNMasked(input: string) {
	const d = input.replace(/\D+/g, "").slice(0, 9)
	if (d.length <= 3) return d
	if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
	return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function formatCurrencyInput(input: string) {
	const cleaned = input.replace(/[^0-9.]/g, "")
	if (!cleaned) return ""
	const parts = cleaned.split(".")
	const intRaw = parts[0].replace(/^0+(?=\d)/, "") // trim leading zeros but keep single 0
	const intNum = intRaw ? Number(intRaw) : 0
	const intFmt = intNum.toLocaleString("en-US")
	let out = intFmt
	if (parts.length > 1) {
		const dec = parts[1].slice(0, 2)
		out = `${intFmt}${dec.length ? `.${dec}` : "."}`
	}
	return `$${out}`
}

function formatLocalYYYYMMDD(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

const US_STATES = [
	"AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

export function NewEntityModal({
	open,
	onOpenChange,
	entityId,
	initial,
	ownersInitial,
}: {
	open: boolean
	onOpenChange: (o: boolean) => void
	entityId?: string
	initial?: Partial<FormValues>
	ownersInitial?: {
		id: string
		name: string
		title: string
		memberType: "Individual" | "Entity" | ""
		ssnEin: string
		ssnEncrypted?: string | null
		ssnLast4?: string | null
		ein?: string | null
		showSsn?: boolean
		guarantor: "Yes" | "No" | ""
		percent: string
		address: string
		borrowerId?: string
		borrower_id?: string
		entityOwnerId?: string
		entity_owner_id?: string
	}[]
}) {
	const [dateFormedCalMonth, setDateFormedCalMonth] = useState<Date | undefined>(new Date(2000, 0, 1))
	const [einRaw, setEinRaw] = useState<string>("")
	const einRef = useRef<HTMLInputElement | null>(null)
	const router = useRouter()
	const [owners, setOwners] = useState<
		Array<{
			id: string
			name: string
			title: string
			memberType: "Individual" | "Entity" | ""
			ssnEin: string
			ssnEncrypted?: string | null
			ssnLast4?: string | null
			ein?: string | null
			guarantor: "Yes" | "No" | ""
			percent: string
			address: string
			borrowerId?: string
			entityOwnerId?: string
			showSsn?: boolean
		}>
	>([])
	const formId = "new-entity-form"

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { isSubmitting, errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {},
	})

	const [shareUrl, setShareUrl] = useState<string | null>(null)
	const [shareLoading, setShareLoading] = useState<boolean>(false)
	const [copied, setCopied] = useState<boolean>(false)
	const shareBaseUrl = "http://apply.whitelabellender.com/entity"

	// Preload share URL for new entity (not edit) using current org member id
	useEffect(() => {
		if (!open) return
		if (entityId) return
		let active = true
		setShareLoading(true)
		setShareUrl(null)
		setCopied(false)
		;(async () => {
			try {
				const res = await fetch("/api/org/members", { cache: "no-store" })
				const j = (await res.json().catch(() => ({}))) as { self_member_id?: string | null }
				if (!active) return
				const id = typeof j?.self_member_id === "string" ? j.self_member_id : null
				setShareUrl(id ? `${shareBaseUrl}/${encodeURIComponent(id)}` : null)
			} catch {
				if (!active) return
				setShareUrl(null)
			} finally {
				if (active) setShareLoading(false)
			}
		})()
		return () => {
			active = false
		}
	}, [entityId, open, shareBaseUrl])

	useEffect(() => {
		if (!open) setCopied(false)
	}, [open])

	const copyShareUrl = async () => {
		if (!shareUrl) return
		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(shareUrl)
			} else {
				const textarea = document.createElement("textarea")
				textarea.value = shareUrl
				document.body.appendChild(textarea)
				textarea.select()
				document.execCommand("copy")
				document.body.removeChild(textarea)
			}
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {
			setCopied(false)
		}
	}

	const openShareLink = (url: string) => {
		if (!shareUrl || shareLoading) return
		if (typeof window === "undefined") return
		window.open(url, "_blank", "noopener,noreferrer")
	}

	const onSubmit = async (_vals: FormValues) => {
		// Persist to API
		const ownersPayload = owners.map((o) => ({
			name: o.name || "",
			title: o.title || "",
			member_type: o.memberType || "",
			ssn: o.memberType === "Individual" ? (o.ssnEin || "") : "",
			ein: o.memberType === "Entity" ? (o.ssnEin || o.ein || "") : "",
			// Preserve encrypted/last4/ein if unchanged
			ssn_encrypted: (o as any).ssnEncrypted ?? (o as any).ssn_encrypted ?? undefined,
			ssn_last4: (o as any).ssnLast4 ?? (o as any).ssn_last4 ?? undefined,
			ownership_percent: o.percent ? Number(o.percent) : undefined,
			address: o.address || "",
			// Send both naming conventions to be extra robust with server parsing
			borrower_id: o.borrowerId || (o as any).borrower_id || undefined,
			borrowerId: o.borrowerId || (o as any).borrower_id || undefined,
			entity_owner_id: (o as any).entity_owner_id || o.entityOwnerId || undefined,
			entityOwnerId: o.entityOwnerId || (o as any).entity_owner_id || undefined,
		}))
		const base = {
			entity_name: _vals.legal_name || "",
			members:
				(_vals as any).members != null && !Number.isNaN((_vals as any).members)
					? Number((_vals as any).members)
					: undefined,
			entity_type: _vals.entity_type || "",
			ein: _vals.ein || "",
			// Use local calendar date to avoid timezone shifts
			date_formed: _vals.date_formed ? formatLocalYYYYMMDD(_vals.date_formed) : undefined,
			state_formed: _vals.state_formed || "",
			address_line1: _vals.address_line1 || "",
			address_line2: _vals.address_line2 || "",
			city: _vals.city || "",
			state: _vals.state || "",
			zip: _vals.zip || "",
			county: _vals.county || "",
			bank_name: _vals.bank_name || "",
			account_balances: _vals.account_balances || "",
			owners: ownersPayload,
		}
		// For updates, avoid sending empty strings which can overwrite existing data.
		const payload =
			entityId
				? (Object.fromEntries(
						Object.entries(base).filter(([_k, v]) => {
							// send owners for patch; skip only truly empty scalars
							if (v === "" || v === undefined) return false
							return true
						}),
				  ) as Record<string, unknown>)
				: (base as Record<string, unknown>)
		const url = entityId ? `/api/applicants/entities/${encodeURIComponent(entityId)}` : "/api/applicants/entities"
		const method = entityId ? "PATCH" : "POST"
		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		})
		if (!res.ok) {
			const j = await res.json().catch(() => ({} as any))
			toast({
				title: "Save failed",
				description: (j as any)?.error || "Unable to save entity.",
				variant: "destructive" as any,
			})
			return
		}
		onOpenChange(false)
		// Refresh pipeline immediately and notify any client tables to refetch
		try {
			router.refresh()
			if (typeof window !== "undefined") {
				window.dispatchEvent(new Event("app:entities:changed"))
			}
		} catch {
			// ignore
		}
	}

	const dateFormed = watch("date_formed")

	useEffect(() => {
		if (dateFormed) setDateFormedCalMonth(dateFormed)
	}, [dateFormed])

	// Create stable dependency keys so the effect deps array stays constant length across renders
	const initKey = useMemo(() => JSON.stringify(initial ?? {}), [initial])
	const ownersKey = useMemo(() => JSON.stringify(ownersInitial ?? []), [ownersInitial])

	// Reset all fields when the modal opens; if initial is provided, preload values for edit
	useEffect(() => {
		if (open) {
			if (initial && Object.keys(initial).length > 0) {
				reset({
					legal_name: (initial as any).legal_name ?? "",
					members: (initial as any).members ?? undefined,
					ein: (initial as any).ein ?? "",
					entity_type: (initial as any).entity_type ?? undefined,
					date_formed: (initial as any).date_formed ?? undefined,
					state_formed: (initial as any).state_formed ?? "",
					address_line1: (initial as any).address_line1 ?? "",
					address_line2: (initial as any).address_line2 ?? "",
					city: (initial as any).city ?? "",
					state: (initial as any).state ?? "",
					zip: (initial as any).zip ?? "",
					county: (initial as any).county ?? "",
					bank_name: (initial as any).bank_name ?? "",
					account_balances: (initial as any).account_balances ?? "",
				} as any)
				const einDigits = String((initial as any).ein ?? "").replace(/\D+/g, "").slice(0, 9)
				setEinRaw(einDigits)
			} else {
				reset({})
				setEinRaw("")
			}
			setOwners(
				Array.isArray(ownersInitial)
					? ownersInitial.map((o) => ({
							...o,
							borrowerId: (o as any).borrowerId || (o as any).borrower_id,
							entityOwnerId: (o as any).entityOwnerId || (o as any).entity_owner_id,
							ssnEncrypted: (o as any).ssnEncrypted ?? (o as any).ssn_encrypted,
							ssnLast4: (o as any).ssnLast4 ?? (o as any).ssn_last4,
							ein: (o as any).ein ?? null,
					  }))
					: [],
			)
			setDateFormedCalMonth(new Date(2000, 0, 1))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, reset, initKey, ownersKey])

	const membersReg = register("members")
	const zipReg = register("zip")
	const balancesReg = register("account_balances")
	const address2Reg = register("address_line2")
	const cityReg = register("city")
	const countyReg = register("county")
	const [linkableOpts, setLinkableOpts] = useState<LinkableOption[]>([])
	const [borrowerLoading, setBorrowerLoading] = useState(false)
	const [_excludeEntityIds, setExcludeEntityIds] = useState<Set<string>>(new Set())
	// Cache borrower details to avoid duplicate fetches
	const [borrowerCache, setBorrowerCache] = useState<
		Record<
			string,
			| undefined
			| {
					first_name?: string | null
					last_name?: string | null
					address_line1?: string | null
					city?: string | null
					state?: string | null
					zip?: string | null
					has_ssn?: boolean
					ssn_last4?: string | null
					primary_phone?: string | null
					full_ssn?: string | null
			  }
		>
	>({})

	// Load borrowers + entities for picker when modal opens; force-include any linked ids so Select shows preselected values
	useEffect(() => {
		if (!open) return
		setBorrowerLoading(true)
		const borrowerIds = Array.from(
			new Set(
				(ownersInitial ?? [])
					.map((o) => (o as any).borrowerId || (o as any).borrower_id)
					.filter(Boolean) as string[],
			),
		)
		const entityIds = Array.from(
			new Set(
				(ownersInitial ?? [])
					.map((o) => (o as any).entityOwnerId || (o as any).entity_owner_id)
					.filter(Boolean) as string[],
			),
		)
		const borrowerQs = borrowerIds.length ? `?includeIds=${encodeURIComponent(borrowerIds.join(","))}` : ""
		const entityQs = entityIds.length ? `?includeIds=${encodeURIComponent(entityIds.join(","))}` : ""
		const exclusionPromise = entityId
			? fetch(`/api/applicants/entities/${encodeURIComponent(entityId)}/owners`)
					.then((r) => r.json())
					.then((j) => {
						const exclude = new Set<string>()
						exclude.add(entityId)
						if (Array.isArray(j?.owned_by_entities)) j.owned_by_entities.forEach((x: string) => x && exclude.add(x))
						if (Array.isArray(j?.owns_entities)) j.owns_entities.forEach((x: string) => x && exclude.add(x))
						setExcludeEntityIds(exclude)
						return exclude
					})
					.catch(() => new Set<string>())
			: Promise.resolve(new Set<string>())

		Promise.all([
			fetch(`/api/applicants/borrowers${borrowerQs}`).then((r) => r.json()).catch(() => ({})),
			fetch(`/api/applicants/entities${entityQs}`).then((r) => r.json()).catch(() => ({})),
			exclusionPromise,
		])
			.then(([bj, ej, exclude]) => {
				const borrowerOpts =
					(bj.borrowers ?? []).map((b: any) => ({
						id: b.id as string,
						label: `Borrower · ${(b.display_id ?? b.id) as string} ${[b.first_name, b.last_name].filter(Boolean).join(" ")}`.trim(),
						kind: "borrower" as LinkableKind,
					})) ?? []
				const entityIdSet = new Set(entityIds)
				const entityOpts =
					(ej.entities ?? [])
						// Always include explicitly requested entities even if they would otherwise be excluded
						.filter((e: any) => !exclude.has(e.id as string) || entityIdSet.has(e.id as string))
						.map((e: any) => ({
							id: e.id as string,
							label: `Entity · ${(e.display_id ?? e.id) as string} ${e.entity_name ?? ""}`.trim(),
							kind: "entity" as LinkableKind,
						})) ?? []
				setLinkableOpts([...entityOpts, ...borrowerOpts])
			})
			.finally(() => setBorrowerLoading(false))
	}, [open, ownersInitial, entityId])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-3xl h-[80vh]"
				showCloseButton={false}
				onPointerDownOutside={(event) => {
					// Only allow overlay clicks to close; ignore stray clicks on portalled children.
					const target = event.target as HTMLElement | null
					if (!target?.closest("[data-slot='dialog-overlay']")) {
						event.preventDefault()
					}
				}}
			>
				<DialogHeader className="flex flex-row items-center justify-between gap-3">
					<DialogTitle>Borrowing Entity</DialogTitle>
					{!entityId ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={shareLoading || !shareUrl}
									className="h-9 w-9"
									aria-label="Share entity invite link"
								>
									<IconShare className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64">
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										copyShareUrl()
									}}
								>
									<IconCopy className="mr-2 h-4 w-4" />
									<span>{copied ? "Copied" : "Copy URL"}</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>Share via</DropdownMenuLabel>
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										if (!shareUrl) return
										openShareLink(
											`mailto:?subject=${encodeURIComponent("Entity link")}&body=${encodeURIComponent(
												`Please complete this entity form: ${shareUrl}`
											)}`
										)
									}}
								>
									<IconMail className="mr-2 h-4 w-4" />
									<span>Email</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										if (!shareUrl) return
										openShareLink(`sms:?&body=${encodeURIComponent(shareUrl)}`)
									}}
								>
									<IconMessages className="mr-2 h-4 w-4" />
									<span>SMS</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										if (!shareUrl) return
										openShareLink(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`)
									}}
								>
									<IconBrandWhatsapp className="mr-2 h-4 w-4" />
									<span>WhatsApp</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										if (!shareUrl) return
										openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)
									}}
								>
									<IconBrandFacebook className="mr-2 h-4 w-4" />
									<span>Facebook</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										if (!shareUrl) return
										openShareLink(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`)
									}}
								>
									<IconBrandTwitter className="mr-2 h-4 w-4" />
									<span>Twitter</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={shareLoading || !shareUrl}
									onSelect={(e) => {
										e.preventDefault()
										if (!shareUrl) return
										openShareLink(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)
									}}
								>
									<IconBrandLinkedin className="mr-2 h-4 w-4" />
									<span>LinkedIn</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
				</DialogHeader>
				<div className="max-h-[calc(80vh-4rem)] overflow-y-auto pr-1">
				<form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 pb-3">
					{/* Watch address to control street-only display */}
					{ }
					{null}
					<section>
						<div className="mb-2 text-sm font-semibold">Business Information</div>
						<div className="grid gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>Legal Name of Business Entity</Label>
									<Input placeholder="Enter legal business name" {...register("legal_name")} />
									{(errors as any)?.legal_name ? (
										<p className="text-xs text-red-600">{(errors as any).legal_name.message as string}</p>
									) : null}
								</div>
								<div className="flex flex-col gap-1">
									<Label># of Members</Label>
									<Input
										placeholder="Enter number of members"
										inputMode="numeric"
										{...membersReg}
										onChange={(e) => {
											const digits = e.target.value.replace(/[^0-9]/g, "")
											e.target.value = digits
											membersReg.onChange(e)
										}}
									/>
								</div>
							</div>
							{/* Link to Borrower moved to each Owner card below */}
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>EIN</Label>
									<Input
										placeholder="XX-XXXXXXX"
										name="ein"
										ref={einRef}
										value={formatEINMasked(einRaw)}
										onChange={(e) => {
											const digits = e.target.value.replace(/\D+/g, "").slice(0, 9)
											setEinRaw(digits)
											setValue("ein", digits, { shouldDirty: true, shouldValidate: false })
											queueMicrotask(() => {
												const el = einRef.current
												if (el) {
													const len = formatEINMasked(digits).length
													el.setSelectionRange(len, len)
												}
											})
										}}
										inputMode="numeric"
										maxLength={10}
										autoComplete="off"
										onKeyDown={(e) => {
											const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End","Enter"]
											if (allowed.includes(e.key) || e.metaKey || e.ctrlKey) return
											if (!/^[0-9]$/.test(e.key)) {
												e.preventDefault()
											}
										}}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label>Entity Type</Label>
									<Select value={(watch("entity_type") as any) ?? undefined} onValueChange={(v) => setValue("entity_type", v as any)}>
										<SelectTrigger><SelectValue placeholder="Select entity type"/></SelectTrigger>
										<SelectContent>
											<SelectItem value="Corporation">Corporation</SelectItem>
											<SelectItem value="General Partnership">General Partnership</SelectItem>
											<SelectItem value="Limited Liability Company">Limited Liability Company</SelectItem>
											<SelectItem value="Limited Partnership">Limited Partnership</SelectItem>
											<SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
											<SelectItem value="Revocable Trust">Revocable Trust</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>Date Formed</Label>
									<Popover>
										<PopoverTrigger asChild>
											<div className="relative">
												<DateInput emptyOnMount value={dateFormed} onChange={(d) => setValue("date_formed", d ?? undefined)} />
												<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
														<rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" />
														<line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" />
														<line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" />
														<line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" />
													</svg>
												</span>
											</div>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												captionLayout="dropdown"
												selected={dateFormed}
												month={dateFormedCalMonth}
												onMonthChange={setDateFormedCalMonth}
												onSelect={(d) => d && setValue("date_formed", d)}
												disabled={(d) => {
													const today = new Date()
													today.setHours(0,0,0,0)
													return d > today
												}}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
								<div className="flex flex-col gap-1">
									<Label>State of Formation</Label>
									<Select value={watch("state_formed") ?? undefined} onValueChange={(v) => setValue("state_formed", v)}>
										<SelectTrigger><SelectValue placeholder="Select state"/></SelectTrigger>
										<SelectContent>
											{US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</section>

					<section>
						<div className="mb-2 text-sm font-semibold">Business Address</div>
						<div className="grid gap-3">
							<div className="flex flex-col gap-1">
								<Label>Business Address</Label>
								<AddressAutocomplete
									value={watch("address_line1") ?? ""}
									displayValue="street"
									placeholder="Start typing your business address..."
									onChange={(addr) => {
										setValue("address_line1", addr.address_line1 ?? "")
										setValue("city", addr.city ?? "")
										setValue("state", addr.state ?? "")
										setValue("zip", addr.zip ?? "")
										setValue("county", addr.county ?? "")
									}}
								/>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>Address Line 2</Label>
									<Input
										placeholder="Suite, Floor, etc. (optional)"
										{...address2Reg}
										value={watch("address_line2") ?? ""}
										onChange={(e) => address2Reg.onChange(e)}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label>City</Label>
									<Input
										placeholder="Enter city"
										{...cityReg}
										value={watch("city") ?? ""}
										onChange={(e) => cityReg.onChange(e)}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label>State</Label>
									<Select value={watch("state") ?? undefined} onValueChange={(v) => setValue("state", v)}>
										<SelectTrigger><SelectValue placeholder="Select state"/></SelectTrigger>
										<SelectContent>
											{US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-1">
									<Label>Zip Code</Label>
									<Input
										placeholder="Enter zip code"
										inputMode="numeric"
										pattern="\\d*"
										{...zipReg}
										onChange={(e) => {
											const digits = e.target.value.replace(/[^0-9]/g, "")
											e.target.value = digits
											zipReg.onChange(e)
										}}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label>County</Label>
									<Input
										placeholder="Enter county"
										{...countyReg}
										value={watch("county") ?? ""}
										onChange={(e) => countyReg.onChange(e)}
									/>
								</div>
							</div>
						</div>
					</section>

					<section>
						<div className="mb-2 text-sm font-semibold">Banking Information</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="flex flex-col gap-1">
								<Label>Bank of Business Account</Label>
								<Input placeholder="Enter bank name" {...register("bank_name")} />
							</div>
							<div className="flex flex-col gap-1">
								<Label>Account Balance(s)</Label>
								<Input
									placeholder="Enter account balance"
									inputMode="decimal"
									{...balancesReg}
									value={watch("account_balances") ?? ""}
									onChange={(e) => {
										const formatted = formatCurrencyInput(e.target.value)
										e.target.value = formatted
										balancesReg.onChange(e)
									}}
								/>
							</div>
						</div>
					</section>

					<section>
						<div className="mb-2 text-sm font-semibold">Schedule A: Entity Ownership</div>
						<div className="flex flex-col gap-2">
							{owners.length === 0 && <div className="text-sm text-muted-foreground">No owners added.</div>}
							{owners.map((o, idx) => {
								const _mask = o.memberType === "Entity" ? formatEINMasked : formatSSNMasked
								const ssnDigits = (o.ssnEin || "").replace(/\D+/g, "")
								const displaySsnEin =
									o.memberType === "Entity"
										? o.ssnEin?.trim()
											? formatEINMasked(o.ssnEin)
											: o.ein
												? formatEINMasked(o.ein)
												: ""
										: o.showSsn && ssnDigits.length > 0
											? formatSSNMasked(ssnDigits)
											: ssnDigits.length >= 4
												? `***-**-${ssnDigits.slice(-4)}`
												: o.ssnLast4
													? `***-**-${o.ssnLast4}`
													: ""
								const idPrefix = `owner-${idx + 1}`
								const linked = Boolean(o.borrowerId || o.entityOwnerId)
								return (
									<div key={o.id} className="rounded-md border p-3">
										<div className="mb-2 flex items-center justify-between">
											<div className="text-sm font-medium">Owner {idx + 1}</div>
											<button
												type="button"
												className="text-muted-foreground hover:text-red-500"
												onClick={() => setOwners((prev) => prev.filter((x) => x.id !== o.id))}
												aria-label="Remove owner"
											>
												<IconTrash size={16} />
											</button>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<div className="flex flex-col gap-1 sm:col-span-2">
												<Label className={linked ? "text-blue-700" : ""}>Link to Owner (borrower or entity)</Label>
												<Select
													disabled={borrowerLoading}
													value={
														o.borrowerId
															? `borrower:${o.borrowerId}`
															: o.entityOwnerId
																? `entity:${o.entityOwnerId}`
																: undefined
													}
													onValueChange={async (v) => {
														// Clear selection -> reset fields and make editable
														if (!v || v === "__none__") {
															setOwners((prev) => {
																if (idx < 0 || idx >= prev.length) return prev
																const next = prev.slice()
																next[idx] = {
																	...next[idx],
																	borrowerId: undefined,
																	entityOwnerId: undefined,
																	name: "",
																	memberType: "",
																	ssnEin: "",
																	address: "",
																}
																return next
															})
															return
														}
														const [kind, id] = v.split(":")
														if (kind === "borrower") {
															setOwners((prev) => {
																if (idx < 0 || idx >= prev.length) return prev
																const next = prev.slice()
																next[idx] = {
																	...next[idx],
																	borrowerId: id,
																	entityOwnerId: undefined,
																}
																return next
															})
															try {
																let details = borrowerCache[id]
																if (!details) {
																	const res = await fetch(`/api/applicants/borrowers/${encodeURIComponent(id)}`, { cache: "no-store" })
																	const j = await res.json().catch(() => ({} as any))
																	const b = (j?.borrower ?? {}) as any
																	details = {
																		first_name: b.first_name ?? "",
																		last_name: b.last_name ?? "",
																		address_line1: b.address_line1 ?? "",
																		city: b.city ?? "",
																		state: b.state ?? "",
																		zip: b.zip ?? "",
																		has_ssn: Boolean(b.has_ssn),
																		ssn_last4: b.ssn_last4 ?? null,
																		primary_phone: b.primary_phone ?? null,
																		full_ssn: null,
																	}
																	if (details.has_ssn) {
																		try {
																			const ssnRes = await fetch(`/api/applicants/borrowers/${encodeURIComponent(id)}/ssn`, { cache: "no-store" })
																			if (ssnRes.ok) {
																				const s = await ssnRes.json().catch(() => ({} as any))
																				const digits = String(s?.ssn ?? "").replace(/\D+/g, "").slice(0, 9)
																				if (digits.length === 9) details.full_ssn = digits
																			}
																		} catch {
																			// ignore
																		}
																	}
																	setBorrowerCache((prev) => ({ ...prev, [id]: details }))
																}
																const fullName = [details?.first_name ?? "", details?.last_name ?? ""].filter(Boolean).join(" ").trim()
																const addrParts = [
																	details?.address_line1 ?? "",
																	[details?.city ?? "", details?.state ?? ""].filter(Boolean).join(", "),
																	details?.zip ?? "",
																]
																	.map((s) => (s ?? "").toString().trim())
																	.filter(Boolean)
																const homeAddr = addrParts.join(", ").replace(/,\\s*,/g, ", ")
																setOwners((prev) => {
																	if (idx < 0 || idx >= prev.length) return prev
																	const next = prev.slice()
																	next[idx] = {
																		...next[idx],
																		borrowerId: id,
																		name: fullName || next[idx].name,
																		memberType: "Individual",
																		ssnEin: details?.full_ssn ?? next[idx].ssnEin,
																		showSsn: false, // Always hidden by default
																		address: homeAddr || next[idx].address,
																	}
																	return next
																})
															} catch {
																// silent fail
															}
															return
														}

														// entity link
														if (kind === "entity") {
															try {
																const res = await fetch(`/api/applicants/entities/${encodeURIComponent(id)}`, { cache: "no-store" })
																const j = await res.json().catch(() => ({} as any))
																const e = (j?.entity ?? {}) as any
																const fullName = e.entity_name ?? ""
																const addrParts = [
																	e.address_line1 ?? "",
																	[e.city ?? "", e.state ?? ""].filter(Boolean).join(", "),
																	e.zip ?? "",
																]
																	.map((s: any) => (s ?? "").toString().trim())
																	.filter(Boolean)
																const homeAddr = addrParts.join(", ").replace(/,\\s*,/g, ", ")
																const einDigits = (e.ein ?? "").toString().replace(/\D+/g, "").slice(0, 9)
																setOwners((prev) => {
																	if (idx < 0 || idx >= prev.length) return prev
																	const next = prev.slice()
																	next[idx] = {
																		...next[idx],
																		borrowerId: undefined,
																		entityOwnerId: id,
																		name: fullName || next[idx].name,
																		memberType: "Entity",
																		ssnEin: einDigits || next[idx].ssnEin,
																		address: homeAddr || next[idx].address,
																	}
																	return next
																})
															} catch {
																// silent fail
															}
														}
													}}
												>
													<SelectTrigger className={linked ? "ring-1 ring-blue-300 focus:ring-blue-500 text-blue-700" : ""}>
														<SelectValue placeholder={borrowerLoading ? "Loading..." : "Select borrower or entity"} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none__">— None —</SelectItem>
														{linkableOpts.map((opt) => (
															<SelectItem key={`${opt.kind}:${opt.id}`} value={`${opt.kind}:${opt.id}`}>
																{opt.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-name`}>Full Name</Label>
												<Input
													id={`${idPrefix}-name`}
													placeholder="Enter full name"
													value={o.name}
													disabled={linked}
													readOnly={linked}
													className={cn(linked ? "bg-muted/50" : undefined)}
													onChange={(e) => {
														if (linked) return
														const next = owners.slice()
														next[idx] = { ...o, name: e.target.value }
														setOwners(next)
													}}
													onKeyDown={(e) => {
														if (linked) e.preventDefault()
													}}
													onBeforeInput={(e) => {
														if (linked) e.preventDefault()
													}}
													onPaste={(e) => {
														if (linked) e.preventDefault()
													}}
												/>
											</div>
											<div className="flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-title`}>Title</Label>
												<Input
													id={`${idPrefix}-title`}
													placeholder="Enter title"
													value={o.title}
													onChange={(e) => {
														const next = owners.slice()
														next[idx] = { ...o, title: e.target.value }
														setOwners(next)
													}}
												/>
											</div>
											<div className="flex flex-col gap-1">
												<Label>Member Type</Label>
												<Select
													value={o.memberType || undefined}
													disabled={linked}
													onValueChange={(v: "Individual" | "Entity") => {
														if (linked) return
														const next = owners.slice()
														next[idx] = { ...o, memberType: v }
														setOwners(next)
													}}
												>
													<SelectTrigger
														disabled={linked}
														aria-disabled={linked}
														className={cn(linked ? "pointer-events-none opacity-70 bg-muted/50" : undefined)}
													>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Individual">Individual</SelectItem>
														<SelectItem value="Entity">Entity</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-ssn`}>{o.memberType === "Entity" ? "EIN" : "SSN"}</Label>
												<div className="relative">
													<Input
														id={`${idPrefix}-ssn`}
														placeholder={o.memberType === "Entity" ? "XX-XXXXXXX" : "XXX-XX-XXXX"}
														inputMode="numeric"
														pattern="\\d*"
														type={o.memberType === "Entity" ? "text" : (o.showSsn ? "text" : "password")}
														value={displaySsnEin}
													disabled={linked}
													readOnly={linked}
														onChange={(e) => {
														if (linked) return
															const digits = e.target.value.replace(/\D+/g, "").slice(0, 9)
															const next = owners.slice()
															next[idx] = { ...o, ssnEin: digits }
															setOwners(next)
														}}
														className={cn(o.memberType === "Entity" ? undefined : "pr-9", linked ? "bg-muted/50" : undefined)}
													onKeyDown={(e) => {
														if (linked) e.preventDefault()
													}}
													onBeforeInput={(e) => {
														if (linked) e.preventDefault()
													}}
													onPaste={(e) => {
														if (linked) e.preventDefault()
													}}
													/>
													{(o.memberType !== "Entity") ? (
														<button
															type="button"
															aria-label={o.showSsn ? "Hide SSN" : "Show SSN"}
														disabled={linked}
															onClick={() => {
																if (linked) return
																const next = owners.slice()
																next[idx] = { ...o, showSsn: !o.showSsn }
																setOwners(next)
															}}
															className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
														>
															{o.showSsn ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
														</button>
													) : null}
												</div>
											</div>
											<div className="flex flex-col gap-1">
												<Label>Ownership %</Label>
												<Input
													placeholder="0%"
													inputMode="numeric"
													pattern="\\d*"
													value={o.percent}
													onChange={(e) => {
														const digits = e.target.value.replace(/[^0-9]/g, "")
														const next = owners.slice()
														next[idx] = { ...o, percent: digits }
														setOwners(next)
													}}
												/>
											</div>
											<div className="sm:col-span-2 flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-addr`}>Home Address</Label>
												{linked ? (
													<Input
														id={`${idPrefix}-addr`}
														placeholder="Enter home address"
														value={o.address}
														disabled
														readOnly
														className="bg-muted/50"
													/>
												) : (
													<AddressAutocomplete
														id={`${idPrefix}-addr`}
														value={o.address}
														placeholder="Start typing home address..."
														displayValue="full"
														onChange={(addr) => {
															const full = addr.raw || [
																addr.address_line1 ?? "",
																[addr.city ?? "", addr.state ?? ""].filter(Boolean).join(", "),
																addr.zip ?? "",
															]
																.map((s) => (s ?? "").toString().trim())
																.filter(Boolean)
																.join(", ")
																.replace(/,\\s*,/g, ", ")
															const next = owners.slice()
															next[idx] = { ...o, address: full }
															setOwners(next)
														}}
													/>
												)}
											</div>
										</div>
									</div>
								)
							})}
							<div>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										setOwners((prev) => [
											...prev,
											{
												id: crypto.randomUUID(),
												name: "",
												title: "",
												memberType: "",
												ssnEin: "",
												guarantor: "",
												percent: "",
												address: "",
												borrowerId: undefined,
												showSsn: false,
											},
										])
									}
								>
									+ Add Owner
								</Button>
							</div>
						</div>
					</section>
				</form>
				</div>
				<div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button form={formId} type="submit" disabled={isSubmitting}>Save</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}


export default NewEntityModal


