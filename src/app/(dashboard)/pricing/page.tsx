"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { IconDeviceFloppy, IconFileExport, IconMapPin, IconStar, IconStarFilled, IconCheck, IconX, IconGripVertical, IconPencil, IconTrash, IconEye, IconDownload, IconFileCheck, IconShare3, IconInfoCircle } from "@tabler/icons-react"
import { SearchIcon, LoaderCircleIcon, MinusIcon, PlusIcon } from "lucide-react"
import { Button as AriaButton, Group, Input as AriaInput, NumberField } from "react-aria-components"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
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
import { TagsInput, TagsInputList, TagsInputInput, TagsInputItem } from "@/components/ui/tags-input"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ensureGoogleMaps } from "@/lib/google-maps"
import { toast } from "@/hooks/use-toast"
import { CalcInput } from "@/components/calc-input"
import { LeasedUnitsGrid, type UnitRow } from "@/components/leased-units-grid"
import DSCRTermSheet, { type DSCRTermSheetProps } from "../../../../components/DSCRTermSheet"
import BridgeTermSheet from "../../../../components/BridgeTermSheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@clerk/nextjs"
import { GoogleMap, Marker } from "@react-google-maps/api"

// Prompt the user with a native Save dialog when supported.
// Falls back to a standard download if the File System Access API is unavailable.
async function saveFileWithPrompt(file: File): Promise<void> {
  try {
    const w = window as unknown as {
      showSaveFilePicker?: (options: {
        suggestedName?: string
        types?: Array<{ description?: string; accept?: Record<string, string[]> }>
      }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob | BufferSource) => Promise<void>; close: () => Promise<void> }> }>
    }
    if (w?.showSaveFilePicker) {
      const handle = await w.showSaveFilePicker({
        suggestedName: file.name,
        types: [
          {
            description: "PDF Document",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      })
      const writable = await handle.createWritable()
      // Write the file bytes and close
      await writable.write(file)
      await writable.close()
      return
    }
  } catch (e) {
    // If the user cancels the picker, return early without throwing or falling back.
    const name = (e as any)?.name ?? ""
    if (name === "AbortError" || /cancel/i.test(String((e as any)?.message ?? ""))) {
      return // User cancelled, no action needed
    }
    // Otherwise fall through to anchor-based download.
  }
  // Fallback: standard download to the browser's default location
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function formatDateOnly(date?: Date | null): string | null {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Parse a date value while preserving local calendar dates when given YYYY-MM-DD.
// This avoids timezone shifts that can move dates backward by one day.
function parseDateLocal(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value
  }
  if (typeof value === "string") {
    const s = value.trim()
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const y = Number(m[1])
      const mm = Number(m[2])
      const dd = Number(m[3])
      if (Number.isFinite(y) && Number.isFinite(mm) && Number.isFinite(dd)) {
        const d = new Date(y, mm - 1, dd)
        return isNaN(d.getTime()) ? undefined : d
      }
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? undefined : d
  }
  if (typeof value === "number") {
    const d = new Date(value)
    return isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

function programDisplayName(
  p: { internal_name?: string; external_name?: string } | null | undefined,
  isBroker: boolean
): string {
  if (!p) return "Program"
  return isBroker ? (p.external_name ?? "Program") : (p.internal_name ?? p.external_name ?? "Program")
}

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
  readOnly,
}: {
  sheetProps: DSCRTermSheetProps
  pageRef?: React.Ref<HTMLDivElement>
  forceLoanType?: string
  readOnly?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Start with a conservative scale so the page won't overflow while iOS lays out the modal
  const [baseScale, setBaseScale] = useState<number>(0.6)
  const [zoom, setZoom] = useState<number>(1) // user-controlled zoom multiplier
  const scale = Math.max(0.1, Math.min(baseScale * zoom, 6))
  const [hasValidMeasure, setHasValidMeasure] = useState<boolean>(false)
  const isSpaceDownRef = useRef<boolean>(false)
  const isPanningRef = useRef<boolean>(false)
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      if (width <= 0 || height <= 0) {
        // Fallback: approximate using window viewport while container stabilizes
        const vw = Math.max(0, (window.innerWidth || 0) - 16)
        const vh = Math.max(0, (window.innerHeight || 0) - 16)
        if (vw > 0 && vh > 0) {
          const fallback = Math.min(vw / 816, vh / 1056, 1) * 0.86
          setBaseScale(fallback)
        }
        setHasValidMeasure(false)
        return
      }
      // Compute scale to fit both width and height of the container precisely.
      const paddingAllowance = 8 // px allowance for container padding/borders
      const s =
        Math.min((width - paddingAllowance) / 816, (height - paddingAllowance) / 1056, 1) * 0.88
      setBaseScale(s)
      setHasValidMeasure(true)
    }
    // Try immediately, then on next frames and a few timed retries to handle iOS Safari layout settles.
    update()
    const rafIds: number[] = []
    const tryRaf = (times: number) => {
      if (times <= 0) return
      rafIds.push(
        requestAnimationFrame(() => {
          update()
          tryRaf(times - 1)
        })
      )
    }
    tryRaf(3)
    const timeouts: number[] = [100, 350, 1000, 2000].map((ms) =>
      window.setTimeout(update, ms)
    )
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const onWindowResize = () => update()
    window.addEventListener("resize", onWindowResize, { passive: true })
    window.addEventListener("orientationchange", onWindowResize, { passive: true })
    window.addEventListener("pageshow", onWindowResize, { passive: true })
    // Zoom with Ctrl/Meta + wheel (and trackpad pinch which sets ctrlKey=true on Mac)
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY
      const factor = Math.pow(0.8, delta / 100) // more aggressive wheel zoom
      setZoom((z) => {
        const next = Math.min(5, Math.max(0.25, z * factor))
        return next
      })
      // Keep the focal point roughly centered by nudging scroll
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left + el.scrollLeft
      const cy = e.clientY - rect.top + el.scrollTop
      // After zoom state update in next frame, scroll toward the cursor position
      requestAnimationFrame(() => {
        const newRect = el.getBoundingClientRect()
        const nx = e.clientX - newRect.left
        const ny = e.clientY - newRect.top
        el.scrollLeft += cx - nx
        el.scrollTop += cy - ny
      })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    // Spacebar-held panning
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        isSpaceDownRef.current = true
        if (isPanningRef.current && el) {
          el.style.cursor = "grabbing"
        }
      }
    }
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        isSpaceDownRef.current = false
        if (!isPanningRef.current && el) {
          el.style.cursor = ""
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    const onPointerDown = (ev: PointerEvent) => {
      if (!isSpaceDownRef.current) return
      isPanningRef.current = true
      el.style.cursor = "grabbing"
      panStartRef.current = {
        x: ev.clientX,
        y: ev.clientY,
        left: el.scrollLeft,
        top: el.scrollTop,
      }
      el.setPointerCapture(ev.pointerId)
    }
    const onPointerMove = (ev: PointerEvent) => {
      if (!isPanningRef.current || !panStartRef.current) return
      const dx = ev.clientX - panStartRef.current.x
      const dy = ev.clientY - panStartRef.current.y
      el.scrollLeft = panStartRef.current.left - dx
      el.scrollTop = panStartRef.current.top - dy
    }
    const onPointerUp = (ev: PointerEvent) => {
      if (!isPanningRef.current) return
      isPanningRef.current = false
      panStartRef.current = null
      el.style.cursor = isSpaceDownRef.current ? "grab" : ""
      try {
        el.releasePointerCapture(ev.pointerId)
      } catch {}
    }
    el.addEventListener("pointerdown", onPointerDown)
    el.addEventListener("pointermove", onPointerMove)
    el.addEventListener("pointerup", onPointerUp)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", onWindowResize)
      window.removeEventListener("orientationchange", onWindowResize)
      window.removeEventListener("pageshow", onWindowResize)
      el.removeEventListener("wheel", onWheel as EventListener as unknown as (e: WheelEvent) => void)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      el.removeEventListener("pointerdown", onPointerDown)
      el.removeEventListener("pointermove", onPointerMove)
      el.removeEventListener("pointerup", onPointerUp)
      rafIds.forEach((id) => cancelAnimationFrame(id))
      timeouts.forEach((id) => clearTimeout(id))
    }
  }, [])
  // Enable inline editing on leaf text nodes within the preview, while freezing layout boxes
  useEffect(() => {
    if (readOnly) return
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
  }, [pageRef, sheetProps, readOnly])
  return (
    <div
      ref={containerRef}
      className="w-full h-[72vh] overflow-x-auto overflow-y-auto rounded-md bg-neutral-100/40 grid place-items-center pt-2 pb-2 max-sm:h-[64vh] max-sm:pt-1 max-sm:pb-1 relative overscroll-contain"
    >
      {/* Wrapper takes the visual scaled size so flex centering uses the real pixel box */}
      <div
        className="mx-auto justify-self-center relative"
        style={{
          width: 816 * scale,
          height: 1056 * scale,
          opacity: hasValidMeasure ? 1 : 0,
          transition: "opacity 150ms ease",
        }}
      >
        <div
          style={{
            width: 816,
            height: 1056,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "hidden",
          }}
          className="border border-black/20 bg-white shadow-xl rounded-sm focus:outline-none focus:ring-2 focus:ring-highlight"
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
      {/* Zoom controls - hard-fixed overlay (never moves on scroll) */}
      <div className="pointer-events-auto fixed bottom-4 right-6 z-50">
        <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-sm border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white"
          onClick={() => setZoom((z) => Math.max(0.25, z * 0.8))}
          aria-label="Zoom out"
        >
          -
        </button>
        <div className="rounded-sm border bg-white px-2 py-1 text-[11px] shadow-sm min-w-14 text-center text-black dark:text-black dark:bg-white">
          {Math.round((zoom || 1) * 100)}%
        </div>
        <button
          type="button"
          className="rounded-sm border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white"
          onClick={() => setZoom((z) => Math.min(5, z * 1.2))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="rounded-sm border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white"
          onClick={() => setZoom(1)}
          aria-label="Reset zoom"
        >
          Fit
        </button>
        </div>
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
  const { orgRole } = useAuth()
  const [isBrokerMember, setIsBrokerMember] = useState<boolean>(false)
  const [selfMemberId, setSelfMemberId] = useState<string | null>(null)
  const [selfBrokerId, setSelfBrokerId] = useState<string | null>(null)
  async function waitForSelfMemberId(maxWaitMs = 45000, intervalMs = 400): Promise<string> {
    const started = Date.now()
    // If we already have it, return immediately
    if (selfMemberId) return selfMemberId
    while (true) {
      try {
        const res = await fetch("/api/org/members", { cache: "no-store" })
        const j = (await res.json().catch(() => ({}))) as { self_member_id?: string | null }
        const id = j?.self_member_id ?? null
        if (id && typeof id === "string") {
          setSelfMemberId(id)
          return id
        }
      } catch {
        // ignore and retry
      }
      if (Date.now() - started >= maxWaitMs) {
        // continue polling beyond maxWaitMs per requirement; always sleep to avoid tight loop
      }
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch("/api/org/members", { cache: "no-store" })
        const j = (await res.json().catch(() => ({}))) as { editable?: boolean; self_member_id?: string | null; self_broker_id?: string | null }
        if (!active) return
        setIsBrokerMember(j?.editable === false)
        setSelfMemberId(j?.self_member_id ?? null)
        setSelfBrokerId(j?.self_broker_id ?? null)
      } catch {
        // ignore
      }
    })()
    return () => { active = false }
  }, [])
  const isBroker = orgRole === "org:broker" || orgRole === "broker" || isBrokerMember
  // Entity name autocomplete state for Borrower Name input
  const [entityQuery, setEntityQuery] = useState("")
  const [entitySuggestions, setEntitySuggestions] = useState<Array<{ id: string; name: string; display: string }>>([])
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined)
  const [hasSessionEntity, setHasSessionEntity] = useState<boolean>(false)
  const [entityLoading, setEntityLoading] = useState(false)
  // Guarantor suggestions
  const [showGuarantorSuggestions, setShowGuarantorSuggestions] = useState(false)
  const [guarantorSuggestions, setGuarantorSuggestions] = useState<Array<{ id: string; name: string; display: string }>>([])
  const [guarantorQuery, setGuarantorQuery] = useState("")
  // hasSessionGuarantors removed - linked status is now tracked per-tag in guarantorTags array
  const [guarantorLoading, setGuarantorLoading] = useState(false)

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
    if (!isMobile) {
      // Trigger the animated collapse on desktop with a tick delay so transitions can run
      // Ensures the sidebar renders in its open state first, then closes with animation.
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setSidebarOpen(false))
        // Cleanup nested RAF in case unmounted quickly
        return () => cancelAnimationFrame(raf2)
      })
      return () => cancelAnimationFrame(raf1)
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

  // Fetch entity suggestions as user types borrower name
  useEffect(() => {
    let cancelled = false
    if (!showEntitySuggestions) {
      setEntitySuggestions([])
      setEntityLoading(false)
      return
    }
    const qRaw = entityQuery
    const q = qRaw && qRaw.trim().length > 0 ? qRaw.trim() : "*"
    const ctrl = new AbortController()
    setEntityLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/applicants/entities?q=${encodeURIComponent(q)}`, { signal: ctrl.signal, cache: "no-store" })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as { entities?: Array<{ id: string; display_id?: string; entity_name?: string }> }
        if (cancelled) return
        const opts =
          (j.entities ?? []).slice(0, 20).map((e) => ({
            id: e.id as string,
            name: (e.entity_name ?? "") as string,
            display: `${(e.display_id ?? "") as string} ${(e.entity_name ?? "") as string}`.trim(),
          })) ?? []
        setEntitySuggestions(opts)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setEntityLoading(false)
      }
    })()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [entityQuery, showEntitySuggestions])

  // Fetch guarantor suggestions as user types the current token
  useEffect(() => {
    let cancelled = false
    if (!showGuarantorSuggestions) {
      setGuarantorSuggestions([])
      setGuarantorLoading(false)
      return
    }
    const qRaw = guarantorQuery
    const q = qRaw && qRaw.trim().length > 0 ? qRaw.trim() : "*"
    const ctrl = new AbortController()
    setGuarantorLoading(true)
    ;(async () => {
      try {
        const url = new URL("/api/applicants/borrowers", window.location.origin)
        url.searchParams.set("q", q)
        if (selectedEntityId) url.searchParams.set("entityId", selectedEntityId)
        const res = await fetch(url.toString(), { signal: ctrl.signal, cache: "no-store" })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as { borrowers?: Array<{ id: string; display_id?: string; first_name?: string; last_name?: string }> }
        if (cancelled) return
        const opts =
          (j.borrowers ?? []).slice(0, 20).map((b) => ({
            id: b.id as string,
            name: [b.first_name ?? "", b.last_name ?? ""].filter(Boolean).join(" ").trim(),
            display: `${(b.display_id ?? "") as string} ${[b.first_name ?? "", b.last_name ?? ""].filter(Boolean).join(" ").trim()}`.trim(),
          })) ?? []
        setGuarantorSuggestions(opts)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setGuarantorLoading(false)
      }
    })()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [guarantorQuery, showGuarantorSuggestions, selectedEntityId])

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

  // Prefetch program catalog for current loan type so we can map IDs to names
  useEffect(() => {
    let active = true
    if (!loanType) return
    ;(async () => {
      try {
        const antiCache = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const res = await fetch(`/api/pricing/programs?loanType=${encodeURIComponent(loanType)}&_=${encodeURIComponent(antiCache)}`, {
          method: "GET",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "X-Client-Request-Id": antiCache },
        })
        if (!res.ok) return
        const pj = (await res.json().catch(() => ({}))) as { programs?: Array<{ id?: string; internal_name?: string; external_name?: string }> }
        if (!active) return
        const ph = Array.isArray(pj?.programs) ? pj.programs : []
        setProgramPlaceholders(ph)
      } catch {
        // ignore
      }
    })()
    return () => {
      active = false
    }
  }, [loanType])

  // Address fields (hooked to Google Places)
  const [street, setStreet] = useState<string>("")
  const [apt, setApt] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [stateCode, setStateCode] = useState<string | undefined>(undefined)
  const [zip, setZip] = useState<string>("")
  const [county, setCounty] = useState<string>("")
  const streetInputRef = useRef<HTMLInputElement | null>(null)
  const [sendingReApi, setSendingReApi] = useState<boolean>(false)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  const [mapsLoadError, setMapsLoadError] = useState(false)
  const [mapsModalOpen, setMapsModalOpen] = useState(false)
  const [mapsCenter, setMapsCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [mapsLoading, setMapsLoading] = useState(false)
  const [mapsView, setMapsView] = useState<"map" | "street">("map")
  const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [streetViewStatus, setStreetViewStatus] = useState<google.maps.StreetViewStatus | null>(null)
  const streetViewPanoRef = useRef<HTMLDivElement | null>(null)
  const streetViewPanoInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null)
  const hasBasicAddress = useMemo(() => {
    const s = street?.trim()
    const c = city?.trim()
    const z = zip?.trim()
    const st = typeof stateCode === "string" ? stateCode.trim() : ""
    return Boolean(s && c && st && z)
  }, [city, stateCode, street, zip])
  const fullAddress = useMemo(() => {
    const parts = [street, apt, city, stateCode, zip]
      .map((p) => (typeof p === "string" ? p.trim() : p))
      .filter((p): p is string => Boolean(p))
    return parts.join(", ")
  }, [apt, city, stateCode, street, zip])
  const mapContainerStyle = useMemo(() => ({ width: "100%", height: "100%" }), [])
  const mapZoom = 16
  const debugSessionId = "debug-session"
  const debugRunId = "pre-fix"
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
  const [brokerAdminFee, setBrokerAdminFee] = useState<string>("")
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
  const [guarantorTags, setGuarantorTags] = useState<Array<{ name: string; id?: string }>>([])
  const [uwException, setUwException] = useState<string | undefined>(undefined)
  // Note: We no longer restore/cache borrower/guarantor links from localStorage.
  // Links are only established when user selects from dropdown or loads a saved scenario.
  const [section8, setSection8] = useState<string | undefined>(undefined)
  const [glaExpansion, setGlaExpansion] = useState<string | undefined>(undefined) // Bridge rehab
  const [changeOfUse, setChangeOfUse] = useState<string | undefined>(undefined) // Bridge rehab
  const [taxEscrowMonths, setTaxEscrowMonths] = useState<string>("")
  const [gmapsReady, setGmapsReady] = useState<boolean>(false)
  const [showPredictions, setShowPredictions] = useState<boolean>(false)
  const [activePredictionIdx, setActivePredictionIdx] = useState<number>(-1)
  const [programResults, setProgramResults] = useState<ProgramResult[]>([])
  const [isDispatching, setIsDispatching] = useState<boolean>(false)
  const [programPlaceholders, setProgramPlaceholders] = useState<Array<{ id?: string; internal_name?: string; external_name?: string }>>([])
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
  const addYears = (dt: Date, years: number) => {
    const d = new Date(dt)
    d.setFullYear(d.getFullYear() + years)
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
      acquisitionDate: addYears(new Date(), -1) as Date,
      loanStructureType: "fixed-30" as string,
      ppp: "5-4-3-2-1" as string,
      borrowerName: "Borrowing Entity LLC" as string,
      guarantorPlaceholder: "First Last" as string,
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
    setIfUnsetDate(acquisitionDate, (v) => setAcquisitionDate(v), DEFAULTS.acquisitionDate)
    setIfUnsetString(loanStructureType, (v) => setLoanStructureType(v), DEFAULTS.loanStructureType)
    setIfUnsetString(ppp, (v) => setPpp(v), DEFAULTS.ppp)
    setIfUnsetString(borrowerName, (v) => setBorrowerName(v), DEFAULTS.borrowerName)
    // guarantorTags is now an array, no default string needed
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
  const effectiveMapsError = useMemo(
    () => mapsError || (mapsLoadError ? "Unable to load Google Maps" : null),
    [mapsError, mapsLoadError]
  )
  const canUseStreetView = gmapsReady && !effectiveMapsError && !!mapsCenter && !mapsLoading
  const gmaps = typeof window !== "undefined" ? (window as any)?.google?.maps : undefined

  const handleOpenMapsModal = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setMapsModalOpen(true)
    setMapsCenter(null)
    setMapsError(null)
    setMapsLoading(false)
    setMapsView("map")
    setStreetViewPosition(null)
    setStreetViewStatus(null)
  }

  useEffect(() => {
    if (!mapsModalOpen) return
    if (!mapsApiKey) {
      setMapsError("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
      setMapsLoading(false)
      return
    }
    if (mapsLoadError) {
      setMapsError("Unable to load Google Maps")
      setMapsLoading(false)
      return
    }
    if (!fullAddress) {
      setMapsError("Enter street, city, state, and zip to preview")
      setMapsCenter(null)
      setMapsLoading(false)
      return
    }
    if (!gmapsReady) {
      setMapsLoading(true)
      return
    }
    const g = (window as any)?.google?.maps
    if (!g?.Geocoder) {
      setMapsError("Maps SDK not ready")
      setMapsLoading(false)
      return
    }
    setMapsLoading(true)
    setMapsError(null)
    const geocoder = new g.Geocoder()
    geocoder.geocode({ address: fullAddress }, (results: Array<any> | null, status: string) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location
        setMapsCenter({ lat: loc.lat(), lng: loc.lng() })
      } else {
        setMapsCenter(null)
        setMapsError("Could not locate that address")
      }
      setMapsLoading(false)
    })
  }, [fullAddress, mapsApiKey, mapsLoadError, mapsModalOpen, gmapsReady])

  useEffect(() => {
    setStreetViewPosition(null)
    setStreetViewStatus(null)
    if (!mapsCenter && mapsView === "street") {
      setMapsView("map")
    }
  }, [mapsCenter, mapsView])

  useEffect(() => {
    if (mapsView !== "street") return
    if (!mapsCenter || !gmapsReady) return
    const g = (window as any)?.google?.maps
    if (!g?.StreetViewService) {
      setStreetViewPosition(null)
      setStreetViewStatus(null)
      return
    }
    const svc = new g.StreetViewService()
    setStreetViewStatus(null)
    svc.getPanorama({ location: mapsCenter, radius: 50 }, (data: any, status: google.maps.StreetViewStatus) => {
      if (status === g.StreetViewStatus.OK && data?.location?.latLng) {
        const pos = data.location.latLng
        setStreetViewPosition({ lat: pos.lat(), lng: pos.lng() })
      } else {
        setStreetViewPosition(null)
      }
      setStreetViewStatus(status ?? null)
    })
  }, [gmapsReady, mapsCenter, mapsView])

  useEffect(() => {
    if (!mapsModalOpen) return
  }, [gmaps, gmapsReady, mapsCenter, mapsLoading, mapsModalOpen, mapsView, streetViewPosition, streetViewStatus])

  useEffect(() => {
    if (!mapsModalOpen) {
      if (streetViewPanoInstanceRef.current) {
        streetViewPanoInstanceRef.current.setVisible(false)
        streetViewPanoInstanceRef.current = null
      }
      return
    }
    if (mapsView !== "street") return
    if (!gmaps || !streetViewPanoRef.current) return
    if (!streetViewPosition || streetViewStatus !== gmaps.StreetViewStatus.OK) {
      if (streetViewPanoInstanceRef.current) {
        streetViewPanoInstanceRef.current.setVisible(false)
      }
      return
    }
    let pano = streetViewPanoInstanceRef.current
    if (!pano) {
      pano = new gmaps.StreetViewPanorama(streetViewPanoRef.current, {
        position: streetViewPosition,
        pov: { heading: 0, pitch: 0 },
        visible: true,
        zoom: 1,
        motionTracking: false,
        motionTrackingControl: false,
      })
      streetViewPanoInstanceRef.current = pano
    } else {
      pano.setPosition(streetViewPosition)
      pano.setVisible(true)
    }
  }, [gmaps, mapsModalOpen, mapsView, streetViewPosition, streetViewStatus])

  useEffect(() => {
    return () => {
      if (streetViewPanoInstanceRef.current) {
        streetViewPanoInstanceRef.current.setVisible(false)
        streetViewPanoInstanceRef.current = null
      }
    }
  }, [])

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
        {
          const d = parseDateLocal(acq)
          if (d) {
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
      // keep legacy and alias for clarity in downstream systems
      // send both legacy and explicit lender_admin_fee for downstream systems
      // Null semantics: if never edited and empty => null; if explicitly "0" => 0
      admin_fee: (() => {
        const ever = !!touched.adminFee
        const v = String(adminFee ?? "").trim()
        if (!ever && v === "") return null
        if (v === "0" || v === "0.0" || v === "0.00") return 0
        return adminFee
      })(),
      lender_admin_fee: (() => {
        const ever = !!touched.adminFee
        const v = String(adminFee ?? "").trim()
        if (!ever && v === "") return null
        if (v === "0" || v === "0.0" || v === "0.00") return 0
        return adminFee
      })(),
      broker_admin_fee: brokerAdminFee,
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
      closing_date: formatDateOnly(closingDate),
      // also send projected note date for downstream webhooks
      projected_note_date: (() => {
        const dt = closingDate ?? DEFAULTS.closingDate
        return formatDateOnly(dt)
      })(),
      // always include effective dates (can be null)
      hoi_effective_date: formatDateOnly(hoiEffective ?? DEFAULTS.hoiEffective),
      flood_effective_date: formatDateOnly(floodEffective ?? DEFAULTS.floodEffective),
      // borrower + fees: always include (may be empty string)
      borrower_type: borrowerType ?? "",
      citizenship: citizenship ?? "",
      fico,
      rural: rural ?? DEFAULTS.rural,
      borrower_name: borrowerName,
      borrower_entity_id: selectedEntityId ?? null,
      guarantors: guarantorTags.map((t) => t.name),
      guarantor_borrower_ids: guarantorTags.filter((t) => t.id).map((t) => t.id!),
      uw_exception: uwException ?? "",
      // Origination null semantics and alias
      lender_orig_percent: (() => {
        const ever = !!touched.lenderOrig
        const v = String(lenderOrig ?? "").trim()
        if (!ever && v === "") return null
        if (v === "0" || v === "0.0" || v === "0.00") return 0
        return lenderOrig
      })(),
      origination_points: (() => {
        const ever = !!touched.lenderOrig
        const v = String(lenderOrig ?? "").trim()
        if (!ever && v === "") return null
        if (v === "0" || v === "0.0" || v === "0.00") return 0
        return lenderOrig
      })(),
      broker_orig_percent: brokerOrig,
      title_recording_fee: titleRecordingFee || computedTitleRecording,
      assignment_fee: assignmentFee,
      seller_concessions: sellerConcessions,
      tax_escrow_months: taxEscrowMonths,
    }
    // Always include acquisition_date; receivers can ignore when not applicable
    payload["acquisition_date"] = formatDateOnly(acquisitionDate)
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

  // Log term sheet activity (download/share) to the backend
  async function logTermSheetActivity(
    action: "downloaded" | "shared",
    pdfFile: File,
    scenarioIdOverride?: string | null
  ) {
    try {
      if (!currentLoanId) return // Can't log without a loan
      const formData = new FormData()
      formData.append("action", action)
      formData.append("loanId", currentLoanId)
      if (scenarioIdOverride ?? selectedScenarioId) {
        formData.append("scenarioId", scenarioIdOverride ?? selectedScenarioId ?? "")
      }
      formData.append("inputs", JSON.stringify(buildPayload()))
      formData.append("outputs", JSON.stringify(programResults?.map(r => r.data ?? null).filter(Boolean) ?? null))
      formData.append("selected", JSON.stringify(selectedMainRow?.values ?? null))
      // For now, we upload the same PDF as both original and edited
      // In the future, we could render a version without orange-box edits for "original"
      formData.append("originalPdf", pdfFile)
      formData.append("editedPdf", pdfFile)
      await fetch("/api/activity/term-sheet", {
        method: "POST",
        body: formData,
      }).catch(() => {})
    } catch {
      // Activity logging should not block user flow
    }
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
      let placeholdersLocal: Array<{ id?: string; internal_name?: string; external_name?: string }> = []
      try {
        const antiCache = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const pre = await fetch(`/api/pricing/programs?loanType=${encodeURIComponent(loanType)}&_=${encodeURIComponent(antiCache)}`, {
          method: "GET",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "X-Client-Request-Id": antiCache },
        })
        if (pre.ok) {
          const pj = (await pre.json().catch(() => ({}))) as { programs?: Array<{ id?: string; internal_name?: string; external_name?: string }> }
          let ph = Array.isArray(pj?.programs) ? pj.programs : []
          // If broker, filter by custom_broker_settings.program_visibility == true
          let allowedIds: Set<string> | null = null
          if (selfBrokerId || isBroker) {
            try {
              if (!selfBrokerId) {
                // Broker without a linked broker id: no permissions
                ph = []
              } else {
                const visRes = await fetch(`/api/brokers/${encodeURIComponent(selfBrokerId)}/custom-settings`, { cache: "no-store" })
                const visJson = await visRes.json().catch(() => ({})) as { program_visibility?: Record<string, boolean> }
                const visibility = (visJson?.program_visibility ?? {}) as Record<string, boolean>
                allowedIds = new Set<string>(Object.keys(visibility).filter((k) => visibility[k] === true))
                ph = ph.filter((p) => {
                  const id = String(p.id ?? "")
                  // Only allow when explicitly true; anything else (false/undefined) is filtered out
                  return id.length > 0 && allowedIds!.has(id)
                })
              }
            } catch {
              // if settings not available, default to empty (no permissions)
              ph = []
            }
          }
          placeholdersLocal = ph
          setProgramPlaceholders(ph)
          // initialize result slots in same order so containers render in place
          setProgramResults(ph.map((p) => ({ id: p.id, internal_name: p.internal_name, external_name: p.external_name } as ProgramResult)))
        }
      } catch {
        // ignore prefetch errors; we'll still show a generic loader
      }
      const payload = buildPayload()
      try {
        // Do not auto-calculate lender fees; preserve user-entered values.
        setLastCalculatedKey(JSON.stringify(payload))
      } catch {
        // ignore serialization issues
        setLastCalculatedKey(String(Date.now()))
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      // Also POST all inputs (including defaults/placeholders) to the external webhook
      // This call is non-blocking and won't affect the main dispatch flow.
      try {
        const augmented = { ...(toYesNoDeepGlobal(payload) as Record<string, unknown>) }
        if (selfMemberId) {
          augmented["organization_member_id"] = selfMemberId
        }
        const webhookBody = JSON.stringify(augmented)
        void fetch(`https://n8n.axora.info/webhook/a108a42d-e071-4f84-a557-2cd72e440c83?_=${encodeURIComponent(nonce)}`, {
          method: "POST",
          cache: "no-store",
          // Fire-and-forget; avoid console noise if remote doesn't send CORS headers
          mode: "no-cors",
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
            // Ensure we have organization_member_id before sending any program webhook
            let memberIdLocal = selfMemberId
            if (!memberIdLocal) {
              memberIdLocal = await waitForSelfMemberId().catch(() => null as any)
            }
            // As an extra guard, skip dispatch if this broker isn't allowed to see this program id
            if (isBroker && selfBrokerId) {
              try {
                const visRes = await fetch(`/api/brokers/${encodeURIComponent(selfBrokerId)}/custom-settings`, { cache: "no-store" })
                const visJson = await visRes.json().catch(() => ({})) as { program_visibility?: Record<string, boolean> }
                const visibility = (visJson?.program_visibility ?? {}) as Record<string, boolean>
                const idStr = String(p.id ?? "")
                if (!(idStr && visibility[idStr] === true)) {
                  return
                }
              } catch {
                return
              }
            }
            const res = await fetch(`/api/pricing/dispatch-one?_=${encodeURIComponent(nonce)}-${idx}`, {
              method: "POST",
              cache: "no-store",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "X-Client-Request-Id": `${nonce}-${idx}`,
              },
              body: JSON.stringify({ loanType, programId: p.id ?? p.internal_name ?? p.external_name, data: { ...payload, organization_member_id: memberIdLocal ?? null } }),
            })
            const single = (await res.json().catch(() => ({}))) as ProgramResult
            // place result in its slot (do not reorder to preserve container positions)
            setProgramResults((prev) => {
              const next = prev.slice()
              // Build per-row cache for initial_pitia if provided
              try {
                const dat = (single as any)?.data
                const arr = Array.isArray(dat?.initial_pitia)
                  ? (dat.initial_pitia as Array<string | number | null | undefined>)
                  : null
                const cache =
                  arr != null ? Object.fromEntries(arr.map((v, i) => [i, v ?? null])) : (next[idx] as any)?.initial_pitia_cache
                // Cache program-level default lender fees from calculate webhook
                let defaultOrig = ""
                let defaultAdmin = ""
                try {
                  const pickDefault = (v: any, hi: number): string => {
                    if (Array.isArray(v)) {
                      const i = Math.max(0, Math.min(hi, v.length - 1))
                      const pv = v[i]
                      return pv === null || pv === undefined ? "" : String(pv)
                    }
                    return v === null || v === undefined ? "" : String(v)
                  }
                  const hi = Number(dat?.highlight_display ?? 0)
                  defaultOrig = pickDefault((dat as any)?.default_lender_orig_percent, hi).trim()
                  defaultAdmin = pickDefault((dat as any)?.default_lender_admin_fee, hi).trim()
                } catch {}
                const lenderDefaultsCache =
                  typeof (next as any)[idx]?.lender_defaults_cache === "object"
                    ? { ...(next as any)[idx].lender_defaults_cache }
                    : {}
                if (defaultOrig !== "") lenderDefaultsCache.default_lender_orig_percent = defaultOrig
                if (defaultAdmin !== "") lenderDefaultsCache.default_lender_admin_fee = defaultAdmin
                ;(next as any)[idx] = {
                  ...(next[idx] as any),
                  ...(single as any),
                  initial_pitia_cache: cache,
                  lender_defaults_cache: lenderDefaultsCache,
                }
              } catch {
                ;(next as any)[idx] = { ...(next[idx] as any), ...(single as any) }
              }
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
        // Always save external name for display
        program_name:
          selectedMainRow?.programName ??
          (programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name ?? null),
        // Always save UUID program id; never save name
        program_id:
          selectedMainRow?.programId ??
          (programResults?.[selectedMainRow?.programIdx ?? 0]?.id ?? null),
        program_index: selectedMainRow?.programIdx ?? 0,
        row_index: selectedMainRow?.rowIdx ?? 0,
      }
      const res = await fetch("/api/pricing/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          inputs,
          outputs: programResults?.map(r => r.data ?? null).filter(Boolean) ?? null,
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

  // Per-unit income rows placeholder state (now uses UnitRow for Data Grid integration)
  const [unitData, setUnitData] = useState<UnitRow[]>([])
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
        const rows: UnitRow[] = Array.from({ length: next }, (_, i) => ({
          id: `unit-${i}`,
          unitNumber: `#${i + 1}`,
          leased: saved[i]?.leased,
          gross: saved[i]?.gross ?? "",
          market: saved[i]?.market ?? "",
        }))
        setUnitData(rows)
        hydrateUnitsRef.current = null
      } else {
        setUnitData((prev) => {
          // Resize array while preserving existing data
          return Array.from({ length: next }, (_, i) => {
            const existing = prev[i]
            if (existing) {
              return { ...existing, id: `unit-${i}`, unitNumber: `#${i + 1}` }
            }
            return { id: `unit-${i}`, unitNumber: `#${i + 1}`, leased: undefined, gross: "", market: "" }
          })
        })
      }
      return
    }
    // Maintain length; populate with saved values if present
    const saved = hydrateUnitsRef.current
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const rows: UnitRow[] = Array.from({ length: numUnits }, (_, i) => ({
        id: `unit-${i}`,
        unitNumber: `#${i + 1}`,
        leased: saved[i]?.leased,
        gross: saved[i]?.gross ?? "",
        market: saved[i]?.market ?? "",
      }))
      setUnitData(rows)
      hydrateUnitsRef.current = null
    } else {
      setUnitData((prev) => {
        // Resize array while preserving existing data
        return Array.from({ length: numUnits }, (_, i) => {
          // Keep existing data if available, otherwise create empty row
          const existing = prev[i]
          if (existing) {
            return { ...existing, id: `unit-${i}`, unitNumber: `#${i + 1}` }
          }
          return { id: `unit-${i}`, unitNumber: `#${i + 1}`, leased: undefined, gross: "", market: "" }
        })
      })
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
    // Only validate the visible rows (first numUnits), not stale rows in unitData
    const visibleRows = unitData.slice(0, numUnits ?? 0)
    return visibleRows.every((u) => {
      // Leased: accept "yes", "no", or any truthy selection
      const hasLeased = u.leased === "yes" || u.leased === "no"
      // Gross/Market: accept any non-null/undefined value (including "0", "0.00")
      const hasGross = u.gross != null && u.gross !== ""
      const hasMarket = u.market != null && u.market !== ""
      return hasLeased && hasGross && hasMarket
    })
  }, [areUnitRowsVisible, unitData, numUnits])
  // Returns array of missing required field labels (only checks VISIBLE fields)
  const missingFields = useMemo(() => {
    const missing: string[] = []
    const has = (v: unknown) => !(v === undefined || v === null || v === "")

    // Always required
    if (!has(loanType)) missing.push("Loan Type")
    if (!has(transactionType)) missing.push("Transaction Type")
    if (!has(borrowerType)) missing.push("Borrower Type")
    if (!has(citizenship)) missing.push("Citizenship")
    if (!has(stateCode)) missing.push("State")
    if (!has(propertyType)) missing.push("Property Type")
    if (!has(aiv)) missing.push("AIV")

    // Conditionally required (only when visible)
    if (isBridge && !has(bridgeType)) missing.push("Bridge Type")
    if (isBridge && !has(term)) missing.push("Term")
    if (isFicoRequired && !has(fico)) missing.push("FICO Score")
    if (isDscr && !has(annualTaxes)) missing.push("Annual Taxes")
    if (isDscr && !has(annualHoi)) missing.push("Annual HOI")
    if (isDscr && !has(loanStructureType)) missing.push("Loan Structure")
    if (isDscr && !has(ppp)) missing.push("Prepay Penalty")
    if (isPurchase && !has(purchasePrice)) missing.push("Purchase Price")
    if (rehabSectionVisible && !has(rehabBudget)) missing.push("Rehab Budget")
    if (rehabSectionVisible && !has(arv)) missing.push("ARV")
    if (rehabPathVisible && !has(initialLoanAmount)) missing.push("Initial Loan Amount")
    if (loanAmountPathVisible && !has(loanAmount)) missing.push("Loan Amount")
    if (!unitsComplete) missing.push("Unit Data (all rows)")

    return missing
  }, [
    loanType,
    transactionType,
    borrowerType,
    citizenship,
    stateCode,
    propertyType,
    aiv,
    isBridge,
    bridgeType,
    term,
    isFicoRequired,
    fico,
    isDscr,
    annualTaxes,
    annualHoi,
    loanStructureType,
    ppp,
    isPurchase,
    purchasePrice,
    rehabSectionVisible,
    rehabBudget,
    arv,
    rehabPathVisible,
    initialLoanAmount,
    loanAmountPathVisible,
    loanAmount,
    unitsComplete,
  ])

  const canCalculate = missingFields.length === 0

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
        setMapsLoadError(false)
      } catch {
        setGmapsReady(false)
        setMapsLoadError(true)
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
    if ("admin_fee" in payload) {
      setAdminFee(String(payload["admin_fee"] ?? ""))
    } else if ("lender_admin_fee" in payload) {
      setAdminFee(String((payload as any)["lender_admin_fee"] ?? ""))
    }
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
        (u: { leased?: "yes" | "no"; gross?: string | number | null; market?: string | number | null; gross_rent?: string | number | null; market_rent?: string | number | null }) => {
          // Support both "gross"/"market" and legacy "gross_rent"/"market_rent" field names
          const grossVal = u?.gross ?? u?.gross_rent
          const marketVal = u?.market ?? u?.market_rent
          return {
            leased: (u?.leased as "yes" | "no" | undefined) ?? undefined,
            gross: grossVal != null ? String(grossVal) : "",
            market: marketVal != null ? String(marketVal) : "",
          }
        }
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
    const borrowerEntityId = typeof payload["borrower_entity_id"] === "string" ? (payload["borrower_entity_id"] as string) : undefined
    setSelectedEntityId(borrowerEntityId ?? undefined)
    if (borrowerEntityId) {
      setHasSessionEntity(true)
    }
    const guarantorNames = Array.isArray(payload["guarantors"]) ? (payload["guarantors"] as string[]) : []
    const guarantorIds = Array.isArray(payload["guarantor_borrower_ids"])
      ? (payload["guarantor_borrower_ids"] as unknown[]).filter((g): g is string => typeof g === "string" && g.length > 0)
      : []
    // Build guarantorTags array - names with optional IDs
    const loadedTags: Array<{ name: string; id?: string }> = guarantorNames.map((name, idx) => ({
      name,
      id: guarantorIds[idx] ?? undefined,
    }))
    setGuarantorTags(loadedTags)
    if ("rural" in payload) setRural((payload["rural"] as string) ?? undefined)
    if ("uw_exception" in payload) setUwException((payload["uw_exception"] as string) ?? undefined)
    if ("section8" in payload) setSection8((payload["section8"] as string) ?? undefined)
    if ("lender_orig_percent" in payload) {
      setLenderOrig(String(payload["lender_orig_percent"] ?? ""))
    } else if ("lender_origination" in (payload as any)) {
      setLenderOrig(String((payload as any)["lender_origination"] ?? ""))
    }
    if ("broker_orig_percent" in payload) setBrokerOrig(String(payload["broker_orig_percent"] ?? ""))
    if ("title_recording_fee" in payload) setTitleRecordingFee(String(payload["title_recording_fee"] ?? ""))
    if ("seller_concessions" in payload) setSellerConcessions(String(payload["seller_concessions"] ?? ""))

    function parseDate(val: unknown): Date | undefined {
      return parseDateLocal(val)
    }
    // Acquisition date from scenario payload (support common aliases)
    {
      const acq =
        payload["acquisition_date"] ??
        (payload as Record<string, unknown>)["acq_date"] ??
        (payload as Record<string, unknown>)["acq-date"]
      const d = parseDate(acq)
      if (d) setAcquisitionDate(d)
    }
    // Projected Note/Closing date from scenario payload
    {
      const proj =
        payload["projected_note_date"] ??
        (payload as Record<string, unknown>)["note_date"] ??
        payload["closing_date"]
      const d = parseDate(proj)
      if (d) setClosingDate(d)
    }
    const hoiEff = parseDateLocal(payload["hoi_effective_date"])
    if (hoiEff) setHoiEffective(hoiEff)
    const floodEff = parseDateLocal(payload["flood_effective_date"])
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
                <Select value={selectedScenarioId ?? ""} onValueChange={setSelectedScenarioId}>
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
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>Favorite</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button aria-label="Delete scenario" size="icon" variant="ghost" disabled={!selectedScenarioId}>
                          <IconTrash />
                        </Button>
                      </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                              outputs: programResults?.map(r => r.data ?? null).filter(Boolean) ?? null,
                              selected: {
                                ...selected,
                                // Always save external name and UUID for id
                                program_name:
                                  selectedMainRow?.programName ??
                                  (programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name ?? null),
                                program_id:
                                  selectedMainRow?.programId ??
                                  (programResults?.[selectedMainRow?.programIdx ?? 0]?.id ?? null),
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
                              outputs: programResults?.map(r => r.data ?? null).filter(Boolean) ?? null,
                              selected: {
                                ...selected,
                                // Always save external name and UUID for id
                                program_name:
                                  selectedMainRow?.programName ??
                                  (programResults?.[selectedMainRow?.programIdx ?? 0]?.external_name ?? null),
                                program_id:
                                  selectedMainRow?.programId ??
                                  (programResults?.[selectedMainRow?.programIdx ?? 0]?.id ?? null),
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
                    </TooltipTrigger>
                    <TooltipContent>Save</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                    <Button
                      aria-label="Save As"
                      size="icon"
                      variant="outline"
                      onClick={() => setIsNamingScenario(true)}
                    >
                  <IconFileExport />
                </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save As</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <ScrollArea className="min-h-0 flex-1">
              <div ref={inputsAreaRef} className="p-3 pb-4">
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
                            <div className="flex items-center gap-1">
                              <Label htmlFor="fthb">FTHB</Label>
                              <TooltipProvider>
                                <Tooltip delayDuration={50}>
                                  <TooltipTrigger>
                                    <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                    <span className="sr-only">More Info</span>
                                  </TooltipTrigger>
                                  <TooltipContent>First Time Home Buyer</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                            <div className="flex items-center gap-1">
                              <Label htmlFor="mortgage-debt">Mortgage Debt</Label>
                              <TooltipProvider>
                                <Tooltip delayDuration={50}>
                                  <TooltipTrigger>
                                    <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                    <span className="sr-only">More Info</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Mortgage Debt shown on guarantor(s) credit report</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                        <div className="flex items-center gap-1">
                          <Label htmlFor="fico">
                            FICO Score{isFicoRequired ? <span className="text-red-600"> *</span> : null}
                          </Label>
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger>
                                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                <span className="sr-only">More Info</span>
                              </TooltipTrigger>
                              <TooltipContent>Middle score when 3 tradelines available, or lower score if only 2 are available</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <NumberField
                          value={fico ? Number(fico) : undefined}
                          onChange={(val) => setFico(String(val))}
                          minValue={300}
                          maxValue={850}
                          className="w-full"
                        >
                          <Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
                            <AriaInput
                              id="fico"
                              placeholder="700"
                              className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                            />
                            <AriaButton
                              slot="decrement"
                              className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                            >
                              <MinusIcon className="size-4" />
                              <span className="sr-only">Decrease FICO</span>
                            </AriaButton>
                            <AriaButton
                              slot="increment"
                              className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                            >
                              <PlusIcon className="size-4" />
                              <span className="sr-only">Increase FICO</span>
                            </AriaButton>
                          </Group>
                        </NumberField>
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
                        <div className="flex items-center gap-1">
                          <Label htmlFor="rentals-owned">Rentals Owned</Label>
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger>
                                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                <span className="sr-only">More Info</span>
                              </TooltipTrigger>
                              <TooltipContent>Properties owned (fix & holds should be included under '# of Flips')</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                          <NumberField
                            value={rentalsOwned ? Number(rentalsOwned) : undefined}
                            onChange={(val) => setRentalsOwned(String(val))}
                            minValue={0}
                            className="w-full"
                          >
                            <Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
                              <AriaInput
                                id="rentals-owned"
                                placeholder="0"
                                className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                              />
                              <AriaButton
                                slot="decrement"
                                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                              >
                                <MinusIcon className="size-4" />
                                <span className="sr-only">Decrease Rentals Owned</span>
                              </AriaButton>
                              <AriaButton
                                slot="increment"
                                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                              >
                                <PlusIcon className="size-4" />
                                <span className="sr-only">Increase Rentals Owned</span>
                              </AriaButton>
                            </Group>
                          </NumberField>
                        </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="num-flips"># of Flips</Label>
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger>
                                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                <span className="sr-only">More Info</span>
                              </TooltipTrigger>
                              <TooltipContent>Flips exited in trailing 36 months</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                          <NumberField
                            value={numFlips ? Number(numFlips) : undefined}
                            onChange={(val) => setNumFlips(String(val))}
                            minValue={0}
                            className="w-full"
                          >
                            <Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
                              <AriaInput
                                id="num-flips"
                                placeholder="0"
                                className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                              />
                              <AriaButton
                                slot="decrement"
                                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                              >
                                <MinusIcon className="size-4" />
                                <span className="sr-only">Decrease Flips</span>
                              </AriaButton>
                              <AriaButton
                                slot="increment"
                                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                              >
                                <PlusIcon className="size-4" />
                                <span className="sr-only">Increase Flips</span>
                              </AriaButton>
                            </Group>
                          </NumberField>
                        </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="num-gunc"># of GUNC</Label>
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger>
                                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                <span className="sr-only">More Info</span>
                              </TooltipTrigger>
                              <TooltipContent>Ground Up projects exited in trailing 36 months</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                          <NumberField
                            value={numGunc ? Number(numGunc) : undefined}
                            onChange={(val) => setNumGunc(String(val))}
                            minValue={0}
                            className="w-full"
                          >
                            <Group className="border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50">
                              <AriaInput
                                id="num-gunc"
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="other-exp">Other</Label>
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger>
                                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                <span className="sr-only">More Info</span>
                              </TooltipTrigger>
                              <TooltipContent>Other real estate experience</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
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
                  <div className="flex items-center gap-2 pr-2 pl-1">
                    <AccordionTrigger className="flex-1 text-left text-base font-bold italic hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span>Subject Property</span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 not-italic"
                        onClick={handleSendToReApi}
                        disabled={!hasBasicAddress || sendingReApi}
                        aria-disabled={sendingReApi || !hasBasicAddress}
                      >
                        {sendingReApi ? "Sending..." : "RE API"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 not-italic"
                        onClick={(e) => handleOpenMapsModal(e)}
                        disabled={!hasBasicAddress}
                      >
                        Google Maps
                      </Button>
                    </div>
                  </div>
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
                            <SelectTrigger id="property-type" className={`h-9 w-full ${reAuto.propertyType ? "border-2 border-highlight/70" : ""}`}>
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
                            <SelectTrigger id="num-units" className={`h-9 w-full ${reAuto.numUnits ? "border-2 border-highlight/70" : ""}`}>
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="gla">GLA Sq Ft</Label>
                            <TooltipProvider>
                              <Tooltip delayDuration={50}>
                                <TooltipTrigger>
                                  <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                  <span className="sr-only">More Info</span>
                                </TooltipTrigger>
                                <TooltipContent>Gross Living Area Square Footage of subject property</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="gla"
                            inputMode="numeric"
                            placeholder="0"
                            value={glaSqFt}
                            onChange={(e) => {
                              clearReAuto("glaSqFt")
                              setGlaSqFt(e.target.value)
                            }}
                            className={`${reAuto.glaSqFt ? "border-2 border-highlight/70" : ""}`}
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
                            className={`h-9 w-full ${!touched.rural && rural === DEFAULTS.rural && !reAuto.rural ? "text-muted-foreground" : ""} ${reAuto.rural ? "border-2 border-highlight/70" : ""}`}
                          >
                              <SelectValue placeholder="No" />
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="str">STR</Label>
                            <TooltipProvider>
                              <Tooltip delayDuration={50}>
                                <TooltipTrigger>
                                  <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                  <span className="sr-only">More Info</span>
                                </TooltipTrigger>
                                <TooltipContent>Short-Term Rental</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
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
                            <div className="flex items-center gap-1">
                              <Label htmlFor="gla-expansion">{">20% GLA Expansion"}</Label>
                              <TooltipProvider>
                                <Tooltip delayDuration={50}>
                                  <TooltipTrigger>
                                    <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                    <span className="sr-only">More Info</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Rehab includes expanding the gross living area square footage by over 20% of current</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                            <div className="flex items-center gap-1">
                              <Label htmlFor="change-of-use">Change of Use</Label>
                              <TooltipProvider>
                                <Tooltip delayDuration={50}>
                                  <TooltipTrigger>
                                    <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                    <span className="sr-only">More Info</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Change of property use (ex. converting Single Family to Duplex)</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                            <div className="flex items-center gap-1">
                              <Label htmlFor="arv">ARV <span className="text-red-600">*</span></Label>
                              <TooltipProvider>
                                <Tooltip delayDuration={50}>
                                  <TooltipTrigger>
                                    <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                    <span className="sr-only">More Info</span>
                                  </TooltipTrigger>
                                  <TooltipContent>After-Repair Value</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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

                    <div className="mt-4">
                      <LeasedUnitsGrid
                        key={`units-${selectedScenarioId ?? "new"}`}
                        data={unitData}
                        onDataChange={setUnitData}
                      />
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
                              disabled={{ before: new Date() }}
                              captionLayout="label"
                              className="rounded-md border min-w-[264px]"
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
                                className={`${reAuto.acquisitionDate ? "border-2 border-highlight/70" : ""}`}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={acquisitionDate}
                                month={acqCalMonth}
                                onMonthChange={setAcqCalMonth}
                                onSelect={(d) => d && setAcquisitionDate(d)}
                                captionLayout="dropdown"
                                className="rounded-md border min-w-[264px]"
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
                                <SelectItem value="4-3-2-1">4-3-2-1</SelectItem>
                                <SelectItem value="3-2-1">3-2-1</SelectItem>
                                <SelectItem value="2-1">2-1</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="none">None</SelectItem>
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
                        <div className="flex items-center gap-1">
                          <Label htmlFor="aiv">
                            AIV<span className="text-red-600"> *</span>
                          </Label>
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger>
                                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                <span className="sr-only">More Info</span>
                              </TooltipTrigger>
                              <TooltipContent>As-Is Value</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
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
                          <div className="relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                            <Switch
                              id="max-lev"
                              checked={requestMaxLeverage}
                              onCheckedChange={setRequestMaxLeverage}
                              className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto rounded-md [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-sm [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-8.75 [&_span]:data-[state=checked]:rtl:-translate-x-8.75"
                            />
                            <span className="pointer-events-none relative ml-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full">
                              <span className="text-[10px] font-medium uppercase">No</span>
                            </span>
                            <span className="peer-data-[state=checked]:text-background pointer-events-none relative mr-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full">
                              <span className="text-[10px] font-medium uppercase">Yes</span>
                            </span>
                          </div>
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
                          <Input
                            id="lender-orig"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pr-6"
                            value={lenderOrig}
                            pattern="^\\d{0,3}(\\.\\d*)?$"
                            onChange={(e) => {
                              const raw = e.target.value
                              // allow empty to let users clear the field
                              if (raw === "") return setLenderOrig("")
                              // keep digits and a single decimal point
                              let v = raw.replace(/[^\d.]/g, "")
                              const firstDot = v.indexOf(".")
                              if (firstDot !== -1) {
                                v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "")
                              }
                              if (v.startsWith(".")) v = "0" + v
                              // clamp to 100
                              const num = Number(v)
                              if (!Number.isNaN(num) && num > 100) {
                                v = "100"
                              }
                              setLenderOrig(v)
                              setTouched((t) => ({ ...t, lenderOrig: true }))
                            }}
                            readOnly={isBroker}
                            disabled={isBroker}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="admin-fee">Lender Admin Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="admin-fee"
                            placeholder="0.00"
                            className="pl-6"
                            value={adminFee}
                            onValueChange={(v) => {
                              setAdminFee(v)
                              setTouched((t) => ({ ...t, adminFee: true }))
                            }}
                            readOnly={isBroker}
                            disabled={isBroker}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="broker-orig">Broker Origination</Label>
                        <div className="relative">
                          <Input
                            id="broker-orig"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pr-6"
                            value={brokerOrig}
                            pattern="^\\d{0,3}(\\.\\d*)?$"
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === "") return setBrokerOrig("")
                              let v = raw.replace(/[^\d.]/g, "")
                              const firstDot = v.indexOf(".")
                              if (firstDot !== -1) {
                                v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "")
                              }
                              if (v.startsWith(".")) v = "0" + v
                              const num = Number(v)
                              if (!Number.isNaN(num) && num > 100) {
                                v = "100"
                              }
                              setBrokerOrig(v)
                            }}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="broker-admin-fee">Broker Admin Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="broker-admin-fee"
                            placeholder="0.00"
                            className="pl-6"
                            value={brokerAdminFee}
                            onValueChange={setBrokerAdminFee}
                          />
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
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
                            <SearchIcon className="size-4" />
                            <span className="sr-only">Search</span>
                          </div>
                          <Input
                            id="borrower-name"
                            placeholder={borrowerName || DEFAULTS.borrowerName}
                            value={!touched.borrowerName ? "" : borrowerName}
                            onChange={(e) => {
                              const v = e.target.value
                              setBorrowerName(v)
                              setTouched((t) => ({ ...t, borrowerName: true }))
                              setEntityQuery(v)
                              setShowEntitySuggestions(true)
                              setSelectedEntityId(undefined)
                              setHasSessionEntity(false)
                            }}
                            onFocus={() => {
                              const seed = (borrowerName ?? "").trim()
                              setEntityQuery(seed.length > 0 ? seed : "*")
                              setShowEntitySuggestions(true)
                            }}
                            onBlur={() => {
                              // Delay to allow clicking on suggestions before closing
                              setTimeout(() => setShowEntitySuggestions(false), 150)
                            }}
                            className={`peer pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none ${selectedEntityId && hasSessionEntity ? "ring-1 ring-blue-500 border-blue-500" : ""}`}
                            autoComplete="off"
                          />
                          {entityLoading && (
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50">
                              <LoaderCircleIcon className="size-4 animate-spin" />
                              <span className="sr-only">Loading...</span>
                            </div>
                          )}
                          {showEntitySuggestions && entitySuggestions.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                              <ul className="max-h-56 overflow-auto">
                                {entitySuggestions.map((opt) => (
                                  <li key={opt.id}>
                                    <button
                                      type="button"
                                      className="w-full cursor-pointer rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
                                      onMouseDown={(e) => {
                                        e.preventDefault() // Prevent blur from firing
                                        setBorrowerName(opt.name)
                                        setTouched((t) => ({ ...t, borrowerName: true }))
                                        setShowEntitySuggestions(false)
                                        setSelectedEntityId(opt.id)
                                        setHasSessionEntity(true)
                                      }}
                                    >
                                      {opt.display}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="guarantors">Guarantor(s)</Label>
                        <div className="relative">
                          <TagsInput
                            value={guarantorTags.map((t) => t.name)}
                            onValueChange={(newValues) => {
                              // Prevent exceeding 4 guarantor limit
                              if (newValues.length > 4) return
                              // Keep only tags whose names are still in the new values
                              setGuarantorTags((prev) => prev.filter((t) => newValues.includes(t.name)))
                            }}
                            className="w-full"
                          >
                            <TagsInputList className="min-h-9 max-h-9 px-3 py-1 overflow-x-auto overflow-y-hidden flex-nowrap">
                              <SearchIcon className="size-4 text-muted-foreground mr-1 shrink-0" />
                              {guarantorTags.map((tag, idx) => (
                                <TagsInputItem
                                  key={`${tag.name}-${idx}`}
                                  value={tag.name}
                                  className={`text-xs px-1.5 py-0.5 shrink-0 ${tag.id ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                                >
                                  {tag.name}
                                </TagsInputItem>
                              ))}
                              <TagsInputInput
                                id="guarantors"
                                placeholder={
                                  guarantorTags.length >= 4
                                    ? "Max 4 guarantors"
                                    : guarantorTags.length === 0
                                      ? DEFAULTS.guarantorPlaceholder
                                      : ""
                                }
                                disabled={guarantorTags.length >= 4}
                                value={guarantorQuery}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setGuarantorQuery(v)
                                  if (v.trim().length > 0) {
                                    setShowGuarantorSuggestions(true)
                                  } else {
                                    setShowGuarantorSuggestions(false)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && guarantorQuery.trim()) {
                                    e.preventDefault()
                                    // Prevent exceeding 4 guarantor limit
                                    if (guarantorTags.length >= 4) return
                                    // Add as unlinked tag
                                    setGuarantorTags((prev) => [...prev, { name: guarantorQuery.trim() }])
                                    setGuarantorQuery("")
                                    setShowGuarantorSuggestions(false)
                                  }
                                }}
                                onFocus={() => {
                                  if (guarantorQuery.trim().length > 0) {
                                    setShowGuarantorSuggestions(true)
                                  }
                                }}
                                onBlur={() => {
                                  // Delay to allow clicking on suggestions before closing
                                  setTimeout(() => setShowGuarantorSuggestions(false), 150)
                                }}
                                autoComplete="off"
                              />
                              {guarantorLoading && (
                                <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground shrink-0" />
                              )}
                            </TagsInputList>
                          </TagsInput>
                          {showGuarantorSuggestions && guarantorSuggestions.filter((s) => !guarantorTags.some((t) => t.id === s.id)).length > 0 && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                              <ul className="max-h-56 overflow-auto">
                                {guarantorSuggestions.filter((s) => !guarantorTags.some((t) => t.id === s.id)).map((opt) => (
                                  <li key={opt.id}>
                                    <button
                                      type="button"
                                      className="w-full cursor-pointer rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
                                      onMouseDown={(e) => {
                                        e.preventDefault() // Prevent blur from firing
                                        // Prevent exceeding 4 guarantor limit
                                        if (guarantorTags.length >= 4) return
                                        // Add as linked tag with borrower ID
                                        setGuarantorTags((prev) => [...prev, { name: opt.name, id: opt.id }])
                                        setGuarantorQuery("")
                                        setShowGuarantorSuggestions(false)
                                      }}
                                    >
                                      {opt.display}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <Label htmlFor="uw-exception">UW Exception</Label>
                              <TooltipProvider>
                                <Tooltip delayDuration={50}>
                                  <TooltipTrigger>
                                    <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                                    <span className="sr-only">More Info</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Underwriting Exception</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                              captionLayout="dropdown"
                              className="rounded-md border min-w-[264px]"
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
                              captionLayout="dropdown"
                              className="rounded-md border min-w-[264px]"
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
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-3">
              <div className="flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={!canCalculate ? 0 : undefined}>
                        <Button onClick={handleCalculate} disabled={!canCalculate || isDispatching}>
                          Calculate
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canCalculate && missingFields.length > 0 && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium mb-1">Missing required fields:</p>
                        <ul className="list-disc pl-4 text-sm">
                          {missingFields.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
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
            memberId={selfMemberId}
            onApplyFees={(lo, la) => {
              if (typeof lo === "string" && lo.trim().length > 0) setLenderOrig(lo)
              if (typeof la === "string" && la.trim().length > 0) setAdminFee(la)
            }}
            loanId={currentLoanId}
            scenarioId={selectedScenarioId}
          />
        </section>
      </div>
    <Dialog open={mapsModalOpen} onOpenChange={setMapsModalOpen}>
      <DialogContent className="sm:max-w-[min(1100px,calc(100vw-1rem))]">
        <DialogHeader>
          <DialogTitle>Google Maps</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {fullAddress || "Enter street, city, state, and zip to preview the subject property."}
            </div>
            <div className="inline-flex gap-1">
              <Button
                size="sm"
                variant={mapsView === "map" ? "secondary" : "ghost"}
                onClick={() => setMapsView("map")}
                disabled={!gmapsReady || !!effectiveMapsError}
              >
                Map
              </Button>
              <Button
                size="sm"
                variant={mapsView === "street" ? "secondary" : "ghost"}
                onClick={() => setMapsView("street")}
                disabled={!canUseStreetView}
              >
                Street View
              </Button>
            </div>
          </div>
          {effectiveMapsError ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {effectiveMapsError}
            </div>
          ) : null}
          {!gmapsReady && !mapsLoadError ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">Loading Google Maps…</div>
          ) : null}
          {mapsModalOpen && gmapsReady && !effectiveMapsError ? (
            <div className="h-[520px] w-full overflow-hidden rounded-md border">
              {mapsCenter && !mapsLoading ? (
                mapsView === "street" ? (
                  <div className="relative h-full w-full">
                    <div ref={streetViewPanoRef} className="h-full w-full" />
                    {!gmaps || !streetViewPosition || streetViewStatus !== gmaps.StreetViewStatus.OK ? (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                        {streetViewStatus === gmaps?.StreetViewStatus?.ZERO_RESULTS
                          ? "Street View is not available here."
                          : "Searching for Street View…"}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapsCenter}
                    zoom={mapZoom}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: true,
                      controlSize: 24,
                    }}
                  >
                    <Marker position={mapsCenter} />
                  </GoogleMap>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {mapsLoading ? "Locating address…" : "Enter a complete address to preview."}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
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
  // Optional warnings from webhook response
  warning?: (string | null | undefined)[]
  warnings?: (string | null | undefined)[]
  // Bridge payload variants
  initial_loan_amount?: (string | number)[]
  rehab_holdback?: (string | number)[]
  total_loan_amount?: (string | number)[]
  initial_pitia?: (string | number)[]
  funded_pitia?: (string | number)[]
  [key: string]: unknown
}
type ProgramResult = {
  id?: string
  internal_name?: string
  external_name?: string
  webhook_url?: string
  status?: number
  ok?: boolean
  data?: ProgramResponseData | null
  initial_pitia_cache?: Record<number, string | number | null>
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
  memberId,
  loanId,
  scenarioId,
}: {
  r: ProgramResult
  programIdx: number
  selected: SelectedRow | null
  onSelect: (sel: SelectedRow) => void
  getInputs?: () => Record<string, unknown>
  memberId?: string | null
  loanId?: string
  scenarioId?: string
}) {
  const { orgRole } = useAuth()
  const isBroker = orgRole === "org:broker" || orgRole === "broker"
  // Hooks must be called unconditionally at the top of the component.
  const [mcpOpen, setMcpOpen] = useState<boolean>(false)
  const [sheetProps, setSheetProps] = useState<DSCRTermSheetProps>({})
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Log term sheet activity for this result card
  const logCardTermSheetActivity = async (action: "downloaded" | "shared", pdfFile: File) => {
    try {
      if (!loanId) return
      const formData = new FormData()
      formData.append("action", action)
      formData.append("loanId", loanId)
      if (scenarioId) formData.append("scenarioId", scenarioId)
      formData.append("inputs", JSON.stringify(getInputs?.() ?? null))
      formData.append("outputs", JSON.stringify([r.data ?? null].filter(Boolean)))
      formData.append("selected", JSON.stringify(selected?.values ?? null))
      formData.append("originalPdf", pdfFile)
      formData.append("editedPdf", pdfFile)
      await fetch("/api/activity/term-sheet", { method: "POST", body: formData }).catch(() => {})
    } catch {
      // Activity logging should not block user flow
    }
  }

  // Render the currently open preview into a PDF File
  const renderPreviewToPdf = async (): Promise<File | null> => {
    const root = (previewRef.current?.querySelector("[data-termsheet-root]") as HTMLElement | null) ?? null
    if (!root) return null
    const container = document.createElement("div")
    container.style.position = "fixed"
    container.style.left = "-10000px"
    container.style.top = "0"
    container.style.width = "816px"
    container.style.height = "1056px"
    container.style.overflow = "hidden"
    container.style.background = "#ffffff"
    container.className = "pdf-sandbox"
    const clone = root.cloneNode(true) as HTMLElement
    clone.style.width = "816px"
    clone.style.height = "auto"
    // Force disclaimer styles in the cloned DOM for PDF rendering
    try {
      const disclaim = clone.querySelector('.ts-disclaimer') as HTMLElement | null
      if (disclaim) {
        disclaim.style.paddingTop = '10px'
        disclaim.style.lineHeight = '6px'
        disclaim.style.margin = '0'
        disclaim.style.whiteSpace = 'normal'
        // Insert a hard spacer above to guarantee visible separation
        const spacer = document.createElement('div')
        spacer.style.display = 'block'
        spacer.style.height = '10px'
        spacer.style.width = '100%'
        if (disclaim.parentNode) {
          disclaim.parentNode.insertBefore(spacer, disclaim)
        }
      }
      // Move logo down 5px (PDF-only)
      {
        const headerEl = clone.querySelector('header') as HTMLElement | null
        if (headerEl) {
          const logoEl = headerEl.querySelector('img[alt="Logo"]') as HTMLElement | null
          if (logoEl) {
            logoEl.style.transform = 'translateY(5px)'
          }
        }
      }
      // Bridge: move option_number up 3px and ensure centered (hardcoded)
      {
        const bridgeRoot = clone.querySelector('[data-termsheet-root="bridge"]') as HTMLElement | null
        if (bridgeRoot) {
          // Find by text content to be robust against class changes
          const candidates = Array.from(bridgeRoot.querySelectorAll('div,span,p,h1,h2,h3')) as HTMLElement[]
          const opt = candidates.find(el => (el.textContent || '').includes('{{ option_number }}'))
          if (opt) {
            opt.style.display = 'block'
            opt.style.width = '100%'
            opt.style.textAlign = 'center'
            opt.style.marginLeft = 'auto'
            opt.style.marginRight = 'auto'
            opt.style.marginTop = '-3px'
            opt.style.transform = 'translateY(-3px)'
          }
        }
      }
      // Shift specific Credits rows and TOTAL SOURCES up by 8px
      const shiftLabels = new Set(['Loan Proceeds', 'Cash Due @ Closing'])
      const spans = Array.from(clone.querySelectorAll('span')) as HTMLElement[]
      spans.forEach((sp) => {
        const txt = (sp.textContent || '').trim()
        if (shiftLabels.has(txt)) {
          const row = sp.closest('div') as HTMLElement | null
          if (row) {
            row.style.transform = 'translateY(-8px)'
          }
        }
        if (txt === 'TOTAL SOURCES') {
          const row = sp.closest('div') as HTMLElement | null
          if (row) {
            row.style.transform = 'translateY(-5px)'
          }
        }
        if (txt === 'TOTAL USES') {
          const row = sp.closest('div') as HTMLElement | null
          if (row) {
            row.style.transform = 'translateY(-5px)'
          }
        }
      })
      // Shift ALL rows within the DEBITS list and the cash-out row up by 8px
      const debitsHeader = Array.from(clone.querySelectorAll('h3')).find(
        (h) => (h.textContent || '').trim() === 'DEBITS'
      ) as HTMLElement | undefined
      if (debitsHeader) {
        const debitsPanel = debitsHeader.closest('.border-2') as HTMLElement | null
        if (debitsPanel) {
          const list = debitsPanel.querySelector('.space-y-1') as HTMLElement | null
          if (list) {
            Array.from(list.children).forEach((row) => {
              const el = row as HTMLElement
              el.style.transform = 'translateY(-8px)'
            })
          }
          const extraRows = debitsPanel.querySelectorAll('.flex.items-center.justify-between.text-xs.mt-1') as NodeListOf<HTMLElement>
          extraRows.forEach((el) => { el.style.transform = 'translateY(-8px)' })
          // PDF-only: ensure the Cash Out to Borrower row aligns with other DEBITS rows and is moved up 5px
          const pr2Blocks = Array.from(debitsPanel.querySelectorAll('.pr-2')) as HTMLElement[]
          const emdBlock = pr2Blocks.length ? pr2Blocks[pr2Blocks.length - 1] : null
          if (emdBlock) {
            const cashOutRow = emdBlock.querySelector(':scope > div:last-child') as HTMLElement | null
            if (cashOutRow) {
              const left = cashOutRow.querySelector('span:first-child') as HTMLElement | null
              if (left) {
                // Match the effective left padding of list rows (px-2 on container + pl-2 on span => ~16px)
                left.style.paddingLeft = '16px'
                left.style.display = 'inline-block'
              }
              // Move only this row up by 5px in PDF sandbox
              cashOutRow.style.transform = 'translateY(-5px)'
            }
          }
        }
      }
      // Liquidity block special inner left paddings
      const liqHeader = Array.from(clone.querySelectorAll('h3')).find(
        (h) => (h.textContent || '').trim() === 'Liquidity Requirement'
      ) as HTMLElement | undefined
      if (liqHeader) {
        const liqContainer = liqHeader.parentElement as HTMLElement | null
        const liqList = liqContainer ? (liqContainer.querySelector('.space-y-1') as HTMLElement | null) : null
        if (liqList) {
          const liqRows = Array.from(liqList.children) as HTMLElement[]
          const applyPad = (idx: number, px: number) => {
            const r = liqRows[idx]
            if (!r) return
            const left = r.querySelector('span:first-child') as HTMLElement | null
            if (left) {
              left.style.paddingLeft = `${px}px`
              left.style.display = 'inline-block'
            }
          }
          applyPad(1, 15) // Cash to Close
          applyPad(2, 25) // Down Payment label
          applyPad(3, 25) // Escrows
          applyPad(4, 15) // Reserves label
          applyPad(5, 15) // Mortgage Debt - 1.00%
        }
      }
      // Liquidity block special paddings
      const liqHeader2 = Array.from(clone.querySelectorAll('h3')).find(
        (h) => (h.textContent || '').trim() === 'Liquidity Requirement'
      ) as HTMLElement | undefined
      if (liqHeader2) {
        const liqContainer = liqHeader2.parentElement as HTMLElement | null
        const liqList = liqContainer ? (liqContainer.querySelector('.space-y-1') as HTMLElement | null) : null
        if (liqList) {
          const rows = Array.from(liqList.querySelectorAll(':scope > div')) as HTMLElement[]
          // By index: 1 Cash to Close 15px; 2 Down Payment 25px; 3 Escrows 25px; 4 Reserves 25px; 5 Mortgage Debt 15px
          const indexToPadding: Record<number, number> = { 1: 15, 2: 25, 3: 25, 4: 25, 5: 15 }
          Object.entries(indexToPadding).forEach(([idxStr, pad]) => {
            const idx = Number(idxStr)
            const row = rows[idx]
            if (!row) return
            const left = row.querySelector('span:first-child') as HTMLElement | null
            if (!left) return
            left.style.setProperty('padding-left', `${pad}px`, 'important')
            left.style.setProperty('margin-left', '0px', 'important')
            left.style.setProperty('display', 'inline-block', 'important')
          })
        }
      }
    } catch {}
    container.appendChild(clone)
    // Bridge PDF-only: equalize left \"LOAN DETAILS\" box height to right column height
    try {
      const bridgeRoot = container.querySelector('[data-termsheet-root=\"bridge\"]') as HTMLElement | null
      if (bridgeRoot) {
        const leftBox = bridgeRoot.querySelector('section.border-2.border-solid.border-black') as HTMLElement | null
        const rightCol = bridgeRoot.querySelector('section.border-0') as HTMLElement | null
        if (leftBox && rightCol) {
          const rightRect = rightCol.getBoundingClientRect()
          const targetH = rightRect && rightRect.height ? Math.ceil(rightRect.height) : 0
          if (targetH > 0) {
            leftBox.setAttribute('data-equalize-left', 'true')
            leftBox.style.overflow = 'hidden'
            const dyn = document.createElement('style')
            dyn.textContent = `.pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-2.border-solid.border-black[data-equalize-left=\"true\"]{height:${targetH}px !important; overflow:hidden !important;}`
            container.appendChild(dyn)
          }
        }
      }
    } catch {}
    // PDF-only style overrides (do not change text alignment; only visuals/spacing/vertical centering)
    const style = document.createElement("style")
    style.textContent = `
      /* Remove orange editing affordances only; preserve text alignment and flow */
      .pdf-sandbox .ts-edit {
        background: transparent !important;
        border-color: transparent !important;
        outline: none !important;
        padding: 0 !important;
        display: inline !important;
      }
      /* Remove viewport-based vertical centering from BridgeTermSheet root so there's no extra top gap */
      .pdf-sandbox [data-termsheet-root] {
        min-height: 0 !important;
        height: auto !important;
        display: block !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .pdf-sandbox [data-termsheet-root] > div {
        margin-left: auto !important;
        margin-right: auto !important;
      }
      /* Slightly tighten spacing in the left column sections only */
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child .mb-3 { margin-bottom: 0.3rem !important; }
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child h3 + div { margin-top: 0.12rem !important; }
      /* HARD-SET row spacing in right column (CREDITS/DEBITS lists) for PDF output */
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .space-y-1 > :not([hidden]) ~ :not([hidden]) {
        margin-top: 0 !important;
      }
      /* Also neutralize any additional margins that sneak in via mt-1 on rows in PDF */
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .mt-1 {
        margin-top: 0 !important;
      }
      /* Force per-row containers in right column to use the same compact spacing */
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .px-2.pt-1.pb-1 > .flex,
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .px-2 > .flex,
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .space-y-1 > .flex,
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .flex.items-center.justify-between.text-xs {
        margin-top: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        line-height: 1.1 !important;
      }
      /* Collapse any default margins inside right-column px-2 containers, then reapply uniform 2px gap */
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .px-2 > * {
        margin-top: 0 !important;
      }
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .px-2 > * + * {
        margin-top: 0 !important;
      }
      /* Ensure left column rows match: zero margins; rely on line-height only */
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child .space-y-1 > :not([hidden]) ~ :not([hidden]),
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child .px-2 > * + *,
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child .mt-1 {
        margin-top: 0 !important;
      }
      /* PDF-only vertical nudge for DSCR header labels to match modal */
      .pdf-sandbox [data-termsheet-root] .ts-bar-label { transform: translateY(-8px); }
      /* Bridge PDF-only: move option number up 3px and center */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] div.mb-3 > .text-center {
        transform: translateY(-4px) !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      /* Bridge PDF-only: center and stack the main heading and subheading */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-dashed .p-3 h1 {
        display: block !important;
        text-align: center !important;
        margin-bottom: 4px !important;
        transform: translateY(-5px) !important;
      }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-dashed .p-3 p {
        display: block !important;
        text-align: center !important;
        transform: translateY(-5px) !important;
      }
      /* Bridge PDF-only: reduce LOAN DETAILS header bar height by 3px */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-2.border-solid.border-black > header {
        padding-top: 3px !important;
        padding-bottom: 3px !important;
      }
      /* Bridge PDF-only: match header paddings for CREDITS / TOTAL SOURCES / DEBITS / TOTAL USES */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-black { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-black { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] { padding-top: 3px !important; padding-bottom: 3px !important; }
      /* Bridge PDF-only: align CREDITS / TOTAL SOURCES / DEBITS / TOTAL USES left with section header */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-black { padding-left: 8px !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] { padding-left: 8px !important; padding-right: 8px !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-black { padding-left: 8px !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] { padding-left: 8px !important; padding-right: 8px !important; }
      /* Bridge PDF-only: move CREDITS list content up 8px */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .mb-0 { position: relative !important; top: -8px !important; }
      /* Bridge PDF-only: move all DEBITS body content up 8px (rows and extras) */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > :not(.bg-black):not(.bg-\\[\\#808080\\]) { position: relative !important; top: -8px !important; }
      /* Bridge PDF-only: move LOAN DETAILS and CLOSING STATEMENT ESTIMATE up 7px and left-align */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-2.border-solid.border-black > header h2 { transform: translateY(-7px) !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-0 > header h2 { transform: translateY(-7px) !important; text-align: left !important; }
      /* Bridge PDF-only: raise ALL content inside left LOAN DETAILS box by 5px */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-2.border-solid.border-black > .px-2.pt-2.pb-0 { position: relative !important; top: -5px !important; }
      /* Bridge PDF-only: add 5px left padding to LOAN DETAILS row labels (exclude section headings) */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-2.border-solid.border-black > .px-2.pt-2.pb-0 .flex.justify-between > span:first-child {
        padding-left: 5px !important;
        display: inline-block !important;
      }
      /* Bridge PDF-only: move CREDITS text up 4px (relative top) */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-black h3 { position: relative !important; top: -8px !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] h3 { position: relative !important; top: -7px !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] > .flex > span:last-child { position: relative !important; top: -7px !important; }
      /* Bridge PDF-only: move DEBITS up 4px (do not affect CREDITS) */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-black h3 { position: relative !important; top: -8px !important; text-align: left !important; }
      /* Bridge PDF-only: move TOTAL USES down 2px */
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] h3 { position: relative !important; top: -7px !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root=\"bridge\"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] > .flex > span:last-child { position: relative !important; top: -7px !important; }
      /* PDF-only: tighten disclaimer lines and remove paragraph margins */
      .pdf-sandbox [data-termsheet-root] footer, .pdf-sandbox [data-termsheet-root] footer * {
        line-height: 6px !important; margin: 0 !important; padding: 0 !important; white-space: normal !important; letter-spacing: 0 !important; word-spacing: 0 !important;
      }
      /* Preserve top padding on disclaimer container */
      .pdf-sandbox [data-termsheet-root] .ts-disclaimer { padding-top: 10px !important; }
      /* PDF-only: prevent merge-tag placeholders from breaking across lines */
      .pdf-sandbox [data-termsheet-root] span[style*="dashed #f59e0b"] {
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
      }
      /* PDF-only: 5px inner left padding for Borrower & Guarantors left labels */
      .pdf-sandbox [data-termsheet-root] section:first-child .space-y-1:nth-of-type(1) .flex.text-xs > span:first-child {
        padding-left: 5px !important;
        display: inline-block !important;
      }
    `
    container.appendChild(style)
    // Remove blank extra rows in the right column for PDF output (both label and value are empty/whitespace)
    try {
      const blankExtraRows = container.querySelectorAll(
        '.pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:last-child .pr-2 > .flex'
      ) as NodeListOf<HTMLElement>
      blankExtraRows.forEach((row) => {
        const spans = row.querySelectorAll('span')
        const a = spans[0]?.textContent?.trim() ?? ''
        const b = spans[1]?.textContent?.trim() ?? ''
        if (a === '' && b === '') {
          row.style.display = 'none'
        }
      })
    } catch {}
    document.body.appendChild(container)
    try {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      // Balance clarity and size: render at higher scale and slightly higher JPEG quality
      const canvas = await html2canvas(container, { scale: 1.75, backgroundColor: "#ffffff", useCORS: true, logging: false })
      const pdf = new jsPDF({ unit: "px", format: [816, 1056], orientation: "portrait", compress: true })
      const img = canvas.toDataURL("image/jpeg", 0.88)
      pdf.addImage(img, "JPEG", 0, 0, 816, 1056)
      const blob = pdf.output("blob")
      const filename = `term-sheet-${Date.now()}.pdf`
      return new File([blob], filename, { type: "application/pdf" })
    } finally {
      document.body.removeChild(container)
    }
  }
  // If this program hasn't returned yet, keep showing the generating loader inside the same container.
  if (!r?.data) {
    return <ResultCardLoader meta={{ internal_name: r?.internal_name, external_name: r?.external_name }} isBroker={isBroker} />
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
  const programName = (isBroker ? (r?.external_name ?? "") : (r?.internal_name ?? r?.external_name ?? "")) as string
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
  const rawWarn = Array.isArray(d.warning)
    ? d.warning
    : Array.isArray((d as Record<string, unknown>)?.warnings as unknown[])
    ? ((d as Record<string, unknown>).warnings as (string | null | undefined)[])
    : []
  const warningList: string[] = rawWarn
    .filter((v) => typeof v === "string" && String(v).trim().length > 0)
    .map((v) => String(v))

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

  async function openTermSheetPreview(rowIndex?: number, opts?: { autoDownloadPdf?: boolean; autoShare?: boolean }) {
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
        // include initial_pitia (from response or cache)
        const ip = pick<string | number>(d?.initial_pitia as any, idx)
        payloadRow["initial_pitia"] = ip ?? (r as any)?.initial_pitia_cache?.[idx]
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
        program: isBroker ? (r.external_name ?? "Program") : (r.internal_name ?? r.external_name ?? "Program"),
        program_id: r.id ?? null,
        row_index: idx,
        inputs: (() => {
          // Include any lender fee overrides or defaults returned by the program webhook
          const out = { ...inputs }
          const pickAt = <T,>(val: T[] | T | undefined, i: number): T | undefined =>
            Array.isArray(val) ? (val as T[])[i] : (val as T | undefined)
          const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim())
          const selLenderOrig = toStr(pickAt<any>((d as any)["lender_orig_percent"], idx))
          const selLenderAdmin = toStr(pickAt<any>((d as any)["lender_admin_fee"], idx))
          const defLenderOrig = toStr(
            pickAt<any>((d as any)["default_lender_orig_percent"], idx) ??
              (d as any)["default_lender_orig_percent"] ??
              (r as any)?.lender_defaults_cache?.default_lender_orig_percent
          )
          const defLenderAdmin = toStr(
            pickAt<any>((d as any)["default_lender_admin_fee"], idx) ??
              (d as any)["default_lender_admin_fee"] ??
              (r as any)?.lender_defaults_cache?.default_lender_admin_fee
          )
          if (selLenderOrig) out["lender_orig_percent"] = selLenderOrig
          if (selLenderAdmin) {
            out["lender_admin_fee"] = selLenderAdmin
            out["admin_fee"] = selLenderAdmin
          }
          // Always include default values, even if empty
          out["default_lender_orig_percent"] = defLenderOrig
          out["default_lender_admin_fee"] = defLenderAdmin
          return out
        })(),
        row: normalizedRow,
        organization_member_id: memberId ?? null,
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
      let enriched: DSCRTermSheetProps =
        json && typeof json === "object" && !Array.isArray(json)
          ? ({ loan_type: (isBridgeResp || isBridgeProgramName) ? "bridge" : "dscr", ...json } as DSCRTermSheetProps)
          : ({ loan_type: (isBridgeResp || isBridgeProgramName) ? "bridge" : "dscr" } as DSCRTermSheetProps)
      // Cache any returned default lender values at the program level for subsequent term sheets
      try {
        const retDefOrig = String((json as any)?.default_lender_orig_percent ?? "").trim()
        const retDefAdmin = String((json as any)?.default_lender_admin_fee ?? "").trim()
        ;(r as any).lender_defaults_cache = {
          default_lender_orig_percent: retDefOrig,
          default_lender_admin_fee: retDefAdmin,
          ...(typeof (r as any).lender_defaults_cache === "object" ? (r as any).lender_defaults_cache : {}),
        }
      } catch {/* ignore */}
      // Fallback: if logo not provided by webhook, pull broker company branding
      try {
        const currentLogo = String((enriched as any)?.logo ?? "").trim()
        if (!currentLogo) {
          const resLogo = await fetch("/api/org/company-branding", { cache: "no-store" })
          const jLogo = (await resLogo.json().catch(() => ({}))) as { logo_url?: string }
          const logoUrl = (typeof jLogo?.logo_url === "string" && jLogo.logo_url.length > 0) ? jLogo.logo_url : ""
          if (logoUrl) {
            enriched = { ...enriched, logo: logoUrl }
          }
        }
      } catch { /* ignore */ }
      setSheetProps(enriched)
      if (opts?.autoDownloadPdf || opts?.autoShare) {
        setTimeout(async () => {
          try {
            const file = await renderPreviewToPdf()
            if (!file) throw new Error("Could not render PDF")
            if (opts?.autoShare) {
              const canShareFiles =
                typeof navigator !== "undefined" &&
                "canShare" in navigator &&
                (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
              const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
              try {
              if (nav?.share && canShareFiles) {
                await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                void logCardTermSheetActivity("shared", file)
              } else {
                await saveFileWithPrompt(file)
                toast({ title: "Saved", description: "PDF saved to your device." })
                void logCardTermSheetActivity("downloaded", file)
                }
              } catch (shareErr) {
                const msg = shareErr instanceof Error ? shareErr.message.toLowerCase() : ""
                const name = (shareErr as any)?.name ?? ""
                // Swallow user-initiated aborts/cancels
                if (msg.includes("cancel") || name === "AbortError" || name === "NotAllowedError") {
                  // no toast
                } else {
                  toast({ title: "PDF error", description: (shareErr as any)?.message || "Share failed", variant: "destructive" })
                }
              }
            } else if (opts?.autoDownloadPdf) {
              await saveFileWithPrompt(file)
              void logCardTermSheetActivity("downloaded", file)
            }
          } catch (e) {
            // When the preview hasn't fully rendered yet or user cancels share, avoid noisy errors
            const message = e instanceof Error ? e.message : "Failed to create PDF"
            if (!/cancel/i.test(message)) {
              toast({ title: "PDF not ready", description: "Preparing term sheet, try again in a moment.", variant: "default" })
            }
          }
        }, 300)
      }
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
            {programDisplayName(r, isBroker)}
          </div>
          {!isBroker ? <div className="text-xs font-semibold">{r.external_name}</div> : null}
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Preview"
            onClick={() => openTermSheetPreview()}
          >
            <IconEye className="h-4 w-4" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Share"
            onClick={() => openTermSheetPreview(undefined, { autoShare: true })}
          >
            <IconShare3 className="h-4 w-4" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Download"
            onClick={() => openTermSheetPreview(undefined, { autoDownloadPdf: true })}
          >
            <IconDownload className="h-4 w-4" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {warningList.length > 0 ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <Popover>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <div
                        className="inline-flex cursor-pointer items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-100"
                        aria-label="Warnings"
                        title="View warnings"
                      >
                        WARNING
                      </div>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="max-w-xs p-2">
                    <ul className="list-disc pl-5 text-xs">
                      {warningList.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
                <TooltipContent>
                  <ul className="list-disc pl-5 text-xs">
                    {warningList.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
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
                            className={`border-b last:border-0 ${
                              ((selected?.programId
                                ? selected.programId === (r?.id ?? null)
                                : selected?.programIdx === programIdx) &&
                                selected?.rowIdx === i)
                                ? "bg-accent/30"
                                : ""
                            }`}
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
                                  programName: isBroker ? (r.external_name ?? `Program ${programIdx + 1}`) : (r.internal_name ?? r.external_name ?? `Program ${programIdx + 1}`),
                                  programId: r.id ?? null,
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
                                {((selected?.programId
                                  ? selected.programId === (r?.id ?? null)
                                  : selected?.programIdx === programIdx) &&
                                  selected?.rowIdx === i) ? (
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
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Share row"
                                onClick={() => openTermSheetPreview(i, { autoShare: true })}
                              >
                                <IconShare3 className="h-4 w-4" />
                              </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Download row"
                                  onClick={() => openTermSheetPreview(i, { autoDownloadPdf: true })}
                                >
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
        <DialogContent className="sm:max-w-[min(860px,calc(100vw-2rem))] max-h-[90vh] overflow-hidden px-6 pt-4 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95vh] max-sm:px-4 max-sm:pt-2 max-sm:pb-2">
          <DialogHeader className="mb-1">
            <DialogTitle className="text-base">Term Sheet</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            aria-label="Share term sheet"
            className="absolute right-24 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            onClick={async () => {
              try {
                const file = await renderPreviewToPdf()
                if (!file) throw new Error("Could not render PDF")
                const canShareFiles =
                  typeof navigator !== "undefined" &&
                  "canShare" in navigator &&
                  (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
                const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
                if (nav?.share && canShareFiles) {
                  await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                  void logCardTermSheetActivity("shared", file)
                } else {
                  await saveFileWithPrompt(file)
                  toast({ title: "Saved", description: "PDF saved to your device." })
                  void logCardTermSheetActivity("downloaded", file)
                }
              } catch (e) {
                const message = e instanceof Error ? e.message : "Unable to share"
                toast({ title: "Share failed", description: message, variant: "destructive" })
              }
            }}
          >
            <IconShare3 />
          </button>
          <button
            type="button"
            aria-label="Download term sheet"
            className="absolute right-14 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            onClick={async () => {
              try {
                const file = await renderPreviewToPdf()
                if (!file) throw new Error("Could not render PDF")
                await saveFileWithPrompt(file)
                void logCardTermSheetActivity("downloaded", file)
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
              <ScaledTermSheetPreview sheetProps={sheetProps as DSCRTermSheetProps} pageRef={previewRef} readOnly={isBroker} />
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
    <div className="rounded-md border p-2 min-w-0">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="w-full overflow-hidden text-left tabular-nums tracking-tight leading-5 text-[13px] sm:text-sm font-semibold truncate">
        {value ?? ""}
      </div>
    </div>
  )
}

function ResultCardLoader({ meta, isBroker }: { meta?: { internal_name?: string; external_name?: string }; isBroker: boolean }) {
  return (
    <div className="mb-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">{isBroker ? (meta?.external_name ?? "Program") : (meta?.internal_name ?? meta?.external_name ?? "Program")}</div>
          {!isBroker ? <div className="text-xs font-semibold">{meta?.external_name ?? ""}</div> : null}
        </div>
        <div className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border text-black border-white dark:text-white dark:border-black bg-transparent">
          Generating
        </div>
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
  memberId,
  onApplyFees,
  loanId,
  scenarioId,
}: {
  results: ProgramResult[]
  loading?: boolean
  placeholders?: Array<{ id?: string; internal_name?: string; external_name?: string }>
  onSelectedChange?: (sel: SelectedRow | null) => void
  selectedFromProps?: SelectedRow | null
  getInputs?: () => Record<string, unknown>
  memberId?: string | null
  onApplyFees?: (lenderOrig?: string, lenderAdminFee?: string) => void
  loanId?: string
  scenarioId?: string
}) {
  const { orgRole } = useAuth()
  const isBroker = orgRole === "org:broker" || orgRole === "broker"
  const [selected, setSelected] = React.useState<SelectedRow | null>(null)
  useEffect(() => {
    onSelectedChange?.(selected)
  }, [selected, onSelectedChange])

  // When a row is starred, if that program's response contains lender fees for the selected row, push them to the main inputs.
  useEffect(() => {
    if (!selected) return
    try {
      const d = (results?.[selected.programIdx]?.data ?? {}) as ProgramResponseData | any
      const idx = selected.rowIdx ?? Number(d?.highlight_display ?? 0)
      const pickAt = <T,>(val: T[] | T | undefined, i: number): T | undefined =>
        Array.isArray(val) ? (val as T[])[i] : (val as T | undefined)
      const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim())
      const selLenderOrig = toStr(pickAt<any>((d as any)["lender_orig_percent"], idx))
      const selLenderAdmin = toStr(pickAt<any>((d as any)["lender_admin_fee"], idx))
      if (selLenderOrig || selLenderAdmin) {
        onApplyFees?.(selLenderOrig || undefined, selLenderAdmin || undefined)
      }
    } catch {
      // ignore
    }
  }, [selected, results, onApplyFees])
  // Log term sheet activity from the main results panel
  const logPanelTermSheetActivity = async (action: "downloaded" | "shared", pdfFile: File) => {
    try {
      if (!loanId) return
      const formData = new FormData()
      formData.append("action", action)
      formData.append("loanId", loanId)
      if (scenarioId) formData.append("scenarioId", scenarioId)
      formData.append("inputs", JSON.stringify(getInputs?.() ?? null))
      formData.append("outputs", JSON.stringify(results?.map(r => r.data ?? null).filter(Boolean) ?? null))
      formData.append("selected", JSON.stringify(selected?.values ?? null))
      formData.append("originalPdf", pdfFile)
      formData.append("editedPdf", pdfFile)
      await fetch("/api/activity/term-sheet", { method: "POST", body: formData }).catch(() => {})
    } catch {
      // Activity logging should not block user flow
    }
  }

  useEffect(() => {
    if (!selectedFromProps) return
    // If a program name was saved, remap to current results order and nearest row by price
    if (Array.isArray(results) && results.length > 0) {
      let progIdx = selectedFromProps.programIdx ?? 0
      // Prefer explicit program id if present
      if (selectedFromProps.programId) {
        const idxById = results.findIndex(
          (r) => r.id === selectedFromProps.programId || r.internal_name === selectedFromProps.programId || r.external_name === selectedFromProps.programId
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

  // Render main preview to a PDF File
  const renderPreviewToPdfMain = async (): Promise<File | null> => {
    const root = (previewRefMain.current?.querySelector("[data-termsheet-root]") as HTMLElement | null) ?? null
    if (!root) return null
    const container = document.createElement("div")
    container.style.position = "fixed"
    container.style.left = "-10000px"
    container.style.top = "0"
    container.style.width = "816px"
    container.style.height = "1056px"
    container.style.overflow = "hidden"
    container.style.background = "#ffffff"
    container.className = "pdf-sandbox"
    const clone = root.cloneNode(true) as HTMLElement
    clone.style.width = "816px"
    clone.style.height = "auto"
    // Force disclaimer styles in the cloned DOM for PDF rendering
    try {
      const disclaim = clone.querySelector('.ts-disclaimer') as HTMLElement | null
      if (disclaim) {
        disclaim.style.paddingTop = '10px'
        disclaim.style.lineHeight = '6px'
        disclaim.style.margin = '0'
        disclaim.style.whiteSpace = 'normal'
        // Insert a hard spacer above to guarantee visible separation
        const spacer = document.createElement('div')
        spacer.style.display = 'block'
        spacer.style.height = '10px'
        spacer.style.width = '100%'
        if (disclaim.parentNode) {
          disclaim.parentNode.insertBefore(spacer, disclaim)
        }
      }
      // Move logo down 5px (PDF-only)
      {
        const headerEl = clone.querySelector('header') as HTMLElement | null
        if (headerEl) {
          const logoEl = headerEl.querySelector('img[alt="Logo"]') as HTMLElement | null
          if (logoEl) {
            logoEl.style.transform = 'translateY(5px)'
          }
        }
      }
      // Bridge: move option_number up 3px and ensure centered (hardcoded)
      {
        const bridgeRoot = clone.querySelector('[data-termsheet-root="bridge"]') as HTMLElement | null
        if (bridgeRoot) {
          const candidates = Array.from(bridgeRoot.querySelectorAll('div,span,p,h1,h2,h3')) as HTMLElement[]
          const opt = candidates.find(el => (el.textContent || '').includes('{{ option_number }}'))
          if (opt) {
            opt.style.display = 'block'
            opt.style.width = '100%'
            opt.style.textAlign = 'center'
            opt.style.marginLeft = 'auto'
            opt.style.marginRight = 'auto'
            opt.style.marginTop = '-3px'
            opt.style.transform = 'translateY(-3px)'
          }
        }
      }
      // Shift specific Credits rows and TOTAL SOURCES up by 8px
      const shiftLabels = new Set(['Loan Proceeds', 'Cash Due @ Closing'])
      const spans = Array.from(clone.querySelectorAll('span')) as HTMLElement[]
      spans.forEach((sp) => {
        const txt = (sp.textContent || '').trim()
        if (shiftLabels.has(txt)) {
          const row = sp.closest('div') as HTMLElement | null
          if (row) {
            row.style.transform = 'translateY(-8px)'
          }
        }
        if (txt === 'TOTAL SOURCES') {
          const row = sp.closest('div') as HTMLElement | null
          if (row) {
            row.style.transform = 'translateY(-5px)'
          }
        }
        if (txt === 'TOTAL USES') {
          const row = sp.closest('div') as HTMLElement | null
          if (row) {
            row.style.transform = 'translateY(-5px)'
          }
        }
      })
      // Shift ALL rows within the DEBITS list and the cash-out row up by 8px
      const debitsHeader = Array.from(clone.querySelectorAll('h3')).find(
        (h) => (h.textContent || '').trim() === 'DEBITS'
      ) as HTMLElement | undefined
      if (debitsHeader) {
        const debitsPanel = debitsHeader.closest('.border-2') as HTMLElement | null
        if (debitsPanel) {
          const list = debitsPanel.querySelector('.space-y-1') as HTMLElement | null
          if (list) {
            Array.from(list.children).forEach((row) => {
              const el = row as HTMLElement
              el.style.transform = 'translateY(-8px)'
            })
          }
          const extraRows = debitsPanel.querySelectorAll('.flex.items-center.justify-between.text-xs.mt-1') as NodeListOf<HTMLElement>
          extraRows.forEach((el) => { el.style.transform = 'translateY(-8px)' })
        }
      }
      // Liquidity block special inner left paddings
      const liqHeader = Array.from(clone.querySelectorAll('h3')).find(
        (h) => (h.textContent || '').trim() === 'Liquidity Requirement'
      ) as HTMLElement | undefined
      if (liqHeader) {
        const liqContainer = liqHeader.parentElement as HTMLElement | null
        const liqList = liqContainer ? (liqContainer.querySelector('.space-y-1') as HTMLElement | null) : null
        if (liqList) {
          const liqRows = Array.from(liqList.children) as HTMLElement[]
          const applyPad = (idx: number, px: number) => {
            const r = liqRows[idx]
            if (!r) return
            const left = r.querySelector('span:first-child') as HTMLElement | null
            if (left) {
              left.style.paddingLeft = `${px}px`
              left.style.display = 'inline-block'
            }
          }
          applyPad(1, 15) // Cash to Close
          applyPad(2, 25) // Down Payment label
          applyPad(3, 25) // Escrows
          applyPad(4, 15) // Reserves label
          applyPad(5, 15) // Mortgage Debt - 1.00%
        }
      }
      // Liquidity block special paddings
      const liqHeader2 = Array.from(clone.querySelectorAll('h3')).find(
        (h) => (h.textContent || '').trim() === 'Liquidity Requirement'
      ) as HTMLElement | undefined
      if (liqHeader2) {
        const liqContainer = liqHeader2.parentElement as HTMLElement | null
        const liqList = liqContainer ? (liqContainer.querySelector('.space-y-1') as HTMLElement | null) : null
        if (liqList) {
          const rows = Array.from(liqList.querySelectorAll(':scope > div')) as HTMLElement[]
          const indexToPadding: Record<number, number> = { 1: 15, 2: 25, 3: 25, 4: 25, 5: 15 }
          Object.entries(indexToPadding).forEach(([idxStr, pad]) => {
            const idx = Number(idxStr)
            const row = rows[idx]
            if (!row) return
            const left = row.querySelector('span:first-child') as HTMLElement | null
            if (!left) return
            left.style.setProperty('padding-left', `${pad}px`, 'important')
            left.style.setProperty('margin-left', '0px', 'important')
            left.style.setProperty('display', 'inline-block', 'important')
          })
        }
      }
    } catch {}
    container.appendChild(clone)
    // Bridge PDF-only: equalize left \"LOAN DETAILS\" box height to right column height
    try {
      const bridgeRoot = container.querySelector('[data-termsheet-root=\"bridge\"]') as HTMLElement | null
      if (bridgeRoot) {
        const leftBox = bridgeRoot.querySelector('section.border-2.border-solid.border-black') as HTMLElement | null
        const rightCol = bridgeRoot.querySelector('section.border-0') as HTMLElement | null
        if (leftBox && rightCol) {
          const rightRect = rightCol.getBoundingClientRect()
          const targetH = rightRect && rightRect.height ? Math.ceil(rightRect.height) : 0
          if (targetH > 0) {
            leftBox.setAttribute('data-equalize-left', 'true')
            leftBox.style.overflow = 'hidden'
            const dyn = document.createElement('style')
            dyn.textContent = `.pdf-sandbox [data-termsheet-root=\"bridge\"] section.border-2.border-solid.border-black[data-equalize-left=\"true\"]{height:${targetH}px !important; overflow:hidden !important;}`
            container.appendChild(dyn)
          }
        }
      }
    } catch {}
    const style = document.createElement("style")
    style.textContent = `
      .pdf-sandbox .ts-edit {
        background: transparent !important;
        border-color: transparent !important;
        outline: none !important;
        padding: 0 !important;
        display: inline !important;
      }
      .pdf-sandbox [data-termsheet-root] {
        min-height: 0 !important;
        height: auto !important;
        display: block !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .pdf-sandbox [data-termsheet-root] > div {
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child .mb-3 { margin-bottom: 0.3rem !important; }
      .pdf-sandbox [data-termsheet-root] .grid.grid-cols-2 > section:first-child h3 + div { margin-top: 0.12rem !important; }
      .pdf-sandbox [data-termsheet-root] .ts-bar-label { transform: translateY(-8px); }
      /* Bridge PDF-only: move option number up 3px and center */
      .pdf-sandbox [data-termsheet-root="bridge"] div.mb-3 > .text-center {
        transform: translateY(-4px) !important;
        text-align: center !important;
        display: block !important;
        width: 100% !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      /* Bridge PDF-only: center and stack the main heading and subheading */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-dashed .p-3 h1 {
        display: block !important;
        text-align: center !important;
        margin-bottom: 4px !important;
        transform: translateY(-5px) !important;
      }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-dashed .p-3 p {
        display: block !important;
        text-align: center !important;
        transform: translateY(-5px) !important;
      }
      /* Bridge PDF-only: reduce LOAN DETAILS header bar height by 3px */
      .pdf-sandbox [data-termsheet-root="bridge"] section.border-2.border-solid.border-black > header {
        padding-top: 3px !important;
        padding-bottom: 3px !important;
      }
      /* Bridge PDF-only: match header paddings for CREDITS / TOTAL SOURCES / DEBITS / TOTAL USES */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-black { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-black { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] { padding-top: 3px !important; padding-bottom: 3px !important; }
      /* Bridge PDF-only: align CREDITS / TOTAL SOURCES / DEBITS / TOTAL USES left with section header */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-black { padding-left: 8px !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] { padding-left: 8px !important; padding-right: 8px !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-black { padding-left: 8px !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] { padding-left: 8px !important; padding-right: 8px !important; }
      /* Bridge PDF-only: move CREDITS list content up 8px */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .mb-0 { position: relative !important; top: -8px !important; }
      /* Bridge PDF-only: move all DEBITS body content up 8px (rows and extras) */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > :not(.bg-black):not(.bg-\\[\\#808080\\]) { position: relative !important; top: -8px !important; }
      /* Bridge PDF-only: move LOAN DETAILS and CLOSING STATEMENT ESTIMATE up 7px and left-align */
      .pdf-sandbox [data-termsheet-root="bridge"] section.border-2.border-solid.border-black > header h2 { transform: translateY(-7px) !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] section.border-0 > header h2 { transform: translateY(-7px) !important; text-align: left !important; }
      /* Bridge PDF-only: raise ALL content inside left LOAN DETAILS box by 5px */
      .pdf-sandbox [data-termsheet-root="bridge"] section.border-2.border-solid.border-black > .px-2.pt-2.pb-0 { position: relative !important; top: -5px !important; }
      /* Bridge PDF-only: add 5px left padding to LOAN DETAILS row labels (exclude section headings) */
      .pdf-sandbox [data-termsheet-root="bridge"] section.border-2.border-solid.border-black > .px-2.pt-2.pb-0 .flex.justify-between > span:first-child {
        padding-left: 5px !important;
        display: inline-block !important;
      }
      /* Bridge PDF-only: move CREDITS text up 4px (relative top) */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-black h3 { position: relative !important; top: -8px !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] h3 { position: relative !important; top: -7px !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mb-2 > .px-2 > .bg-\\[\\#808080\\] > .flex > span:last-child { position: relative !important; top: -7px !important; }
      /* Bridge PDF-only: move DEBITS up 4px (do not affect CREDITS) */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-black h3 { position: relative !important; top: -8px !important; text-align: left !important; }
      /* Bridge PDF-only: move TOTAL USES down 2px */
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] h3 { position: relative !important; top: -7px !important; text-align: left !important; }
      .pdf-sandbox [data-termsheet-root="bridge"] .border-2.border-solid.border-black.mx-\\[-12px\\] > .px-2 > .bg-\\[\\#808080\\] > .flex > span:last-child { position: relative !important; top: -7px !important; }
      /* PDF-only: tighten disclaimer lines and remove paragraph margins */
      .pdf-sandbox [data-termsheet-root] footer p { line-height: 1px !important; margin: 0 !important; white-space: normal !important; }
      /* PDF-only: 5px inner left padding for Borrower & Guarantors left labels */
      .pdf-sandbox [data-termsheet-root] section:first-child .space-y-1:nth-of-type(1) .flex.text-xs > span:first-child {
        padding-left: 5px !important;
        display: inline-block !important;
      }
    `
    container.appendChild(style)
    document.body.appendChild(container)
    try {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      // Balance clarity and size: render at higher scale and slightly higher JPEG quality
      const canvas = await html2canvas(container, { scale: 1.75, backgroundColor: "#ffffff", useCORS: true, logging: false })
      const pdf = new jsPDF({ unit: "px", format: [816, 1056], orientation: "portrait", compress: true })
      const img = canvas.toDataURL("image/jpeg", 0.88)
      pdf.addImage(img, "JPEG", 0, 0, 816, 1056)
      const blob = pdf.output("blob")
      const filename = `term-sheet-${Date.now()}.pdf`
      return new File([blob], filename, { type: "application/pdf" })
    } finally {
      document.body.removeChild(container)
    }
  }

  async function openMainTermSheetPreview(opts?: { autoDownloadPdf?: boolean; autoShare?: boolean }) {
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
        // include initial_pitia from response or cached value
        payloadRow["initial_pitia"] = Array.isArray(d?.initial_pitia)
          ? d.initial_pitia[idx]
          : (results?.[selected.programIdx] as any)?.initial_pitia_cache?.[idx]
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
      // If webhook returned lender fees or defaults, override/append inputs ONLY for the selected program/row
      const pickAt = <T,>(val: T[] | T | undefined, i: number): T | undefined =>
        Array.isArray(val) ? (val as T[])[i] : (val as T | undefined)
      const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim())
      const selLenderOrig = toStr(pickAt<any>((d as any)["lender_orig_percent"], idx))
      const selLenderAdmin = toStr(pickAt<any>((d as any)["lender_admin_fee"], idx))
      const defLenderOrig = toStr(
        pickAt<any>((d as any)["default_lender_orig_percent"], idx) ??
          (d as any)["default_lender_orig_percent"] ??
          (results?.[selected.programIdx] as any)?.lender_defaults_cache?.default_lender_orig_percent
      )
      const defLenderAdmin = toStr(
        pickAt<any>((d as any)["default_lender_admin_fee"], idx) ??
          (d as any)["default_lender_admin_fee"] ??
          (results?.[selected.programIdx] as any)?.lender_defaults_cache?.default_lender_admin_fee
      )
      if (selLenderOrig) {
        inputs["lender_orig_percent"] = selLenderOrig
      }
      if (selLenderAdmin) {
        inputs["lender_admin_fee"] = selLenderAdmin
        inputs["admin_fee"] = selLenderAdmin
      }
      // Always include defaults, even if empty
      inputs["default_lender_orig_percent"] = defLenderOrig
      inputs["default_lender_admin_fee"] = defLenderAdmin
      const normalizedRow = toYesNoDeepGlobal(payloadRow) as Record<string, unknown>
      const r = results?.[selected.programIdx]
      const body = {
        program: (isBroker ? (r?.external_name ?? "Program") : (r?.internal_name ?? r?.external_name ?? "Program")),
        program_id: r?.id ?? null,
        row_index: idx,
        inputs,
        row: normalizedRow,
        organization_member_id: memberId ?? null,
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
      // Cache any returned defaults at the program level for reuse
      try {
        const retDefOrig = String((json as any)?.default_lender_orig_percent ?? "").trim()
        const retDefAdmin = String((json as any)?.default_lender_admin_fee ?? "").trim()
        const prog = results?.[selected.programIdx] as any
        if (prog && typeof prog === "object") {
          prog.lender_defaults_cache = {
            default_lender_orig_percent: retDefOrig,
            default_lender_admin_fee: retDefAdmin,
            ...(typeof prog.lender_defaults_cache === "object" ? prog.lender_defaults_cache : {}),
          }
        }
      } catch {/* ignore */}
      setSheetPropsMain(enriched)
      setMcpOpenMain(true)
      if (opts?.autoDownloadPdf || opts?.autoShare) {
        setTimeout(async () => {
          try {
            const file = await renderPreviewToPdfMain()
            if (!file) throw new Error("Could not render PDF")
            if (opts?.autoShare) {
              const canShareFiles =
                typeof navigator !== "undefined" &&
                "canShare" in navigator &&
                (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
              const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
              if (nav?.share && canShareFiles) {
                await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
              } else {
                await saveFileWithPrompt(file)
                toast({ title: "Saved", description: "PDF saved to your device." })
              }
            } else if (opts?.autoDownloadPdf) {
              await saveFileWithPrompt(file)
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

  // Compute ordered list: PASS first, then highest loan amount, then lowest rate (must be called unconditionally).
  const orderedResults = React.useMemo(() => {
    const parseNum = (v: unknown): number => {
      const n = Number(String(v ?? "").toString().replace(/[^0-9.-]/g, ""))
      return Number.isFinite(n) ? n : NaN
    }
    const pickLoanAndRate = (r: ProgramResult): { loan: number; rate: number } => {
      const d = (r?.data ?? {}) as ProgramResponseData
      const hi = Number(d?.highlight_display ?? 0)
      const isBridgeResp =
        Array.isArray(d?.total_loan_amount) ||
        Array.isArray(d?.initial_loan_amount) ||
        Array.isArray(d?.funded_pitia)
      const loan = isBridgeResp
        ? parseNum(pick<string | number>(d?.total_loan_amount as (string | number)[] | undefined, hi))
        : parseNum(d?.loan_amount)
      const rate = parseNum(pick<string | number>(d?.interest_rate as (string | number)[] | undefined, hi))
      return { loan, rate }
    }
    const arr = (results ?? []).slice()
    arr.sort((a, b) => {
      const scoreA = a?.data ? (a.data?.pass ? 2 : 1) : 0
      const scoreB = b?.data ? (b.data?.pass ? 2 : 1) : 0
      if (scoreA !== scoreB) return scoreB - scoreA
      if (scoreA === 0 && scoreB === 0) return 0
      const { loan: loanA, rate: rateA } = pickLoanAndRate(a)
      const { loan: loanB, rate: rateB } = pickLoanAndRate(b)
      if (!Number.isNaN(loanA) && !Number.isNaN(loanB) && loanA !== loanB) return loanB - loanA
      if (!Number.isNaN(rateA) && !Number.isNaN(rateB) && rateA !== rateB) return rateA - rateB
      return 0
    })
    return arr
  }, [results])

  // Main loan price display (all roles): "-" until programs are calculated; then
  // match the program row whose interest rate is the smallest >= Main's rate (round up),
  // falling back to the max rate when none are >=.
  const mainLoanPriceDisplay: string | number | null = React.useMemo(() => {
    if (!results || results.length === 0) return "-"
    if (!selected) return "-"
    const d = (results[selected.programIdx]?.data ?? null) as ProgramResponseData | null
    if (!d) return "-"
    const ratesArr = Array.isArray(d.interest_rate) ? (d.interest_rate as Array<string | number>) : []
    const pricesArr = Array.isArray(d.loan_price) ? (d.loan_price as Array<string | number>) : []
    if (ratesArr.length === 0 || pricesArr.length === 0) return "-"
    const parse = (v: unknown): number => {
      const n = Number(String(v ?? "").toString().replace(/[^0-9.-]/g, ""))
      return Number.isFinite(n) ? n : NaN
    }
    const targetRate = parse(selected.values.interestRate)
    if (!Number.isFinite(targetRate)) return "-"
    let chosenIdx = -1
    let smallestAbove = Infinity
    ratesArr.forEach((rv, i) => {
      const r = parse(rv)
      if (Number.isFinite(r) && r >= targetRate && r < smallestAbove) {
        smallestAbove = r
        chosenIdx = i
      }
    })
    if (chosenIdx === -1) {
      let maxRate = -Infinity
      ratesArr.forEach((rv, i) => {
        const r = parse(rv)
        if (Number.isFinite(r) && r > maxRate) {
          maxRate = r
          chosenIdx = i
        }
      })
    }
    if (chosenIdx < 0 || chosenIdx >= pricesArr.length) return "-"
    const price = pricesArr[chosenIdx]
    const s = String(price ?? "").trim()
    return s.length ? price : "-"
  }, [selected, results])

  // Ensure the starred row matches the "selected option" exactly:
  // program id, loan price AND interest rate must all align.
  // If not found, clear the star.
  useEffect(() => {
    if (!selected) return
    if (!results || results.length === 0) return
    // Resolve program by id if available
    let progIdx = selected.programIdx
    if (selected.programId) {
      const idxById = results.findIndex(
        (r) => r.id === selected.programId || r.internal_name === selected.programId || r.external_name === selected.programId
      )
      if (idxById >= 0) progIdx = idxById
    }
    const prog = results[progIdx]
    const d = (prog?.data ?? null) as ProgramResponseData | null
    if (!d) return
    const ratesArr = Array.isArray(d.interest_rate) ? (d.interest_rate as Array<string | number>) : []
    const pricesArr = Array.isArray(d.loan_price) ? (d.loan_price as Array<string | number>) : []
    if (pricesArr.length === 0 || ratesArr.length === 0) {
      setSelected(null)
      return
    }
    const parse = (v: unknown): number => {
      const n = Number(String(v ?? "").toString().replace(/[^0-9.-]/g, ""))
      return Number.isFinite(n) ? n : NaN
    }
    const targetRate = parse(selected.values.interestRate)
    const targetPrice = parse(mainLoanPriceDisplay)
    if (!Number.isFinite(targetPrice)) {
      setSelected(null)
      return
    }
    // Find exact matching row: price AND rate match within tolerance
    const tolPrice = 1e-3
    const tolRate = 1e-3
    let chosenIdx = -1
    for (let i = 0; i < pricesArr.length; i++) {
      const p = parse(pricesArr[i])
      if (!Number.isFinite(p) || Math.abs(p - targetPrice) >= tolPrice) continue
      if (ratesArr.length > i) {
        const r = parse(ratesArr[i])
        if (Number.isFinite(targetRate)) {
          if (!Number.isFinite(r) || Math.abs(r - targetRate) >= tolRate) continue
        }
      }
      chosenIdx = i
      break
    }
    if (chosenIdx < 0 || chosenIdx >= pricesArr.length) {
      setSelected(null)
      return
    }
    // If the program index itself is different (because we remapped by id), update it too.
    if (chosenIdx === selected.rowIdx && progIdx === selected.programIdx) return
    const isBridgeResp =
      Array.isArray(d?.total_loan_amount) ||
      Array.isArray(d?.initial_loan_amount) ||
      Array.isArray(d?.funded_pitia)
    // Build new selected values based on chosenIdx
    const nextValues =
      isBridgeResp
        ? {
            loanPrice: pick<string | number>(d?.loan_price as any, chosenIdx) ?? null,
            interestRate: pick<string | number>(d?.interest_rate as any, chosenIdx) ?? null,
            initialLoanAmount: pick<string | number>(d?.initial_loan_amount as any, chosenIdx) ?? undefined,
            rehabHoldback: pick<string | number>(d?.rehab_holdback as any, chosenIdx) ?? undefined,
            loanAmount: pick<string | number>(d?.total_loan_amount as any, chosenIdx) ?? undefined,
            pitia: pick<string | number>(d?.funded_pitia as any, chosenIdx) ?? undefined,
            ltv: undefined,
            dscr: undefined,
          }
        : {
            loanPrice: pick<string | number>(d?.loan_price as any, chosenIdx) ?? null,
            interestRate: pick<string | number>(d?.interest_rate as any, chosenIdx) ?? null,
            loanAmount: (d?.loan_amount as any) ?? null,
            ltv: (d?.ltv as any) ?? null,
            pitia: pick<string | number>(d?.pitia as any, chosenIdx) ?? null,
            dscr: pick<string | number>(d?.dscr as any, chosenIdx) ?? null,
            initialLoanAmount: undefined,
            rehabHoldback: undefined,
          }
    setSelected({
      ...selected,
      programIdx: progIdx,
      rowIdx: chosenIdx,
      values: nextValues,
    })
  }, [results, selected, mainLoanPriceDisplay])

  // While loading, show placeholder-only list ONLY when we don't yet have any result slots.
  if (loading && (!results || results.length === 0) && Array.isArray(placeholders) && placeholders.length > 0) {
    const selectedKey = selected?.programId ?? selected?.programName ?? null
    const filtered = selectedKey
      ? placeholders.filter(
          (p) => p.id !== selectedKey && p.internal_name !== selectedKey && p.external_name !== selectedKey
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
                  const byResultsExt = results?.[selected.programIdx ?? 0]?.external_name
                  const byPh = placeholders?.find?.((p) => p.id === selected.programId || p.internal_name === selected.programId || p.external_name === selected.programId)
                  const name = byResultsExt ?? byPh?.external_name ?? selected.programName ?? "Program"
                    return `Selected: ${name ?? `Program`}`
                  })()}
                </div>
              </div>
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Preview main" onClick={() => openMainTermSheetPreview()}>
                <IconEye className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Share main"
                onClick={() => openMainTermSheetPreview({ autoShare: true })}
              >
                <IconShare3 className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download main"
                onClick={() => openMainTermSheetPreview({ autoDownloadPdf: true })}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            </div>
            {selected.values.rehabHoldback != null || selected.values.initialLoanAmount != null ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Widget label="Loan Price" value={mainLoanPriceDisplay} />
                <Widget label="Interest Rate" value={selected.values.interestRate} />
                <Widget label="Initial Loan Amount" value={selected.values.initialLoanAmount} />
                <Widget label="Rehab Holdback" value={selected.values.rehabHoldback} />
                <Widget label="Total Loan Amount" value={selected.values.loanAmount} />
                <Widget label="Funded PITIA" value={selected.values.pitia} />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Widget label="Loan Price" value={mainLoanPriceDisplay} />
                <Widget label="Interest Rate" value={selected.values.interestRate} />
                <Widget label="Loan Amount" value={selected.values.loanAmount} />
                <Widget label="LTV" value={selected.values.ltv} />
                <Widget label="PITIA" value={selected.values.pitia} />
                <Widget label="DSCR" value={selected.values.dscr} />
              </div>
            )}
          </div>
          <Dialog open={mcpOpenMain} onOpenChange={setMcpOpenMain}>
            <DialogContent className="sm:max-w-[min(860px,calc(100vw-2rem))] max-h-[90vh] overflow-hidden px-6 pt-4 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95vh] max-sm:px-4 max-sm:pt-2 max-sm:pb-2">
              <DialogHeader className="mb-1">
                <DialogTitle className="text-base">Term Sheet</DialogTitle>
              </DialogHeader>
              <button
                type="button"
                aria-label="Share term sheet"
                className="absolute right-24 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                onClick={async () => {
                  try {
                    const file = await renderPreviewToPdfMain()
                    if (!file) throw new Error("Could not render PDF")
                    const canShareFiles =
                      typeof navigator !== "undefined" &&
                      "canShare" in navigator &&
                      (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
                    const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
                  if (nav?.share && canShareFiles) {
                      await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                    } else {
                      await saveFileWithPrompt(file)
                      toast({ title: "Saved", description: "PDF saved to your device." })
                    }
                  } catch (e) {
                    const message = e instanceof Error ? e.message : "Unable to share"
                    toast({ title: "Share failed", description: message, variant: "destructive" })
                  }
                }}
              >
                <IconShare3 />
              </button>
              <button
                type="button"
                aria-label="Download term sheet"
                className="absolute right-14 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                onClick={async () => {
                  try {
                    const file = await renderPreviewToPdfMain()
                    if (!file) throw new Error("Could not render PDF")
                    await saveFileWithPrompt(file)
                  } catch (e) {
                    const message = e instanceof Error ? e.message : "Unknown error"
                    toast({ title: "Download failed", description: message, variant: "destructive" })
                  }
                }}
              >
                <IconDownload />
              </button>
              
              <div className="space-y-3">
                {Object.keys(sheetPropsMain ?? {}).length ? (
                  <ScaledTermSheetPreview sheetProps={sheetPropsMain as DSCRTermSheetProps} pageRef={previewRefMain} readOnly={isBroker} />
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
          <ResultCardLoader key={idx} meta={p} isBroker={isBroker} />
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
                  const byResultsExt = results?.[selected.programIdx]?.external_name
                  const byPh = placeholders?.find?.((p) => p.id === selected.programId || p.internal_name === selected.programId || p.external_name === selected.programId)
                  const name = byResultsExt ?? byPh?.external_name ?? selected.programName
                  return `Selected: ${name ?? `Program`}`
                })()}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Preview main" onClick={() => openMainTermSheetPreview()}>
                <IconEye className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Share main"
                onClick={() => openMainTermSheetPreview({ autoShare: true })}
              >
                <IconShare3 className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download main"
                onClick={() => openMainTermSheetPreview({ autoDownloadPdf: true })}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {selected.values.rehabHoldback != null || selected.values.initialLoanAmount != null ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={mainLoanPriceDisplay} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Initial Loan Amount" value={selected.values.initialLoanAmount} />
              <Widget label="Rehab Holdback" value={selected.values.rehabHoldback} />
              <Widget label="Total Loan Amount" value={selected.values.loanAmount} />
              <Widget label="Funded PITIA" value={selected.values.pitia} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={mainLoanPriceDisplay} />
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
  // orderedResults is computed above unconditionally to satisfy the Rules of Hooks.

  return (
    <div>
      {selected ? (
        <div className="mb-3 rounded-md border p-3 bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">Main</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {(() => {
                  const byResultsExt = results?.[selected.programIdx]?.external_name
                  const byPh = placeholders?.find?.((p) => p.id === selected.programId || p.internal_name === selected.programId || p.external_name === selected.programId)
                  const name = byResultsExt ?? byPh?.external_name ?? selected.programName
                  return `Selected: ${name ?? `Program`}`
                })()}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Preview main" onClick={() => openMainTermSheetPreview()}>
                <IconEye className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Share main"
                onClick={() => openMainTermSheetPreview({ autoShare: true })}
              >
                <IconShare3 className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download main"
                onClick={() => openMainTermSheetPreview({ autoDownloadPdf: true })}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {selected.values.rehabHoldback != null || selected.values.initialLoanAmount != null ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={mainLoanPriceDisplay} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Initial Loan Amount" value={selected.values.initialLoanAmount} />
              <Widget label="Rehab Holdback" value={selected.values.rehabHoldback} />
              <Widget label="Total Loan Amount" value={selected.values.loanAmount} />
              <Widget label="Funded PITIA" value={selected.values.pitia} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Widget label="Loan Price" value={mainLoanPriceDisplay} />
              <Widget label="Interest Rate" value={selected.values.interestRate} />
              <Widget label="Loan Amount" value={selected.values.loanAmount} />
              <Widget label="LTV" value={selected.values.ltv} />
              <Widget label="PITIA" value={selected.values.pitia} />
              <Widget label="DSCR" value={selected.values.dscr} />
            </div>
          )}
        </div>
      ) : null}
      {orderedResults.map((r, idx) => (
        <ResultCard
          key={idx}
          r={r}
          programIdx={idx}
          selected={selected}
          onSelect={(sel) => setSelected(sel)}
          getInputs={getInputs}
          memberId={memberId}
          loanId={loanId}
          scenarioId={scenarioId}
        />
      ))}
        <Dialog open={mcpOpenMain} onOpenChange={setMcpOpenMain}>
          <DialogContent className="sm:max-w-[min(860px,calc(100vw-2rem))] max-h-[90vh] px-6 pt-4 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95vh] max-sm:px-4 max-sm:pt-2 max-sm:pb-2">
            <DialogHeader className="mb-1">
              <DialogTitle className="text-base">Term Sheet</DialogTitle>
            </DialogHeader>
            <button
              type="button"
              aria-label="Share term sheet"
              className="absolute right-24 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              onClick={async () => {
                try {
                  const file = await renderPreviewToPdfMain()
                  if (!file) throw new Error("Could not render PDF")
                  const canShareFiles =
                    typeof navigator !== "undefined" &&
                    "canShare" in navigator &&
                    (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
                  const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
                  if (nav?.share && canShareFiles) {
                    await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                    // Log activity after successful share
                    void logPanelTermSheetActivity("shared", file)
                  } else {
                    await saveFileWithPrompt(file)
                    toast({ title: "Saved", description: "PDF saved to your device." })
                    // Log as downloaded since it fell back to download
                    void logPanelTermSheetActivity("downloaded", file)
                  }
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Unable to share"
                  toast({ title: "Share failed", description: message, variant: "destructive" })
                }
              }}
            >
              <IconShare3 />
            </button>
            <button
              type="button"
              aria-label="Download term sheet"
              className="absolute right-14 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              onClick={async () => {
                try {
                  const file = await renderPreviewToPdfMain()
                  if (!file) throw new Error("Could not render PDF")
                  const url = URL.createObjectURL(file)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = file.name
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                  // Log activity
                  void logPanelTermSheetActivity("downloaded", file)
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Unknown error"
                  toast({ title: "Download failed", description: message, variant: "destructive" })
                }
              }}
            >
              <IconDownload />
            </button>
            <div className="space-y-3">
              {Object.keys(sheetPropsMain ?? {}).length ? (
                <ScaledTermSheetPreview sheetProps={sheetPropsMain as DSCRTermSheetProps} pageRef={previewRefMain} readOnly={isBroker} />
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
      /* Loader styles with warm gradient - uses theme variables from globals.css */
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
      /* Restored original orange "wave" loader with radial glows and mask stripes */
      .loader {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        z-index: 1;
        background-color: transparent;
        -webkit-mask: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px);
        mask: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px);
      }
      .loader::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
          radial-gradient(circle at 50% 50%, var(--gradient-warm-3) 0%, transparent 50%),
          radial-gradient(circle at 45% 45%, var(--gradient-warm-1) 0%, transparent 45%),
          radial-gradient(circle at 55% 55%, var(--gradient-warm-2) 0%, transparent 45%),
          radial-gradient(circle at 45% 55%, var(--gradient-warm-2) 0%, transparent 45%),
          radial-gradient(circle at 55% 45%, var(--gradient-warm-3) 0%, transparent 45%);
        -webkit-mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
        mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
        animation: transform-animation 2s infinite alternate, opacity-animation 4s infinite;
        animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1);
      }
      @keyframes transform-animation {
        0% { transform: translate(-55%); }
        100% { transform: translate(55%); }
      }
      @keyframes opacity-animation {
        0%, 100% { opacity: 0; }
        15% { opacity: 1; }
        65% { opacity: 0; }
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

