"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { IconDeviceFloppy, IconFileExport, IconMapPin, IconStar, IconStarFilled, IconCheck, IconX, IconGripVertical, IconPencil, IconTrash, IconEye, IconDownload, IconFileCheck } from "@tabler/icons-react"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateInput } from "@/components/date-input"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ensureGoogleMaps } from "@/lib/google-maps"
import { toast } from "@/hooks/use-toast"
import { CalcInput } from "@/components/calc-input"
import DSCRTermSheet, { type DSCRTermSheetProps } from "../../../../components/DSCRTermSheet"
import BridgeTermSheet from "../../../../components/BridgeTermSheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function toYesNoDeepGlobal(value: unknown): unknown {
  if (typeof value === "boolean") return value ? "yes" : "no"
  if (Array.isArray(value)) return value.map((v) => toYesNoDeepGlobal(v))
  if (value && typeof value === "object") {
    const src = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(src)) {
      out[k] = toYesNoDeepGlobal(v)
    }
    return out
  }
  return value
}

function ScaledTermSheetPreview({
  sheetProps,
  pageRef,
  forceLoanType,
}: {
  sheetProps: DSCRTermSheetProps
  pageRef?: React.Ref<HTMLDivElement>
  forceLoanType?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState<number>(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      if (width <= 0 || height <= 0) return
      // Compute scale to fit both width and height of the container precisely.
      const paddingAllowance = 8 // px allowance for container padding/borders
      const s = Math.min(
        (width - paddingAllowance) / 816,
        (height - paddingAllowance) / 1056,
        1
      ) * 0.88 // slightly further zoom out in the modal
      setScale(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Enable inline editing on leaf text nodes within the preview, while freezing layout boxes
  useEffect(() => {
    const node = (pageRef as React.RefObject<HTMLDivElement> | undefined)?.current
    if (!node) return
    const candidates = Array.from(
      node.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,span,th,td,div")
    )
    const edited: HTMLElement[] = []
    candidates.forEach((el) => {
      // Only make leaf elements with real text editable
      if (el.childElementCount === 0) {
        const text = (el.textContent || "").trim()
        if (text.length > 0) {
          // Freeze current box so alignment stays put during edits
          const rect = el.getBoundingClientRect()
          const cs = window.getComputedStyle(el)
          if (rect.width > 0 && rect.height > 0) {
            // Preserve block elements; only adjust inline
            if (cs.display === "inline" || cs.display === "inline-block") {
              el.style.display = "inline-block"
              el.style.width = `${rect.width}px`
              el.style.whiteSpace = "nowrap"
              el.style.overflow = "hidden"
              el.style.verticalAlign = "top"
            }
          }
          el.setAttribute("contenteditable", "true")
          el.classList.add("ts-edit")
          edited.push(el)
        }
      }
    })
    return () => {
      edited.forEach((el) => {
        el.removeAttribute("contenteditable")
        el.classList.remove("ts-edit")
        el.style.display = ""
        el.style.width = ""
        el.style.whiteSpace = ""
        el.style.overflow = ""
        el.style.verticalAlign = ""
      })
    }
    // Re-evaluate when sheet content changes
  }, [pageRef, sheetProps])
  return (
    <div
      ref={containerRef}
      className="w-full h-[72vh] overflow-hidden rounded-md bg-neutral-100/40 flex items-start justify-center pt-2 pb-2 max-sm:h-[64dvh] max-sm:pt-1 max-sm:pb-1"
    >
      {/* Wrapper takes the visual scaled size so flex centering uses the real pixel box */}
      <div style={{ width: 816 * scale, height: 1056 * scale }}>
        <div
          style={{
            width: 816,
            height: 1056,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="border border-black/20 bg-white shadow-xl rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          ref={pageRef}
          tabIndex={0}
        >
          {(() => {
            const lt = String(forceLoanType ?? sheetProps?.loan_type ?? "").toLowerCase()
            return lt.includes("bridge")
          })() ? (
            <BridgeTermSheet {...sheetProps} />
          ) : (
            <DSCRTermSheet {...sheetProps} />
          )}
        </div>
        {/* Editable text boxes styling (screen-only; hidden on print/download) */}
        <style jsx global>{`
          .ts-edit {
            border: 1px dashed rgba(245, 158, 11, 0.6);
            background: rgba(245, 158, 11, 0.06);
            border-radius: 2px;
            padding: 1px 2px;
          }
          .ts-edit:focus {
            outline: 2px solid #f59e0b;
            outline-offset: 0;
          }
          @media print {
            .ts-edit {
              border-color: transparent !important;
              background: transparent !important;
              outline: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

// Shared minimal types for Google Places Autocomplete
export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

// Minimal Google Places typings used locally
type GPlaces = {
  AutocompleteSessionToken: new () => unknown
  AutocompleteService: new () => {
    getPlacePredictions: (
      req: {
        input: string
        types?: string[]
        componentRestrictions?: { country: string[] }
        sessionToken?: unknown
      },
      cb: (res: PlacePrediction[] | null, status: string) => void
    ) => void
  }
  PlacesService: new (el: HTMLElement) => {
    getDetails: (
      req: { placeId: string; fields?: string[]; sessionToken?: unknown },
      cb: (
        place:
          | { address_components?: { short_name?: string; long_name?: string; types?: string[] }[] }
          | null,
        status: string
      ) => void
    ) => void
  }
}
const getPlaces = (): GPlaces | undefined => {
  const win = window as unknown as { google?: { maps?: { places?: GPlaces } } }
  return win.google?.maps?.places
}

export default function PricingEnginePage() {
  const searchParams = useSearchParams()
  const initialLoanId = searchParams.get("loanId") ?? undefined
  const [scenariosList, setScenariosList] = useState<{ id: string; name?: string; primary?: boolean; created_at?: string }[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(undefined)
  // Collapse the left app sidebar by default when entering this page.
  // We snapshot the prior open state and restore it on unmount so other pages aren't affected.
  const { open: sidebarOpen, setOpen: setSidebarOpen, isMobile } = useSidebar()
  const [mobileView, setMobileView] = useState<"inputs" | "programs">("inputs")
  const prevSidebarOpenRef = useRef<boolean>(sidebarOpen)
  const didInitSidebarEffectRef = useRef<boolean>(false)
  // Persist mobile Inputs/Programs view across sessions
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("pricing.mobileView") : null
      if (saved === "inputs" || saved === "programs") setMobileView(saved)
    } catch {
      // ignore
    }
  }, [])
  useEffect(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("pricing.mobileView", mobileView)
    } catch {
      // ignore
    }
  }, [mobileView])
  useEffect(() => {
    if (didInitSidebarEffectRef.current) return
    didInitSidebarEffectRef.current = true
    prevSidebarOpenRef.current = sidebarOpen
    if (!isMobile && sidebarOpen) {
      // Trigger the animated collapse on desktop
      setSidebarOpen(false)
    }
    return () => {
      // Restore previous state when leaving the page (desktop only)
      if (!isMobile) {
        setSidebarOpen(prevSidebarOpenRef.current)
      }
    }
    // Run once on mount; internal refs ensure single execution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // ----- Resizable panels (inputs/results) -----
  const [leftPanePct, setLeftPanePct] = useState<number>(0.3) // 30% default (clamped 25–50)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const layoutRef = useRef<HTMLDivElement | null>(null)
  const inputsAreaRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!isResizing) return
    const onMove = (ev: MouseEvent | TouchEvent) => {
      let clientX: number | undefined
      if ("touches" in ev) {
        if (ev.touches.length === 0) return
        clientX = ev.touches[0].clientX
      } else {
        clientX = (ev as MouseEvent).clientX
      }
      const root = layoutRef.current
      if (!root || clientX === undefined) return
      const rect = root.getBoundingClientRect()
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      let pct = x / rect.width
      // clamp to 25% - 50%
      pct = Math.max(0.25, Math.min(0.5, pct))
      setLeftPanePct(pct)
      ev.preventDefault?.()
    }
    const stop = () => setIsResizing(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("touchmove", onMove, { passive: false } as unknown as AddEventListenerOptions)
    window.addEventListener("mouseup", stop)
    window.addEventListener("touchend", stop)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("mouseup", stop)
      window.removeEventListener("touchend", stop)
    }
  }, [isResizing])

  // Subject Property dependent state
  const [propertyType, setPropertyType] = useState<string | undefined>(undefined)
  const [numUnits, setNumUnits] = useState<number | undefined>(undefined)
  const [loanType, setLoanType] = useState<string | undefined>(undefined)
  const [bridgeType, setBridgeType] = useState<string | undefined>(undefined)
  const [transactionType, setTransactionType] = useState<string | undefined>(undefined)
  const [closingDate, setClosingDate] = useState<Date | undefined>(undefined)
  const [acquisitionDate, setAcquisitionDate] = useState<Date | undefined>(undefined)
  const [requestMaxLeverage, setRequestMaxLeverage] = useState<boolean>(false)
  const [hoiEffective, setHoiEffective] = useState<Date | undefined>(undefined)
  const [floodEffective, setFloodEffective] = useState<Date | undefined>(undefined)
  // Calendar visible months (controlled so arrows work and typing syncs view)
  const [closingCalMonth, setClosingCalMonth] = useState<Date | undefined>(undefined)
  const [acqCalMonth, setAcqCalMonth] = useState<Date | undefined>(undefined)
  const [hoiCalMonth, setHoiCalMonth] = useState<Date | undefined>(undefined)
  const [floodCalMonth, setFloodCalMonth] = useState<Date | undefined>(undefined)
  const [initialLoanAmount, setInitialLoanAmount] = useState<string>("")
  const [rehabHoldback, setRehabHoldback] = useState<string>("")

  // Address fields (hooked to Google Places)
  const [street, setStreet] = useState<string>("")
  const [apt, setApt] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [stateCode, setStateCode] = useState<string | undefined>(undefined)
  const [zip, setZip] = useState<string>("")
  const [county, setCounty] = useState<string>("")
  const streetInputRef = useRef<HTMLInputElement | null>(null)
  const [sendingReApi, setSendingReApi] = useState<boolean>(false)
  // Controlled fields for webhook responses
  const [glaSqFt, setGlaSqFt] = useState<string>("0")
  const [purchasePrice, setPurchasePrice] = useState<string>("")
  const [annualTaxes, setAnnualTaxes] = useState<string>("")
  const [annualHoi, setAnnualHoi] = useState<string>("")
  const [annualFlood, setAnnualFlood] = useState<string>("")
  const [annualHoa, setAnnualHoa] = useState<string>("")
  const [annualMgmt, setAnnualMgmt] = useState<string>("")
  const [loanAmount, setLoanAmount] = useState<string>("")
  const [adminFee, setAdminFee] = useState<string>("")
  const [payoffAmount, setPayoffAmount] = useState<string>("")
  const [titleRecordingFee, setTitleRecordingFee] = useState<string>("")
  const [assignmentFee, setAssignmentFee] = useState<string>("")
  const [sellerConcessions, setSellerConcessions] = useState<string>("")
  const [hoiPremium, setHoiPremium] = useState<string>("")
  const [floodPremium, setFloodPremium] = useState<string>("")
  const [emd, setEmd] = useState<string>("")
  const [mortgageDebtValue, setMortgageDebtValue] = useState<string>("")
  const [rehabBudget, setRehabBudget] = useState<string>("")
  const [rehabCompleted, setRehabCompleted] = useState<string>("")
  const [arv, setArv] = useState<string>("")
  const [aiv, setAiv] = useState<string>("")
  // Additional UI states to include in payload
  const [borrowerType, setBorrowerType] = useState<string | undefined>(undefined)
  const [citizenship, setCitizenship] = useState<string | undefined>(undefined)
  const [fico, setFico] = useState<string>("")
  const [fthb, setFthb] = useState<string | undefined>(undefined) // DSCR only
  const [rentalsOwned, setRentalsOwned] = useState<string>("") // Bridge only
  const [numFlips, setNumFlips] = useState<string>("") // Bridge only
  const [numGunc, setNumGunc] = useState<string>("") // Bridge only
  const [otherExp, setOtherExp] = useState<string | undefined>(undefined) // Bridge only
  const [warrantability, setWarrantability] = useState<string | undefined>(undefined) // Condo only
  const [strValue, setStrValue] = useState<string | undefined>(undefined) // DSCR only
  const [decliningMarket, setDecliningMarket] = useState<string | undefined>(undefined) // DSCR only
  const [rural, setRural] = useState<string | undefined>(undefined) // Yes/No
  const [loanStructureType, setLoanStructureType] = useState<string | undefined>(undefined) // DSCR
  const [ppp, setPpp] = useState<string | undefined>(undefined) // DSCR
  const [term, setTerm] = useState<string | undefined>(undefined) // Bridge
  const [lenderOrig, setLenderOrig] = useState<string>("")
  const [brokerOrig, setBrokerOrig] = useState<string>("")
  const [borrowerName, setBorrowerName] = useState<string>("")
  const [guarantorsStr, setGuarantorsStr] = useState<string>("")
  const [uwException, setUwException] = useState<string | undefined>(undefined)
  const [section8, setSection8] = useState<string | undefined>(undefined)
  const [glaExpansion, setGlaExpansion] = useState<string | undefined>(undefined) // Bridge rehab
  const [changeOfUse, setChangeOfUse] = useState<string | undefined>(undefined) // Bridge rehab
  const [taxEscrowMonths, setTaxEscrowMonths] = useState<string>("")
  const [gmapsReady, setGmapsReady] = useState<boolean>(false)
  const [showPredictions, setShowPredictions] = useState<boolean>(false)
  const [activePredictionIdx, setActivePredictionIdx] = useState<number>(-1)
  const [programResults, setProgramResults] = useState<ProgramResult[]>([])
  const [isDispatching, setIsDispatching] = useState<boolean>(false)
  const [programPlaceholders, setProgramPlaceholders] = useState<Array<{ internal_name?: string; external_name?: string }>>([])
  // Track when shown results are out-of-sync with edited inputs
  const [lastCalculatedKey, setLastCalculatedKey] = useState<string | null>(null)
  const [resultsStale, setResultsStale] = useState<boolean>(false)
  const [currentLoanId, setCurrentLoanId] = useState<string | undefined>(undefined)
  const [selectedMainRow, setSelectedMainRow] = useState<SelectedRow | null>(null)
  // Scenario naming UI state
  const [isNamingScenario, setIsNamingScenario] = useState<boolean>(false)
  const [scenarioName, setScenarioName] = useState<string>("")
  const scenarioInputRef = useRef<HTMLInputElement | null>(null)
  // Scenario rename state (local only until Save)
  const [isRenamingScenario, setIsRenamingScenario] = useState<boolean>(false)
  const [renameDraft, setRenameDraft] = useState<string>("")
  const [pendingScenarioName, setPendingScenarioName] = useState<string | undefined>(undefined)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false)

  // Defaults for a brand-new loan (from "New Loan" button).
  // These should be visible as greyed values but still included in all POST payloads.
  const addDays = (dt: Date, days: number) => {
    const d = new Date(dt)
    d.setDate(d.getDate() + days)
    return d
  }
  const _isSameDay = (a?: Date, b?: Date) => {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }
  const DEFAULTS = React.useMemo(
    () => ({
      borrowerType: "entity" as string,
      fthb: "no" as string,
      citizenship: "us" as string,
      mortgageDebtValue: "0" as string,
      rural: "no" as string,
      strValue: "no" as string,
      decliningMarket: "no" as string,
      annualFlood: "0" as string,
      annualHoa: "0" as string,
      annualMgmt: "0" as string,
      closingDate: addDays(new Date(), 24) as Date,
      loanStructureType: "fixed-30" as string,
      ppp: "5-4-3-2-1" as string,
      borrowerName: "Example LLC" as string,
      guarantorsStr: "First Last" as string,
      uwException: "no" as string,
      section8: "no" as string,
      glaExpansion: "no" as string,
      changeOfUse: "no" as string,
      hoiEffective: addDays(new Date(), 24) as Date,
      floodEffective: addDays(new Date(), 24) as Date,
      taxEscrowMonths: "3" as string,
    }),
    []
  )
  const defaultsAppliedRef = useRef<boolean>(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [reAuto, setReAuto] = useState<Record<string, boolean>>({})
  function markReAuto(keys: string[]) {
    if (!Array.isArray(keys) || keys.length === 0) return
    setReAuto((prev) => {
      const next: Record<string, boolean> = { ...prev }
      for (const k of keys) next[k] = true
      return next
    })
  }
  function clearReAuto(key: string) {
    setReAuto((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }
  useEffect(() => {
    if (defaultsAppliedRef.current) return
    // Only apply defaults when arriving via "New Loan" (no loanId present)
    if (initialLoanId) return
    // Guard against overriding any prefilled values
    const setIfUnsetString = (current: string | undefined, setter: (v: string) => void, value: string) => {
      if (current === undefined || current === "") setter(value)
    }
    const setIfUnsetDate = (current: Date | undefined, setter: (v: Date) => void, value: Date) => {
      if (!current) setter(value)
    }
    setIfUnsetString(borrowerType, (v) => setBorrowerType(v), DEFAULTS.borrowerType)
    setIfUnsetString(fthb, (v) => setFthb(v), DEFAULTS.fthb)
    setIfUnsetString(citizenship, (v) => setCitizenship(v), DEFAULTS.citizenship)
    setIfUnsetString(mortgageDebtValue, (v) => setMortgageDebtValue(v), DEFAULTS.mortgageDebtValue)
    setIfUnsetString(rural, (v) => setRural(v), DEFAULTS.rural)
    setIfUnsetString(strValue, (v) => setStrValue(v), DEFAULTS.strValue)
    setIfUnsetString(decliningMarket, (v) => setDecliningMarket(v), DEFAULTS.decliningMarket)
    setIfUnsetString(annualFlood, (v) => setAnnualFlood(v), DEFAULTS.annualFlood)
    setIfUnsetString(annualHoa, (v) => setAnnualHoa(v), DEFAULTS.annualHoa)
    setIfUnsetString(annualMgmt, (v) => setAnnualMgmt(v), DEFAULTS.annualMgmt)
    setIfUnsetDate(closingDate, (v) => setClosingDate(v), DEFAULTS.closingDate)
    setIfUnsetString(loanStructureType, (v) => setLoanStructureType(v), DEFAULTS.loanStructureType)
    setIfUnsetString(ppp, (v) => setPpp(v), DEFAULTS.ppp)
    setIfUnsetString(borrowerName, (v) => setBorrowerName(v), DEFAULTS.borrowerName)
    setIfUnsetString(guarantorsStr, (v) => setGuarantorsStr(v), DEFAULTS.guarantorsStr)
    setIfUnsetString(uwException, (v) => setUwException(v), DEFAULTS.uwException)
    setIfUnsetString(section8, (v) => setSection8(v), DEFAULTS.section8)
    setIfUnsetString(glaExpansion, (v) => setGlaExpansion(v), DEFAULTS.glaExpansion)
    setIfUnsetString(changeOfUse, (v) => setChangeOfUse(v), DEFAULTS.changeOfUse)
    setIfUnsetDate(hoiEffective, (v) => setHoiEffective(v), DEFAULTS.hoiEffective)
    setIfUnsetDate(floodEffective, (v) => setFloodEffective(v), DEFAULTS.floodEffective)
    // Bridge defaults to 0 months; DSCR defaults to 3
    setIfUnsetString(
      taxEscrowMonths,
      (v) => setTaxEscrowMonths(v),
      loanType === "bridge" ? "0" : DEFAULTS.taxEscrowMonths
    )
    defaultsAppliedRef.current = true
  }, [
    initialLoanId,
    borrowerType,
    fthb,
    citizenship,
    mortgageDebtValue,
    rural,
    strValue,
    decliningMarket,
    annualFlood,
    annualHoa,
    annualMgmt,
    closingDate,
    loanStructureType,
    ppp,
    borrowerName,
    guarantorsStr,
    uwException,
    section8,
    glaExpansion,
    changeOfUse,
    hoiEffective,
    floodEffective,
    taxEscrowMonths,
  ])

  // Keep Tax Escrow (months) default in sync with loan type until user edits it
  useEffect(() => {
    const currentDefault = loanType === "bridge" ? "0" : DEFAULTS.taxEscrowMonths
    if (!touched.taxEscrowMonths) {
      setTaxEscrowMonths((v) => (v === "" || v === "0" || v === "3" ? currentDefault : v))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanType])

  // Keep calendar month in sync with typed/selected dates
  useEffect(() => {
    setClosingCalMonth(closingDate ?? undefined)
  }, [closingDate])
  useEffect(() => {
    setAcqCalMonth(acquisitionDate ?? undefined)
  }, [acquisitionDate])
  useEffect(() => {
    setHoiCalMonth(hoiEffective ?? undefined)
  }, [hoiEffective])
  useEffect(() => {
    setFloodCalMonth(floodEffective ?? undefined)
  }, [floodEffective])

  // Simple derived flags for label required markers
  const isDscr = loanType === "dscr"
  const isBridge = loanType === "bridge"
  const isPurchase = transactionType === "purchase" || transactionType === "delayed-purchase"
  const isRefi = transactionType === "co-refi" || transactionType === "rt-refi"
  const isFicoRequired = (isDscr || isBridge) && (citizenship === "us" || citizenship === "pr")
  // Compute default/placeholder for Title & Recording Fee when untouched
  const computedTitleRecording = useMemo(() => {
    const parse = (s: string): number => {
      const n = Number(String(s ?? "").replace(/[^0-9.-]/g, ""))
      return Number.isFinite(n) ? n : 0
    }
    const formatter = (n: number) => n.toFixed(2)
    if (isPurchase) {
      const price = parse(purchasePrice)
      if (price > 0) return formatter(price * 0.75 * 0.0125)
    } else if (isRefi) {
      const v = parse(aiv)
      if (v > 0) return formatter(v * 0.75 * 0.0125)
    }
    return ""
  }, [isPurchase, isRefi, purchasePrice, aiv])
  // Do not auto-write Title & Recording Fee while user types other fields.
  // We will use the computed default in payload if the user left it untouched.
  // Ensure default Term when Bridge is selected
  useEffect(() => {
    if (isBridge && (!term || term === "")) {
      setTerm("12")
    }
  }, [isBridge, term])
  useEffect(() => {
    if (isNamingScenario) {
      // focus when entering naming mode
      setTimeout(() => scenarioInputRef.current?.focus(), 0)
    }
  }, [isNamingScenario])
  const predictionsMenuRef = useRef<HTMLDivElement | null>(null)
  const pointerInMenuRef = useRef<boolean>(false)
  const suppressPredictionsRef = useRef<boolean>(false)
  const sessionTokenRef = useRef<unknown>(undefined)
  async function handleSendToReApi(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (sendingReApi) return
    try {
      setSendingReApi(true)
      const payload = {
        street,
        apt,
        city,
        state: stateCode ?? "",
        zip,
        transaction_type: transactionType ?? "",
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      // Helper to map RE API data back into form fields
      const applyReApiResponse = (data: Record<string, unknown>) => {
        const autoKeys: string[] = []
        const val = (...keys: string[]) => {
          for (const k of keys) {
            if (k in data) return data[k] as unknown
          }
          return undefined
        }
        // Property Type
        const pt = val("property-type", "property_type")
        if (typeof pt === "string" && pt) {
          setPropertyType(pt)
          autoKeys.push("propertyType")
        }
        // Number of Units (validated against property-type)
        const units = val("num-units", "num_units", "units")
        if (units !== undefined && units !== null) {
          const asNum = Number(units)
          if (!Number.isNaN(asNum) && Number.isFinite(asNum)) {
            const allowed =
              pt === "mf2_4"
                ? [2, 3, 4]
                : pt === "mf5_10"
                ? [5, 6, 7, 8, 9, 10]
                : pt
                ? [1]
                : []
            if (allowed.length === 0 || allowed.includes(asNum)) {
              setNumUnits(asNum)
              autoKeys.push("numUnits")
            }
          }
        }
        // GLA Sq Ft
        const gla = val("gla", "gla_sq_ft", "gla_sqft", "gla_sqft_ft")
        if (gla !== undefined && gla !== null) {
          setGlaSqFt(String(gla))
          autoKeys.push("glaSqFt")
        }
        // Acquisition Date
        const acq = val("acq-date", "acq_date", "acquisition_date")
        if (typeof acq === "string" || acq instanceof Date || typeof acq === "number") {
          const d = acq instanceof Date ? acq : new Date(acq)
          if (!isNaN(d.getTime())) {
            setAcquisitionDate(d)
            autoKeys.push("acquisitionDate")
          }
        }
        // Purchase Price
        const pp = val("purchase-price", "purchase_price")
        if (pp !== undefined && pp !== null) {
          setPurchasePrice(String(pp))
          autoKeys.push("purchasePrice")
        }
        // Annual Taxes
        const at = val("annual-taxes", "annual_taxes")
        if (at !== undefined && at !== null) {
          setAnnualTaxes(String(at))
          autoKeys.push("annualTaxes")
        }
        // Rural flag (expects Yes/No from RE API; normalize to 'yes' | 'no')
        const ruralIncoming = val("rural", "is_rural", "rural_flag", "rural-indicator", "rural_indicator")
        if (ruralIncoming !== undefined && ruralIncoming !== null) {
          const toYesNo = (v: unknown): "yes" | "no" | undefined => {
            if (typeof v === "boolean") return v ? "yes" : "no"
            const s = String(v).trim().toLowerCase()
            if (["yes", "y", "true", "1"].includes(s)) return "yes"
            if (["no", "n", "false", "0"].includes(s)) return "no"
            return undefined
          }
          const yn = toYesNo(ruralIncoming)
          if (yn) {
            setRural(yn)
            autoKeys.push("rural")
          }
        }
        if (autoKeys.length > 0) {
          markReAuto(autoKeys)
        }
      }

      const urls = [
        `https://n8n.axora.info/webhook/c0d82736-8004-4c69-b9fc-fee54676ff46?_=${encodeURIComponent(nonce)}`,
        `https://n8n.axora.info/webhook/7459a9a6-3e04-42d4-9465-1dd42bf91cc3?_=${encodeURIComponent(nonce)}`,
      ]
      const body = JSON.stringify(toYesNoDeepGlobal(payload) as Record<string, unknown>)
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "X-Client-Request-Id": nonce,
      }

      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const r = await fetch(url, { method: "POST", cache: "no-store", headers, body })
          // Try to parse JSON regardless of ok; network 200 with non-JSON should not throw
          let data: Record<string, unknown> | undefined
          try {
            data = await r.json()
          } catch {
            data = undefined
          }
          if (r.ok && data && typeof data === "object") {
            applyReApiResponse(data)
          } else if (!r.ok) {
            const t = await r.text().catch(() => "")
            throw new Error(t || `Request failed: ${r.status}`)
          }
          return r.ok
        })
      )
      const anySuccess = results.some((res) => res.status === "fulfilled")
      if (!anySuccess) {
        const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined
        throw new Error(firstErr?.reason?.message || "Both RE API requests failed")
      }
      toast({
        title: "Sent to RE API",
        description: "Address submitted successfully.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast({
        title: "Failed to send",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSendingReApi(false)
    }
  }

  // Build payload of current, visible inputs
  function buildPayload() {
    const payload: Record<string, unknown> = {
      // Ensure keys are always present in JSON (no undefined values)
      loan_type: loanType ?? "",
      transaction_type: transactionType ?? "",
      property_type: propertyType ?? "",
      num_units: numUnits ?? null,
      max_leverage_requested: requestMaxLeverage ? "yes" : "no",
      address: {
        street,
        apt,
        city,
        state: stateCode ?? "",
        zip,
        county,
      },
      gla_sq_ft: glaSqFt,
      purchase_price: purchasePrice,
      loan_amount: loanAmount,
      admin_fee: adminFee,
      payoff_amount: payoffAmount,
      aiv,
      arv,
      rehab_budget: rehabBudget,
      rehab_completed: rehabCompleted,
      rehab_holdback: rehabHoldback,
      emd,
      taxes_annual: annualTaxes,
      hoi_annual: annualHoi,
      flood_annual: annualFlood,
      hoa_annual: annualHoa,
      mgmt_annual: annualMgmt,
      hoi_premium: hoiPremium,
      flood_premium: floodPremium,
      mortgage_debt: mortgageDebtValue,
      closing_date: closingDate ? closingDate.toISOString() : null,
      // also send projected note date for downstream webhooks
      projected_note_date: (() => {
        const dt = closingDate ?? DEFAULTS.closingDate
        return dt ? dt.toISOString() : null
      })(),
      // always include effective dates (can be null)
      hoi_effective_date: (hoiEffective ?? DEFAULTS.hoiEffective)?.toISOString() ?? null,
      flood_effective_date: (floodEffective ?? DEFAULTS.floodEffective)?.toISOString() ?? null,
      // borrower + fees: always include (may be empty string)
      borrower_type: borrowerType ?? "",
      citizenship: citizenship ?? "",
      fico,
      rural: rural ?? "",
      borrower_name: borrowerName,
      guarantors: (guarantorsStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      uw_exception: uwException ?? "",
      lender_orig_percent: lenderOrig,
      broker_orig_percent: brokerOrig,
      title_recording_fee: titleRecordingFee || computedTitleRecording,
      assignment_fee: assignmentFee,
      seller_concessions: sellerConcessions,
      tax_escrow_months: taxEscrowMonths,
    }
    // Optional / conditional extras - include when section is visible
    if (transactionType !== "purchase") {
      payload["acquisition_date"] = acquisitionDate ? acquisitionDate.toISOString() : null
    }
    if (loanType === "bridge") {
      // Always include bridge-specific selections
      payload["bridge_type"] = bridgeType ?? ""
      payload["term"] = term ?? "12"
      payload["rentals_owned"] = rentalsOwned
      payload["num_flips"] = numFlips
      payload["num_gunc"] = numGunc
      payload["other_exp"] = otherExp ?? ""

      // Always include potential rehab-related inputs so webhooks receive them when visible
      payload["gla_expansion"] = glaExpansion ?? ""
      payload["change_of_use"] = changeOfUse ?? ""
      payload["initial_loan_amount"] = initialLoanAmount
      payload["rehab_holdback"] = rehabHoldback
      const total = (() => {
        const a = Number(initialLoanAmount || "0")
        const b = Number(rehabHoldback || "0")
        const sum = Number.isFinite(a) && Number.isFinite(b) ? a + b : 0
        return sum.toFixed(2)
      })()
      payload["total_loan_amount"] = total
      // Keep single-loan amount value too (empty string if using rehab path)
      payload["loan_amount"] = loanAmount
      // Ensure aliases are present
      payload["rehab_budget"] = rehabBudget
      payload["arv"] = arv
    }
    if (loanType === "dscr") {
      payload["fthb"] = fthb ?? ""
      payload["loan_structure_type"] = loanStructureType ?? ""
      payload["ppp"] = ppp ?? ""
      payload["str"] = strValue ?? ""
      payload["declining_market"] = decliningMarket ?? ""
      payload["section8"] = section8 ?? ""
    }
    if (propertyType === "condo") {
      payload["warrantability"] = warrantability ?? ""
    }
    if (unitData?.length) {
      const units = unitData.map((u) => ({
        leased: u.leased,
        gross: u.gross,
        market: u.market,
        // explicit aliases for clarity in saved scenarios
        gross_rent: u.gross,
        market_rent: u.market,
      }))
      payload["unit_data"] = units
      // add a more descriptive alias without impacting downstream usage
      payload["units"] = units
    }
    return payload
  }

  async function handleCalculate() {
    try {
      // Clear any previously selected row so a fresh calculation doesn't preselect anything
      setSelectedMainRow(null)
      setResultsStale(false)
      if (!loanType) {
        toast({ title: "Missing loan type", description: "Select a Loan Type before calculating.", variant: "destructive" })
        return
      }
      // show results container with loader
      setProgramResults([])
      setProgramPlaceholders([])
      setIsDispatching(true)
      // Prefetch programs to render per-program loaders
      let placeholdersLocal: Array<{ internal_name?: string; external_name?: string }> = []
      try {
        const antiCache = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const pre = await fetch(`/api/pricing/programs?loanType=${encodeURIComponent(loanType)}&_=${encodeURIComponent(antiCache)}`, {
          method: "GET",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "X-Client-Request-Id": antiCache },
        })
        if (pre.ok) {
          const pj = (await pre.json().catch(() => ({}))) as { programs?: Array<{ internal_name?: string; external_name?: string }> }
          const ph = Array.isArray(pj?.programs) ? pj.programs : []
          placeholdersLocal = ph
          setProgramPlaceholders(ph)
          // initialize result slots in same order so containers render in place
          setProgramResults(ph.map((p) => ({ internal_name: p.internal_name, external_name: p.external_name } as ProgramResult)))
        }
      } catch {
        // ignore prefetch errors; we'll still show a generic loader
      }
      const payload = buildPayload()
      try {
        setLastCalculatedKey(JSON.stringify(payload))
      } catch {
        // ignore serialization issues
        setLastCalculatedKey(String(Date.now()))
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      // Also POST all inputs (including defaults/placeholders) to the external webhook
      // This call is non-blocking and won't affect the main dispatch flow.
      try {
        const webhookBody = JSON.stringify(toYesNoDeepGlobal(payload) as Record<string, unknown>)
        void fetch(`https://n8n.axora.info/webhook/a108a42d-e071-4f84-a557-2cd72e440c83?_=${encodeURIComponent(nonce)}`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "X-Client-Request-Id": nonce,
          },
          body: webhookBody,
        }).catch(() => {})
      } catch {
        // do not block calculation if webhook serialization fails
      }
      // Kick off per-program dispatch requests so each card fills as soon as it's ready
      const currentPlaceholders = placeholdersLocal.slice()
      await Promise.all(
        currentPlaceholders.map(async (p, idx) => {
          try {
            const res = await fetch(`/api/pricing/dispatch-one?_=${encodeURIComponent(nonce)}-${idx}`, {
              method: "POST",
              cache: "no-store",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "X-Client-Request-Id": `${nonce}-${idx}`,
              },
              body: JSON.stringify({ loanType, programId: p.internal_name ?? p.external_name, data: payload }),
            })
            const single = (await res.json().catch(() => ({}))) as ProgramResult
            // place result in its slot (do not reorder to preserve container positions)
            setProgramResults((prev) => {
              const next = prev.slice()
              next[idx] = { ...next[idx], ...single }
              return next
            })
          } catch {
            // leave the loader if a single program fails; others will still resolve
          }
        })
      )
      toast({ title: "Sent", description: "Webhooks dispatched" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast({ title: "Failed to send", description: message, variant: "destructive" })
    } finally {
      setIsDispatching(false)
    }
  }
  async function handleSaveAs(nameFromUi?: string) {
    try {
      const name = nameFromUi ?? (typeof window !== "undefined" ? window.prompt("Scenario name:") : undefined)
      if (!name || !name.trim()) return
      const inputs = buildPayload()
      let selected = selectedMainRow?.values
      if (!selected) {
        const first = programResults?.[0]?.data as ProgramResponseData | undefined
        if (first) {
          const hi = Number(first.highlight_display ?? 0)
          const isBridgeStyle =
            Array.isArray(first.total_loan_amount) ||
            Array.isArray(first.initial_loan_amount) ||
            Array.isArray(first.funded_pitia)
          if (isBridgeStyle) {
            const loanPrice = pick<string | number>(first.loan_price, hi) ?? null
            const rate = pick<string | number>(first.interest_rate, hi) ?? null
            const init = pick<string | number>(first.initial_loan_amount, hi) ?? null
            const hold = pick<string | number>(first.rehab_holdback, hi) ?? null
            const tot = pick<string | number>(first.total_loan_amount, hi) ?? null
            const fpitia = pick<string | number>(first.funded_pitia, hi) ?? null
            selected = {
              loanPrice,
              interestRate: rate,
              initialLoanAmount: init,
              rehabHoldback: hold,
              loanAmount: tot,
              pitia: fpitia,
              ltv: null,
              dscr: null,
            }
          } else {
            selected = {
              loanPrice: pick<string | number>(first.loan_price, hi) ?? null,
              interestRate: pick<string | number>(first.interest_rate, hi) ?? null,
              loanAmount: (first.loan_amount as string | number | null | undefined) ?? null,
              ltv: (first.ltv as string | number | null | undefined) ?? null,
              pitia: pick<string | number>(first.pitia, hi) ?? null,
              dscr: pick<string | number>(first.dscr, hi) ?? null,
            }
          }
        }
      }
      // Attach metadata about which program/row was chosen when saving
      const selectedWithMeta = {
        ...selected,
        program_name:
          selectedMainRow?.programName ??
          programResults?.[selectedMainRow?.programIdx ?? 0]?.internal_name ??
          programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name,
        program_id:
          selectedMainRow?.programId ??
          programResults?.[selectedMainRow?.programIdx ?? 0]?.internal_name ??
          programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name,
        program_index: selectedMainRow?.programIdx ?? 0,
        row_index: selectedMainRow?.rowIdx ?? 0,
      }
      const res = await fetch("/api/pricing/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          inputs,
          selected: selectedWithMeta,
          loanId: currentLoanId,
        }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => "")
        throw new Error(msg || `Save failed (${res.status})`)
      }
      const j = (await res.json().catch(() => ({}))) as { loanId?: string; scenarioId?: string }
      if (j?.loanId) {
        setCurrentLoanId(j.loanId)
        // Refresh scenarios list for this loan so the new scenario appears
        try {
          const listRes = await fetch(`/api/loans/${j.loanId}/scenarios`)
          if (listRes.ok) {
            const json = (await listRes.json().catch(() => ({}))) as {
              scenarios?: { id: string; name?: string; primary?: boolean; created_at?: string }[]
            }
            setScenariosList(json.scenarios ?? [])
          }
        } catch {
          // ignore refresh errors
        }
      }
      if (j?.scenarioId) {
        setSelectedScenarioId(j.scenarioId)
      }
      toast({ title: "Saved", description: `Scenario saved${j?.scenarioId ? ` (#${j.scenarioId})` : ""}.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast({ title: "Save failed", description: message, variant: "destructive" })
    }
  }

  function handleConfirmSave() {
    const trimmed = scenarioName.trim()
    if (!trimmed) {
      toast({ title: "Missing name", description: "Please enter a scenario name.", variant: "destructive" })
      scenarioInputRef.current?.focus()
      return
    }
    handleSaveAs(trimmed).finally(() => {
      setIsNamingScenario(false)
      setScenarioName("")
    })
  }

  function handleCancelSave() {
    setIsNamingScenario(false)
    setScenarioName("")
  }
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])

  const states = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  ]

  const unitOptions = useMemo(() => {
    if (propertyType === "mf2_4") return [2, 3, 4]
    if (propertyType === "mf5_10") return [5, 6, 7, 8, 9, 10]
    if (!propertyType) return []
    return [1]
  }, [propertyType])

  // Per-unit income rows placeholder state
  const [unitData, setUnitData] = useState<
    { leased?: "yes" | "no"; gross?: string; market?: string }[]
  >([])
  // When hydrating from a scenario, stash unit rows so the resizing effect can populate them once.
  const hydrateUnitsRef = useRef<
    { leased?: "yes" | "no"; gross?: string; market?: string }[] | null
  >(null)

  // Keep numUnits within allowed options and resize unit rows accordingly
  useEffect(() => {
    if (unitOptions.length === 0) {
      setNumUnits(undefined)
      setUnitData([])
      return
    }
    if (!numUnits || !unitOptions.includes(numUnits)) {
      const next = unitOptions[0]
      setNumUnits(next)
      // If we have saved data to hydrate, prefer that; else blank rows.
      const saved = hydrateUnitsRef.current
      if (saved && Array.isArray(saved) && saved.length > 0) {
        const rows = Array.from({ length: next }, (_, i) => ({
          leased: saved[i]?.leased,
          gross: saved[i]?.gross ?? "",
          market: saved[i]?.market ?? "",
        }))
        setUnitData(rows)
        hydrateUnitsRef.current = null
      } else {
        setUnitData(Array.from({ length: next }, () => ({ leased: undefined, gross: "", market: "" })))
      }
      return
    }
    // Maintain length; populate with saved values if present
    const saved = hydrateUnitsRef.current
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const rows = Array.from({ length: numUnits }, (_, i) => ({
        leased: saved[i]?.leased,
        gross: saved[i]?.gross ?? "",
        market: saved[i]?.market ?? "",
      }))
      setUnitData(rows)
      hydrateUnitsRef.current = null
    } else {
      setUnitData(Array.from({ length: numUnits }, () => ({ leased: undefined, gross: "", market: "" })))
    }
  }, [unitOptions, numUnits])

  // Derived requiredness and validation for Calculate button (placed after unitData declaration)
  const rehabSectionVisible = isBridge && (bridgeType === "bridge-rehab" || bridgeType === "ground-up")
  const rehabPathVisible = !requestMaxLeverage && rehabSectionVisible
  const loanAmountPathVisible = !requestMaxLeverage && !rehabPathVisible
  // Units table is only applicable to DSCR income analysis
  const areUnitRowsVisible = isDscr && (numUnits ?? 0) > 0
  const unitsComplete = useMemo(() => {
    if (!areUnitRowsVisible) return true
    return unitData.every(
      (u) =>
        (u.leased === "yes" || u.leased === "no") &&
        typeof u.gross === "string" &&
        u.gross !== "" &&
        typeof u.market === "string" &&
        u.market !== ""
    )
  }, [areUnitRowsVisible, unitData])
  const canCalculate = useMemo(() => {
    const has = (v: unknown) => !(v === undefined || v === null || v === "")
    if (!has(loanType)) return false
    if (!has(transactionType)) return false
    if (isBridge && !has(bridgeType)) return false
    // Term becomes required for Bridge; default to "12" if not set
    if (isBridge && !has(term)) return false
    if (!has(borrowerType)) return false
    if (!has(citizenship)) return false
    if (isFicoRequired && !has(fico)) return false
    if (!has(stateCode)) return false
    if (!has(propertyType)) return false
    // Taxes/HOI are only required for DSCR
    if (isDscr && !has(annualTaxes)) return false
    if (isDscr && !has(annualHoi)) return false
    if (!unitsComplete) return false
    if (isDscr && (!has(loanStructureType) || !has(ppp))) return false
    if (isPurchase && !has(purchasePrice)) return false
    if (!has(aiv)) return false
    if (rehabSectionVisible) {
      if (!has(rehabBudget)) return false
      if (!has(arv)) return false
    }
    if (rehabPathVisible && !has(initialLoanAmount)) return false
    if (loanAmountPathVisible && !has(loanAmount)) return false
    // Treat computed defaults as satisfying requirements for fee-like optional fields
    // Even if user did not type them, they will be sent in the payload.
    return true
  }, [
    loanType,
    transactionType,
    isBridge,
    bridgeType,
    term,
    borrowerType,
    citizenship,
    isFicoRequired,
    fico,
    stateCode,
    propertyType,
    annualTaxes,
    annualHoi,
    unitsComplete,
    isDscr,
    loanStructureType,
    ppp,
    isPurchase,
    purchasePrice,
    isRefi,
    aiv,
    rehabPathVisible,
    initialLoanAmount,
    loanAmountPathVisible,
    loanAmount,
  ])

  // Load Google Maps JS API (Places) once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ;(async () => {
      try {
        await ensureGoogleMaps(apiKey)
        // Initialize a session token for a better billing experience
        const places = getPlaces()
        if (places) {
          sessionTokenRef.current = new places.AutocompleteSessionToken()
        }
        setGmapsReady(true)
      } catch {
        setGmapsReady(false)
      }
    })()
  }, [])
  // Mark results as stale when user edits any input after we have results
  useEffect(() => {
    const el = inputsAreaRef.current
    if (!el) return
    const markDirty = () => {
      // Defer comparison to the next tick so React has time to commit input state
      setTimeout(() => {
        if (isDispatching) return
        if (!programResults || programResults.length === 0) return
        // Any user edit after results are shown marks results as potentially stale.
        setResultsStale(true)
      }, 0)
    }
    el.addEventListener("input", markDirty, true)
    el.addEventListener("change", markDirty, true)
    return () => {
      el.removeEventListener("input", markDirty, true)
      el.removeEventListener("change", markDirty, true)
    }
  }, [isDispatching, programResults, lastCalculatedKey])
  // Also detect programmatic/default changes that don't emit input/change events
  useEffect(() => {
    if (!lastCalculatedKey) return
    if (isDispatching) return
    if (!programResults || programResults.length === 0) return
    try {
      const key = JSON.stringify(buildPayload())
      if (key !== lastCalculatedKey) setResultsStale(true)
    } catch {
      setResultsStale(true)
    }
  })

  // Load scenarios for a given loanId from query param
  useEffect(() => {
    const loanId = initialLoanId
    if (!loanId) {
      setScenariosList([])
      setSelectedScenarioId(undefined)
      return
    }
    // Ensure currentLoanId sticks to the page session when coming from pipeline
    setCurrentLoanId(loanId)
    ;(async () => {
      try {
        const res = await fetch(`/api/loans/${loanId}/scenarios`)
        if (!res.ok) return
        const json = (await res.json()) as { scenarios?: { id: string; name?: string; primary?: boolean; created_at?: string }[] }
        setScenariosList(json.scenarios ?? [])
        // Auto-select primary; else latest edited/created
        const primary = json.scenarios?.find((s) => s.primary)
        if (primary?.id) {
          setSelectedScenarioId(primary.id)
        } else if (json.scenarios && json.scenarios.length) {
          const latest = [...json.scenarios].sort((a, b) => {
            const da = new Date(a.created_at ?? 0).getTime()
            const db = new Date(b.created_at ?? 0).getTime()
            return db - da
          })[0]
          setSelectedScenarioId(latest?.id)
        } else {
          setSelectedScenarioId(undefined)
        }
      } catch {
        // ignore
      }
    })()
  }, [initialLoanId])

  // Helper setters from inputs payload
  function applyInputsPayload(payload: Record<string, unknown>) {
    // Prevent Google Places predictions from triggering while hydrating from Supabase
    suppressPredictionsRef.current = true
    const addr = (payload["address"] as Record<string, unknown>) ?? {}
    if ("street" in addr) setStreet(String(addr["street"] ?? ""))
    if ("apt" in addr) setApt(String(addr["apt"] ?? ""))
    if ("city" in addr) setCity(String(addr["city"] ?? ""))
    if ("state" in addr) setStateCode((addr["state"] as string) ?? undefined)
    if ("zip" in addr) setZip(String(addr["zip"] ?? ""))
    if ("county" in addr) setCounty(String(addr["county"] ?? ""))

    if ("loan_type" in payload) setLoanType((payload["loan_type"] as string) ?? undefined)
    if ("transaction_type" in payload) setTransactionType((payload["transaction_type"] as string) ?? undefined)
    if ("property_type" in payload) setPropertyType((payload["property_type"] as string) ?? undefined)
    if ("num_units" in payload) {
      const n = Number(payload["num_units"])
      if (Number.isFinite(n)) setNumUnits(n)
    }
    if ("max_leverage_requested" in payload) {
      const v = payload["max_leverage_requested"]
      setRequestMaxLeverage(v === "yes" || v === true)
    } else if ("request_max_leverage" in payload) {
      // backward compatibility with older payloads
      const v = payload["request_max_leverage"]
      setRequestMaxLeverage(v === "yes" || v === true)
    }

    if ("gla_sq_ft" in payload) setGlaSqFt(String(payload["gla_sq_ft"] ?? ""))
    if ("purchase_price" in payload) setPurchasePrice(String(payload["purchase_price"] ?? ""))
    if ("loan_amount" in payload) setLoanAmount(String(payload["loan_amount"] ?? ""))
    if ("admin_fee" in payload) setAdminFee(String(payload["admin_fee"] ?? ""))
    if ("payoff_amount" in payload) setPayoffAmount(String(payload["payoff_amount"] ?? ""))
    if ("aiv" in payload) setAiv(String(payload["aiv"] ?? ""))
    if ("arv" in payload) setArv(String(payload["arv"] ?? ""))
    if ("rehab_budget" in payload) setRehabBudget(String(payload["rehab_budget"] ?? ""))
    if ("rehab_holdback" in payload) setRehabHoldback(String(payload["rehab_holdback"] ?? ""))
    if ("emd" in payload) setEmd(String(payload["emd"] ?? ""))
    if ("taxes_annual" in payload) setAnnualTaxes(String(payload["taxes_annual"] ?? ""))
    if ("hoi_annual" in payload) setAnnualHoi(String(payload["hoi_annual"] ?? ""))
    if ("flood_annual" in payload) setAnnualFlood(String(payload["flood_annual"] ?? ""))
    if ("hoa_annual" in payload) setAnnualHoa(String(payload["hoa_annual"] ?? ""))
    if ("hoi_premium" in payload) setHoiPremium(String(payload["hoi_premium"] ?? ""))
    if ("flood_premium" in payload) setFloodPremium(String(payload["flood_premium"] ?? ""))
    if ("mortgage_debt" in payload) setMortgageDebtValue(String(payload["mortgage_debt"] ?? ""))
    if ("tax_escrow_months" in payload) setTaxEscrowMonths(String(payload["tax_escrow_months"] ?? ""))
    // Units (leased/gross/market) from scenario inputs
    const unitsFromPayload = (payload["units"] ?? payload["unit_data"]) as unknown
    if (Array.isArray(unitsFromPayload)) {
      const normalized = unitsFromPayload.map(
        (u: { leased?: "yes" | "no"; gross?: string | number | null; market?: string | number | null }) => ({
        leased: (u?.leased as "yes" | "no" | undefined) ?? undefined,
          gross: u?.gross != null ? String(u.gross) : "",
          market: u?.market != null ? String(u.market) : "",
        })
      )
      hydrateUnitsRef.current = normalized
      if (normalized.length > 0) {
        setNumUnits(normalized.length)
      }
    }

    if ("borrower_type" in payload) setBorrowerType((payload["borrower_type"] as string) ?? undefined)
    if ("citizenship" in payload) setCitizenship((payload["citizenship"] as string) ?? undefined)
    if ("fico" in payload) setFico(String(payload["fico"] ?? ""))
    if ("borrower_name" in payload) setBorrowerName(String(payload["borrower_name"] ?? ""))
    if ("guarantors" in payload && Array.isArray(payload["guarantors"])) {
      setGuarantorsStr((payload["guarantors"] as string[]).join(", "))
    }
    if ("uw_exception" in payload) setUwException((payload["uw_exception"] as string) ?? undefined)
    if ("section8" in payload) setSection8((payload["section8"] as string) ?? undefined)
    if ("lender_orig_percent" in payload) setLenderOrig(String(payload["lender_orig_percent"] ?? ""))
    if ("broker_orig_percent" in payload) setBrokerOrig(String(payload["broker_orig_percent"] ?? ""))
    if ("title_recording_fee" in payload) setTitleRecordingFee(String(payload["title_recording_fee"] ?? ""))
    if ("seller_concessions" in payload) setSellerConcessions(String(payload["seller_concessions"] ?? ""))

    function parseDate(val: unknown): Date | undefined {
      if (typeof val === "string" || typeof val === "number") {
        const d = new Date(val)
        return isNaN(d.getTime()) ? undefined : d
      }
      return undefined
    }
    const hoiEff = parseDate(payload["hoi_effective_date"])
    if (hoiEff) setHoiEffective(hoiEff)
    const floodEff = parseDate(payload["flood_effective_date"])
    if (floodEff) setFloodEffective(floodEff)

    if ("bridge_type" in payload) setBridgeType((payload["bridge_type"] as string) ?? undefined)
    if ("fthb" in payload) setFthb((payload["fthb"] as string) ?? undefined)
    if ("loan_structure_type" in payload) setLoanStructureType((payload["loan_structure_type"] as string) ?? undefined)
    if ("ppp" in payload) setPpp((payload["ppp"] as string) ?? undefined)
    if ("str" in payload) setStrValue((payload["str"] as string) ?? undefined)
    if ("declining_market" in payload) setDecliningMarket((payload["declining_market"] as string) ?? undefined)
    if ("rentals_owned" in payload) setRentalsOwned(String(payload["rentals_owned"] ?? ""))
    if ("num_flips" in payload) setNumFlips(String(payload["num_flips"] ?? ""))
    if ("num_gunc" in payload) setNumGunc(String(payload["num_gunc"] ?? ""))
    if ("other_exp" in payload) setOtherExp((payload["other_exp"] as string) ?? undefined)
    if ("warrantability" in payload) setWarrantability((payload["warrantability"] as string) ?? undefined)
  }

  // When scenario is selected, load inputs/selected and hydrate UI
  useEffect(() => {
    const sid = selectedScenarioId
    if (!sid) return
    ;(async () => {
      try {
        const res = await fetch(`/api/scenarios/${sid}`)
        if (!res.ok) return
        const json = (await res.json()) as { scenario?: { inputs?: Record<string, unknown>; selected?: Record<string, unknown> } }
        const inputs = json.scenario?.inputs ?? {}
        applyInputsPayload(inputs as Record<string, unknown>)
        const sel = (json.scenario?.selected ?? {}) as Record<string, unknown>
        // Normalize potential key variants saved previously
        const isBridgeSel =
          "total_loan_amount" in sel ||
          "initialLoanAmount" in sel ||
          "funded_pitia" in sel
        setSelectedMainRow({
          programIdx: (sel["program_index"] as number | undefined) ?? 0,
          rowIdx: (sel["row_index"] as number | undefined) ?? (sel["rowIndex"] as number | undefined) ?? 0,
          programName: (sel["program_name"] as string | undefined) ?? (sel["programName"] as string | undefined),
          programId: (sel["program_id"] as string | undefined) ?? (sel["programId"] as string | undefined),
          values: isBridgeSel
            ? {
                loanPrice: ((sel["loan_price"] ?? sel["loanPrice"]) as number | string | null) ?? null,
                interestRate: (sel["rate"] ?? sel["interestRate"]) as number | string | null,
                initialLoanAmount: (sel["initial_loan_amount"] ?? sel["initialLoanAmount"]) as number | string | null,
                rehabHoldback: (sel["rehab_holdback"] ?? sel["rehabHoldback"]) as number | string | null,
                loanAmount: (sel["total_loan_amount"] ?? sel["loanAmount"]) as number | string | null,
                pitia: (sel["funded_pitia"] ?? sel["pitia"]) as number | string | null,
                ltv: null,
                dscr: null,
              }
            : {
                loanPrice: ((sel["loan_price"] ?? sel["loanPrice"]) as number | string | null) ?? null,
                interestRate: (sel["rate"] ?? sel["interestRate"]) as number | string | null,
                loanAmount: (sel["loan_amount"] ?? sel["loanAmount"]) as number | string | null,
                ltv: sel["ltv"] as number | string | null,
                pitia: sel["pitia"] as number | string | null,
                dscr: sel["dscr"] as number | string | null,
              },
        })
      } catch {
        // ignore errors
      }
    })()
  }, [selectedScenarioId])

  // Fetch predictions as the user types, using our own UI
  useEffect(() => {
    if (!gmapsReady) return
    // Suppress one prediction fetch cycle right after a programmatic selection
    if (suppressPredictionsRef.current) {
      suppressPredictionsRef.current = false
      setPredictions([])
      setShowPredictions(false)
      return
    }
    const q = street.trim()
    if (!q) {
      setPredictions([])
      return
    }
    const places = getPlaces()
    if (!places) return
    const svc = new places.AutocompleteService()
    const req = {
      input: q,
      types: ["address"],
      componentRestrictions: { country: ["us"] },
      sessionToken: sessionTokenRef.current,
    }
    let cancelled = false
    svc.getPlacePredictions(req, (res: PlacePrediction[] | null, status: string) => {
      if (cancelled) return
      const ok = status === "OK" || status === "ZERO_RESULTS"
      if (!ok || !res) {
        setPredictions([])
        return
      }
      setPredictions(res)
      setShowPredictions(true)
      setActivePredictionIdx(-1)
    })
    return () => {
      cancelled = true
    }
  }, [street, gmapsReady])

  function applyPlaceById(placeId: string) {
    const places = getPlaces()
    if (!places) return
    const svc = new places.PlacesService(document.createElement("div"))
    const req = {
      placeId,
      fields: ["address_components", "formatted_address"],
      sessionToken: sessionTokenRef.current,
    }
    svc.getDetails(req, (place, status: string) => {
      const ok = status === "OK"
      if (!ok || !place) return
      type AddressComponent = { short_name?: string; long_name?: string; types?: string[] }
      const comps = (place?.address_components as AddressComponent[]) ?? []
      const get = (t: string) => comps.find((c: AddressComponent) => c.types?.includes(t))
      const streetNumber = get("street_number")?.short_name ?? ""
      const route = get("route")?.long_name ?? ""
      const locality = get("locality")?.long_name ?? get("sublocality")?.long_name ?? ""
      const admin1 = get("administrative_area_level_1")?.short_name ?? ""
      const postal = get("postal_code")?.short_name ?? ""
      const countyName = (get("administrative_area_level_2")?.long_name ?? "").replace(/ County$/i, "")

      setStreet([streetNumber, route].filter(Boolean).join(" "))
      setCity(locality)
      setStateCode(admin1 || undefined)
      setZip(postal)
      setCounty(countyName)
      setPredictions([])
      setShowPredictions(false)
      // Prevent the next input value change from reopening the menu immediately
      suppressPredictionsRef.current = true
      // New token after a selection, per session semantics
      sessionTokenRef.current = new places.AutocompleteSessionToken()
    })
  }

  return (
    <div data-layout="fixed" className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Pricing Engine</h2>
        {/* Mobile-only view switch: Inputs / Programs */}
        <div className="lg:hidden">
          <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as "inputs" | "programs")}>
            <TabsList className="grid h-8 grid-cols-2 p-[3px]">
              <TabsTrigger className="h-7 px-3" value="inputs">
                Inputs
              </TabsTrigger>
              <TabsTrigger className="h-7 px-3" value="programs">
                Programs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div ref={layoutRef} className="flex h-full min-h-0 flex-1 gap-0 overflow-hidden">
        {/* Left 25% column: scrollable container with header and footer */}
        <aside className={`${isMobile && mobileView === "programs" ? "hidden" : "block"} min-h-0 w-full lg:shrink-0`} style={isMobile ? undefined : { width: `${leftPanePct * 100}%` }}>
          <div className="flex h-full min-h-0 flex-col rounded-md border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto] items-end gap-2 border-b p-3 overflow-hidden">
              <div className="flex min-w-0 flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Scenarios
                </label>
                {isNamingScenario || isRenamingScenario ? (
                  <Input
                    ref={scenarioInputRef}
                    placeholder={isRenamingScenario ? "Rename scenario" : "Scenario name"}
                    value={isRenamingScenario ? renameDraft : scenarioName}
                    onChange={(e) => (isRenamingScenario ? setRenameDraft(e.target.value) : setScenarioName(e.target.value))}
                    onKeyDown={(e) => {
                      if (isRenamingScenario) {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const trimmed = renameDraft.trim()
                          if (trimmed && selectedScenarioId) {
                            setPendingScenarioName(trimmed)
                            setScenariosList((prev) => prev.map((s) => (s.id === selectedScenarioId ? { ...s, name: trimmed } : s)))
                          }
                          setIsRenamingScenario(false)
                        } else if (e.key === "Escape") {
                          e.preventDefault()
                          setIsRenamingScenario(false)
                          setRenameDraft("")
                        }
                      } else {
                        if (e.key === "Enter") {
                          handleConfirmSave()
                        } else if (e.key === "Escape") {
                          handleCancelSave()
                        }
                      }
                    }}
                    className="h-9 w-full"
                  />
                ) : (
                <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
                  <SelectTrigger disabled={scenariosList.length === 0} className="h-9 w-full">
                    <SelectValue placeholder={scenariosList.length === 0 ? "No scenarios" : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {scenariosList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex w-full items-center justify-between">
                          <span>{s.name ?? `Scenario ${new Date(s.created_at ?? "").toLocaleDateString()}`}</span>
                          {s.primary ? <IconStarFilled className="ml-2 h-3 w-3 text-yellow-500" /> : null}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {isNamingScenario || isRenamingScenario ? (
                  <>
                    {isRenamingScenario ? (
                      <>
                        <Button
                          aria-label="Confirm rename"
                          size="icon"
                          variant="secondary"
                          onClick={() => {
                            const trimmed = renameDraft.trim()
                            if (trimmed && selectedScenarioId) {
                              setPendingScenarioName(trimmed)
                              setScenariosList((prev) => prev.map((s) => (s.id === selectedScenarioId ? { ...s, name: trimmed } : s)))
                            }
                            setIsRenamingScenario(false)
                          }}
                        >
                          <IconCheck />
                        </Button>
                        <Button
                          aria-label="Cancel rename"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setIsRenamingScenario(false)
                            setRenameDraft("")
                          }}
                        >
                          <IconX />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button aria-label="Save Scenario" size="icon" variant="secondary" onClick={handleConfirmSave}>
                          <IconCheck />
                        </Button>
                        <Button aria-label="Cancel" size="icon" variant="outline" onClick={handleCancelSave}>
                          <IconX />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      aria-label="Toggle Primary"
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        if (!selectedScenarioId) return
                        try {
                          const res = await fetch(`/api/scenarios/${selectedScenarioId}/primary`, { method: "POST" })
                          if (!res.ok) return
                          setScenariosList((prev) =>
                            prev.map((s) => ({ ...s, primary: s.id === selectedScenarioId }))
                          )
                        } catch {
                          // ignore
                        }
                      }}
                      disabled={!selectedScenarioId}
                    >
                      {scenariosList.find((s) => s.id === selectedScenarioId)?.primary ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      aria-label="Rename"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (!selectedScenarioId) return
                        const name = scenariosList.find((s) => s.id === selectedScenarioId)?.name ?? ""
                        setRenameDraft(name)
                        setIsRenamingScenario(true)
                        setTimeout(() => scenarioInputRef.current?.focus(), 0)
                      }}
                      disabled={!selectedScenarioId}
                    >
                      <IconPencil />
                    </Button>
                    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                      <AlertDialogTrigger asChild>
                        <Button aria-label="Delete scenario" size="icon" variant="ghost" disabled={!selectedScenarioId}>
                          <IconTrash />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete scenario?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the scenario from this loan. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              if (!selectedScenarioId) return
                              try {
                                const res = await fetch(`/api/scenarios/${selectedScenarioId}`, { method: "DELETE" })
                                if (!res.ok) return
                                setScenariosList((prev) => prev.filter((s) => s.id !== selectedScenarioId))
                                setSelectedScenarioId(undefined)
                                setPendingScenarioName(undefined)
                                toast({ title: "Deleted", description: "Scenario removed." })
                              } catch {
                                toast({ title: "Delete failed", description: "Could not delete scenario.", variant: "destructive" })
                              }
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                <Button aria-label="Save" size="icon" variant="secondary" onClick={async () => {
                      try {
                        const inputs = buildPayload()
                        let selected = selectedMainRow?.values
                        if (!selected) {
                          const first = programResults?.[0]?.data
                          if (first) {
                            const hi = Number(first.highlight_display ?? 0)
                            const resp = first as ProgramResponseData
                            const isBridgeStyle =
                              Array.isArray(resp.total_loan_amount) ||
                              Array.isArray(resp.initial_loan_amount) ||
                              Array.isArray(resp.funded_pitia)
                            selected = isBridgeStyle
                              ? {
                                  loanPrice: pick<string | number>(resp.loan_price, hi) ?? null,
                                  interestRate: pick<string | number>(resp.interest_rate, hi) ?? null,
                                  initialLoanAmount: pick<string | number>(resp.initial_loan_amount, hi) ?? null,
                                  rehabHoldback: pick<string | number>(resp.rehab_holdback, hi) ?? null,
                                  loanAmount: pick<string | number>(resp.total_loan_amount, hi) ?? null,
                                  pitia: pick<string | number>(resp.funded_pitia, hi) ?? null,
                                  ltv: null,
                                  dscr: null,
                                }
                              : {
                                  loanPrice: pick<string | number>(resp.loan_price, hi) ?? null,
                                  interestRate: pick<string | number>(resp.interest_rate, hi) ?? null,
                                  loanAmount: (resp.loan_amount as string | number | null | undefined) ?? null,
                                  ltv: (resp.ltv as string | number | null | undefined) ?? null,
                                  pitia: pick<string | number>(resp.pitia, hi) ?? null,
                                  dscr: pick<string | number>(resp.dscr, hi) ?? null,
                                }
                          }
                        }
                        const nameOverride =
                          pendingScenarioName ?? scenariosList.find((s) => s.id === selectedScenarioId)?.name ?? undefined
                        if (!selectedScenarioId) {
                          // If no scenario selected, behave like Save As (create)
                          const res = await fetch("/api/pricing/scenario", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: nameOverride ?? "Scenario",
                              inputs,
                              selected: {
                                ...selected,
                                program_name:
                                  selectedMainRow?.programName ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.internal_name ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name,
                                program_id:
                                  selectedMainRow?.programId ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.internal_name ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name,
                                program_index: selectedMainRow?.programIdx ?? 0,
                                row_index: selectedMainRow?.rowIdx ?? 0,
                              },
                              loanId: currentLoanId,
                            }),
                          })
                          if (res.ok) {
                            const json = (await res.json().catch(() => ({}))) as { scenarioId?: string }
                            if (json?.scenarioId) {
                              setSelectedScenarioId(json.scenarioId)
                            }
                          }
                        } else {
                          // Update existing scenario (including rename if pending)
                          const res = await fetch(`/api/scenarios/${selectedScenarioId}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: nameOverride,
                              inputs,
                              selected: {
                                ...selected,
                                program_name:
                                  selectedMainRow?.programName ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.internal_name ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name,
                                program_id:
                                  selectedMainRow?.programId ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.internal_name ??
                                  programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name,
                                program_index: selectedMainRow?.programIdx ?? 0,
                                row_index: selectedMainRow?.rowIdx ?? 0,
                              },
                              loanId: currentLoanId,
                            }),
                          })
                          if (res.ok) {
                            setPendingScenarioName(undefined)
                            toast({ title: "Saved", description: "Scenario updated." })
                          } else {
                            const msg = await res.text().catch(() => "")
                            throw new Error(msg || "Save failed")
                          }
                        }
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Unknown error"
                        toast({ title: "Save failed", description: message, variant: "destructive" })
                      }
                    }}>
                  <IconDeviceFloppy />
                </Button>
                    <Button
                      aria-label="Save As"
                      size="icon"
                      variant="outline"
                      onClick={() => setIsNamingScenario(true)}
                    >
                  <IconFileExport />
                </Button>
                  </>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <div ref={inputsAreaRef} className="min-h-0 flex-1 overflow-auto p-3 pb-4">
              <Accordion
                type="multiple"
                defaultValue={[
                  "loan-details",
                  "borrowers",
                  "subject",
                  "loan-structure",
                  // include conditional sections so if rendered, they start opened
                  "experience",
                  "rehab-details",
                  "income",
                ]}
                className="w-full"
              >
                <AccordionItem value="loan-details" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Loan Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="loan-type">
                          Loan Type <span className="text-red-600">*</span>
                        </Label>
                        <Select value={loanType} onValueChange={setLoanType}>
                          <SelectTrigger id="loan-type" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dscr">DSCR</SelectItem>
                            <SelectItem value="bridge">Bridge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="transaction-type">
                          Transaction Type <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={transactionType}
                          onValueChange={setTransactionType}
                        >
                          <SelectTrigger id="transaction-type" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="delayed-purchase">Delayed Purchase</SelectItem>
                            <SelectItem value="rt-refi">Refinance Rate/Term</SelectItem>
                            <SelectItem value="co-refi">Refinance Cash Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {loanType === "bridge" && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="bridge-type">
                            Bridge Type <span className="text-red-600">*</span>
                          </Label>
                          <Select value={bridgeType} onValueChange={setBridgeType}>
                            <SelectTrigger id="bridge-type" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bridge">Bridge</SelectItem>
                              <SelectItem value="bridge-rehab">Bridge + Rehab</SelectItem>
                              <SelectItem value="ground-up">Ground Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                
                <AccordionItem value="borrowers" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Borrowers &amp; Guarantors
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="borrower-type">
                          Borrower Type <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={borrowerType}
                          onValueChange={(v) => {
                            setBorrowerType(v)
                            setTouched((t) => ({ ...t, borrowerType: true }))
                          }}
                        >
                          <SelectTrigger
                            id="borrower-type"
                            className={`h-9 w-full ${!touched.borrowerType && borrowerType === DEFAULTS.borrowerType ? "text-muted-foreground" : ""}`}
                          >
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entity">Entity</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="citizenship">
                          Citizenship <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={citizenship}
                          onValueChange={(v) => {
                            setCitizenship(v)
                            setTouched((t) => ({ ...t, citizenship: true }))
                          }}
                        >
                          <SelectTrigger
                            id="citizenship"
                            className={`h-9 w-full ${!touched.citizenship && citizenship === DEFAULTS.citizenship ? "text-muted-foreground" : ""}`}
                          >
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">U.S. Citizen</SelectItem>
                            <SelectItem value="pr">Permanent Resident</SelectItem>
                            <SelectItem value="npr">Non-Permanent Resident</SelectItem>
                            <SelectItem value="fn">Foreign National</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {loanType === "dscr" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="fthb">FTHB</Label>
                            <Select
                              value={fthb}
                              onValueChange={(v) => {
                                setFthb(v)
                                setTouched((t) => ({ ...t, fthb: true }))
                              }}
                            >
                              <SelectTrigger
                                id="fthb"
                                className={`h-9 w-full ${!touched.fthb && fthb === DEFAULTS.fthb ? "text-muted-foreground" : ""}`}
                              >
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="mortgage-debt">Mortgage Debt</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <CalcInput
                                id="mortgage-debt"
                                placeholder="0.00"
                                className={`pl-6 ${!touched.mortgageDebt && mortgageDebtValue === DEFAULTS.mortgageDebtValue ? "text-muted-foreground" : ""}`}
                                value={mortgageDebtValue}
                                onValueChange={(v) => {
                                  setMortgageDebtValue(v)
                                  setTouched((t) => ({ ...t, mortgageDebt: true }))
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="fico">
                          FICO Score{isFicoRequired ? <span className="text-red-600"> *</span> : null}
                        </Label>
                        <Input
                          id="fico"
                          type="number"
                          inputMode="numeric"
                          min={300}
                          max={850}
                          placeholder="700"
                          value={fico}
                          onChange={(e) => {
                            // Allow typing, but restrict to digits
                            const cleaned = e.target.value.replace(/[^0-9]/g, "")
                            setFico(cleaned)
                          }}
                          onBlur={() => {
                            // Clamp to 300–850 on blur
                            const n = Number(fico)
                            if (!Number.isFinite(n)) return
                            const clamped = Math.min(850, Math.max(300, Math.round(n)))
                            setFico(String(clamped))
                          }}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {loanType === "bridge" && (
                  <AccordionItem value="experience" className="border-b">
                    <AccordionTrigger className="text-left text-base font-bold italic">
                      Experience
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="rentals-owned">Rentals Owned</Label>
                          <Input
                            id="rentals-owned"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={rentalsOwned}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, "")
                              setRentalsOwned(digits)
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-flips"># of Flips</Label>
                          <Input
                            id="num-flips"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={numFlips}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, "")
                              setNumFlips(digits)
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-gunc"># of GUNC</Label>
                          <Input
                            id="num-gunc"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={numGunc}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, "")
                              setNumGunc(digits)
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="other-exp">Other</Label>
                          <Select value={otherExp} onValueChange={setOtherExp}>
                            <SelectTrigger id="other-exp" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="subject" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic hover:no-underline">
                    <div className="flex items-center gap-3 pr-6">
                      <span>Subject Property</span>
                      <Button size="sm" variant="secondary" className="ml-auto h-7 not-italic" asChild>
                        <span onClick={handleSendToReApi} aria-disabled={sendingReApi}>
                          {sendingReApi ? "Sending..." : "RE API"}
                        </span>
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <Label htmlFor="street">Street</Label>
                          <div className="relative">
                            <Input
                              id="street"
                              placeholder="123 Main St"
                              ref={streetInputRef}
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              onFocus={() => predictions.length && setShowPredictions(true)}
                              onKeyDown={(e) => {
                                if (!showPredictions || predictions.length === 0) return
                                if (e.key === "ArrowDown") {
                                  e.preventDefault()
                                  setActivePredictionIdx((idx) =>
                                    Math.min(idx + 1, predictions.length - 1),
                                  )
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault()
                                  setActivePredictionIdx((idx) => Math.max(idx - 1, 0))
                                } else if (e.key === "Enter") {
                                  if (activePredictionIdx >= 0) {
                                    e.preventDefault()
                                    const p = predictions[activePredictionIdx]
                                    applyPlaceById(p.place_id)
                                  }
                                } else if (e.key === "Escape") {
                                  setShowPredictions(false)
                                }
                              }}
                              onBlur={() => {
                                // If the blur was caused by clicking inside the menu, don't close yet
                                setTimeout(() => {
                                  if (!pointerInMenuRef.current) {
                                    setShowPredictions(false)
                                  }
                                }, 0)
                              }}
                              autoComplete="off"
                            />
                            {showPredictions && predictions.length > 0 && (
                              <div
                                ref={predictionsMenuRef}
                                className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-background shadow"
                                role="listbox"
                                onMouseDown={() => {
                                  // Mark that the pointer is interacting within the menu (used by onBlur)
                                  pointerInMenuRef.current = true
                                }}
                                onMouseUp={() => {
                                  // Reset after click completes
                                  pointerInMenuRef.current = false
                                }}
                              >
                                {predictions.map((p, idx) => (
                                  <button
                                    key={p.place_id}
                                    type="button"
                                    className={`flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-accent ${
                                      idx === activePredictionIdx ? "bg-accent" : ""
                                    }`}
                                    onMouseEnter={() => setActivePredictionIdx(idx)}
                                    onClick={() => {
                                      applyPlaceById(p.place_id)
                                    }}
                                  >
                                    <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="flex min-w-0 flex-col">
                                      <span className="truncate text-sm font-medium">
                                        {p.structured_formatting?.main_text ?? p.description}
                                      </span>
                                      <span className="truncate text-xs text-muted-foreground">
                                        {p.structured_formatting?.secondary_text ?? ""}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                                <div className="border-t px-2 py-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Powered by Google
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="apt">Apt #</Label>
                          <Input
                            id="apt"
                            placeholder="Unit/Apt"
                            value={apt}
                            onChange={(e) => setApt(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="state">
                            State <span className="text-red-600">*</span>
                          </Label>
                          <Select value={stateCode} onValueChange={setStateCode}>
                            <SelectTrigger id="state" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((st) => (
                                <SelectItem key={st} value={st}>
                                  {st}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="zip">Zip Code</Label>
                          <Input
                            id="zip"
                            inputMode="numeric"
                            maxLength={5}
                            pattern="[0-9]*"
                            placeholder="12345"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="county">County</Label>
                          <Input
                            id="county"
                            placeholder="County"
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                        <Label htmlFor="property-type">
                          Property Type <span className="text-red-600">*</span>
                        </Label>
                          <Select
                            value={propertyType}
                            onValueChange={(v) => {
                              clearReAuto("propertyType")
                              setPropertyType(v)
                            }}
                          >
                            <SelectTrigger id="property-type" className={`h-9 w-full ${reAuto.propertyType ? "border-2 border-amber-500/70" : ""}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="single">Single Family</SelectItem>
                              <SelectItem value="pud">Townhome/PUD</SelectItem>
                              <SelectItem value="condo">Condominium</SelectItem>
                              <SelectItem value="mf2_4">Multifamily 2-4 Units</SelectItem>
                              <SelectItem value="mf5_10">Multifamily 5-10 Units</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {propertyType === "condo" ? (
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="warrantability">Warrantability</Label>
                            <Select value={warrantability} onValueChange={setWarrantability}>
                              <SelectTrigger id="warrantability" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warrantable">Warrantable</SelectItem>
                                <SelectItem value="non-warrantable">Non-Warrantable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-units">Number of Units</Label>
                          <Select
                            disabled={unitOptions.length === 0}
                            value={numUnits ? String(numUnits) : undefined}
                            onValueChange={(v) => {
                              clearReAuto("numUnits")
                              setNumUnits(parseInt(v))
                            }}
                          >
                            <SelectTrigger id="num-units" className={`h-9 w-full ${reAuto.numUnits ? "border-2 border-amber-500/70" : ""}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOptions.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Label htmlFor="gla">GLA Sq Ft</Label>
                          <Input
                            id="gla"
                            inputMode="numeric"
                            placeholder="0"
                            value={glaSqFt}
                            onChange={(e) => {
                              clearReAuto("glaSqFt")
                              setGlaSqFt(e.target.value)
                            }}
                            className={`${reAuto.glaSqFt ? "border-2 border-amber-500/70" : ""}`}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="rural">Rural</Label>
                        <Select
                          value={rural}
                          onValueChange={(v) => {
                            setRural(v)
                            setTouched((t) => ({ ...t, rural: true }))
                          }}
                        >
                          <SelectTrigger
                            id="rural"
                            className={`h-9 w-full ${!touched.rural && rural === DEFAULTS.rural && !reAuto.rural ? "text-muted-foreground" : ""} ${reAuto.rural ? "border-2 border-amber-500/70" : ""}`}
                          >
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {loanType === "dscr" && (
                          <>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="str">STR</Label>
                            <Select
                              value={strValue}
                              onValueChange={(v) => {
                                setStrValue(v)
                                setTouched((t) => ({ ...t, strValue: true }))
                              }}
                            >
                              <SelectTrigger
                                id="str"
                                className={`h-9 w-full ${!touched.strValue && strValue === DEFAULTS.strValue ? "text-muted-foreground" : ""}`}
                              >
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="declining-market">Declining Market</Label>
                            <Select
                              value={decliningMarket}
                              onValueChange={(v) => {
                                setDecliningMarket(v)
                                setTouched((t) => ({ ...t, decliningMarket: true }))
                              }}
                            >
                              <SelectTrigger
                                id="declining-market"
                                className={`h-9 w-full ${!touched.decliningMarket && decliningMarket === DEFAULTS.decliningMarket ? "text-muted-foreground" : ""}`}
                              >
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {loanType === "bridge" &&
                  (bridgeType === "bridge-rehab" || bridgeType === "ground-up") && (
                    <AccordionItem value="rehab-details" className="border-b">
                      <AccordionTrigger className="text-left text-base font-bold italic">
                        Rehab Details
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="gla-expansion">{">20% GLA Expansion"}</Label>
                            <Select
                              value={glaExpansion}
                              onValueChange={(v) => {
                                setGlaExpansion(v)
                                setTouched((t) => ({ ...t, glaExpansion: true }))
                              }}
                            >
                              <SelectTrigger
                                id="gla-expansion"
                                className={`h-9 w-full ${!touched.glaExpansion && glaExpansion === DEFAULTS.glaExpansion ? "text-muted-foreground" : ""}`}
                              >
                                <SelectValue placeholder="No" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="change-of-use">Change of Use</Label>
                            <Select
                              value={changeOfUse}
                              onValueChange={(v) => {
                                setChangeOfUse(v)
                                setTouched((t) => ({ ...t, changeOfUse: true }))
                              }}
                            >
                              <SelectTrigger
                                id="change-of-use"
                                className={`h-9 w-full ${!touched.changeOfUse && changeOfUse === DEFAULTS.changeOfUse ? "text-muted-foreground" : ""}`}
                              >
                                <SelectValue placeholder="No" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="rehab-budget">Rehab Budget <span className="text-red-600">*</span></Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <CalcInput
                                id="rehab-budget"
                                placeholder="0.00"
                                className="pl-6"
                                value={rehabBudget}
                                onValueChange={setRehabBudget}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="arv">ARV <span className="text-red-600">*</span></Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <CalcInput
                                id="arv"
                                placeholder="0.00"
                                className="pl-6"
                                value={arv}
                                onValueChange={setArv}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                {loanType === "dscr" && (
                  <AccordionItem value="income" className="border-b">
                    <AccordionTrigger className="text-left text-base font-bold italic">
                      Income &amp; Expenses
                    </AccordionTrigger>
                    <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-taxes">
                          Annual Taxes <span className="text-red-600">*</span>
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-taxes"
                            placeholder="0.00"
                            className="pl-6"
                            value={annualTaxes}
                            highlighted={!!reAuto.annualTaxes}
                            onValueChange={(v) => {
                              clearReAuto("annualTaxes")
                              setAnnualTaxes(v)
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-hoi">
                          Annual HOI <span className="text-red-600">*</span>
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-hoi"
                            placeholder="0.00"
                            className={`pl-6`}
                            value={annualHoi}
                            onValueChange={setAnnualHoi}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-flood">Annual Flood</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-flood"
                            placeholder="0.00"
                            className={`pl-6 ${!touched.annualFlood && annualFlood === DEFAULTS.annualFlood ? "text-muted-foreground" : ""}`}
                            value={annualFlood}
                            onValueChange={(v) => {
                              setAnnualFlood(v)
                              setTouched((t) => ({ ...t, annualFlood: true }))
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-hoa">Annual HOA</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-hoa"
                            placeholder="0.00"
                            className={`pl-6 ${!touched.annualHoa && annualHoa === DEFAULTS.annualHoa ? "text-muted-foreground" : ""}`}
                            value={annualHoa}
                            onValueChange={(v) => {
                              setAnnualHoa(v)
                              setTouched((t) => ({ ...t, annualHoa: true }))
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-mgmt">Annual Management</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-mgmt"
                            placeholder="0.00"
                            className={`pl-6 ${!touched.annualMgmt && annualMgmt === DEFAULTS.annualMgmt ? "text-muted-foreground" : ""}`}
                            value={annualMgmt}
                            onValueChange={(v) => {
                              setAnnualMgmt(v)
                              setTouched((t) => ({ ...t, annualMgmt: true }))
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {(numUnits ?? 0) > 0 ? (
                        Array.from({ length: numUnits ?? 0 }, (_, idx) => idx).map((_, idx) => (
                          <div key={idx} className="grid grid-cols-[max-content_1fr_1fr_1fr] items-end gap-3">
                            <div className="self-center mt-6 text-sm font-medium">#{idx + 1}</div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`leased-${idx}`}>
                                Leased <span className="text-red-600">*</span>
                              </Label>
                              <Select
                                value={unitData[idx]?.leased}
                                onValueChange={(v: "yes" | "no") => {
                                  setUnitData((prev) => {
                                    const next = [...prev]
                                    next[idx] = { ...next[idx], leased: v }
                                    return next
                                  })
                                }}
                              >
                                <SelectTrigger id={`leased-${idx}`} className="h-9 w-full">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`gross-${idx}`}>
                                Gross Rent <span className="text-red-600">*</span>
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                              <CalcInput
                                  id={`gross-${idx}`}
                                  placeholder="0.00"
                                  className="pl-6 w-full"
                                value={unitData[idx]?.gross ?? ""}
                                onValueChange={(v) =>
                                    setUnitData((prev) => {
                                      const next = [...prev]
                                    next[idx] = { ...(next[idx] ?? {}), gross: v }
                                      return next
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`market-${idx}`}>
                                Market Rent <span className="text-red-600">*</span>
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                              <CalcInput
                                  id={`market-${idx}`}
                                  placeholder="0.00"
                                  className="pl-6 w-full"
                                value={unitData[idx]?.market ?? ""}
                                onValueChange={(v) =>
                                    setUnitData((prev) => {
                                      const next = [...prev]
                                    next[idx] = { ...(next[idx] ?? {}), market: v }
                                      return next
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          Select Property Type and Number of Units to add unit rows.
                        </div>
                      )}
                    </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="loan-structure" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Loan Structure
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                          <Label htmlFor="proj-close">Projected Closing Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateInput
                              value={closingDate}
                              onChange={(d) => {
                                setClosingDate(d)
                                setTouched((t) => ({ ...t, closingDate: true }))
                              }}
                              className={`${!touched.closingDate && closingDate && _isSameDay(closingDate, DEFAULTS.closingDate) ? "text-muted-foreground" : ""}`}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={closingDate}
                              month={closingCalMonth}
                              onMonthChange={setClosingCalMonth}
                              onSelect={(d) => d && setClosingDate(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {transactionType !== "purchase" ? (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="acq-date">Acquisition Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <DateInput
                                value={acquisitionDate}
                                onChange={(d) => {
                                  clearReAuto("acquisitionDate")
                                  setAcquisitionDate(d)
                                }}
                                className={`${reAuto.acquisitionDate ? "border-2 border-amber-500/70" : ""}`}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={acquisitionDate}
                                month={acqCalMonth}
                                onMonthChange={setAcqCalMonth}
                                onSelect={(d) => d && setAcquisitionDate(d)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : null}
                      {loanType === "dscr" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="loan-structure-type">
                              Loan Structure <span className="text-red-600">*</span>
                            </Label>
                            <Select
                              value={loanStructureType}
                              onValueChange={(v) => {
                                setLoanStructureType(v)
                                setTouched((t) => ({ ...t, loanStructureType: true }))
                              }}
                            >
                              <SelectTrigger
                                id="loan-structure-type"
                                className={`h-9 w-full ${!touched.loanStructureType && loanStructureType === DEFAULTS.loanStructureType ? "text-muted-foreground" : ""}`}
                              >
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed-30">30 Year Fixed</SelectItem>
                                <SelectItem value="io">Interest Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="ppp">
                              PPP <span className="text-red-600">*</span>
                            </Label>
                            <Select
                              value={ppp}
                              onValueChange={(v) => {
                                setPpp(v)
                                setTouched((t) => ({ ...t, ppp: true }))
                              }}
                            >
                              <SelectTrigger
                                id="ppp"
                                className={`h-9 w-full ${!touched.ppp && ppp === DEFAULTS.ppp ? "text-muted-foreground" : ""}`}
                              >
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5-4-3-2-1">5-4-3-2-1</SelectItem>
                                <SelectItem value="3-2-1">3-2-1</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {loanType === "bridge" && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="term">
                            Term <span className="text-red-600">*</span>
                          </Label>
                          <Select
                            value={term}
                            onValueChange={(v) => {
                              setTerm(v)
                              setTouched((t) => ({ ...t, term: true }))
                            }}
                          >
                            <SelectTrigger id="term" className={`h-9 w-full ${!touched.term && term === "12" ? "text-muted-foreground" : ""}`}>
                              <SelectValue placeholder="12 months" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12 months</SelectItem>
                              <SelectItem value="15">15 months</SelectItem>
                              <SelectItem value="18">18 months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="purchase-price">
                          Purchase Price
                          {isPurchase ? <span className="text-red-600"> *</span> : null}
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="purchase-price"
                            placeholder="0.00"
                            className="pl-6"
                            value={purchasePrice}
                            highlighted={!!reAuto.purchasePrice}
                            onValueChange={(v) => {
                              clearReAuto("purchasePrice")
                              setPurchasePrice(v)
                            }}
                          />
                        </div>
                      </div>
                      {transactionType !== "purchase" ? (
                        <>
                          {loanType === "dscr" && (
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="rehab-completed">Rehab Completed</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <CalcInput
                                  id="rehab-completed"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={rehabCompleted}
                                  onValueChange={setRehabCompleted}
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="payoff-amount">Payoff Amount</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <CalcInput
                                id="payoff-amount"
                                placeholder="0.00"
                                className="pl-6"
                                value={payoffAmount}
                                onValueChange={setPayoffAmount}
                              />
                            </div>
                          </div>
                        </>
                      ) : null}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="aiv">
                          AIV<span className="text-red-600"> *</span>
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="aiv"
                            placeholder="0.00"
                            className="pl-6"
                            value={aiv}
                            onValueChange={setAiv}
                            required
                            aria-required="true"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="max-lev">Request Max Leverage</Label>
                        <div className="flex h-9 items-center">
                          <Switch
                            id="max-lev"
                            checked={requestMaxLeverage}
                            onCheckedChange={setRequestMaxLeverage}
                          />
                        </div>
                      </div>
                      {!requestMaxLeverage ? (
                        loanType === "bridge" &&
                        (bridgeType === "bridge-rehab" || bridgeType === "ground-up") ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="initial-loan-amount">
                                Initial Loan Amount <span className="text-red-600">*</span>
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <CalcInput
                                  id="initial-loan-amount"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={initialLoanAmount}
                                  onValueChange={setInitialLoanAmount}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="rehab-holdback">Rehab Holdback</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <CalcInput
                                  id="rehab-holdback"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={rehabHoldback}
                                  onValueChange={setRehabHoldback}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="total-loan-amount">Total Loan Amount</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id="total-loan-amount"
                                  readOnly
                                  value={(() => {
                                    const toNum = (v: string | number | undefined) =>
                                      Number(String(v ?? "0").toString().replace(/[^0-9.-]/g, "")) || 0
                                    const a = toNum(initialLoanAmount)
                                    const b = toNum(rehabHoldback)
                                    const total = a + b
                                    return total.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  })()}
                                  className="pl-6"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="loan-amount">
                              Loan Amount <span className="text-red-600">*</span>
                            </Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <CalcInput
                                id="loan-amount"
                                placeholder="0.00"
                                className="pl-6"
                                value={loanAmount}
                                onValueChange={setLoanAmount}
                              />
                            </div>
                          </div>
                        )
                      ) : null}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="lender-orig">Lender Origination</Label>
                        <div className="relative">
                          <Input id="lender-orig" inputMode="decimal" placeholder="0.00" className="pr-6" value={lenderOrig} onChange={(e)=>setLenderOrig(e.target.value)} />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="admin-fee">Admin Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="admin-fee"
                            placeholder="0.00"
                            className="pl-6"
                            value={adminFee}
                            onValueChange={setAdminFee}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="broker-orig">Broker Origination</Label>
                        <div className="relative">
                          <Input id="broker-orig" inputMode="decimal" placeholder="0.00" className="pr-6" value={brokerOrig} onChange={(e)=>setBrokerOrig(e.target.value)} />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="additional-details" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Additional Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="borrower-name">Borrower Name</Label>
                        <Input
                          id="borrower-name"
                          placeholder="Name"
                          value={borrowerName}
                          onChange={(e) => {
                            setBorrowerName(e.target.value)
                            setTouched((t) => ({ ...t, borrowerName: true }))
                          }}
                          className={`${!touched.borrowerName && borrowerName === DEFAULTS.borrowerName ? "text-muted-foreground" : ""}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="guarantors">Guarantor(s)</Label>
                        <Input
                          id="guarantors"
                          placeholder="Names separated by comma"
                          value={guarantorsStr}
                          onChange={(e) => {
                            setGuarantorsStr(e.target.value)
                            setTouched((t) => ({ ...t, guarantorsStr: true }))
                          }}
                          className={`${!touched.guarantorsStr && guarantorsStr === DEFAULTS.guarantorsStr ? "text-muted-foreground" : ""}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="uw-exception">UW Exception</Label>
                        <Select
                          value={uwException}
                          onValueChange={(v) => {
                            setUwException(v)
                            setTouched((t) => ({ ...t, uwException: true }))
                          }}
                        >
                          <SelectTrigger
                            id="uw-exception"
                            className={`h-9 w-full ${!touched.uwException && uwException === DEFAULTS.uwException ? "text-muted-foreground" : ""}`}
                          >
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {isDscr && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="section-8">Section 8</Label>
                          <Select
                            value={section8}
                            onValueChange={(v) => {
                              setSection8(v)
                              setTouched((t) => ({ ...t, section8: true }))
                            }}
                          >
                            <SelectTrigger
                              id="section-8"
                              className={`h-9 w-full ${!touched.section8 && section8 === DEFAULTS.section8 ? "text-muted-foreground" : ""}`}
                            >
                              <SelectValue
                                placeholder="No"
                                className={`${!touched.section8 && section8 === DEFAULTS.section8 ? "text-muted-foreground" : ""}`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="hoi-effective">HOI Effective</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateInput
                              value={hoiEffective}
                              onChange={(d) => {
                                setHoiEffective(d)
                                setTouched((t) => ({ ...t, hoiEffective: true }))
                              }}
                              className={`${!touched.hoiEffective && hoiEffective && _isSameDay(hoiEffective, DEFAULTS.hoiEffective) ? "text-muted-foreground" : ""}`}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={hoiEffective}
                              month={hoiCalMonth}
                              onMonthChange={setHoiCalMonth}
                              onSelect={(d) => d && setHoiEffective(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="flood-effective">Flood Effective</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateInput
                              value={floodEffective}
                              onChange={(d) => {
                                setFloodEffective(d)
                                setTouched((t) => ({ ...t, floodEffective: true }))
                              }}
                              className={`${!touched.floodEffective && floodEffective && _isSameDay(floodEffective, DEFAULTS.floodEffective) ? "text-muted-foreground" : ""}`}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={floodEffective}
                              month={floodCalMonth}
                              onMonthChange={setFloodCalMonth}
                              onSelect={(d) => d && setFloodEffective(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="title-recording">Title &amp; Recording Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="title-recording"
                            placeholder={computedTitleRecording || "0.00"}
                            className={`pl-6 ${!touched.titleRecordingFee && titleRecordingFee === computedTitleRecording ? "text-muted-foreground" : ""}`}
                            value={titleRecordingFee}
                            onValueChange={(v) => {
                              setTitleRecordingFee(v)
                              setTouched((t) => ({ ...t, titleRecordingFee: true }))
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="assignment-fee">Assignment Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="assignment-fee"
                            placeholder="0.00"
                            className="pl-6"
                            value={assignmentFee}
                            onValueChange={setAssignmentFee}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="seller-concessions">Seller Concessions</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="seller-concessions"
                            placeholder="0.00"
                            className="pl-6"
                            value={sellerConcessions}
                            onValueChange={setSellerConcessions}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="tax-escrow">Tax Escrow (months)</Label>
                        <Input
                          id="tax-escrow"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={taxEscrowMonths}
                          onChange={(e) => {
                            setTaxEscrowMonths(e.target.value)
                            setTouched((t) => ({ ...t, taxEscrowMonths: true }))
                          }}
                          className={`${!touched.taxEscrowMonths && taxEscrowMonths === (loanType === "bridge" ? "0" : DEFAULTS.taxEscrowMonths) ? "text-muted-foreground" : ""}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="hoi-premium">HOI Premium</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="hoi-premium"
                            placeholder="0.00"
                            className="pl-6"
                            value={hoiPremium}
                            onValueChange={setHoiPremium}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="flood-premium">Flood Premium</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="flood-premium"
                            placeholder="0.00"
                            className="pl-6"
                            value={floodPremium}
                            onValueChange={setFloodPremium}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="emd">EMD</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="emd"
                            placeholder="0.00"
                            className="pl-6"
                            value={emd}
                            onValueChange={setEmd}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Footer */}
            <div className="border-t p-3">
              <div className="flex justify-end">
                <Button onClick={handleCalculate} disabled={!canCalculate || isDispatching}>
                  Calculate
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Drag handle (desktop only) */}
        <div className="relative hidden h-full items-stretch lg:flex">
          <button
            type="button"
            aria-label="Resize panels"
            className={`flex h-full w-3 cursor-col-resize items-center justify-center hover:bg-accent ${isResizing ? "bg-accent" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
          >
            <IconGripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Right column: results display (flexes to remaining space) */}
        <section className={`${isMobile && mobileView === "programs" ? "block" : "hidden"} h-full min-h-0 flex-1 overflow-auto rounded-md border p-3 pb-4 lg:block`}>
          {resultsStale && !isDispatching ? (
            <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
              Terms may be outdated based on recent input changes. Please recalculate to update results.
            </div>
          ) : null}
          <ResultsPanel
            results={programResults}
            loading={isDispatching}
            placeholders={programPlaceholders}
            onSelectedChange={setSelectedMainRow}
            selectedFromProps={selectedMainRow}
            getInputs={() => buildPayload()}
          />
        </section>
      </div>
    </div>
  )
}


// ---------- Results UI ----------
import * as React from "react"
type ProgramResponseData = {
  pass?: boolean
  highlight_display?: number
  loan_price?: (number | string)[]
  interest_rate?: (number | string)[]
  loan_amount?: string
  ltv?: string
  pitia?: (number | string)[]
  dscr?: (number | string)[]
  validations?: (string | null | undefined)[]
  // Bridge payload variants
  initial_loan_amount?: (string | number)[]
  rehab_holdback?: (string | number)[]
  total_loan_amount?: (string | number)[]
  initial_pitia?: (string | number)[]
  funded_pitia?: (string | number)[]
  [key: string]: unknown
}
type ProgramResult = {
  internal_name?: string
  external_name?: string
  webhook_url?: string
  status?: number
  ok?: boolean
  data?: ProgramResponseData | null
}

type SelectedRow = {
  programIdx: number
  rowIdx: number
  programName?: string | null
  programId?: string | null
  values: {
    loanPrice?: number | string | null
    interestRate?: number | string | null
    loanAmount?: string | number | null
    ltv?: string | number | null
    pitia?: number | string | null
    dscr?: number | string | null
    initialLoanAmount?: string | number | null
    rehabHoldback?: string | number | null
  }
}

function pick<T>(arr: T[] | undefined, idx: number): T | undefined {
  if (!Array.isArray(arr)) return undefined
  if (idx < 0 || idx >= arr.length) return undefined
  return arr[idx]
}

function ResultCard({
  r,
  programIdx,
  selected,
  onSelect,
  getInputs,
}: {
  r: ProgramResult
  programIdx: number
  selected: SelectedRow | null
  onSelect: (sel: SelectedRow) => void
  getInputs?: () => Record<string, unknown>
}) {
  // Hooks must be called unconditionally at the top of the component.
  const [mcpOpen, setMcpOpen] = useState<boolean>(false)
  const [sheetProps, setSheetProps] = useState<DSCRTermSheetProps>({})
  const previewRef = useRef<HTMLDivElement | null>(null)
  // If this program hasn't returned yet, keep showing the generating loader inside the same container.
  if (!r?.data) {
    return <ResultCardLoader meta={{ internal_name: r?.internal_name, external_name: r?.external_name }} />
  }
  const d = (r?.data ?? {}) as ProgramResponseData
  const pass = d?.pass === true
  const hi = Number(d?.highlight_display ?? 0)
  // Detect bridge-style response vs DSCR
  const isBridgeResp =
    Array.isArray(d?.total_loan_amount) ||
    Array.isArray(d?.initial_loan_amount) ||
    Array.isArray(d?.funded_pitia)
  // Also detect Bridge by program name to be robust
  const programName = (r?.internal_name ?? r?.external_name ?? "") as string
  const isBridgeProgramName = String(programName).toLowerCase().includes("bridge")
  // Program card widgets should always reflect the original highlight index from the API.
  const loanPrice = pick<string | number>(d?.loan_price, hi)
  const rate = pick<string | number>(d?.interest_rate, hi)
  const pitia = isBridgeResp ? pick<string | number>(d?.funded_pitia, hi) : pick<string | number>(d?.pitia, hi)
  const dscr = isBridgeResp ? undefined : pick<string | number>(d?.dscr, hi)
  const loanAmount = isBridgeResp ? pick<string | number>(d?.total_loan_amount, hi) : d?.loan_amount
  const ltv = d?.ltv
  const TERMSHEET_WEBHOOK = "https://n8n.axora.info/webhook/a108a42d-e071-4f84-a557-2cd72e440c83"
  const validationList: string[] = Array.isArray(d.validations)
    ? (d.validations as (string | null | undefined)[])
        .filter((v) => typeof v === "string" && String(v).trim().length > 0)
        .map((v) => String(v))
    : []

  const toYesNoDeep = (value: unknown): unknown => {
    if (typeof value === "boolean") return value ? "yes" : "no"
    if (Array.isArray(value)) return value.map((v) => toYesNoDeep(v))
    if (value && typeof value === "object") {
      const src = value as Record<string, unknown>
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(src)) {
        out[k] = toYesNoDeep(v)
      }
      return out
    }
    return value
  }

  async function openTermSheetPreview(rowIndex?: number) {
    try {
      // Open modal immediately with loader while webhook response is fetched
      setSheetProps({} as DSCRTermSheetProps)
      setMcpOpen(true)

      const rawInputs = (typeof getInputs === "function" ? getInputs() : {}) as Record<string, unknown>
      const idx = rowIndex ?? Number(d?.highlight_display ?? 0)
      const payloadRow: Record<string, unknown> = {
        loan_price: pick<string | number>(d?.loan_price, idx),
        interest_rate: pick<string | number>(d?.interest_rate, idx),
      }
      if (isBridgeResp) {
        payloadRow["initial_loan_amount"] = pick<string | number>(d?.initial_loan_amount, idx)
        payloadRow["rehab_holdback"] = pick<string | number>(d?.rehab_holdback, idx)
        payloadRow["total_loan_amount"] = pick<string | number>(d?.total_loan_amount, idx)
        payloadRow["funded_pitia"] = pick<string | number>(d?.funded_pitia, idx)
      } else {
        payloadRow["loan_amount"] = loanAmount
        payloadRow["ltv"] = ltv
        payloadRow["pitia"] = pick<string | number>(d?.pitia, idx)
        payloadRow["dscr"] = pick<string | number>(d?.dscr, idx)
      }
      const inputs = toYesNoDeep(rawInputs) as Record<string, unknown>
      const normalizedRow = toYesNoDeep(payloadRow) as Record<string, unknown>
      const body = {
        program: r.internal_name ?? r.external_name ?? "Program",
        program_id: r.internal_name ?? r.external_name ?? null,
        row_index: idx,
        inputs,
        row: normalizedRow,
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const res = await fetch(`${TERMSHEET_WEBHOOK}?_=${encodeURIComponent(nonce)}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "X-Client-Request-Id": nonce,
        },
        body: JSON.stringify(body),
      })
      const raw = await res.json().catch(() => ({}))
      const json = Array.isArray(raw) ? (raw[0] as DSCRTermSheetProps) : (raw as DSCRTermSheetProps)
      const enriched =
        json && typeof json === "object" && !Array.isArray(json)
          ? ({ loan_type: (isBridgeResp || isBridgeProgramName) ? "bridge" : "dscr", ...json } as DSCRTermSheetProps)
          : ({ loan_type: (isBridgeResp || isBridgeProgramName) ? "bridge" : "dscr" } as DSCRTermSheetProps)
      setSheetProps(enriched)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load term sheet"
      toast({ title: "Preview failed", description: message, variant: "destructive" })
    }
  }

  return (
    <div className="mb-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">
            {r.internal_name ?? "Program"}
          </div>
          <div className="text-xs font-semibold">{r.external_name}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Preview"
            onClick={() => openTermSheetPreview()}
          >
            <IconEye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Download">
            <IconDownload className="h-4 w-4" />
          </Button>
          <div
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
            pass
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
          }`}
          >
            {pass ? "PASS" : "FAIL"}
          </div>
        </div>
      </div>

      {pass ? (
        isBridgeResp ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Widget label="Loan Price" value={loanPrice} />
            <Widget label="Interest Rate" value={rate} />
            <Widget label="Initial Loan Amount" value={pick<string | number>(d?.initial_loan_amount, hi)} />
            <Widget label="Rehab Holdback" value={pick<string | number>(d?.rehab_holdback, hi)} />
            <Widget label="Total Loan Amount" value={loanAmount} />
            <Widget label="Funded PITIA" value={pitia} />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Widget label="Loan Price" value={loanPrice} />
            <Widget label="Interest Rate" value={rate} />
            <Widget label="Loan Amount" value={loanAmount} />
            <Widget label="LTV" value={ltv} />
            <Widget label="PITIA" value={pitia} />
            <Widget label="DSCR" value={dscr} />
          </div>
        )
      ) : null}

      {/* Details */}
      <Accordion type="single" collapsible className="mt-2">
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm">Details</AccordionTrigger>
          <AccordionContent>
            {!pass ? (
              validationList.length ? (
                <ol className="list-decimal pl-4 text-sm space-y-1">
                  {validationList.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ol>
              ) : null
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                  <thead className="border-b">
                    <tr>
                      <th className="py-1 pr-3 w-8 text-left"></th>
                      <th className="py-1 pr-3">Loan Price</th>
                      <th className="py-1 pr-3">Interest Rate</th>
                      {isBridgeResp ? (
                        <>
                          <th className="py-1 pr-3">Initial Loan</th>
                          <th className="py-1 pr-3">Holdback</th>
                          <th className="py-1 pr-3">Total Loan</th>
                          <th className="py-1 pr-3">Funded PITIA</th>
                        </>
                      ) : (
                        <>
                          <th className="py-1 pr-3">Loan Amount</th>
                          <th className="py-1 pr-3">LTV</th>
                          <th className="py-1 pr-3">PITIA</th>
                          <th className="py-1 pr-3">DSCR</th>
                        </>
                      )}
                      <th className="py-1 pr-3 w-14 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(d?.loan_price) &&
                      d.loan_price
                        .map((lp: unknown, i: number) => ({ lp, i }))
                        .filter(({ lp }) => {
                          if (lp === null || lp === undefined) return false
                          const s = String(lp).trim()
                          if (s.length === 0) return false
                          const n = Number(s)
                          return Number.isFinite(n) || s.length > 0
                        })
                        .map(({ lp, i }) => (
                          <tr
                            key={i}
                            className={`border-b last:border-0 ${selected?.programIdx === programIdx && selected?.rowIdx === i ? "bg-accent/30" : ""}`}
                          >
                            <td className="py-1 pr-3 text-left">
                              <button
                                type="button"
                                aria-label="Select row"
                                className="inline-flex h-6 w-6 items-center justify-center text-yellow-500"
                                onClick={() =>
                                  onSelect({
                                    programIdx,
                                    rowIdx: i,
                                    programName: r.internal_name ?? r.external_name ?? `Program ${programIdx + 1}`,
                                    programId: r.internal_name ?? r.external_name ?? null,
                                    values: {
                                      loanPrice: typeof lp === "number" ? lp : String(lp),
                                      interestRate: Array.isArray(d?.interest_rate) ? d.interest_rate[i] : undefined,
                                      loanAmount: isBridgeResp
                                        ? (Array.isArray(d?.total_loan_amount) ? d.total_loan_amount[i] : undefined)
                                        : (loanAmount ?? undefined),
                                      initialLoanAmount: isBridgeResp
                                        ? (Array.isArray(d?.initial_loan_amount) ? d.initial_loan_amount[i] : undefined)
                                        : undefined,
                                      rehabHoldback: isBridgeResp
                                        ? (Array.isArray(d?.rehab_holdback) ? d.rehab_holdback[i] : undefined)
                                        : undefined,
                                      ltv: isBridgeResp ? undefined : (ltv ?? undefined),
                                      pitia: isBridgeResp
                                        ? (Array.isArray(d?.funded_pitia) ? d.funded_pitia[i] : undefined)
                                        : (Array.isArray(d?.pitia) ? d.pitia[i] : undefined),
                                      dscr: isBridgeResp ? undefined : (Array.isArray(d?.dscr) ? d.dscr[i] : undefined),
                                    },
                                  })
                                }
                              >
                                {selected?.programIdx === programIdx && selected?.rowIdx === i ? (
                                  <IconStarFilled className="h-5 w-5" />
                                ) : (
                                  <IconStar className="h-5 w-5" />
                                )}
                              </button>
                            </td>
                            <td className="py-1 pr-3 text-center">{typeof lp === "number" ? lp : String(lp)}</td>
                            <td className="py-1 pr-3 text-center">{Array.isArray(d?.interest_rate) ? d.interest_rate[i] : ""}</td>
                            {isBridgeResp ? (
                              <>
                                <td className="py-1 pr-3 text-center">{Array.isArray(d?.initial_loan_amount) ? d.initial_loan_amount[i] : ""}</td>
                                <td className="py-1 pr-3 text-center">{Array.isArray(d?.rehab_holdback) ? d.rehab_holdback[i] : ""}</td>
                                <td className="py-1 pr-3 text-center">{Array.isArray(d?.total_loan_amount) ? d.total_loan_amount[i] : ""}</td>
                                <td className="py-1 pr-3 text-center">{Array.isArray(d?.funded_pitia) ? d.funded_pitia[i] : ""}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-1 pr-3 text-center">{loanAmount ?? ""}</td>
                                <td className="py-1 pr-3 text-center">{ltv ?? ""}</td>
                                <td className="py-1 pr-3 text-center">{Array.isArray(d?.pitia) ? d.pitia[i] : ""}</td>
                                <td className="py-1 pr-3 text-center">{Array.isArray(d?.dscr) ? d.dscr[i] : ""}</td>
                              </>
                            )}
                            <td className="py-1 pr-3 text-left">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Preview row"
                                  onClick={() => openTermSheetPreview(i)}
                                >
                                  <IconEye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" aria-label="Download row">
                                  <IconDownload className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Dialog open={mcpOpen} onOpenChange={setMcpOpen}>
        <DialogContent className="sm:max-w-[min(860px,calc(100vw-2rem))] max-h-[90vh] px-4 pt-1 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95dvh] max-sm:px-3 max-sm:pt-0.5 max-sm:pb-2">
          <DialogHeader>
            <DialogTitle>Term Sheet</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            aria-label="Download term sheet"
            className="absolute top-4 right-12 rounded-xs opacity-70 transition-opacity hover:opacity-100 ring-offset-background focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none border-0 bg-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            onClick={() => {
              try {
                const node = previewRef.current as HTMLElement | null
                if (!node) return
                const root = node.querySelector('[data-termsheet-root]') as HTMLElement | null
                const htmlInside = (root ?? node).outerHTML
                // Capture current styles (Tailwind + globals) so printed output matches on-screen
                const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                  .map((el) => (el as HTMLElement).outerHTML)
                  .join("\n")
                const htmlClass = document.documentElement.className || ""
                const bodyClass = document.body.className || ""
                const htmlAttrs = Array.from(document.documentElement.attributes)
                  .map((a) => `${a.name}="${a.value}"`)
                  .join(" ")
                const doc = `<!doctype html>
<html class="${htmlClass}" ${htmlAttrs}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${location.origin}">
    <title>Term Sheet</title>
    ${headStyles}
    <style>
      html, body { margin: 0; padding: 0; background: #fff; }
      /* Render exactly one Letter page at 816x1056 and center it */
      #page { width: 816px; height: 1056px; margin: 0 auto; box-sizing: border-box; overflow: hidden; display: block; }
      #page > .reset { width: 816px !important; height: 1056px !important; transform: none !important; transform-origin: top left !important; margin: 0 !important; }
      #inner { width: 816px; height: 1056px; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
      #inner [data-termsheet-root] { width: 816px !important; height: auto !important; transform: scale(0.90); transform-origin: center center; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      /* Hide on-screen edit affordances inside print */
      .ts-edit { border-color: transparent !important; background: transparent !important; outline: none !important; }
      @page { size: 816px 1056px; margin: 0; }
      @media print {
        html, body { width: 816px; height: 1056px; overflow: hidden; }
        /* Remove border in the PDF to avoid a heavy black line at the bottom edge */
        #page { box-shadow: none; border: none; }
      }
    </style>
  </head>
  <body class="${bodyClass}">
    <div id="page"><div class="reset"><div id="inner">${htmlInside}</div></div></div>
  </body>
</html>`
                const iframe = document.createElement("iframe")
                iframe.style.position = "fixed"
                iframe.style.right = "0"
                iframe.style.bottom = "0"
                iframe.style.width = "0"
                iframe.style.height = "0"
                iframe.style.border = "0"
                iframe.setAttribute("srcdoc", doc)
                document.body.appendChild(iframe)
                iframe.onload = () => {
                  try {
                    // No runtime scaling; content is rendered at exact 816x1056 canvas
                    iframe.contentWindow?.focus()
                    // Wait one frame so layout recalculates at the new scale
                    setTimeout(() => iframe.contentWindow?.print(), 50)
                  } finally {
                    setTimeout(() => document.body.removeChild(iframe), 500)
                  }
                }
              } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error"
                toast({ title: "Download failed", description: message, variant: "destructive" })
              }
            }}
          >
            <IconDownload />
          </button>
          <div className="space-y-3">
            {Object.keys(sheetProps ?? {}).length ? (
              <ScaledTermSheetPreview
                sheetProps={sheetProps as DSCRTermSheetProps}
                pageRef={previewRef}
                forceLoanType={(isBridgeResp || isBridgeProgramName) ? "bridge" : undefined}
              />
            ) : (
              <div className="flex h-[70vh] items-center justify-center">
                <div className="text-sm text-muted-foreground">Preparing term sheet…</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Widget({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value ?? ""}</div>
    </div>
  )
}

function ResultCardLoader({ meta }: { meta?: { internal_name?: string; external_name?: string } }) {
  return (
    <div className="mb-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">{meta?.internal_name ?? "Program"}</div>
          <div className="text-xs font-semibold">{meta?.external_name ?? ""}</div>
        </div>
        <div className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Generating</div>
      </div>
      <div className="mt-3 flex flex-col items-center">
        <div className="loader-wrapper">
          <span className="loader-letter">G</span>
          <span className="loader-letter">e</span>
          <span className="loader-letter">n</span>
          <span className="loader-letter">e</span>
          <span className="loader-letter">r</span>
          <span className="loader-letter">a</span>
          <span className="loader-letter">t</span>
          <span className="loader-letter">i</span>
          <span className="loader-letter">n</span>
          <span className="loader-letter">g</span>
          <span className="loader" />
        </div>
      </div>
      {/* Ensure global loader styles are present even during per-card loading */}
      <LoaderStyles />
    </div>
  )
}

function ResultsPanel({
  results,
  loading,
  placeholders,
  onSelectedChange,
  selectedFromProps,
  getInputs,
}: {
  results: ProgramResult[]
  loading?: boolean
  placeholders?: Array<{ internal_name?: string; external_name?: string }>
  onSelectedChange?: (sel: SelectedRow | null) => void
  selectedFromProps?: SelectedRow | null
  getInputs?: () => Record<string, unknown>
}) {
  const [selected, setSelected] = React.useState<SelectedRow | null>(null)
  useEffect(() => {
    onSelectedChange?.(selected)
  }, [selected, onSelectedChange])
  useEffect(() => {
    if (!selectedFromProps) return
    // If a program name was saved, remap to current results order and nearest row by price
    if (Array.isArray(results) && results.length > 0) {
      let progIdx = selectedFromProps.programIdx ?? 0
      // Prefer explicit program id if present
      if (selectedFromProps.programId) {
        const idxById = results.findIndex(
          (r) => r.internal_name === selectedFromProps.programId || r.external_name === selectedFromProps.programId
        )
        if (idxById >= 0) progIdx = idxById
      } else if (selectedFromProps.programName) {
        const idxByName = results.findIndex(
          (r) => r.internal_name === selectedFromProps.programName || r.external_name === selectedFromProps.programName
        )
        if (idxByName >= 0) progIdx = idxByName
      }
      if (progIdx < 0 || progIdx >= results.length) progIdx = 0
      const d = (results[progIdx]?.data ?? {}) as ProgramResponseData
      const lpArr = Array.isArray(d.loan_price) ? (d.loan_price as Array<string | number>) : []
      const target = Number(String(selectedFromProps.values.loanPrice ?? "").replace(/[^0-9.-]/g, ""))
      let rowIdx = selectedFromProps.rowIdx ?? 0
      if (lpArr.length > 0 && Number.isFinite(target)) {
        let best = 0
        let bestDiff = Infinity
        lpArr.forEach((v, i) => {
          const n = Number(String(v).replace(/[^0-9.-]/g, ""))
          const diff = Math.abs(n - target)
          if (diff < bestDiff) {
            bestDiff = diff
            best = i
          }
        })
        rowIdx = best
      }
      const next = { ...selectedFromProps, programIdx: progIdx, rowIdx }
      // Avoid infinite update loop by only updating local state when it actually changes
      if (
        !selected ||
        selected.programIdx !== next.programIdx ||
        selected.rowIdx !== next.rowIdx ||
        selected.programName !== next.programName ||
        selected.programId !== next.programId
      ) {
        setSelected(next)
      }
    } else {
      if (
        !selected ||
        selected.programIdx !== (selectedFromProps.programIdx ?? 0) ||
        selected.rowIdx !== (selectedFromProps.rowIdx ?? 0) ||
        selected.programName !== selectedFromProps.programName ||
        selected.programId !== selectedFromProps.programId
      ) {
        setSelected(selectedFromProps)
      }
    }
  }, [selectedFromProps, results])

  // Main panel term sheet preview/download state
  const [mcpOpenMain, setMcpOpenMain] = useState<boolean>(false)
  const [sheetPropsMain, setSheetPropsMain] = useState<DSCRTermSheetProps>({})
  const previewRefMain = useRef<HTMLDivElement | null>(null)
  const TERMSHEET_WEBHOOK_MAIN = "https://n8n.axora.info/webhook/a108a42d-e071-4f84-a557-2cd72e440c83"

  async function openMainTermSheetPreview(opts?: { autoPrint?: boolean }) {
    try {
      if (!selected) return
      const d = (results?.[selected.programIdx]?.data ?? {}) as ProgramResponseData
      const isBridgeResp =
        Array.isArray(d?.total_loan_amount) ||
        Array.isArray(d?.initial_loan_amount) ||
        Array.isArray(d?.funded_pitia)
      const idx = selected.rowIdx ?? Number(d?.highlight_display ?? 0)
      const loanAmount = isBridgeResp ? (Array.isArray(d?.total_loan_amount) ? d.total_loan_amount[idx] : undefined) : d?.loan_amount
      const ltv = d?.ltv
      const payloadRow: Record<string, unknown> = {
        loan_price: Array.isArray(d?.loan_price) ? d.loan_price[idx] : undefined,
        interest_rate: Array.isArray(d?.interest_rate) ? d.interest_rate[idx] : undefined,
      }
      if (isBridgeResp) {
        payloadRow["initial_loan_amount"] = Array.isArray(d?.initial_loan_amount) ? d.initial_loan_amount[idx] : undefined
        payloadRow["rehab_holdback"] = Array.isArray(d?.rehab_holdback) ? d.rehab_holdback[idx] : undefined
        payloadRow["total_loan_amount"] = Array.isArray(d?.total_loan_amount) ? d.total_loan_amount[idx] : undefined
        payloadRow["funded_pitia"] = Array.isArray(d?.funded_pitia) ? d.funded_pitia[idx] : undefined
      } else {
        payloadRow["loan_amount"] = loanAmount
        payloadRow["ltv"] = ltv
        payloadRow["pitia"] = Array.isArray(d?.pitia) ? d.pitia[idx] : undefined
        payloadRow["dscr"] = Array.isArray(d?.dscr) ? d.dscr[idx] : undefined
      }
      const rawInputs = (typeof getInputs === "function" ? getInputs() : {}) as Record<string, unknown>
      const inputs = toYesNoDeepGlobal(rawInputs) as Record<string, unknown>
      const normalizedRow = toYesNoDeepGlobal(payloadRow) as Record<string, unknown>
      const r = results?.[selected.programIdx]
      const body = {
        program: r?.internal_name ?? r?.external_name ?? "Program",
        program_id: r?.internal_name ?? r?.external_name ?? null,
        row_index: idx,
        inputs,
        row: normalizedRow,
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const res = await fetch(`${TERMSHEET_WEBHOOK_MAIN}?_=${encodeURIComponent(nonce)}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "X-Client-Request-Id": nonce,
        },
        body: JSON.stringify(body),
      })
      const raw = await res.json().catch(() => ({}))
      const json = Array.isArray(raw) ? (raw[0] as DSCRTermSheetProps) : (raw as DSCRTermSheetProps)
      const enriched =
        json && typeof json === "object" && !Array.isArray(json)
          ? ({ loan_type: isBridgeResp ? "bridge" : "dscr", ...json } as DSCRTermSheetProps)
          : ({ loan_type: isBridgeResp ? "bridge" : "dscr" } as DSCRTermSheetProps)
      setSheetPropsMain(enriched)
      setMcpOpenMain(true)
      if (opts?.autoPrint) {
        setTimeout(() => {
          try {
            const node = previewRefMain.current as HTMLElement | null
            if (!node) return
            const root = node.querySelector('[data-termsheet-root]') as HTMLElement | null
            const htmlInside = (root ?? node).outerHTML
            const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
              .map((el) => (el as HTMLElement).outerHTML)
              .join("\n")
            const htmlClass = document.documentElement.className || ""
            const bodyClass = document.body.className || ""
            const htmlAttrs = Array.from(document.documentElement.attributes)
              .map((a) => `${a.name}="${a.value}"`)
              .join(" ")
            const doc = `<!doctype html>
<html class="${htmlClass}" ${htmlAttrs}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${location.origin}">
    <title>Term Sheet</title>
    ${headStyles}
    <style>
      html, body { margin: 0; padding: 0; background: #fff; }
      #page { width: 816px; height: 1056px; margin: 0 auto; box-sizing: border-box; overflow: hidden; display: block; }
      #page > .reset { width: 816px !important; height: 1056px !important; transform: none !important; transform-origin: top left !important; margin: 0 !important; }
      #inner { width: 816px; height: 1056px; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
      #inner [data-termsheet-root] { width: 816px !important; height: auto !important; transform: scale(0.90); transform-origin: center center; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .ts-edit { border-color: transparent !important; background: transparent !important; outline: none !important; }
      @page { size: 816px 1056px; margin: 0; }
      @media print {
        html, body { width: 816px; height: 1056px; overflow: hidden; }
        #page { box-shadow: none; border: none; }
      }
    </style>
  </head>
  <body class="${bodyClass}">
    <div id="page"><div class="reset"><div id="inner">${htmlInside}</div></div></div>
  </body>
</html>`
            const iframe = document.createElement("iframe")
            iframe.style.position = "fixed"
            iframe.style.right = "0"
            iframe.style.bottom = "0"
            iframe.style.width = "0"
            iframe.style.height = "0"
            iframe.style.border = "0"
            iframe.setAttribute("srcdoc", doc)
            document.body.appendChild(iframe)
            iframe.onload = () => {
              try {
            // No runtime scaling; content is rendered at exact 816x1056 canvas
                iframe.contentWindow?.focus()
                setTimeout(() => iframe.contentWindow?.print(), 50)
              } finally {
                setTimeout(() => document.body.removeChild(iframe), 500)
              }
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : "Unknown error"
            toast({ title: "Download failed", description: message, variant: "destructive" })
          }
        }, 300)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load term sheet"
      toast({ title: "Preview failed", description: message, variant: "destructive" })
    }
  }

  // While loading, show placeholder-only list ONLY when we don't yet have any result slots.
  if (loading && (!results || results.length === 0) && Array.isArray(placeholders) && placeholders.length > 0) {
    const selectedKey = selected?.programId ?? selected?.programName ?? null
    const filtered = selectedKey
      ? placeholders.filter(
          (p) => p.internal_name !== selectedKey && p.external_name !== selectedKey
        )
      : placeholders
    return (
      <div>
        {selected ? (
          <>
          <div className="mb-3 rounded-md border p-3 bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Main</div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {(() => {
                    const name = selected.programName ?? selected.programId ?? "Program"
                    return `Selected: ${name ?? `Program #${(selected.programIdx ?? 0) + 1}`}, Row #${(selected.rowIdx ?? 0) + 1}`
                  })()}
                </div>
              </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="Approved document">
                <IconFileCheck className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Preview main" onClick={() => openMainTermSheetPreview()}>
                <IconEye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download main"
                onClick={() => openMainTermSheetPreview({ autoPrint: true })}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
            </div>
            </div>
            {selected.values.rehabHoldback != null || selected.values.initialLoanAmount != null ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Widget label="Loan Price" value={selected.values.loanPrice} />
                <Widget label="Interest Rate" value={selected.values.interestRate} />
                <Widget label="Initial Loan Amount" value={selected.values.initialLoanAmount} />
                <Widget label="Rehab Holdback" value={selected.values.rehabHoldback} />
                <Widget label="Total Loan Amount" value={selected.values.loanAmount} />
                <Widget label="Funded PITIA" value={selected.values.pitia} />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Widget label="Loan Price" value={selected.values.loanPrice} />
                <Widget label="Interest Rate" value={selected.values.interestRate} />
                <Widget label="Loan Amount" value={selected.values.loanAmount} />
                <Widget label="LTV" value={selected.values.ltv} />
                <Widget label="PITIA" value={selected.values.pitia} />
                <Widget label="DSCR" value={selected.values.dscr} />
              </div>
            )}
          </div>
          <Dialog open={mcpOpenMain} onOpenChange={setMcpOpenMain}>
            <DialogContent className="sm:max-w-[min(860px,calc(100vw-2rem))] max-h-[90vh] px-4 pt-1 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95dvh] max-sm:px-3 max-sm:pt-0.5 max-sm:pb-2">
              <DialogHeader>
                <DialogTitle>Term Sheet</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3">
                {Object.keys(sheetPropsMain ?? {}).length ? (
                  <ScaledTermSheetPreview sheetProps={sheetPropsMain as DSCRTermSheetProps} pageRef={previewRefMain} />
                ) : (
                  <div className="flex h-[70vh] items-center justify-center">
                    <div className="text-sm text-muted-foreground">Preparing term sheet…</div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          </>
        ) : null}
        {filtered.map((p, idx) => (
          <ResultCardLoader key={idx} meta={p} />
        ))}
        <LoaderStyles />
      </div>
    )
  }
  // Intentionally no global loading state; we only show per-program loaders above.
  // Always show the Main selected panel when available, even without results
  if (!results?.length) {
    return selected ? (
      <div>
        <div className="mb-3 rounded-md border p-3 bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">Main</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {(() => {
                  const name = selected.programName ?? results?.[selected.programIdx]?.internal_name ?? results?.[selected.programIdx]?.external_name
                  return `Selected: ${name ?? `Program #${selected.programIdx + 1}`}, Row #${selected.rowIdx + 1}`
                })()}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="Approved document">
                <IconFileCheck className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Preview main" onClick={() => openMainTermSheetPreview()}>
                <IconEye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download main"
                onClick={() => openMainTermSheetPreview({ autoPrint: true })}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {selected.values.rehabHoldback != null || selected.values.initialLoanAmount != null ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={selected.values.loanPrice} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Initial Loan Amount" value={selected.values.initialLoanAmount} />
              <Widget label="Rehab Holdback" value={selected.values.rehabHoldback} />
              <Widget label="Total Loan Amount" value={selected.values.loanAmount} />
              <Widget label="Funded PITIA" value={selected.values.pitia} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={selected.values.loanPrice} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Loan Amount" value={selected.values.loanAmount} />
              <Widget label="LTV" value={selected.values.ltv} />
              <Widget label="PITIA" value={selected.values.pitia} />
              <Widget label="DSCR" value={selected.values.dscr} />
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="text-sm text-muted-foreground">Results will appear here after you calculate.</div>
    )
  }
  return (
    <div>
      {selected ? (
        <div className="mb-3 rounded-md border p-3 bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">Main</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {(() => {
                  const name = selected.programName ?? results?.[selected.programIdx]?.internal_name ?? results?.[selected.programIdx]?.external_name
                  return `Selected: ${name ?? `Program #${selected.programIdx + 1}`}, Row #${selected.rowIdx + 1}`
                })()}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="Approved document">
                <IconFileCheck className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Preview main" onClick={() => openMainTermSheetPreview()}>
                <IconEye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download main"
                onClick={() => openMainTermSheetPreview({ autoPrint: true })}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {selected.values.rehabHoldback != null || selected.values.initialLoanAmount != null ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={selected.values.loanPrice} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Initial Loan Amount" value={selected.values.initialLoanAmount} />
              <Widget label="Rehab Holdback" value={selected.values.rehabHoldback} />
              <Widget label="Total Loan Amount" value={selected.values.loanAmount} />
              <Widget label="Funded PITIA" value={selected.values.pitia} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={selected.values.loanPrice} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Loan Amount" value={selected.values.loanAmount} />
              <Widget label="LTV" value={selected.values.ltv} />
              <Widget label="PITIA" value={selected.values.pitia} />
              <Widget label="DSCR" value={selected.values.dscr} />
            </div>
          )}
        </div>
      ) : null}
      {results.map((r, idx) => (
        <ResultCard
          key={idx}
          r={r}
          programIdx={idx}
          selected={selected}
          onSelect={(sel) => setSelected(sel)}
          getInputs={getInputs}
        />
      ))}
        <Dialog open={mcpOpenMain} onOpenChange={setMcpOpenMain}>
          <DialogContent className="sm:max-w-[min(860px,calc(100vw-2rem))] max-h-[90vh] px-4 pt-1 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95dvh] max-sm:px-3 max-sm:pt-0.5 max-sm:pb-2">
            <DialogHeader>
              <DialogTitle>Term Sheet</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {Object.keys(sheetPropsMain ?? {}).length ? (
                <ScaledTermSheetPreview sheetProps={sheetPropsMain as DSCRTermSheetProps} pageRef={previewRefMain} />
              ) : (
                <div className="flex h-[70vh] items-center justify-center">
                  <div className="text-sm text-muted-foreground">Preparing term sheet…</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}

function LoaderStyles() {
  return (
    <style jsx global>{`
      /* Loader styles with warm gradient (supports light/dark) */
      :root {
        --warm-red: #ff3b30;
        --warm-orange: #ff6a00;
        --warm-yellow: #ffd60a;
        --wave-rgb: 255, 138, 76; /* base orange for stripes */
      }
      .dark {
        --warm-red: #ff453a;
        --warm-orange: #ff7a1a;
        --warm-yellow: #ffd60a;
        --wave-rgb: 255, 179, 64;
      }
      .loader-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 120px;
        width: auto;
        margin: 2rem;
        font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: 1.6em;
        font-weight: 600;
        user-select: none;
        color: #fff;
        scale: 2;
      }
      @media (prefers-color-scheme: light) {
        .loader-wrapper {
          color: #111;
        }
      }
      /* Simpler, robust moving stripe "wave" */
      .loader {
        position: absolute;
        inset: 0;
        z-index: 1;
        background-image: repeating-linear-gradient(
          90deg,
          rgba(var(--wave-rgb), 0.18) 0 8px,
          transparent 8px 22px
        );
        animation: warm-wave 1.2s linear infinite;
        border-radius: 6px;
      }
      @keyframes warm-wave {
        from { background-position-x: -44px; }
        to   { background-position-x: 44px; }
      }
      .loader-letter {
        display: inline-block;
        opacity: 0;
        animation: loader-letter-anim 4s infinite linear;
        z-index: 2;
      }
      .loader-letter:nth-child(1) { animation-delay: 0.1s; }
      .loader-letter:nth-child(2) { animation-delay: 0.205s; }
      .loader-letter:nth-child(3) { animation-delay: 0.31s; }
      .loader-letter:nth-child(4) { animation-delay: 0.415s; }
      .loader-letter:nth-child(5) { animation-delay: 0.521s; }
      .loader-letter:nth-child(6) { animation-delay: 0.626s; }
      .loader-letter:nth-child(7) { animation-delay: 0.731s; }
      .loader-letter:nth-child(8) { animation-delay: 0.837s; }
      @keyframes loader-letter-anim {
        0% { opacity: 0; }
        5% {
          opacity: 1;
          text-shadow: 0 0 4px #fff;
          transform: scale(1.1) translateY(-2px);
        }
        20% { opacity: 0.2; }
        100% { opacity: 0; }
      }
    `}</style>
  )
}

