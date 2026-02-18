"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, MessageCircle, RotateCcw, X } from "lucide-react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { motion, AnimatePresence } from "motion/react"
import { FaFeatherAlt } from "react-icons/fa"
import { GiStoneBlock } from "react-icons/gi"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { cn } from "@repo/lib/cn"
import { isUuid } from "@/lib/uuid"
import { useToast } from "@/hooks/use-toast"
import { BounceButton } from "@/components/ui/bounce-button"
import { Button } from "@repo/ui/shadcn/button"
import { Calendar } from "@/components/ui/calendar"
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
  "Corporation",
  "General Partnership",
  "Limited Liability Company",
  "Limited Partnership",
  "Sole Proprietorship",
  "Revocable Trust",
]

const formatEIN = (input: string) => {
  const d = input.replace(/\D+/g, "").slice(0, 9)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}-${d.slice(2)}`
}

const CartStep = ({
  data: _data,
  stepper,
  applicationId,
  carouselIndex = 0,
  currentBorrowerId,
  currentEntityId,
  isEntity = false,
}: {
  data: OrderItemType[]
  stepper: StepperType
  applicationId?: string
  carouselIndex?: number
  currentBorrowerId?: string
  currentEntityId?: string
  isEntity?: boolean
}) => {
  const isCredit = stepper.current.id === "credit"
  const isBackground = stepper.current.id === "background"
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

  // ── Helpers for date conversion ──
  const parseDateStr = useCallback((s: string | null | undefined): Date | undefined => {
    if (!s) return undefined
    const m = /^([0-9]{4})-(\d{2})-(\d{2})$/.exec(String(s))
    if (!m) return undefined
    const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return Number.isNaN(local.getTime()) ? undefined : local
  }, [])

  const formatDateStr = useCallback((d: Date | undefined): string | null => {
    if (!d) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  // ── Helper: fetch SSN for a borrower (always from borrowers table) ──
  const fetchSsnForBorrower = useCallback(async (borrowerId: string): Promise<string> => {
    try {
      const sres = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrowerId)}/ssn`, { cache: "no-store" })
      if (sres.ok) {
        const sj = await sres.json().catch(() => ({}))
        const digits = String(sj?.ssn ?? "").replace(/\D+/g, "").slice(0, 9)
        if (digits.length === 9) return formatSSN(digits)
      }
    } catch { /* ignore */ }
    // fallback: try last4
    try {
      const bres = await fetch(`/api/borrowers/${encodeURIComponent(borrowerId)}`, { cache: "no-store" })
      if (bres.ok) {
        const bj = await bres.json().catch(() => ({}))
        if (typeof bj?.borrower?.ssn_last4 === "string" && bj.borrower.ssn_last4.length === 4) {
          return `***-**-${bj.borrower.ssn_last4}`
        }
      }
    } catch { /* ignore */ }
    return ""
  }, [])

  // ── Helper: populate credit fields from a borrower record ──
  const populateCreditFromBorrower = useCallback(async (borrowerId: string) => {
    try {
      const res = await fetch(`/api/borrowers/${encodeURIComponent(borrowerId)}`, { cache: "no-store" })
      if (!res.ok) return
      const j = await res.json().catch(() => ({}))
      const b = j?.borrower
      if (b) {
        setFirstName((b.first_name as string) ?? "")
        setLastName((b.last_name as string) ?? "")
        if (b.date_of_birth) setDob(parseDateStr(b.date_of_birth as string))
        setStreet((b.address_line1 as string) ?? "")
        setCity((b.city as string) ?? "")
        setStateCode((b.state as string) ?? "")
        setZip((b.zip as string) ?? "")
        setCounty((b.county as string) ?? "")
      }
    } catch { /* swallow */ }
    const ssnVal = await fetchSsnForBorrower(borrowerId)
    setSsn(ssnVal)
  }, [parseDateStr, fetchSsnForBorrower])

  // ── Helper: populate guarantor (background) fields from a borrower record ──
  const populateGuarantorFromBorrower = useCallback(async (borrowerId: string) => {
    try {
      const res = await fetch(`/api/borrowers/${encodeURIComponent(borrowerId)}`, { cache: "no-store" })
      if (!res.ok) return
      const j = await res.json().catch(() => ({}))
      const b = j?.borrower
      if (b) {
        setGuarantorFirstName((b.first_name as string) ?? "")
        setGuarantorLastName((b.last_name as string) ?? "")
        setGuarantorEmail((b.email as string) ?? "")
        if (b.primary_phone) setGuarantorPhone(formatUSPhone(String(b.primary_phone)))
        if (b.date_of_birth) setDob(parseDateStr(b.date_of_birth as string))
        setStreet((b.address_line1 as string) ?? "")
        setCity((b.city as string) ?? "")
        setStateCode((b.state as string) ?? "")
        setZip((b.zip as string) ?? "")
        setCounty((b.county as string) ?? "")
      }
    } catch { /* swallow */ }
    const ssnVal = await fetchSsnForBorrower(borrowerId)
    setGuarantorSsn(ssnVal)
  }, [parseDateStr, fetchSsnForBorrower])

  // ── Helper: populate entity (background) fields from entities API ──
  const populateEntityFromSource = useCallback(async (entityId: string) => {
    try {
      const res = await fetch(`/api/applicants/entities/${encodeURIComponent(entityId)}`, { cache: "no-store" })
      if (!res.ok) return
      const j = await res.json().catch(() => ({}))
      const ent = j?.entity
      if (ent) {
        setEntityName((ent.entity_name as string) ?? "")
        setEntityType((ent.entity_type as string) ?? "")
        setEin(ent.ein ? formatEIN(String(ent.ein)) : "")
        setStateOfFormation((ent.state_formed as string) ?? "")
        if (ent.date_formed) setDateOfFormation(parseDateStr(ent.date_formed as string))
        setStreet((ent.address_line1 as string) ?? "")
        setCity((ent.city as string) ?? "")
        setStateCode((ent.state as string) ?? "")
        setZip((ent.zip as string) ?? "")
        setCounty((ent.county as string) ?? "")
      }
    } catch { /* swallow */ }
  }, [parseDateStr])

  // ── Load Credit step data ──
  useEffect(() => {
    let ignore = false
    async function loadCredit() {
      if (stepper.current.id !== "credit") return
      // Clear
      skipAutosaveRef.current = true
      setShowSsn(false)
      setFirstName("")
      setLastName("")
      setSsn("")
      setDob(undefined)
      setStreet("")
      setCity("")
      setStateCode("")
      setZip("")
      setCounty("")
      setPrevStreet("")
      setPrevCity("")
      setPrevState("")
      setPrevZip("")
      setPullType("soft")
      setIncludeTU(true)
      setIncludeEX(true)
      setIncludeEQ(true)

      if (!currentBorrowerId) return

      // 1. Try saved data first
      let loadedFromSaved = false
      if (applicationId) {
        try {
          const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/credit`, { cache: "no-store" })
          if (res.ok) {
            const j = await res.json().catch(() => ({}))
            const rows = j?.rows ?? []
            const saved = rows.find((r: any) => r.guarantor_index === carouselIndex)
            if (saved && !ignore) {
              loadedFromSaved = true
              setFirstName((saved.first_name as string) ?? "")
              setLastName((saved.last_name as string) ?? "")
              setDob(parseDateStr(saved.date_of_birth))
              setStreet((saved.street as string) ?? "")
              setCity((saved.city as string) ?? "")
              setStateCode((saved.state as string) ?? "")
              setZip((saved.zip as string) ?? "")
              setCounty((saved.county as string) ?? "")
              setPrevStreet((saved.prev_street as string) ?? "")
              setPrevCity((saved.prev_city as string) ?? "")
              setPrevState((saved.prev_state as string) ?? "")
              setPrevZip((saved.prev_zip as string) ?? "")
              setPullType((saved.pull_type as "hard" | "soft") ?? "soft")
              setIncludeTU(saved.include_tu ?? true)
              setIncludeEX(saved.include_ex ?? true)
              setIncludeEQ(saved.include_eq ?? true)
            }
          }
        } catch { /* ignore */ }
      }

      // 2. If no saved data, pull from borrowers
      if (!loadedFromSaved && !ignore) {
        await populateCreditFromBorrower(currentBorrowerId)
      }

      // 3. Always fetch SSN live from borrowers table
      if (!ignore && currentBorrowerId) {
        const ssnVal = await fetchSsnForBorrower(currentBorrowerId)
        if (!ignore) setSsn(ssnVal)
      }

      // Allow autosave after a tick; if loaded from source, force autosave
      if (!ignore) {
        setTimeout(() => {
          skipAutosaveRef.current = false
          if (!loadedFromSaved) setSaveNonce(n => n + 1)
        }, 200)
      }
    }
    loadCredit()
    return () => { ignore = true }
  }, [currentBorrowerId, stepper.current.id, applicationId, carouselIndex, parseDateStr, populateCreditFromBorrower, fetchSsnForBorrower])

  const [prevStreet, setPrevStreet] = useState("")
  const [prevCity, setPrevCity] = useState("")
  const [prevState, setPrevState] = useState("")
  const [prevZip, setPrevZip] = useState("")
  const [ssn, setSsn] = useState("")
  const [showSsn, setShowSsn] = useState(false)
  const [runPhase, setRunPhase] = useState<
    "idle" | "bounce" | "running" | "error"
  >("idle")
  const [chatOpen, setChatOpen] = useState(false)

  // Permissible Purpose & Compliance (Background step)
  const [glb, setGlb] = useState("B")
  const [dppa, setDppa] = useState("3")
  const [voter, setVoter] = useState("7")

  // Autosave refs
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipAutosaveRef = useRef(false)
  // Nonce to force autosave after initial load from source
  const [saveNonce, setSaveNonce] = useState(0)

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
  const [showGuarantorSsn, setShowGuarantorSsn] = useState(false)
  const [guarantorEmail, setGuarantorEmail] = useState("")
  const [guarantorPhone, setGuarantorPhone] = useState("")

  // ── Load Background entity data ──
  useEffect(() => {
    let ignore = false
    async function loadBgEntity() {
      if (stepper.current.id !== "background" || !isEntity) return
      skipAutosaveRef.current = true
      setEntityName("")
      setEntityType("")
      setEin("")
      setStateOfFormation("")
      setDateOfFormation(undefined)
      setStreet("")
      setCity("")
      setStateCode("")
      setZip("")
      setCounty("")
      setGlb("B")
      setDppa("3")
      setVoter("7")

      let loadedFromSaved = false
      if (applicationId) {
        try {
          const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/background`, { cache: "no-store" })
          if (res.ok) {
            const j = await res.json().catch(() => ({}))
            const saved = (j?.rows ?? []).find((r: any) => r.party_index === carouselIndex)
            if (saved && !ignore) {
              loadedFromSaved = true
              setEntityName((saved.entity_name as string) ?? "")
              setEntityType((saved.entity_type as string) ?? "")
              setEin(saved.ein ? formatEIN(String(saved.ein)) : "")
              setStateOfFormation((saved.state_of_formation as string) ?? "")
              setDateOfFormation(parseDateStr(saved.date_of_formation))
              setStreet((saved.street as string) ?? "")
              setCity((saved.city as string) ?? "")
              setStateCode((saved.state as string) ?? "")
              setZip((saved.zip as string) ?? "")
              setCounty((saved.county as string) ?? "")
              setProvince((saved.province as string) ?? "")
              setCountry((saved.country as string) ?? "")
              if (saved.glb) setGlb(saved.glb as string)
              if (saved.dppa) setDppa(saved.dppa as string)
              if (saved.voter) setVoter(saved.voter as string)
            }
          }
        } catch { /* ignore */ }
      }

      if (!loadedFromSaved && !ignore && currentEntityId) {
        await populateEntityFromSource(currentEntityId)
      }

      if (!ignore) {
        setTimeout(() => {
          skipAutosaveRef.current = false
          if (!loadedFromSaved) setSaveNonce(n => n + 1)
        }, 200)
      }
    }
    loadBgEntity()
    return () => { ignore = true }
  }, [currentEntityId, isEntity, stepper.current.id, applicationId, carouselIndex, parseDateStr, populateEntityFromSource])

  // ── Load Background guarantor data ──
  useEffect(() => {
    let ignore = false
    async function loadBgGuarantor() {
      if (stepper.current.id !== "background" || isEntity) return
      skipAutosaveRef.current = true
      setGuarantorFirstName("")
      setGuarantorMiddleInitial("")
      setGuarantorLastName("")
      setGuarantorSsn("")
      setShowGuarantorSsn(false)
      setGuarantorEmail("")
      setGuarantorPhone("")
      setDob(undefined)
      setStreet("")
      setCity("")
      setStateCode("")
      setZip("")
      setCounty("")
      setGlb("B")
      setDppa("3")
      setVoter("7")

      if (!currentBorrowerId) return

      let loadedFromSaved = false
      if (applicationId) {
        try {
          const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/background`, { cache: "no-store" })
          if (res.ok) {
            const j = await res.json().catch(() => ({}))
            const saved = (j?.rows ?? []).find((r: any) => r.party_index === carouselIndex)
            if (saved && !ignore) {
              loadedFromSaved = true
              setGuarantorFirstName((saved.first_name as string) ?? "")
              setGuarantorMiddleInitial((saved.middle_initial as string) ?? "")
              setGuarantorLastName((saved.last_name as string) ?? "")
              setGuarantorEmail((saved.email as string) ?? "")
              setGuarantorPhone(saved.phone ? formatUSPhone(String(saved.phone)) : "")
              setDob(parseDateStr(saved.date_of_birth))
              setStreet((saved.street as string) ?? "")
              setCity((saved.city as string) ?? "")
              setStateCode((saved.state as string) ?? "")
              setZip((saved.zip as string) ?? "")
              setCounty((saved.county as string) ?? "")
              setProvince((saved.province as string) ?? "")
              setCountry((saved.country as string) ?? "")
              if (saved.glb) setGlb(saved.glb as string)
              if (saved.dppa) setDppa(saved.dppa as string)
              if (saved.voter) setVoter(saved.voter as string)
            }
          }
        } catch { /* ignore */ }
      }

      if (!loadedFromSaved && !ignore) {
        await populateGuarantorFromBorrower(currentBorrowerId)
      }

      // Always fetch SSN live
      if (!ignore && currentBorrowerId) {
        const ssnVal = await fetchSsnForBorrower(currentBorrowerId)
        if (!ignore) setGuarantorSsn(ssnVal)
      }

      if (!ignore) {
        setTimeout(() => {
          skipAutosaveRef.current = false
          if (!loadedFromSaved) setSaveNonce(n => n + 1)
        }, 200)
      }
    }
    loadBgGuarantor()
    return () => { ignore = true }
  }, [currentBorrowerId, isEntity, stepper.current.id, applicationId, carouselIndex, parseDateStr, populateGuarantorFromBorrower, fetchSsnForBorrower])

  // ── Load Appraisal data ──
  useEffect(() => {
    let ignore = false
    async function loadAppraisal() {
      if (stepper.current.id !== "confirmation" || !applicationId) return
      skipAutosaveRef.current = true
      try {
        const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/appraisal`, { cache: "no-store" })
        if (res.ok) {
          const j = await res.json().catch(() => ({}))
          const saved = j?.row
          if (saved && !ignore) {
            setAppraisalLender((saved.lender as string) ?? "DSCR Loan Funder LLC")
            setAppraisalInvestor((saved.investor as string) ?? "DSCR Loan Funder LLC")
            setAppraisalTransactionType((saved.transaction_type as string) ?? "")
            setAppraisalLoanType((saved.loan_type as string) ?? "")
            setAppraisalLoanTypeOther((saved.loan_type_other as string) ?? "")
            setAppraisalLoanNumber((saved.loan_number as string) ?? "")
            setAppraisalPriority((saved.priority as string) ?? "")
            setAppraisalBorrowerName((saved.borrower_name as string) ?? "")
            setAppraisalBorrowerEmail((saved.borrower_email as string) ?? "")
            setAppraisalBorrowerPhone(saved.borrower_phone ? formatUSPhone(String(saved.borrower_phone)) : "")
            setAppraisalBorrowerAltPhone(saved.borrower_alt_phone ? formatUSPhone(String(saved.borrower_alt_phone)) : "")
            setAppraisalPropertyType((saved.property_type as string) ?? "")
            setAppraisalOccupancyType((saved.occupancy_type as string) ?? "")
            setAppraisalPropertyAddress((saved.property_address as string) ?? "")
            setAppraisalPropertyCity((saved.property_city as string) ?? "")
            setAppraisalPropertyState((saved.property_state as string) ?? "")
            setAppraisalPropertyZip((saved.property_zip as string) ?? "")
            setAppraisalPropertyCounty((saved.property_county as string) ?? "")
            setAppraisalContactPerson((saved.contact_person as string) ?? "")
            setAppraisalContactName((saved.contact_name as string) ?? "")
            setAppraisalContactEmail((saved.contact_email as string) ?? "")
            setAppraisalContactPhone(saved.contact_phone ? formatUSPhone(String(saved.contact_phone)) : "")
            setAppraisalOtherAccessInfo((saved.other_access_info as string) ?? "")
            setAppraisalProduct((saved.product as string) ?? "")
            setAppraisalLoanAmount((saved.loan_amount as string) ?? "")
            setAppraisalSalesPrice((saved.sales_price as string) ?? "")
            setAppraisalDueDate(parseDateStr(saved.due_date))
          }
        }
      } catch { /* ignore */ }
      if (!ignore) {
        setTimeout(() => {
          skipAutosaveRef.current = false
        }, 200)
      }
    }
    loadAppraisal()
    return () => { ignore = true }
  }, [stepper.current.id, applicationId, parseDateStr])

  // ── Autosave: debounced save to application_* tables ──
  const doAutosave = useCallback(async () => {
    if (!applicationId || skipAutosaveRef.current) return
    const stepId = stepper.current.id
    try {
      if (stepId === "background") {
        await fetch(`/api/applications/${encodeURIComponent(applicationId)}/background`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            party_index: carouselIndex,
            is_entity: isEntity,
            entity_id: currentEntityId ?? null,
            borrower_id: currentBorrowerId ?? null,
            glb, dppa, voter,
            // Entity fields
            entity_name: isEntity ? entityName : null,
            entity_type: isEntity ? entityType : null,
            ein: isEntity ? ein.replace(/\D+/g, "") : null,
            state_of_formation: isEntity ? stateOfFormation : null,
            date_of_formation: isEntity ? formatDateStr(dateOfFormation) : null,
            // Guarantor fields
            first_name: !isEntity ? guarantorFirstName : null,
            middle_initial: !isEntity ? guarantorMiddleInitial : null,
            last_name: !isEntity ? guarantorLastName : null,
            date_of_birth: !isEntity ? formatDateStr(dob) : null,
            email: !isEntity ? guarantorEmail : null,
            phone: !isEntity ? guarantorPhone : null,
            // Address
            street, city, state: stateCode, zip, county, province, country,
          }),
        })
      } else if (stepId === "credit") {
        await fetch(`/api/applications/${encodeURIComponent(applicationId)}/credit`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guarantor_index: carouselIndex,
            borrower_id: currentBorrowerId ?? null,
            pull_type: pullType,
            include_tu: includeTU,
            include_ex: includeEX,
            include_eq: includeEQ,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: formatDateStr(dob),
            street, city, state: stateCode, zip, county,
            prev_street: prevStreet,
            prev_city: prevCity,
            prev_state: prevState,
            prev_zip: prevZip,
          }),
        })
      } else if (stepId === "confirmation") {
        await fetch(`/api/applications/${encodeURIComponent(applicationId)}/appraisal`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lender: appraisalLender,
            investor: appraisalInvestor,
            transaction_type: appraisalTransactionType,
            loan_type: appraisalLoanType,
            loan_type_other: appraisalLoanTypeOther,
            loan_number: appraisalLoanNumber,
            priority: appraisalPriority,
            borrower_name: appraisalBorrowerName,
            borrower_email: appraisalBorrowerEmail,
            borrower_phone: appraisalBorrowerPhone,
            borrower_alt_phone: appraisalBorrowerAltPhone,
            property_type: appraisalPropertyType,
            occupancy_type: appraisalOccupancyType,
            property_address: appraisalPropertyAddress,
            property_city: appraisalPropertyCity,
            property_state: appraisalPropertyState,
            property_zip: appraisalPropertyZip,
            property_county: appraisalPropertyCounty,
            contact_person: appraisalContactPerson,
            contact_name: appraisalContactName,
            contact_email: appraisalContactEmail,
            contact_phone: appraisalContactPhone,
            other_access_info: appraisalOtherAccessInfo,
            product: appraisalProduct,
            loan_amount: appraisalLoanAmount,
            sales_price: appraisalSalesPrice,
            due_date: formatDateStr(appraisalDueDate),
          }),
        })
      }
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    applicationId, stepper.current.id, carouselIndex, isEntity,
    currentEntityId, currentBorrowerId, formatDateStr,
    // Background fields
    glb, dppa, voter, entityName, entityType, ein, stateOfFormation, dateOfFormation,
    guarantorFirstName, guarantorMiddleInitial, guarantorLastName, dob,
    guarantorEmail, guarantorPhone,
    street, city, stateCode, zip, county, province, country,
    // Credit fields
    pullType, includeTU, includeEX, includeEQ,
    firstName, lastName, ssn,
    prevStreet, prevCity, prevState, prevZip,
    // Appraisal fields
    appraisalLender, appraisalInvestor, appraisalTransactionType, appraisalLoanType,
    appraisalLoanTypeOther, appraisalLoanNumber, appraisalPriority,
    appraisalBorrowerName, appraisalBorrowerEmail, appraisalBorrowerPhone, appraisalBorrowerAltPhone,
    appraisalPropertyType, appraisalOccupancyType, appraisalPropertyAddress,
    appraisalPropertyCity, appraisalPropertyState, appraisalPropertyZip, appraisalPropertyCounty,
    appraisalContactPerson, appraisalContactName, appraisalContactEmail, appraisalContactPhone,
    appraisalOtherAccessInfo, appraisalProduct, appraisalLoanAmount, appraisalSalesPrice,
    appraisalDueDate,
  ])

  // Trigger debounced autosave whenever doAutosave changes (which happens when any field changes)
  // Also re-triggers when saveNonce changes (initial save after loading from source)
  useEffect(() => {
    if (!applicationId || skipAutosaveRef.current) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => { doAutosave() }, 500)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doAutosave, applicationId, saveNonce])

  // ── Refresh: re-pull from source entity/borrower tables ──
  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    skipAutosaveRef.current = true
    const stepId = stepper.current.id
    try {
      if (stepId === "background" && isEntity && currentEntityId) {
        await populateEntityFromSource(currentEntityId)
      } else if (stepId === "background" && !isEntity && currentBorrowerId) {
        await populateGuarantorFromBorrower(currentBorrowerId)
        const ssnVal = await fetchSsnForBorrower(currentBorrowerId)
        setGuarantorSsn(ssnVal)
      } else if (stepId === "credit" && currentBorrowerId) {
        await populateCreditFromBorrower(currentBorrowerId)
        const ssnVal = await fetchSsnForBorrower(currentBorrowerId)
        setSsn(ssnVal)
      }
    } finally {
      setRefreshing(false)
      // Re-enable autosave after a tick so the refreshed values get saved
      setTimeout(() => {
        skipAutosaveRef.current = false
        setSaveNonce(n => n + 1)
      }, 200)
    }
  }, [
    refreshing, stepper.current.id, isEntity,
    currentEntityId, currentBorrowerId,
    populateEntityFromSource, populateGuarantorFromBorrower,
    populateCreditFromBorrower, fetchSsnForBorrower,
  ])

  async function handleRun() {
    if (!(isCredit || isBackground) || runPhase !== "idle") return
    setRunPhase("bounce")
    const bounceTimer = setTimeout(() => setRunPhase("running"), 180)
    try {
      if (isBackground) {
        const dobStr = dob
          ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, "0")}-${String(dob.getDate()).padStart(2, "0")}`
          : null
        const dofStr = dateOfFormation
          ? `${dateOfFormation.getFullYear()}-${String(dateOfFormation.getMonth() + 1).padStart(2, "0")}-${String(dateOfFormation.getDate()).padStart(2, "0")}`
          : null

        const res = await fetch("/api/background/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            borrower_id: isEntity ? null : currentBorrowerId ?? null,
            entity_id: isEntity ? currentEntityId ?? null : null,
            is_entity: !!isEntity,
            glb: glb || null,
            dppa: dppa || null,
            voter: voter || null,
            entity_name: entityName || null,
            entity_type: entityType || null,
            ein: ein ? ein.replace(/\D+/g, "") : null,
            state_of_formation: stateOfFormation || null,
            date_of_formation: dofStr,
            first_name: guarantorFirstName || null,
            middle_initial: guarantorMiddleInitial || null,
            last_name: guarantorLastName || null,
            date_of_birth: dobStr,
            ssn: guarantorSsn ? guarantorSsn.replace(/\D+/g, "") : null,
            email: guarantorEmail || null,
            phone: guarantorPhone ? guarantorPhone.replace(/\D+/g, "") : null,
            street: street || null,
            city: city || null,
            state: stateCode || null,
            zip: zip || null,
            county: county || null,
            province: province || null,
            country: country || "US",
            report_type: "comprehensive",
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok || j?.ok === false) {
          throw new Error(
            j?.error || `Background run failed (status ${res.status})`
          )
        }
        toast({
          title: "Background check dispatched",
          description: "The request has been sent for processing.",
        })
      } else {
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
      }
    } catch (e) {
      const label = isBackground ? "Background run" : "Credit run"
      const msg =
        e instanceof Error ? e.message : `Failed to run ${label.toLowerCase()}`
      toast({ title: `${label} failed`, description: msg })
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
        {/* Refresh from source entity/borrower data */}
        {!isAppraisal && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-10 shadow-sm"
            disabled={refreshing}
            onClick={handleRefresh}
            aria-label="Refresh from source data"
          >
            <RotateCcw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
          </Button>
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
                    <div className="relative">
                      <Input
                        placeholder="123-45-6789"
                        inputMode="numeric"
                        type={showSsn ? "text" : "password"}
                        value={ssn}
                        onChange={(e) => {
                          const next = formatSSN(e.target.value)
                          setSsn(next)
                        }}
                        maxLength={11}
                        className="pr-9"
                      />
                      <button
                        type="button"
                        aria-label={showSsn ? "Hide SSN" : "Show SSN"}
                        onClick={() => setShowSsn((v) => !v)}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                      >
                        {showSsn ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
                  <Select value={glb} onValueChange={setGlb}>
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
                  <Select value={dppa} onValueChange={setDppa}>
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
                  <Select value={voter} onValueChange={setVoter}>
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
                        <div className="relative">
                          <Input
                            placeholder="123-45-6789"
                            inputMode="numeric"
                            type={showGuarantorSsn ? "text" : "password"}
                            value={guarantorSsn}
                            onChange={(e) =>
                              setGuarantorSsn(formatSSN(e.target.value))
                            }
                            maxLength={11}
                            className="pr-9"
                          />
                          <button
                            type="button"
                            aria-label={showGuarantorSsn ? "Hide SSN" : "Show SSN"}
                            onClick={() => setShowGuarantorSsn((v) => !v)}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                          >
                            {showGuarantorSsn ? (
                              <IconEyeOff className="h-4 w-4" />
                            ) : (
                              <IconEye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
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
