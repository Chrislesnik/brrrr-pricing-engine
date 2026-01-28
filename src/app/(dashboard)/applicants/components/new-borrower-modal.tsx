"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { DateInput } from "@/components/date-input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
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
import { MinusIcon, PlusIcon } from "lucide-react"
import { Button as AriaButton, Group, Input as AriaInput, NumberField } from "react-aria-components"

const schema = z.object({
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	ssn: z.string().regex(/^[0-9]{9}$/).optional().or(z.literal("")),
	date_of_birth: z.date().optional(),
	fico_score: z.coerce.number().int().min(300).max(850).optional(),
	email: z.string().email().optional().or(z.literal("")),
	primary_phone: z.string().optional().or(z.literal("")),
	alt_phone: z.string().optional().or(z.literal("")),
	address_line1: z.string().optional().or(z.literal("")),
	address_line2: z.string().optional().or(z.literal("")),
	city: z.string().optional().or(z.literal("")),
	state: z.string().optional().or(z.literal("")),
	zip: z.string().regex(/^[0-9]{5}$/).optional().or(z.literal("")),
	county: z.string().optional().or(z.literal("")),
	citizenship: z.enum(["U.S. Citizen", "Permanent Resident", "Non-Permanent Resident", "Foreign National"]).optional(),
	green_card: z.boolean().optional(),
	visa: z.boolean().optional(),
	visa_type: z.string().optional().or(z.literal("")),
	rentals_owned: z.coerce.number().int().nonnegative().optional(),
	fix_flips_3yrs: z.coerce.number().int().nonnegative().optional(),
	groundups_3yrs: z.coerce.number().int().nonnegative().optional(),
	real_estate_licensed: z.enum(["Yes","No"]).optional(),
})

type FormValues = z.infer<typeof schema>

function formatSSN(input: string) {
	// Only digits, format as 3-2-4 (xxx-xx-xxxx) with exactly two dashes visually
	const d = input.replace(/\D+/g, "").slice(0, 9)
	if (d.length <= 3) return d
	if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
	return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function formatUS(input: string) {
	// Progressive formatter where the first typed digit becomes the +X country code,
	// and the rest formats as (AAA) BBB-CCCC as digits are entered.
	const digits = input.replace(/\D+/g, "").slice(0, 11) // 1 country + up to 10 national
	if (digits.length === 0) return ""
	const cc = digits[0] // country code single digit
	const national = digits.slice(1) // remaining digits for US national number
	let out = `+${cc}`
	if (national.length === 0) return out
	if (national.length <= 3) return `${out} (${national}`
	if (national.length <= 6) return `${out} (${national.slice(0,3)}) ${national.slice(3)}`
	return `${out} (${national.slice(0,3)}) ${national.slice(3,6)}-${national.slice(6)}`
}

async function createBorrower(payload: Record<string, unknown>) {
	const res = await fetch("/api/applicants/borrowers", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})
	if (!res.ok) {
		const j = await res.json().catch(() => ({}))
		throw new Error(j?.error || "Failed to create borrower")
	}
	return await res.json()
}

export function NewBorrowerModal({
	open,
	onOpenChange,
	borrowerId,
	initial,
}: {
	open: boolean
	onOpenChange: (o: boolean) => void
	borrowerId?: string
	initial?: Partial<FormValues>
}) {
	// Calendar should not jump to today when empty; default to placeholder month/year (Jan 2000)
	const [dobCalMonth, setDobCalMonth] = useState<Date | undefined>(new Date(2000, 0, 1))
	const router = useRouter()
	const [ssnRaw, setSsnRaw] = useState<string>("")
	const ssnInputRef = useRef<HTMLInputElement | null>(null)
	const [showSsn, setShowSsn] = useState<boolean>(false)
	const [hasStoredSsn, setHasStoredSsn] = useState<boolean>(false)
	const [ssnLast4, setSsnLast4] = useState<string | null>(null)
	const formId = "new-borrower-form"
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { real_estate_licensed: undefined, ...(initial ?? {}) },
	})

	const ficoReg = register("fico_score")

	const citizenship = watch("citizenship")
	const isImmigrationRelevant =
		citizenship === "Permanent Resident" ||
		citizenship === "Non-Permanent Resident" ||
		citizenship === "Foreign National"
	const isVisaRelevant =
		citizenship === "Non-Permanent Resident" ||
		citizenship === "Foreign National"
	const visa = watch("visa")
	const isVisaTypeEnabled = isVisaRelevant && visa === true
	const dob = watch("date_of_birth")
	const primaryPhone = watch("primary_phone")
	const altPhone = watch("alt_phone")
	const [shareUrl, setShareUrl] = useState<string | null>(null)
	const [shareLoading, setShareLoading] = useState<boolean>(false)
	const [copied, setCopied] = useState<boolean>(false)
	const shareBaseUrl = "http://apply.whitelabellender.com/guarantor"
	// Keep calendar view in sync with a picked date, otherwise keep placeholder month
	useEffect(() => {
		if (dob) setDobCalMonth(dob)
	}, [dob])

	// Preload share URL for new borrower (not edit) using current org member id
	useEffect(() => {
		if (!open) return
		if (borrowerId) return
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
	}, [borrowerId, open, shareBaseUrl])

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

	// Ensure modal opens with proper defaults (new vs edit)
	useEffect(() => {
		if (!open) return
		setShowSsn(false)
		if (initial && Object.keys(initial).length > 0) {
			reset({
				first_name: initial.first_name ?? "",
				last_name: initial.last_name ?? "",
				ssn: "",
				date_of_birth: (initial as any).date_of_birth ?? undefined,
				fico_score: (initial as any).fico_score ?? undefined,
				email: initial.email ?? "",
				primary_phone: formatUS((initial as any).primary_phone ?? ""),
				alt_phone: formatUS((initial as any).alt_phone ?? ""),
				address_line1: (initial as any).address_line1 ?? "",
				address_line2: (initial as any).address_line2 ?? "",
				city: (initial as any).city ?? "",
				state: (initial as any).state ?? "",
				zip: (initial as any).zip ?? "",
				county: (initial as any).county ?? "",
				citizenship: (initial as any).citizenship ?? undefined,
				green_card: (initial as any).green_card ?? undefined,
				visa: (initial as any).visa ?? undefined,
				visa_type: (initial as any).visa_type ?? "",
				rentals_owned: (initial as any).rentals_owned ?? undefined,
				fix_flips_3yrs: (initial as any).fix_flips_3yrs ?? undefined,
				groundups_3yrs: (initial as any).groundups_3yrs ?? undefined,
				real_estate_licensed:
					(initial as any).real_estate_licensed === true
						? "Yes"
						: (initial as any).real_estate_licensed === false
						? "No"
						: undefined,
			} as any)
			setHasStoredSsn(Boolean((initial as any).has_ssn))
			setSsnLast4((initial as any).ssn_last4 ?? null)
			setSsnRaw("")
		} else {
			reset({
				first_name: "",
				last_name: "",
				ssn: "",
				date_of_birth: undefined,
				fico_score: undefined as any,
				email: "",
				primary_phone: "",
				alt_phone: "",
				address_line1: "",
				address_line2: "",
				city: "",
				state: "",
				zip: "",
				county: "",
				citizenship: undefined as any,
				green_card: undefined as any,
				visa: undefined as any,
				visa_type: "",
				rentals_owned: undefined as any,
				fix_flips_3yrs: undefined as any,
				groundups_3yrs: undefined as any,
				real_estate_licensed: undefined as any,
			})
			setHasStoredSsn(false)
			setSsnLast4(null)
		}
		setSsnRaw("")
		setDobCalMonth(new Date(2000, 0, 1))
	}, [open, reset, initial])

	// If editing and SSN exists, preload full SSN on open so the field starts populated (hidden)
	useEffect(() => {
		if (!open) return
		if (!borrowerId) return
		if (!hasStoredSsn) return
		if (ssnRaw) return
		let cancelled = false
		;(async () => {
			try {
				const res = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrowerId)}/ssn`, { cache: "no-store" })
				if (!res.ok) return
				const j = await res.json().catch(() => ({} as any))
				const digits = String(j?.ssn ?? "").replace(/\D+/g, "").slice(0, 9)
				if (digits.length === 9 && !cancelled) {
					setSsnRaw(digits)
					setValue("ssn", digits, { shouldDirty: false, shouldValidate: false })
				}
			} catch {
				// ignore
			}
		})()
		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, borrowerId, hasStoredSsn, ssnRaw])

	// When citizenship is U.S. Citizen, disable dependent fields and clear values
	useEffect(() => {
		if (!isImmigrationRelevant) {
			setValue("green_card", undefined as any, { shouldValidate: false, shouldDirty: true })
		}
	}, [isImmigrationRelevant, setValue])
	// VISA fields should be N/A for Permanent Resident and U.S. Citizen
	useEffect(() => {
		if (!isVisaRelevant) {
			setValue("visa", undefined as any, { shouldValidate: false, shouldDirty: true })
			setValue("visa_type", undefined as any, { shouldValidate: false, shouldDirty: true })
		}
	}, [isVisaRelevant, setValue])
	// VISA Type should only be enabled when VISA === "Yes"
	useEffect(() => {
		if (!isVisaTypeEnabled) {
			setValue("visa_type", undefined as any, { shouldValidate: false, shouldDirty: true })
		}
	}, [isVisaTypeEnabled, setValue])

	const onSubmit = async (vals: FormValues) => {
		function formatLocalYYYYMMDD(date: Date): string {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, "0")
			const d = String(date.getDate()).padStart(2, "0")
			return `${y}-${m}-${d}`
		}
		const payload = {
			...vals,
			real_estate_licensed:
				(vals.real_estate_licensed as unknown as string | undefined) == null
					? undefined
					: (vals.real_estate_licensed as unknown as string) === "Yes",
			// Preserve local calendar date to avoid timezone-related off-by-one
			date_of_birth: vals.date_of_birth ? formatLocalYYYYMMDD(vals.date_of_birth) : undefined,
			ssn: vals.ssn ? vals.ssn.replace(/\D+/g, "") : undefined,
		}
		if (borrowerId) {
			await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrowerId)}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			})
		} else {
			await createBorrower(payload)
		}
		onOpenChange(false)
		// Ensure pipeline updates immediately even before realtime event arrives
		router.refresh()
		// Also notify client-side tables to refetch immediately
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("app:borrowers:changed"))
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl h-[80vh]" hideClose>
				<DialogHeader className="flex flex-row items-center justify-between gap-3">
					<DialogTitle>Borrower Information</DialogTitle>
					{!borrowerId ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={shareLoading || !shareUrl}
									className="h-9 w-9"
									aria-label="Share borrower invite link"
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
											`mailto:?subject=${encodeURIComponent("Guarantor invite")}&body=${encodeURIComponent(
												`Please complete this guarantor form: ${shareUrl}`
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
				<form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-3">
					{/* Personal Information */}
					<section>
						<div className="mb-2 text-sm font-semibold">Personal Information</div>
						<div className="grid gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>First Name</Label>
									<Input placeholder="Enter first name" {...register("first_name")} />
								</div>
								<div className="flex flex-col gap-1">
                                    <Label>Last Name</Label>
									<Input placeholder="Enter last name" {...register("last_name")} />
								</div>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>SSN</Label>
									<div className="relative">
										<Input
											placeholder={hasStoredSsn && !ssnRaw && ssnLast4 ? `***-**-${ssnLast4}` : "xxx-xx-xxxx"}
											name="ssn"
											ref={ssnInputRef}
											type={showSsn ? "text" : "password"}
											value={formatSSN(ssnRaw)}
											onChange={(e) => {
												// allow only digits, max 9; store digits in form state; mask display
												const digits = e.target.value.replace(/\D+/g, "").slice(0, 9)
												setSsnRaw(digits)
												setValue("ssn", digits, { shouldValidate: false, shouldDirty: true })
												// keep caret at end of masked value
												queueMicrotask(() => {
													const el = ssnInputRef.current
													if (el) {
														const len = formatSSN(digits).length
														el.setSelectionRange(len, len)
													}
												})
											}}
											inputMode="numeric"
											maxLength={11}
											autoComplete="off"
											onKeyDown={(e) => {
												// Allow control/navigation keys
												const allowed = [
													"Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End","Enter"
												]
												if (allowed.includes(e.key) || e.metaKey || e.ctrlKey) return
												if (!/^[0-9]$/.test(e.key)) {
													e.preventDefault()
												}
											}}
											onBeforeInput={(e: any) => {
												// Some mobile browsers fire beforeInput with data
												const data: string | null = e.data ?? null
												if (data && /\D/.test(data)) {
													e.preventDefault()
												}
											}}
											onPaste={(e) => {
												const text = (e.clipboardData?.getData("text") || "").replace(/\D+/g, "").slice(0,9)
												if (text.length === 0) {
													e.preventDefault()
													return
												}
												e.preventDefault()
												setSsnRaw(text)
												setValue("ssn", text, { shouldValidate: false, shouldDirty: true })
											}}
											className="pr-9"
										/>
										<button
											type="button"
											aria-label={showSsn ? "Hide SSN" : "Show SSN"}
											onClick={async () => {
												// On first reveal in edit mode, fetch full SSN if we have a stored value
												if (!showSsn && !ssnRaw && hasStoredSsn && borrowerId) {
													try {
														const res = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrowerId)}/ssn`, { cache: "no-store" })
														if (res.ok) {
															const j = await res.json()
															const digits = String(j?.ssn ?? "").replace(/\D+/g, "").slice(0,9)
															if (digits.length === 9) {
																setSsnRaw(digits)
																setValue("ssn", digits, { shouldDirty: false, shouldValidate: false })
															}
														}
													} catch {
														// ignore fetch errors; keep placeholder
													}
												}
												setShowSsn((v) => !v)
											}}
											className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										>
											{showSsn ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
										</button>
									</div>
								</div>
								<div className="flex flex-col gap-1">
									<Label>Mid-FICO (estimate)</Label>
									<Input
										placeholder="Enter FICO score"
										inputMode="numeric"
										{...ficoReg}
										onChange={(e) => {
											// Keep only digits while typing
											const digits = e.target.value.replace(/[^0-9]/g, "")
											e.target.value = digits
											ficoReg.onChange(e)
										}}
										onKeyDown={(e) => {
											const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End","Enter"]
											if (allowed.includes(e.key) || e.metaKey || e.ctrlKey) return
											if (!/^[0-9]$/.test(e.key)) {
												e.preventDefault()
											}
										}}
										onBeforeInput={(e: any) => {
											const data: string | null = e.data ?? null
											if (data && /\\D/.test(data)) {
												e.preventDefault()
											}
										}}
										onPaste={(e) => {
											const text = (e.clipboardData?.getData("text") || "").replace(/\\D+/g, "")
											e.preventDefault()
											;(e.target as HTMLInputElement).value = text
											const ev = new Event("input", { bubbles: true })
											e.target.dispatchEvent(ev)
										}}
										onBlur={(e) => {
											const raw = e.target.value.replace(/[^0-9]/g, "")
											if (!raw) {
												ficoReg.onBlur(e)
												return
											}
											let n = parseInt(raw, 10)
											if (Number.isNaN(n)) {
												ficoReg.onBlur(e)
												return
											}
											if (n < 300) n = 300
											if (n > 850) n = 850
											e.target.value = String(n)
											setValue("fico_score", n, { shouldDirty: true, shouldValidate: true })
											ficoReg.onBlur(e)
										}}
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label>Date of Birth</Label>
									<Popover>
										<PopoverTrigger asChild>
											<div className="relative">
												<DateInput emptyOnMount value={dob} onChange={(d) => setValue("date_of_birth", d ?? undefined)} />
												{/* Calendar icon */}
												<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
													{/* simple calendar glyph */}
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
												selected={dob}
												month={dobCalMonth}
												onMonthChange={setDobCalMonth}
												onSelect={(d) => d && setValue("date_of_birth", d)}
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
							</div>
						</div>
					</section>

					{/* Contact Information */}
					<section>
						<div className="mb-2 text-sm font-semibold">Contact Information</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="flex flex-col gap-1">
								<Label>Email Address</Label>
								<Input placeholder="Enter email address" type="email" {...register("email")} />
							</div>
							<div className="flex flex-col gap-1">
								<Label>Primary Phone</Label>
								<Input
									placeholder="+1 (xxx) xxx-xxxx"
									{...register("primary_phone")}
									value={primaryPhone ?? ""}
									onChange={(e) => setValue("primary_phone", formatUS(e.target.value), { shouldDirty: true, shouldValidate: false })}
									inputMode="tel"
									autoComplete="tel"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<Label>Alternate Phone</Label>
								<Input
									placeholder="+1 (xxx) xxx-xxxx"
									{...register("alt_phone")}
									value={altPhone ?? ""}
									onChange={(e) => setValue("alt_phone", formatUS(e.target.value), { shouldDirty: true, shouldValidate: false })}
									inputMode="tel"
									autoComplete="tel"
								/>
							</div>
							<div />
						</div>
					</section>

					{/* Primary Residence Address */}
					<section>
						<div className="mb-2 text-sm font-semibold">Primary Residence Address</div>
						<div className="grid gap-3">
							<div className="flex flex-col gap-1">
								<Label>Street</Label>
								<AddressAutocomplete
									placeholder="Start typing your address..."
									value={watch("address_line1") ?? ""}
									displayValue="street"
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
									<Input placeholder="Address line 2" {...register("address_line2")} />
								</div>
								<div className="flex flex-col gap-1">
									<Label>City</Label>
									<Input placeholder="City" {...register("city")} />
								</div>
								<div className="flex flex-col gap-1">
									<Label>State</Label>
									<Input placeholder="State" {...register("state")} />
								</div>
								<div className="flex flex-col gap-1">
									<Label>Zip Code</Label>
									<Input placeholder="Zip code" inputMode="numeric" {...register("zip")} />
								</div>
								<div className="flex flex-col gap-1">
									<Label>County</Label>
									<Input placeholder="County" {...register("county")} />
								</div>
							</div>
						</div>
					</section>

					{/* Citizenship & Immigration */}
					<section>
						<div className="mb-2 text-sm font-semibold">Citizenship & Immigration</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="flex flex-col gap-1">
								<Label>Citizenship</Label>
								<Select
									value={(watch("citizenship") as any) ?? undefined}
									onValueChange={(v) => setValue("citizenship", v as any)}
								>
									<SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
									<SelectContent>
										<SelectItem value="U.S. Citizen">U.S. Citizen</SelectItem>
										<SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
										<SelectItem value="Non-Permanent Resident">Non-Permanent Resident</SelectItem>
										<SelectItem value="Foreign National">Foreign National</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className={cn("flex flex-col gap-1", !isImmigrationRelevant ? "opacity-60" : "")}>
								<Label>Green Card</Label>
								<Select
									value={
										watch("green_card") == null
											? undefined
											: (watch("green_card") ? "Yes" : "No")
									}
									onValueChange={(v) => setValue("green_card", v === "Yes")}
								>
									<SelectTrigger disabled={!isImmigrationRelevant}>
										<SelectValue placeholder={!isImmigrationRelevant ? "N/A" : "Select"}/>
									</SelectTrigger>
									<SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
								</Select>
							</div>
							<div className={cn("flex flex-col gap-1", !isVisaRelevant ? "opacity-60" : "")}>
								<Label>VISA</Label>
								<Select
									value={
										watch("visa") == null
											? undefined
											: (watch("visa") ? "Yes" : "No")
									}
									onValueChange={(v) => setValue("visa", v === "Yes")}
								>
									<SelectTrigger disabled={!isVisaRelevant}>
										<SelectValue placeholder={!isVisaRelevant ? "N/A" : "Select"}/>
									</SelectTrigger>
									<SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
								</Select>
							</div>
							<div className={cn("flex flex-col gap-1", !isVisaTypeEnabled ? "opacity-60" : "")}>
								<Label>VISA Type</Label>
								<Select
									value={watch("visa_type") ?? undefined}
									onValueChange={(v) => setValue("visa_type", v)}
								>
									<SelectTrigger disabled={!isVisaTypeEnabled}>
										<SelectValue placeholder={!isVisaTypeEnabled ? "N/A" : "Select VISA type"}/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="CW1">CW1</SelectItem>
										<SelectItem value="E-1 / E-2 / E-3">E-1 / E-2 / E-3</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</section>

					{/* Real Estate Experience */}
					<section>
						<div className="mb-2 text-sm font-semibold">Real Estate Experience</div>
						<div className="grid gap-3">
							{/* Row 1: rentals | fix & flips */}
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label># Rentals currently owned</Label>
									<NumberField
										value={watch("rentals_owned") ? Number(watch("rentals_owned")) : undefined}
										onChange={(val) => setValue("rentals_owned", val, { shouldDirty: true })}
										minValue={0}
										className="w-full"
									>
										<Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
											<AriaInput
												placeholder="0"
												className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
											/>
											<AriaButton
												slot="decrement"
												className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
											>
												<MinusIcon className="size-4" />
												<span className="sr-only">Decrease Rentals</span>
											</AriaButton>
											<AriaButton
												slot="increment"
												className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
											>
												<PlusIcon className="size-4" />
												<span className="sr-only">Increase Rentals</span>
											</AriaButton>
										</Group>
									</NumberField>
								</div>
								<div className="flex flex-col gap-1">
									<Label># Fix & Flips sold in the last 3 yrs</Label>
									<NumberField
										value={watch("fix_flips_3yrs") ? Number(watch("fix_flips_3yrs")) : undefined}
										onChange={(val) => setValue("fix_flips_3yrs", val, { shouldDirty: true })}
										minValue={0}
										className="w-full"
									>
										<Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
											<AriaInput
												placeholder="0"
												className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
											/>
											<AriaButton
												slot="decrement"
												className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
											>
												<MinusIcon className="size-4" />
												<span className="sr-only">Decrease Fix & Flips</span>
											</AriaButton>
											<AriaButton
												slot="increment"
												className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
											>
												<PlusIcon className="size-4" />
												<span className="sr-only">Increase Fix & Flips</span>
											</AriaButton>
										</Group>
									</NumberField>
								</div>
							</div>
							{/* Row 2: ground ups by itself under rentals (left column) */}
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<Label># GUNC sold in the last 3 yrs</Label>
									<NumberField
										value={watch("groundups_3yrs") ? Number(watch("groundups_3yrs")) : undefined}
										onChange={(val) => setValue("groundups_3yrs", val, { shouldDirty: true })}
										minValue={0}
										className="w-full"
									>
										<Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
											<AriaInput
												placeholder="0"
												className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
											/>
											<AriaButton
												slot="decrement"
												className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
											>
												<MinusIcon className="size-4" />
												<span className="sr-only">Decrease GUNC</span>
											</AriaButton>
											<AriaButton
												slot="increment"
												className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
											>
												<PlusIcon className="size-4" />
												<span className="sr-only">Increase GUNC</span>
											</AriaButton>
										</Group>
									</NumberField>
								</div>
								<div />
							</div>
							{/* Row 3: licensed/related, full width */}
							<div className="flex flex-col gap-1">
								<Label>Are you a licensed General Contractor, Real Estate Broker / Sales Person, Lender, Appraiser or involved in any other real estate related activities?</Label>
								<Select
									value={(watch("real_estate_licensed") as any) ?? undefined}
									onValueChange={(v) => setValue("real_estate_licensed", v as any)}
								>
									<SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
									<SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
								</Select>
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


