"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Download, MessageCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { FaFeatherAlt } from "react-icons/fa"
import { GiStoneBlock } from "react-icons/gi"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { cn } from "@repo/lib/cn"
import { isUuid } from "@/lib/uuid"
import { useToast } from "@/hooks/use-toast"
import { BounceButton } from "@/components/ui/bounce-button"
import { Button } from "@repo/ui/shadcn/button"
import { Calendar } from "@repo/ui/shadcn/calendar"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import { ShakeButton } from "@/components/ui/shake-button"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { ChatPanel } from "@/components/ai/chat-panel"
import { Shimmer } from "@/components/ai/shimmer"
import { CalcInput } from "@/components/calc-input"
import { DateInput } from "@/components/date-input"
import { SparklesSolidIcon } from "@/components/icons/heroicons-sparkles-solid"
import type {
  OrderItemType,
  StepperType,
} from "@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm"

const STATE_OPTIONS = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
]

const PROVINCE_OPTIONS = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NT",
  "NS",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
]

const COUNTRY_OPTIONS = ["US", "CA"]

const formatSSN = (input: string) => {
  const d = input.replace(/\D+/g, "").slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

const formatUSPhone = (input: string) => {
  const digits = input.replace(/\D+/g, "").slice(0, 11) // 1 country + up to 10 national
  if (digits.length === 0) return ""
  const cc = digits[0]
  const national = digits.slice(1)
  if (national.length === 0) return `+${cc}`
  const area = national.slice(0, 3)
  const rest = national.slice(3)
  if (rest.length === 0) return `+${cc} (${area}`
  const prefix = rest.slice(0, 3)
  const line = rest.slice(3, 7)
  if (rest.length <= 3) return `+${cc} (${area}) ${prefix}`
  return `+${cc} (${area}) ${prefix}-${line}`
}

type ReportDoc = {
  id: string
  name: string
  created_at: string
  status: string | null
  url: string
}

const ENTITY_TYPE_OPTIONS = [
  "LLC",
  "Corporation",
  "S-Corp",
  "Partnership",
  "Limited Partnership",
  "Sole Proprietorship",
  "Trust",
  "Other",
]

const formatEIN = (input: string) => {
  const d = input.replace(/\D+/g, "").slice(0, 9)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}-${d.slice(2)}`
}

const CartStep = ({
  data: _data,
  stepper,
  currentBorrowerId,
  isEntity = false,
}: {
  data: OrderItemType[]
  stepper: StepperType
  currentBorrowerId?: string
  isEntity?: boolean
}) => {
  const isCredit = stepper.current.id === "credit"
  const { toast } = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [zip, setZip] = useState("")
  const [county, setCounty] = useState("")
  const [province, setProvince] = useState("")
  const [country, setCountry] = useState("")
  const [dob, setDob] = useState<Date | undefined>()
  const [dobCalMonth, setDobCalMonth] = useState<Date | undefined>(new Date())
  const [pullType, setPullType] = useState<"hard" | "soft">("soft")
  const [includeTU, setIncludeTU] = useState(true)
  const [includeEX, setIncludeEX] = useState(true)
  const [includeEQ, setIncludeEQ] = useState(true)
  // Credit report files for the currently selected borrower (Credit step)
  const [files, setFiles] = useState<ReportDoc[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(
    undefined
  )

  // ========== Appraisal Tab State ==========
  // Order Details
  const [appraisalLender, setAppraisalLender] = useState("DSCR Loan Funder LLC")
  const [appraisalInvestor, setAppraisalInvestor] = useState(
    "DSCR Loan Funder LLC"
  )
  const [appraisalTransactionType, setAppraisalTransactionType] = useState("")
  const [appraisalLoanType, setAppraisalLoanType] = useState("")
  const [appraisalLoanTypeOther, setAppraisalLoanTypeOther] = useState("")
  const [appraisalLoanNumber, setAppraisalLoanNumber] = useState("")
  const [appraisalPriority, setAppraisalPriority] = useState("")
  // Borrower
  const [appraisalBorrowerName, setAppraisalBorrowerName] = useState("")
  const [appraisalBorrowerEmail, setAppraisalBorrowerEmail] = useState("")
  const [appraisalBorrowerPhone, setAppraisalBorrowerPhone] = useState("")
  const [appraisalBorrowerAltPhone, setAppraisalBorrowerAltPhone] = useState("")
  // Property Details
  const [appraisalPropertyType, setAppraisalPropertyType] = useState("")
  const [appraisalPropertyAddress, setAppraisalPropertyAddress] = useState("")
  const [appraisalPropertyCity, setAppraisalPropertyCity] = useState("")
  const [appraisalPropertyState, setAppraisalPropertyState] = useState("")
  const [appraisalPropertyZip, setAppraisalPropertyZip] = useState("")
  const [appraisalPropertyCounty, setAppraisalPropertyCounty] = useState("")
  const [appraisalOccupancyType, setAppraisalOccupancyType] = useState("")
  // Access Information
  const [appraisalContactPerson, setAppraisalContactPerson] = useState("")
  const [appraisalContactName, setAppraisalContactName] = useState("")
  const [appraisalContactEmail, setAppraisalContactEmail] = useState("")
  const [appraisalContactPhone, setAppraisalContactPhone] = useState("")
  const [appraisalOtherAccessInfo, setAppraisalOtherAccessInfo] = useState("")
  // Appraisal Information
  const [appraisalProduct, setAppraisalProduct] = useState("")
  const [appraisalLoanAmount, setAppraisalLoanAmount] = useState("")
  const [appraisalSalesPrice, setAppraisalSalesPrice] = useState("")
  // Dates
  const [appraisalDueDate, setAppraisalDueDate] = useState<Date | undefined>()
  const [appraisalDueDateCalMonth, setAppraisalDueDateCalMonth] = useState<
    Date | undefined
  >(new Date())
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const refreshAbortRef = useRef<AbortController | null>(null)

  // Auto-select the first file when list loads and nothing is selected
  useEffect(() => {
    const first = files.find((f) => isUuid(f.id?.trim?.() ?? f.id))?.id
    const stillValid =
      selectedReportId && files.some((f) => f.id === selectedReportId)
    if (first && !stillValid) {
      setSelectedReportId(first.trim())
    } else if (!first) {
      setSelectedReportId(undefined)
    }
    // only run when files list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  // Normalize the report id we will actually use for chat requests:
  // - Prefer the selected item when it exists in the current files list
  // - Otherwise fall back to the first valid UUID from the list
  const effectiveReportId = useMemo(() => {
    const normalized = selectedReportId?.trim()
    if (isUuid(normalized)) return normalized
    return files.find((f) => isUuid(f.id?.trim?.() ?? f.id))?.id?.trim()
  }, [files, selectedReportId])
  const selectedReport = useMemo(
    () =>
      files.find(
        (f) => f.id === (selectedReportId?.trim?.() ?? selectedReportId)
      ) ?? null,
    [files, selectedReportId]
  )
  useEffect(() => {
    let ignore = false

    async function load(selectId?: string) {
      if (!currentBorrowerId || stepper.current.id !== "credit") {
        setFiles([])
        return
      }
      try {
        refreshAbortRef.current?.abort()
        const controller = new AbortController()
        refreshAbortRef.current = controller
        setFilesLoading(true)
        const res = await fetch(
          `/api/credit-reports?borrowerId=${encodeURIComponent(currentBorrowerId)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        )
        const j = await res.json().catch(() => ({ documents: [] }))
        if (!ignore) {
          const docs = Array.isArray(j?.documents) ? j.documents : []
          setFiles(docs)
          if (selectId && docs.some((d: { id: string }) => d.id === selectId)) {
            setSelectedReportId(selectId)
          }
        }
      } catch {
        if (!ignore) setFiles([])
      } finally {
        if (!ignore) setFilesLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
      refreshAbortRef.current?.abort()
    }
  }, [currentBorrowerId, stepper.current.id])

  // Realtime subscription: refresh list when a credit report is stored
  useEffect(() => {
    if (!currentBorrowerId || stepper.current.id !== "credit") return
    const channel = supabase.channel("credit-reports")
    const handler = (payload: { event: string; payload: any }) => {
      const { borrowerId: evtBorrower, reportId } = payload.payload || {}
      if (!evtBorrower || evtBorrower !== currentBorrowerId)
        return // Refresh files and select the new report if present
      ;(async () => {
        try {
          refreshAbortRef.current?.abort()
          const controller = new AbortController()
          refreshAbortRef.current = controller
          setFilesLoading(true)
          const res = await fetch(
            `/api/credit-reports?borrowerId=${encodeURIComponent(currentBorrowerId)}`,
            {
              cache: "no-store",
              signal: controller.signal,
            }
          )
          const j = await res.json().catch(() => ({ documents: [] }))
          const docs = Array.isArray(j?.documents) ? j.documents : []
          setFiles(docs)
          if (reportId && docs.some((d: { id: string }) => d.id === reportId)) {
            setSelectedReportId(reportId)
          }
        } catch {
          // silent
        } finally {
          setFilesLoading(false)
        }
      })()
    }

    channel.on("broadcast", { event: "credit_report_stored" }, handler)
    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [currentBorrowerId, stepper.current.id, supabase])

  // Prefill borrower data on Credit step
  useEffect(() => {
    let ignore = false
    async function loadBorrower() {
      // When on Credit tab but there is no borrower id, clear fields
      if (stepper.current.id === "credit" && !currentBorrowerId) {
        setFirstName("")
        setLastName("")
        setSsn("")
        setDob(undefined)
        setStreet("")
        setCity("")
        setStateCode("")
        setZip("")
        setCounty("")
        return
      }
      // If we have some id string, attempt fetch; server will 404 when not found
      if (!currentBorrowerId || stepper.current.id !== "credit") return
      // Optimistically clear before fetching to avoid stale values while switching
      setFirstName("")
      setLastName("")
      setSsn("")
      setDob(undefined)
      setStreet("")
      setCity("")
      setStateCode("")
      setZip("")
      setCounty("")
      try {
        const res = await fetch(
          `/api/borrowers/${encodeURIComponent(currentBorrowerId)}`,
          { cache: "no-store" }
        )
        if (!res.ok) {
          // Nothing to populate (404/401 etc.) — keep cleared values
          return
        }
        const j = await res.json().catch(() => ({}))
        const b = j?.borrower
        if (!ignore && b) {
          setFirstName((b.first_name as string) ?? "")
          setLastName((b.last_name as string) ?? "")
          // DOB
          if (b.date_of_birth) {
            const s = String(b.date_of_birth as string)
            const m = /^([0-9]{4})-(\d{2})-(\d{2})$/.exec(s)
            if (m) {
              const y = Number(m[1])
              const mo = Number(m[2])
              const d = Number(m[3])
              const local = new Date(y, mo - 1, d)
              if (!Number.isNaN(local.getTime())) setDob(local)
            }
          }
          setStreet((b.address_line1 as string) ?? "")
          setCity((b.city as string) ?? "")
          setStateCode((b.state as string) ?? "")
          setZip((b.zip as string) ?? "")
          setCounty((b.county as string) ?? "")
        }
        // Attempt to load full decrypted SSN using the same endpoint as the Borrower Settings modal
        try {
          const sres = await fetch(
            `/api/applicants/borrowers/${encodeURIComponent(currentBorrowerId)}/ssn`,
            { cache: "no-store" }
          )
          if (sres.ok) {
            const sj = await sres.json().catch(() => ({}) as any)
            const digits = String(sj?.ssn ?? "")
              .replace(/\D+/g, "")
              .slice(0, 9)
            if (digits.length === 9 && !ignore) {
              setSsn(formatSSN(digits))
              return
            }
          }
        } catch {
          // ignore and fall back to last4
        }
        // Fallback: mask with last4 if available
        if (
          !ignore &&
          typeof j?.borrower?.ssn_last4 === "string" &&
          j.borrower.ssn_last4.length === 4
        ) {
          setSsn(`***-**-${j.borrower.ssn_last4}`)
        }
      } catch {
        // swallow
      }
    }
    loadBorrower()
    return () => {
      ignore = true
    }
  }, [currentBorrowerId, stepper.current.id])

  const [prevStreet, setPrevStreet] = useState("")
  const [prevCity, setPrevCity] = useState("")
  const [prevState, setPrevState] = useState("")
  const [prevZip, setPrevZip] = useState("")
  const [ssn, setSsn] = useState("")
  const [runPhase, setRunPhase] = useState<
    "idle" | "bounce" | "running" | "error"
  >("idle")
  const [chatOpen, setChatOpen] = useState(false)

  // Entity-specific state
  const [entityName, setEntityName] = useState("")
  const [entityType, setEntityType] = useState("")
  const [ein, setEin] = useState("")
  const [stateOfFormation, setStateOfFormation] = useState("")
  const [dateOfFormation, setDateOfFormation] = useState<Date | undefined>()
  const [dateOfFormationCalMonth, setDateOfFormationCalMonth] = useState<
    Date | undefined
  >(new Date())

  // Guarantor-specific state (Background tab)
  const [guarantorFirstName, setGuarantorFirstName] = useState("")
  const [guarantorMiddleInitial, setGuarantorMiddleInitial] = useState("")
  const [guarantorLastName, setGuarantorLastName] = useState("")
  const [guarantorSsn, setGuarantorSsn] = useState("")
  const [guarantorEmail, setGuarantorEmail] = useState("")
  const [guarantorPhone, setGuarantorPhone] = useState("")

  async function handleRun() {
    if (!isCredit || runPhase !== "idle") return
    setRunPhase("bounce")
    const bounceTimer = setTimeout(() => setRunPhase("running"), 180)
    try {
      const digits = ssn.replace(/\D+/g, "").slice(0, 9)
      const inputs = {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        ssn: digits || undefined,
        date_of_birth: (() => {
          if (!dob) return undefined
          const y = dob.getFullYear()
          const m = String(dob.getMonth() + 1).padStart(2, "0")
          const d = String(dob.getDate()).padStart(2, "0")
          return `${y}-${m}-${d}`
        })(),
        address_line1: street || undefined,
        city: city || undefined,
        state: stateCode || undefined,
        zip: zip || undefined,
        county: county || undefined,
        include_transunion: includeTU,
        include_experian: includeEX,
        include_equifax: includeEQ,
        pull_type: pullType,
      }
      const res = await fetch("/api/credit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: currentBorrowerId ?? null,
          inputs,
          aggregator: null,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.ok === false) {
        throw new Error(
          j?.error || `Webhook failed (status ${j?.status ?? res.status})`
        )
      }
      toast({
        title: "Credit run dispatched",
        description: "Webhook received the payload.",
      })
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to run credit dispatch"
      toast({ title: "Credit run failed", description: msg })
      setRunPhase("error")
      setTimeout(() => setRunPhase("idle"), 900)
    } finally {
      clearTimeout(bounceTimer)
      setRunPhase("idle")
    }
  }

  const isAppraisal = stepper.current.id === "confirmation"

  return (
    <div
      className="flex flex-col gap-4"
      key={stepper.current.id}
    >
      {/* Toolbar: Run/Order button + file selector + download */}
      <div className="flex flex-wrap items-center gap-2">
        {isAppraisal ? (
          <>
            {runPhase === "error" ? (
              <ShakeButton
                className="h-9 min-w-[130px] px-4 py-2"
                onClick={handleRun}
              >
                Order
              </ShakeButton>
            ) : runPhase === "running" ? (
              <LoadingButton className="h-9 min-w-[130px] px-4 py-2" disabled>
                Ordering...
              </LoadingButton>
            ) : (
              <BounceButton
                className="h-9 min-w-[130px] px-4 py-2"
                onClick={handleRun}
                disabled={runPhase !== "idle"}
              >
                Order
              </BounceButton>
            )}
          </>
        ) : (
          <>
            {runPhase === "error" ? (
              <ShakeButton
                className="h-9 min-w-[130px] px-4 py-2"
                onClick={handleRun}
              >
                Run
              </ShakeButton>
            ) : runPhase === "running" ? (
              <LoadingButton className="h-9 min-w-[130px] px-4 py-2" disabled>
                Running...
              </LoadingButton>
            ) : (
              <BounceButton
                className="h-9 min-w-[130px] px-4 py-2"
                onClick={handleRun}
                disabled={runPhase !== "idle"}
              >
                Run
              </BounceButton>
            )}
            <Select
              onValueChange={(val) => {
                const next = val?.trim?.() ?? val
                const normalized = isUuid(next) ? next : undefined
                if (next) {
                  setSelectedReportId(normalized)
                }
              }}
              value={selectedReportId}
              disabled={filesLoading || files.length === 0}
            >
              <SelectTrigger className="h-9 w-[180px] truncate">
                <SelectValue
                  placeholder={
                    filesLoading
                      ? "Loading…"
                      : files.length
                        ? "Files"
                        : "No files"
                  }
                />
              </SelectTrigger>
              <SelectContent className="data-[state=open]:!zoom-in-0 origin-center duration-400">
                {files.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Files</SelectLabel>
                    {files.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-10 shadow-sm"
              disabled={filesLoading || !selectedReport?.url}
              onClick={() => {
                if (!selectedReport?.url) return
                const anchor = document.createElement("a")
                anchor.href = selectedReport.url
                anchor.download = selectedReport.name || "report.pdf"
                anchor.target = "_blank"
                anchor.rel = "noopener noreferrer"
                anchor.click()
                anchor.remove()
              }}
              aria-label={
                selectedReport?.name
                  ? `Download ${selectedReport.name}`
                  : "No file to download"
              }
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {/* Full-width form content */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          {isCredit ? (
            <>
              <h3 className="text-sm font-semibold">
                Report Order Information
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Pull Type
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: "hard", label: "Hard Pull", icon: GiStoneBlock },
                      { id: "soft", label: "Soft Pull", icon: FaFeatherAlt },
                    ].map((opt) => {
                      const selected = pullType === opt.id
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPullType(opt.id as "hard" | "soft")}
                          className={cn(
                            "hover:border-ring focus-visible:ring-ring flex h-full min-h-[130px] w-full max-w-[180px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                            selected
                              ? "border-ring ring-ring ring-2"
                              : "border-input bg-background"
                          )}
                          aria-pressed={selected}
                        >
                          <Icon
                            className="text-foreground h-8 w-8"
                            aria-hidden="true"
                          />
                          <span className="text-foreground text-sm font-semibold">
                            {opt.label}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {opt.id === "hard"
                              ? "Full bureau pull"
                              : "Soft inquiry"}
                          </span>
                          <span
                            className={cn(
                              "mt-2 inline-flex h-4 w-4 items-center justify-center rounded-full border",
                              selected
                                ? "border-ring bg-ring/20"
                                : "border-muted"
                            )}
                          >
                            {selected && (
                              <span className="bg-ring h-2 w-2 rounded-full" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-4">
                  <span className="text-muted-foreground text-xs font-semibold">
                    Include:
                  </span>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      className="h-5 w-5"
                      checked={includeTU}
                      onCheckedChange={(v) => setIncludeTU(!!v)}
                    />
                    <span className="flex-1">TransUnion</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      className="h-5 w-5"
                      checked={includeEX}
                      onCheckedChange={(v) => setIncludeEX(!!v)}
                    />
                    <span className="flex-1">Experian</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      className="h-5 w-5"
                      checked={includeEQ}
                      onCheckedChange={(v) => setIncludeEQ(!!v)}
                    />
                    <span className="flex-1">Equifax</span>
                  </label>
                </div>
              </div>

              <h3 className="text-sm font-semibold">Personal Information</h3>
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      First Name
                    </Label>
                    <Input
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Last Name
                    </Label>
                    <Input
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      SSN
                    </Label>
                    <Input
                      placeholder="123-45-6789"
                      inputMode="numeric"
                      value={ssn}
                      onChange={(e) => {
                        const next = formatSSN(e.target.value)
                        setSsn(next)
                      }}
                      maxLength={11}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      DOB
                    </Label>
                    <Popover
                      onOpenChange={(open) => {
                        if (open && dob) setDobCalMonth(dob)
                      }}
                    >
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <DateInput
                            emptyOnMount
                            value={dob}
                            onChange={setDob}
                          />
                          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                                stroke="currentColor"
                              />
                              <line
                                x1="16"
                                y1="2"
                                x2="16"
                                y2="6"
                                stroke="currentColor"
                              />
                              <line
                                x1="8"
                                y1="2"
                                x2="8"
                                y2="6"
                                stroke="currentColor"
                              />
                              <line
                                x1="3"
                                y1="10"
                                x2="21"
                                y2="10"
                                stroke="currentColor"
                              />
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
                          onSelect={(d) => d && setDob(d)}
                          disabled={(d) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return d > today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold">Current Primary Address</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Street
                  </Label>
                  <AddressAutocomplete
                    value={street}
                    displayValue="street"
                    placeholder="123 Main St"
                    onChange={(addr) => {
                      setStreet(addr.address_line1 ?? "")
                      setCity(addr.city ?? "")
                      setStateCode((addr.state ?? "").toUpperCase())
                      setZip(addr.zip ?? "")
                    }}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      State
                    </Label>
                    <Select
                      value={stateCode || undefined}
                      onValueChange={setStateCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Zip Code
                    </Label>
                    <Input
                      placeholder="Zip Code"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold">
                Previous Address (If less than 2 years)
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Street
                  </Label>
                  <AddressAutocomplete
                    value={prevStreet}
                    displayValue="street"
                    placeholder="Previous street"
                    onChange={(addr) => {
                      setPrevStreet(addr.address_line1 ?? "")
                      setPrevCity(addr.city ?? "")
                      setPrevState((addr.state ?? "").toUpperCase())
                      setPrevZip(addr.zip ?? "")
                    }}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      placeholder="City"
                      value={prevCity}
                      onChange={(e) => setPrevCity(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      State
                    </Label>
                    <Select
                      value={prevState || undefined}
                      onValueChange={setPrevState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Zip Code
                    </Label>
                    <Input
                      placeholder="Zip Code"
                      value={prevZip}
                      onChange={(e) => setPrevZip(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : isAppraisal ? (
            <>
              {/* ========== ORDER DETAILS ========== */}
              <h3 className="text-sm font-semibold">Order Details</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Lender/Client on Report
                  </Label>
                  <Select
                    value={appraisalLender}
                    onValueChange={setAppraisalLender}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Lender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DSCR Loan Funder LLC">
                        DSCR Loan Funder LLC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Investor Name
                  </Label>
                  <Select
                    value={appraisalInvestor}
                    onValueChange={setAppraisalInvestor}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Investor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DSCR Loan Funder LLC">
                        DSCR Loan Funder LLC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Transaction Type
                  </Label>
                  <Select
                    value={appraisalTransactionType}
                    onValueChange={setAppraisalTransactionType}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase">Purchase</SelectItem>
                      <SelectItem value="Refinance">Refinance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Loan Type
                  </Label>
                  <Select
                    value={appraisalLoanType}
                    onValueChange={setAppraisalLoanType}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Other (specify)">
                        Other (specify)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {appraisalLoanType === "Other (specify)" && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Other
                    </Label>
                    <Input
                      className="h-9"
                      placeholder="Specify"
                      value={appraisalLoanTypeOther}
                      onChange={(e) =>
                        setAppraisalLoanTypeOther(e.target.value)
                      }
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Loan Number
                  </Label>
                  <Input
                    className="h-9"
                    placeholder="Loan #"
                    inputMode="numeric"
                    value={appraisalLoanNumber}
                    onChange={(e) =>
                      setAppraisalLoanNumber(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Priority
                  </Label>
                  <Select
                    value={appraisalPriority}
                    onValueChange={setAppraisalPriority}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Rush">Rush</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ========== BORROWER ========== */}
              <h3 className="text-sm font-semibold">Borrower</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="col-span-2 flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Borrower (and Co-Borrower)
                  </Label>
                  <Input
                    className="h-9"
                    placeholder="Borrower Name"
                    value={appraisalBorrowerName}
                    onChange={(e) => setAppraisalBorrowerName(e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Borrower Email
                  </Label>
                  <Input
                    className="h-9"
                    type="email"
                    placeholder="email@example.com"
                    value={appraisalBorrowerEmail}
                    onChange={(e) => setAppraisalBorrowerEmail(e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Borrower Phone
                  </Label>
                  <Input
                    className="h-9"
                    placeholder="(555) 555-5555"
                    inputMode="tel"
                    value={appraisalBorrowerPhone}
                    onChange={(e) =>
                      setAppraisalBorrowerPhone(formatUSPhone(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Borrower Alternate Phone
                  </Label>
                  <Input
                    className="h-9"
                    placeholder="(555) 555-5555"
                    inputMode="tel"
                    value={appraisalBorrowerAltPhone}
                    onChange={(e) =>
                      setAppraisalBorrowerAltPhone(
                        formatUSPhone(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              {/* ========== PROPERTY DETAILS ========== */}
              <h3 className="text-sm font-semibold">Property Details</h3>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Property Type
                    </Label>
                    <Select
                      value={appraisalPropertyType}
                      onValueChange={setAppraisalPropertyType}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Family">
                          Single Family
                        </SelectItem>
                        <SelectItem value="Condominium">Condominium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Occupancy Type
                    </Label>
                    <Select
                      value={appraisalOccupancyType}
                      onValueChange={setAppraisalOccupancyType}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Investment">Investment</SelectItem>
                        <SelectItem value="Vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Property Address
                  </Label>
                  <AddressAutocomplete
                    value={appraisalPropertyAddress}
                    className="h-9"
                    onChange={(addr) => {
                      setAppraisalPropertyAddress(
                        addr.address_line1 ?? addr.raw
                      )
                      setAppraisalPropertyCity(addr.city ?? "")
                      setAppraisalPropertyState(addr.state ?? "")
                      setAppraisalPropertyZip(addr.zip ?? "")
                      setAppraisalPropertyCounty(addr.county ?? "")
                    }}
                    placeholder="Start typing address..."
                    displayValue="street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      className="h-9"
                      placeholder="City"
                      value={appraisalPropertyCity}
                      onChange={(e) => setAppraisalPropertyCity(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      State
                    </Label>
                    <Select
                      value={appraisalPropertyState || undefined}
                      onValueChange={setAppraisalPropertyState}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Zip Code
                    </Label>
                    <Input
                      className="h-9"
                      placeholder="12345"
                      inputMode="numeric"
                      value={appraisalPropertyZip}
                      onChange={(e) =>
                        setAppraisalPropertyZip(
                          e.target.value.replace(/\D/g, "").slice(0, 5)
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      County
                    </Label>
                    <Input
                      className="h-9"
                      placeholder="County"
                      value={appraisalPropertyCounty}
                      onChange={(e) =>
                        setAppraisalPropertyCounty(e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ========== ACCESS INFORMATION ========== */}
              <h3 className="text-sm font-semibold">Access Information</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Contact Person
                  </Label>
                  <Select
                    value={appraisalContactPerson}
                    onValueChange={setAppraisalContactPerson}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Borrower">Borrower</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {appraisalContactPerson === "Other" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs font-semibold">
                        Contact Name
                      </Label>
                      <Input
                        className="h-9"
                        placeholder="Name"
                        value={appraisalContactName}
                        onChange={(e) =>
                          setAppraisalContactName(e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs font-semibold">
                        Contact Email
                      </Label>
                      <Input
                        className="h-9"
                        type="email"
                        placeholder="email@example.com"
                        value={appraisalContactEmail}
                        onChange={(e) =>
                          setAppraisalContactEmail(e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs font-semibold">
                        Contact Phone
                      </Label>
                      <Input
                        className="h-9"
                        placeholder="(555) 555-5555"
                        inputMode="tel"
                        value={appraisalContactPhone}
                        onChange={(e) =>
                          setAppraisalContactPhone(
                            formatUSPhone(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1 md:col-span-4">
                      <Label className="text-muted-foreground text-xs font-semibold">
                        Other Access Information
                      </Label>
                      <Input
                        className="h-9"
                        placeholder="Additional access details..."
                        value={appraisalOtherAccessInfo}
                        onChange={(e) =>
                          setAppraisalOtherAccessInfo(e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              {/* ========== APPRAISAL INFORMATION & DATES ========== */}
              <h3 className="text-sm font-semibold">Appraisal Information</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Product
                  </Label>
                  <Select
                    value={appraisalProduct}
                    onValueChange={setAppraisalProduct}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1004/1007 (SFR & Rent Sch)">
                        1004/1007 (SFR & Rent Sch)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Loan Amount
                  </Label>
                  <CalcInput
                    className="h-9"
                    placeholder="$0.00"
                    value={appraisalLoanAmount}
                    onValueChange={setAppraisalLoanAmount}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Sales Price
                  </Label>
                  <CalcInput
                    className="h-9"
                    placeholder="$0.00"
                    value={appraisalSalesPrice}
                    onValueChange={setAppraisalSalesPrice}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Due Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <DateInput
                        className="h-9"
                        value={appraisalDueDate}
                        onChange={setAppraisalDueDate}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={appraisalDueDate}
                        month={appraisalDueDateCalMonth}
                        onMonthChange={setAppraisalDueDateCalMonth}
                        onSelect={(d) => d && setAppraisalDueDate(d)}
                        disabled={{ before: new Date() }}
                        captionLayout="dropdown"
                        className="min-w-[264px] rounded-md border"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold">
                Permissible Purpose & Compliance
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    GLB
                  </Label>
                  <Select defaultValue="B">
                    <SelectTrigger>
                      <SelectValue placeholder="Select GLB" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    DPPA
                  </Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue placeholder="Select DPPA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    VOTER
                  </Label>
                  <Select defaultValue="7">
                    <SelectTrigger>
                      <SelectValue placeholder="Select VOTER" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isEntity ? (
                <>
                  <h3 className="text-sm font-semibold">Entity Information</h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Entity Name
                        </Label>
                        <Input
                          placeholder="Entity Name"
                          value={entityName}
                          onChange={(e) => setEntityName(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Entity Type
                        </Label>
                        <Select
                          value={entityType || undefined}
                          onValueChange={setEntityType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Entity Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ENTITY_TYPE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          EIN
                        </Label>
                        <Input
                          placeholder="XX-XXXXXXX"
                          inputMode="numeric"
                          value={ein}
                          onChange={(e) => setEin(formatEIN(e.target.value))}
                          maxLength={10}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          State of Formation
                        </Label>
                        <Select
                          value={stateOfFormation || undefined}
                          onValueChange={setStateOfFormation}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {STATE_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Date of Formation
                        </Label>
                        <Popover
                          onOpenChange={(open) => {
                            if (open && dateOfFormation)
                              setDateOfFormationCalMonth(dateOfFormation)
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <DateInput
                                emptyOnMount
                                value={dateOfFormation}
                                onChange={setDateOfFormation}
                              />
                              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                    stroke="currentColor"
                                  />
                                  <line
                                    x1="16"
                                    y1="2"
                                    x2="16"
                                    y2="6"
                                    stroke="currentColor"
                                  />
                                  <line
                                    x1="8"
                                    y1="2"
                                    x2="8"
                                    y2="6"
                                    stroke="currentColor"
                                  />
                                  <line
                                    x1="3"
                                    y1="10"
                                    x2="21"
                                    y2="10"
                                    stroke="currentColor"
                                  />
                                </svg>
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={dateOfFormation}
                              month={dateOfFormationCalMonth}
                              onMonthChange={setDateOfFormationCalMonth}
                              onSelect={(d) => d && setDateOfFormation(d)}
                              disabled={(d) => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                return d > today
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold">
                    Personal Information
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          First Name
                        </Label>
                        <Input
                          placeholder="First Name"
                          value={guarantorFirstName}
                          onChange={(e) =>
                            setGuarantorFirstName(e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Middle Initial
                        </Label>
                        <Input
                          placeholder="M"
                          value={guarantorMiddleInitial}
                          onChange={(e) =>
                            setGuarantorMiddleInitial(e.target.value)
                          }
                          maxLength={1}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Last Name
                        </Label>
                        <Input
                          placeholder="Last Name"
                          value={guarantorLastName}
                          onChange={(e) => setGuarantorLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          DOB
                        </Label>
                        <Popover
                          onOpenChange={(open) => {
                            if (open && dob) setDobCalMonth(dob)
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <DateInput
                                emptyOnMount
                                value={dob}
                                onChange={setDob}
                              />
                              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                    stroke="currentColor"
                                  />
                                  <line
                                    x1="16"
                                    y1="2"
                                    x2="16"
                                    y2="6"
                                    stroke="currentColor"
                                  />
                                  <line
                                    x1="8"
                                    y1="2"
                                    x2="8"
                                    y2="6"
                                    stroke="currentColor"
                                  />
                                  <line
                                    x1="3"
                                    y1="10"
                                    x2="21"
                                    y2="10"
                                    stroke="currentColor"
                                  />
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
                              onSelect={(d) => d && setDob(d)}
                              disabled={(d) => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                return d > today
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          SSN
                        </Label>
                        <Input
                          placeholder="123-45-6789"
                          inputMode="numeric"
                          value={guarantorSsn}
                          onChange={(e) =>
                            setGuarantorSsn(formatSSN(e.target.value))
                          }
                          maxLength={11}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Email Address
                        </Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={guarantorEmail}
                          onChange={(e) => setGuarantorEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">
                          Phone Number
                        </Label>
                        <Input
                          placeholder="(555) 555-5555"
                          inputMode="tel"
                          value={guarantorPhone}
                          onChange={(e) =>
                            setGuarantorPhone(formatUSPhone(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <h3 className="text-sm font-semibold">
                {isEntity ? "Business Address" : "Primary Residence"}
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Street
                  </Label>
                  <AddressAutocomplete
                    value={street}
                    displayValue="street"
                    placeholder="123 Main St"
                    onChange={(addr) => {
                      setStreet(addr.address_line1 ?? "")
                      setCity(addr.city ?? "")
                      setStateCode((addr.state ?? "").toUpperCase())
                      setProvince((addr.province ?? "").toUpperCase())
                      setCountry((addr.country ?? "").toUpperCase())
                      setZip(addr.zip ?? "")
                      setCounty(addr.county ?? "")
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      State
                    </Label>
                    <Select
                      value={stateCode || undefined}
                      onValueChange={setStateCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Zip Code
                    </Label>
                    <Input
                      placeholder="12345"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      County
                    </Label>
                    <Input
                      placeholder="County"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Province
                    </Label>
                    <Select
                      value={province || undefined}
                      onValueChange={setProvince}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {PROVINCE_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Country
                    </Label>
                    <Select
                      value={country || undefined}
                      onValueChange={setCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Floating AI Chat Button + Popup */}
      {!isAppraisal && (
        <div className="pointer-events-none fixed right-8 bottom-8 z-50 flex flex-col items-end gap-3">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-background pointer-events-auto flex h-[480px] w-[380px] flex-col overflow-hidden rounded-xl border shadow-2xl"
              >
                {/* Chat header */}
                <div className="bg-primary flex items-center justify-between px-4 py-3">
                  <div>
                    <h3 className="text-primary-foreground text-sm font-semibold">
                      AI Assistant
                    </h3>
                    <p className="text-primary-foreground/70 text-xs">
                      {stepper.current.id === "credit"
                        ? "Credit report analysis"
                        : "Background check assistant"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="text-primary-foreground/70 hover:text-primary-foreground rounded-md p-1 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Chat body */}
                <div className="flex min-h-0 flex-1 flex-col">
                  {effectiveReportId ? (
                    <ChatPanel
                      key={effectiveReportId}
                      className="h-full min-h-0 flex-1 p-3"
                      reportId={effectiveReportId}
                    />
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
                      <motion.div
                        className="text-muted-foreground"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut",
                        }}
                      >
                        <SparklesSolidIcon size={64} />
                      </motion.div>
                      <Shimmer className="text-sm">
                        {stepper.current.id === "credit"
                          ? "Agent ready to assist when credit is ran"
                          : "Agent ready to assist when background is ran"}
                      </Shimmer>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setChatOpen((prev) => !prev)}
            className={cn(
              "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
              chatOpen
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground",
              effectiveReportId && !chatOpen && "ring-success ring-2 ring-offset-2"
            )}
            aria-label={chatOpen ? "Close AI assistant" : "Open AI assistant"}
          >
            {chatOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default CartStep
