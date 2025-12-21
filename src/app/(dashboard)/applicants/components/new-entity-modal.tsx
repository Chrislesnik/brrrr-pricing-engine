"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { DateInput } from "@/components/date-input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { IconTrash } from "@tabler/icons-react"

const schema = z.object({
	legal_name: z.string().optional().or(z.literal("")),
	members: z.coerce.number().int().nonnegative().optional(),
	ein: z.string().optional().or(z.literal("")),
	entity_type: z.enum(["LLC","Corporation","Partnership","Trust","Other"]).optional(),
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

const US_STATES = [
	"AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

export function NewEntityModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
	const [dateFormedCalMonth, setDateFormedCalMonth] = useState<Date | undefined>(new Date(2000, 0, 1))
	const [einRaw, setEinRaw] = useState<string>("")
	const einRef = useRef<HTMLInputElement | null>(null)
	const [owners, setOwners] = useState<
		Array<{
			id: string
			name: string
			title: string
			memberType: "Individual" | "Entity" | ""
			ssnEin: string
			guarantor: "Yes" | "No" | ""
			percent: string
			address: string
		}>
	>([])
	const formId = "new-entity-form"

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {},
	})

	const onSubmit = async (_vals: FormValues) => {
		// Persist to API
		const ownersPayload = owners.map((o) => ({
			name: o.name || "",
			title: o.title || "",
			member_type: o.memberType || "",
			id_number: o.ssnEin || "",
			guarantor: o.guarantor === "Yes",
			ownership_percent: o.percent ? Number(o.percent) : undefined,
			address: o.address || "",
		}))
		const payload = {
			entity_name: _vals.legal_name || "",
			entity_type: _vals.entity_type || "",
			ein: _vals.ein || "",
			date_formed: _vals.date_formed ? _vals.date_formed.toISOString().slice(0, 10) : undefined,
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
			link_borrower_id: linkBorrowerId,
		}
		await fetch("/api/applicants/entities", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		})
		onOpenChange(false)
	}

	const dateFormed = watch("date_formed")

	useEffect(() => {
		if (dateFormed) setDateFormedCalMonth(dateFormed)
	}, [dateFormed])

	// Reset all fields every time the modal opens
	useEffect(() => {
		if (open) {
			reset({})
			setEinRaw("")
			setOwners([])
			setDateFormedCalMonth(new Date(2000, 0, 1))
		}
	}, [open, reset])

	const membersReg = register("members")
	const zipReg = register("zip")
	const balancesReg = register("account_balances")
	const address2Reg = register("address_line2")
	const cityReg = register("city")
	const countyReg = register("county")
	const [borrowerOpts, setBorrowerOpts] = useState<Array<{ id: string; label: string }>>([])
	const [borrowerLoading, setBorrowerLoading] = useState(false)
	const [linkBorrowerId, setLinkBorrowerId] = useState<string | undefined>(undefined)

	// Load borrowers for picker when modal opens
	useEffect(() => {
		if (!open) return
		setBorrowerLoading(true)
		fetch("/api/applicants/borrowers")
			.then((r) => r.json())
			.then((j) => {
				const opts = (j.borrowers ?? []).map((b: any) => ({
					id: b.id as string,
					label: `${b.display_id ?? ""} ${[b.first_name, b.last_name].filter(Boolean).join(" ")}`.trim(),
				}))
				setBorrowerOpts(opts)
			})
			.finally(() => setBorrowerLoading(false))
	}, [open])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl h-[80vh]">
				<DialogHeader>
					<DialogTitle>Borrowing Entity</DialogTitle>
				</DialogHeader>
				<div className="max-h-[calc(80vh-4rem)] overflow-y-auto pr-1">
				<form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-3">
					{/* Watch address to control street-only display */}
					{/* eslint-disable-next-line react-hooks/rules-of-hooks */}
					{null}
					<section>
						<div className="mb-2 text-sm font-semibold">Business Information</div>
						<div className="grid gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>Legal Name of Business Entity</Label>
									<Input placeholder="Enter legal business name" {...register("legal_name")} />
								</div>
								<div className="flex flex-col gap-1">
									<Label># of Members</Label>
									<Input
										placeholder="Enter number of members"
										inputMode="numeric"
										pattern="\\d*"
										{...membersReg}
										onChange={(e) => {
											const digits = e.target.value.replace(/[^0-9]/g, "")
											e.target.value = digits
											membersReg.onChange(e)
										}}
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>Link to Borrower</Label>
									<Select
										disabled={borrowerLoading}
										onValueChange={(v) => setLinkBorrowerId(v)}
									>
										<SelectTrigger>
											<SelectValue placeholder={borrowerLoading ? "Loading..." : "Select borrower (optional)"} />
										</SelectTrigger>
										<SelectContent>
											{borrowerOpts.map((b) => (
												<SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div />
							</div>
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
										pattern="\\d*"
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
									<Select onValueChange={(v) => setValue("entity_type", v as any)}>
										<SelectTrigger><SelectValue placeholder="Select entity type"/></SelectTrigger>
										<SelectContent>
											<SelectItem value="LLC">LLC</SelectItem>
											<SelectItem value="Corporation">Corporation</SelectItem>
											<SelectItem value="Partnership">Partnership</SelectItem>
											<SelectItem value="Trust">Trust</SelectItem>
											<SelectItem value="Other">Other</SelectItem>
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
									<Select onValueChange={(v) => setValue("state_formed", v)}>
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
									<Select onValueChange={(v) => setValue("state", v)}>
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
								const mask = o.memberType === "Entity" ? formatEINMasked : formatSSNMasked
								const idPrefix = `owner-${idx + 1}`
								return (
									<div key={o.id} className="rounded-md border p-3">
										<div className="mb-2 flex items-center justify-between">
											<div className="text-sm font-medium">Owner {idx + 1}</div>
											<button
												type="button"
												className="text-muted-foreground hover:text-foreground"
												onClick={() => setOwners((prev) => prev.filter((x) => x.id !== o.id))}
												aria-label="Remove owner"
											>
												<IconTrash size={16} />
											</button>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<div className="flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-name`}>Full Name</Label>
												<Input
													id={`${idPrefix}-name`}
													placeholder="Enter full name"
													value={o.name}
													onChange={(e) => {
														const next = owners.slice()
														next[idx] = { ...o, name: e.target.value }
														setOwners(next)
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
													onValueChange={(v: "Individual" | "Entity") => {
														const next = owners.slice()
														next[idx] = { ...o, memberType: v }
														setOwners(next)
													}}
												>
													<SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
													<SelectContent>
														<SelectItem value="Individual">Individual</SelectItem>
														<SelectItem value="Entity">Entity</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-ssn`}>{o.memberType === "Entity" ? "EIN" : "SSN"}</Label>
												<Input
													id={`${idPrefix}-ssn`}
													placeholder={o.memberType === "Entity" ? "XX-XXXXXXX" : "XXX-XX-XXXX"}
													inputMode="numeric"
													pattern="\\d*"
													value={mask(o.ssnEin)}
													onChange={(e) => {
														const digits = e.target.value.replace(/\D+/g, "").slice(0, 9)
														const next = owners.slice()
														next[idx] = { ...o, ssnEin: digits }
														setOwners(next)
													}}
												/>
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
											<div className="flex flex-col gap-1">
												<Label>Guarantor?</Label>
												<Select
													value={o.guarantor || undefined}
													onValueChange={(v: "Yes" | "No") => {
														const next = owners.slice()
														next[idx] = { ...o, guarantor: v }
														setOwners(next)
													}}
												>
													<SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
													<SelectContent>
														<SelectItem value="Yes">Yes</SelectItem>
														<SelectItem value="No">No</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="sm:col-span-2 flex flex-col gap-1">
												<Label htmlFor={`${idPrefix}-addr`}>Home Address</Label>
												<Input
													id={`${idPrefix}-addr`}
													placeholder="Enter home address"
													value={o.address}
													onChange={(e) => {
														const next = owners.slice()
														next[idx] = { ...o, address: e.target.value }
														setOwners(next)
													}}
												/>
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


