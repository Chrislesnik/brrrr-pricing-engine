"use client"

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { IconDeviceFloppy, IconFileExport, IconStar, IconStarFilled, IconCheck, IconX, IconGripVertical, IconPencil, IconTrash, IconEye, IconDownload, IconFileCheck, IconShare3, IconInfoCircle } from "@tabler/icons-react"
import { SearchIcon, LoaderCircleIcon, MinusIcon, PlusIcon } from "lucide-react"
import { Button as AriaButton, Group, Input as AriaInput, NumberField } from "react-aria-components"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { useSidebar } from "@repo/ui/shadcn/sidebar"
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
import { cn } from "@/lib/utils"
import { ensureGoogleMaps } from "@/lib/google-maps"
import { toast } from "@/hooks/use-toast"
import { CalcInput } from "@/components/calc-input"
import { DynamicPEInput, type PEInputField, type AddressFields } from "@/components/pricing/dynamic-pe-input"
import { usePELogicEngine } from "@/hooks/use-pe-logic-engine"
import { evaluateExpression } from "@/lib/expression-evaluator"
import { ConfigurableGrid } from "@/components/pricing/configurable-grid"
import type { TableConfig } from "@/types/table-config"
import type { SectionButton } from "@/types/section-buttons"
import DSCRTermSheet, { type DSCRTermSheetProps, type DSCRTermSheetData } from "@/components/DSCRTermSheet"
import BridgeTermSheet from "@/components/BridgeTermSheet"
import { resolveTemplateVariables, type TemplateVariable, type OrgLogos } from "@/lib/template-variable-resolver"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@clerk/nextjs"
import { GoogleMap, Marker } from "@react-google-maps/api"

type SaveFileHandle = {
  createWritable: () => Promise<{ write: (data: Blob | BufferSource) => Promise<void>; close: () => Promise<void> }>
}

// Open the native Save dialog immediately (must be called during a user gesture).
// Returns a file handle to write to later, or null if unsupported / cancelled.
function openSaveDialog(suggestedName: string): Promise<SaveFileHandle | null> {
  const w = window as unknown as {
    showSaveFilePicker?: (options: {
      suggestedName?: string
      types?: Array<{ description?: string; accept?: Record<string, string[]> }>
    }) => Promise<SaveFileHandle>
  }
  if (!w?.showSaveFilePicker) return Promise.resolve(null)
  return w.showSaveFilePicker({
    suggestedName,
    types: [{ description: "PDF Document", accept: { "application/pdf": [".pdf"] } }],
  }).catch((e) => {
    const name = (e as any)?.name ?? ""
    if (name === "AbortError" || /cancel/i.test(String((e as any)?.message ?? ""))) {
      throw e
    }
    return null
  })
}

// Write a blob to a previously opened save handle, or fall back to auto-download.
async function saveFileWithPrompt(file: File, handle?: SaveFileHandle | null): Promise<void> {
  if (handle) {
    const writable = await handle.createWritable()
    await writable.write(file)
    await writable.close()
    return
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function formatDateOnly(date?: Date | string | null): string | null {
  if (!date) return null
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10)
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return null
    date = parsed
  }
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
  onLogoChange,
}: {
  sheetProps: DSCRTermSheetData
  pageRef?: React.Ref<HTMLDivElement>
  forceLoanType?: string
  readOnly?: boolean
  onLogoChange?: (url: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Start with a conservative scale so the page won't overflow while iOS lays out the modal
  const [baseScale, setBaseScale] = useState<number>(0.6)
  const [zoom, setZoom] = useState<number>(1) // user-controlled zoom multiplier
  const scale = Math.max(0.1, Math.min(baseScale * zoom, 6))
  const [hasValidMeasure, setHasValidMeasure] = useState<boolean>(false)
  const [containerDims, setContainerDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
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
      setContainerDims({ width, height })
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
      className="w-full h-[72vh] overflow-x-auto overflow-y-auto rounded-md bg-neutral-100/40 pt-2 pb-2 max-sm:h-[64vh] max-sm:pt-1 max-sm:pb-1 relative overscroll-contain"
    >
      {/* Inner wrapper with explicit width/height ensures scrollable area covers the full scaled content */}
      <div
        style={{
          width: Math.max(816 * scale + 16, containerDims.width),
          height: Math.max(1056 * scale + 16, containerDims.height),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Wrapper takes the visual scaled size */}
        <div
          style={{
            width: 816 * scale,
            height: 1056 * scale,
            opacity: hasValidMeasure ? 1 : 0,
            transition: "opacity 150ms ease",
            flexShrink: 0,
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
            <BridgeTermSheet {...sheetProps} readOnly={readOnly} onLogoChange={onLogoChange} />
          ) : (
            <DSCRTermSheet {...sheetProps} readOnly={readOnly} onLogoChange={onLogoChange} />
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

interface ResolvedTermSheet {
  id: string
  template_name: string
  resolvedHtml: string
}

function ScaledHtmlPreview({
  html,
  previewRef,
  isEditable = false,
}: {
  html: string
  previewRef?: React.Ref<HTMLDivElement>
  isEditable?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [baseScale, setBaseScale] = useState<number>(0.6)
  const [zoom, setZoom] = useState<number>(1)
  const scale = Math.max(0.1, Math.min(baseScale * zoom, 6))
  const [hasValidMeasure, setHasValidMeasure] = useState<boolean>(false)
  const [containerDims, setContainerDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      if (width <= 0 || height <= 0) {
        const vw = Math.max(0, (window.innerWidth || 0) - 16)
        const vh = Math.max(0, (window.innerHeight || 0) - 16)
        if (vw > 0 && vh > 0) {
          const fallback = Math.min(vw / 816, vh / 1056, 1) * 0.86
          setBaseScale(fallback)
        }
        setHasValidMeasure(false)
        return
      }
      const paddingAllowance = 8
      const s = Math.min((width - paddingAllowance) / 816, (height - paddingAllowance) / 1056, 1) * 0.88
      setBaseScale(s)
      setContainerDims({ width, height })
      setHasValidMeasure(true)
    }
    update()
    const rafIds: number[] = []
    const tryRaf = (times: number) => {
      if (times <= 0) return
      rafIds.push(requestAnimationFrame(() => { update(); tryRaf(times - 1) }))
    }
    tryRaf(3)
    const timeouts = [100, 350, 1000, 2000].map((ms) => window.setTimeout(update, ms))
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const factor = Math.pow(0.8, e.deltaY / 100)
      setZoom((z) => Math.min(5, Math.max(0.25, z * factor)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      ro.disconnect()
      el.removeEventListener("wheel", onWheel as EventListener as unknown as (e: WheelEvent) => void)
      rafIds.forEach((id) => cancelAnimationFrame(id))
      timeouts.forEach((id) => clearTimeout(id))
    }
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    const embeddedStyles: string[] = []
    let stripped = html.replace(/<style>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
      embeddedStyles.push(css)
      return ""
    })
    const bodyContent = (() => {
      const m = stripped.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      return m ? m[1] : stripped
    })()
    const editableStyles = isEditable ? `<style>
      .ts-edit { outline: 1px dashed rgba(245,158,11,0.6); outline-offset: 0px; background: rgba(245,158,11,0.06); }
      .ts-edit:focus { outline: 2px solid #f59e0b; outline-offset: 0; }
      img.ts-replaceable { cursor: pointer; transition: opacity 0.15s; }
      img.ts-replaceable:hover { opacity: 0.8; outline: 2px dashed #f59e0b; outline-offset: 2px; }
      img.ts-edit { object-fit: contain; }
    </style>` : ""
    doc.open()
    doc.write(`<!DOCTYPE html><html><head><style>
      * { box-sizing: border-box; }
      body { margin: 0; background: white; }
      html, body { overflow: hidden; }
    </style>${embeddedStyles.map((css) => `<style>${css}</style>`).join("")}${editableStyles}</head><body>${bodyContent}</body></html>`)
    doc.close()

    if (isEditable) {
      requestAnimationFrame(() => {
        if (!doc.body) return
        const textEls = doc.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,td,th,div,b,em,i,strong")
        textEls.forEach((el) => {
          const htmlEl = el as HTMLElement
          if (htmlEl.childElementCount !== 0) return
          const hasText = (htmlEl.textContent || "").trim().length > 0
          const isVariable = htmlEl.hasAttribute("data-type-data-variable")
          if (hasText || isVariable) {
            htmlEl.setAttribute("contenteditable", "true")
            htmlEl.classList.add("ts-edit")
            if (!hasText) {
              htmlEl.textContent = "\u00A0"
              htmlEl.setAttribute("data-ts-empty", "true")
              htmlEl.addEventListener("focus", function onFocus() {
                if (htmlEl.getAttribute("data-ts-empty") === "true") {
                  htmlEl.textContent = ""
                  htmlEl.removeAttribute("data-ts-empty")
                }
              }, { once: true })
            }
          }
        })

        function showImagePopover(img: HTMLImageElement) {
          doc.querySelector(".ts-img-popover")?.remove()
          const popover = doc.createElement("div")
          popover.className = "ts-img-popover"
          const rect = img.getBoundingClientRect()
          const scrollY = doc.documentElement.scrollTop || doc.body.scrollTop
          const scrollX = doc.documentElement.scrollLeft || doc.body.scrollLeft
          popover.style.cssText = `position:absolute;top:${rect.bottom + scrollY + 6}px;left:${rect.left + scrollX}px;z-index:9999;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);width:220px;font-family:Arial,sans-serif;`
          const preview = doc.createElement("div")
          preview.style.cssText = "display:flex;justify-content:center;padding:8px;background:#f9fafb;border-radius:6px;margin-bottom:8px;"
          const previewImg = doc.createElement("img")
          previewImg.src = img.src
          previewImg.style.cssText = "max-height:50px;max-width:100%;object-fit:contain;"
          preview.appendChild(previewImg)
          popover.appendChild(preview)

          const dropZone = doc.createElement("div")
          dropZone.style.cssText = "border:2px dashed #d1d5db;border-radius:6px;padding:12px;text-align:center;transition:all 0.15s;margin-bottom:8px;"
          const dropText = doc.createElement("div")
          dropText.textContent = "Drag & drop to replace"
          dropText.style.cssText = "font-size:11px;color:#6b7280;margin-bottom:6px;"
          dropZone.appendChild(dropText)

          const fileInput = doc.createElement("input")
          fileInput.type = "file"
          fileInput.accept = "image/*"
          fileInput.style.display = "none"

          const chooseBtn = doc.createElement("button")
          chooseBtn.textContent = "Choose File"
          chooseBtn.style.cssText = "background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:4px 12px;font-size:12px;cursor:pointer;color:#000;"
          chooseBtn.addEventListener("click", () => fileInput.click())
          dropZone.appendChild(chooseBtn)
          dropZone.appendChild(fileInput)
          popover.appendChild(dropZone)

          const removeBtn = doc.createElement("button")
          removeBtn.textContent = "Remove Image"
          removeBtn.style.cssText = "width:100%;background:#ef4444;color:#fff;border:none;border-radius:4px;padding:6px;font-size:12px;cursor:pointer;"
          removeBtn.addEventListener("click", () => {
            const w = img.offsetWidth
            const h = img.offsetHeight
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            if (w > 0) { img.style.width = `${w}px`; img.style.minWidth = `${w}px` }
            if (h > 0) { img.style.height = `${h}px`; img.style.minHeight = `${h}px` }
            popover.remove()
          })
          popover.appendChild(removeBtn)

          function handleFile(file: File) {
            if (!file.type.startsWith("image/")) return
            const reader = new FileReader()
            reader.onload = () => {
              if (typeof reader.result === "string") {
                img.src = reader.result
                previewImg.src = reader.result
              }
            }
            reader.readAsDataURL(file)
            setTimeout(() => popover.remove(), 300)
          }

          fileInput.addEventListener("change", () => {
            const f = fileInput.files?.[0]
            if (f) handleFile(f)
          })

          dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.style.borderColor = "#f59e0b"; dropZone.style.background = "#fffbeb"; })
          dropZone.addEventListener("dragleave", (e) => { e.preventDefault(); dropZone.style.borderColor = "#d1d5db"; dropZone.style.background = "transparent"; })
          dropZone.addEventListener("drop", (e) => {
            e.preventDefault()
            dropZone.style.borderColor = "#d1d5db"
            dropZone.style.background = "transparent"
            const f = e.dataTransfer?.files?.[0]
            if (f) handleFile(f)
          })

          doc.body.appendChild(popover)
          const closeOnOutside = (e: MouseEvent) => {
            if (!popover.contains(e.target as Node) && e.target !== img) {
              popover.remove()
              doc.removeEventListener("click", closeOnOutside)
            }
          }
          setTimeout(() => doc.addEventListener("click", closeOnOutside), 10)
        }

        const images = doc.querySelectorAll("img")
        images.forEach((img) => {
          img.classList.add("ts-replaceable")
          if (img.hasAttribute("data-brand-logo")) {
            const w = img.offsetWidth
            const h = img.offsetHeight
            if (w > 0) img.style.minWidth = `${w}px`
            if (h > 0) img.style.minHeight = `${h}px`
            img.classList.add("ts-edit")
          }
          img.addEventListener("click", (e) => {
            e.stopPropagation()
            showImagePopover(img)
          })
        })
      })
    }
  }, [html, isEditable])

  const scaledW = 816 * scale
  const scaledH = 1056 * scale

  const padLeft = Math.max(16, (containerDims.width - scaledW) / 2)
  const padTop = Math.max(16, (containerDims.height - scaledH) / 2)

  const scrollBy = (dx: number, dy: number) => {
    containerRef.current?.scrollBy({ left: dx, top: dy, behavior: "smooth" })
  }

  return (
    <div className="w-full h-[72vh] max-sm:h-[64vh] relative">
      <div
        ref={containerRef}
        style={{ overflow: "auto", width: 0, minWidth: "100%" }}
        className="h-full rounded-md bg-neutral-100/40"
      >
        <div
          style={{
            paddingLeft: padLeft,
            paddingRight: 16,
            paddingTop: padTop,
            paddingBottom: 48,
            width: "fit-content",
          }}
        >
          <div
            style={{
              width: scaledW,
              height: scaledH,
              opacity: hasValidMeasure ? 1 : 0,
              transition: "opacity 150ms ease",
            }}
          >
            <div
              ref={previewRef}
              style={{
                width: 816,
                height: 1056,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                overflow: "hidden",
              }}
              className="border border-black/20 bg-white shadow-xl rounded-sm"
            >
              <iframe
                ref={iframeRef}
                className={`w-full h-full border-0${isEditable ? "" : " pointer-events-none"}`}
                sandbox="allow-same-origin"
                title="Term Sheet Preview"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 left-0 right-0 z-50 flex items-center justify-between px-4 pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto">
          <button type="button" className="rounded-md border bg-white p-1.5 shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => scrollBy(-120, 0)} aria-label="Scroll left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button type="button" className="rounded-md border bg-white p-1.5 shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => scrollBy(0, -120)} aria-label="Scroll up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <button type="button" className="rounded-md border bg-white p-1.5 shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => scrollBy(0, 120)} aria-label="Scroll down">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <button type="button" className="rounded-md border bg-white p-1.5 shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => scrollBy(120, 0)} aria-label="Scroll right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button type="button" className="rounded-sm border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => setZoom((z) => Math.max(0.25, z * 0.8))} aria-label="Zoom out">-</button>
          <div className="rounded-sm border bg-white px-2 py-1 text-[11px] shadow-sm min-w-14 text-center text-black dark:text-black dark:bg-white">{Math.round((zoom || 1) * 100)}%</div>
          <button type="button" className="rounded-sm border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => setZoom((z) => Math.min(5, z * 1.2))} aria-label="Zoom in">+</button>
          <button type="button" className="rounded-sm border bg-white px-2 py-1 text-xs shadow-sm hover:bg-neutral-50 text-black dark:text-black dark:bg-white" onClick={() => setZoom(1)} aria-label="Reset zoom">Fit</button>
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

  // Unified input state: single source of truth for all PE input values
  const [extraFormValues, setExtraFormValues] = useState<Record<string, unknown>>({})

  // PE input definitions (moved up so dynamic address/date derivations can use them)
  interface PECategory { id: number; category: string; display_order: number; default_open: boolean; config?: Record<string, unknown> | null }
  interface PEInputDef extends PEInputField { category_id: number; display_order: number; config?: Record<string, unknown> | null }
  const [peInputDefs, setPeInputDefs] = useState<PEInputDef[]>([])

  // Dynamic helper to read any input value by code
  const fv = useCallback((code: string) => extraFormValues[code], [extraFormValues])

  // Dynamic address field codes resolved from peInputDefs config (address_role → input_code)
  const primaryAddrCodes = useMemo(() => {
    const codes: Record<string, string> = {}
    for (const inp of peInputDefs) {
      const role = inp.config?.address_role as string | undefined
      if (role && !codes[role]) codes[role] = inp.input_code
    }
    return codes
  }, [peInputDefs])
  const street = String(extraFormValues[primaryAddrCodes.street ?? ""] ?? "")
  const apt = String(extraFormValues[primaryAddrCodes.apt ?? ""] ?? "")
  const city = String(extraFormValues[primaryAddrCodes.city ?? ""] ?? "")
  const stateCode = extraFormValues[primaryAddrCodes.state ?? ""] as string | undefined
  const zip = String(extraFormValues[primaryAddrCodes.zip ?? ""] ?? "")
  const county = String(extraFormValues[primaryAddrCodes.county ?? ""] ?? "")

  // Date input codes resolved dynamically from peInputDefs
  const dateInputCodes = useMemo(() =>
    peInputDefs.filter((d) => d.input_type === "date").map((d) => d.input_code),
    [peInputDefs],
  )

  // Generic calendar month state for all date inputs (keyed by input_code)
  const [calendarMonths, setCalendarMonths] = useState<Record<string, Date | undefined>>({})
  const setCalendarMonth = useCallback((code: string, d: Date | undefined) => {
    setCalendarMonths((prev) => prev[code] === d ? prev : { ...prev, [code]: d })
  }, [])

  // Sync calendar visible months when date values change
  useEffect(() => {
    for (const code of dateInputCodes) {
      const val = extraFormValues[code] as Date | undefined
      setCalendarMonth(code, val ?? undefined)
    }
  }, [dateInputCodes, extraFormValues, setCalendarMonth])

  const streetInputRef = useRef<HTMLInputElement | null>(null)
  const [sendingReApi, setSendingReApi] = useState<boolean>(false)
  const [reApiClicked, setReApiClicked] = useState(false)
  const [mapsClicked, setMapsClicked] = useState(false)
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
  useEffect(() => {
    setReApiClicked(false)
    setMapsClicked(false)
  }, [street, city, stateCode, zip])
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
  // Guarantor tags kept as useState (complex array type, not a simple PE input value)
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

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [signalColors, setSignalColors] = useState<Record<string, string>>({})
  function markSignalColors(keys: string[], color: string) {
    if (!Array.isArray(keys) || keys.length === 0 || !color) return
    setSignalColors((prev) => {
      const next: Record<string, string> = { ...prev }
      for (const k of keys) next[k] = color
      return next
    })
  }
  function clearSignalColor(key: string) {
    setSignalColors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  /* -------------------------------------------------------------------------- */
  /*  Dynamic PE inputs infrastructure                                           */
  /* -------------------------------------------------------------------------- */
  const [peCategories, setPeCategories] = useState<PECategory[]>([])
  const [peLoaded, setPeLoaded] = useState(false)
  const [openAccordionSections, setOpenAccordionSections] = useState<string[]>([])
  const [sectionButtons, setSectionButtons] = useState<SectionButton[]>([])
  const [linkedRecordsByTable, setLinkedRecordsByTable] = useState<Record<string, { id: string; label: string }[]>>({})

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [catsRes, inputsRes, btnsRes] = await Promise.all([
          fetch("/api/pricing-engine-input-categories"),
          fetch("/api/pricing-engine-inputs"),
          fetch("/api/pe-section-buttons"),
        ])
        if (!active) return
        if (catsRes.ok) {
          const cats = await catsRes.json() as PECategory[]
          setPeCategories(cats)
          setOpenAccordionSections(
            cats.filter((c) => c.default_open !== false).map((c) => `pe-cat-${c.id}`)
          )
        }
        if (inputsRes.ok) {
          const rawInputs = await inputsRes.json()
          setPeInputDefs(rawInputs)
          // Initialize defaults from DB for inputs not yet set
          const defaults: Record<string, unknown> = {}
          for (const inp of rawInputs as PEInputDef[]) {
            if (!inp.default_value) continue
            if (inp.default_value.includes("{")) continue
            const dv = inp.default_value
            if (inp.input_type === "date") {
              const m = dv.match(/^([+-])(\d+)([dmy])$/)
              if (m) {
                const sign = m[1] === "+" ? 1 : -1
                const amount = Number(m[2]) * sign
                const unit = m[3]
                const d = new Date()
                if (unit === "d") d.setDate(d.getDate() + amount)
                else if (unit === "m") d.setMonth(d.getMonth() + amount)
                else if (unit === "y") d.setFullYear(d.getFullYear() + amount)
                defaults[inp.input_code] = d
              }
            } else if (inp.input_type === "boolean") {
              defaults[inp.input_code] = (dv === "true" || dv === "yes" || dv === "Yes")
            } else {
              defaults[inp.input_code] = dv
            }
          }
          if (Object.keys(defaults).length > 0 && !initialLoanId) {
            setExtraFormValues((prev) => ({ ...prev, ...defaults }))
          }
        }
        if (btnsRes.ok) {
          const btns = await btnsRes.json()
          if (Array.isArray(btns)) setSectionButtons(btns)
        }
        setPeLoaded(true)
      } catch (err) {
        console.error("Failed to fetch PE input definitions:", err)
        setPeLoaded(true)
      }
    })()
    return () => { active = false }
  }, [initialLoanId])

  // Fetch linked records for inputs with linked_table
  useEffect(() => {
    const linkedInputs = peInputDefs.filter((inp) => inp.linked_table)
    if (linkedInputs.length === 0) return
    let cancelled = false
    const tableColumnPairs = new Map<string, string | null>()
    for (const inp of linkedInputs) {
      if (!tableColumnPairs.has(inp.linked_table!)) {
        tableColumnPairs.set(inp.linked_table!, inp.linked_column ?? null)
      }
    }
    ;(async () => {
      const results: Record<string, { id: string; label: string }[]> = {}
      await Promise.all(
        Array.from(tableColumnPairs.entries()).map(async ([table, column]) => {
          try {
            const params = new URLSearchParams({ table })
            if (column) params.set("expression", column)
            const res = await fetch(`/api/inputs/linked-records?${params.toString()}`)
            const data = await res.json()
            if (!cancelled && Array.isArray(data.records)) {
              results[table] = data.records
            }
          } catch { /* ignore */ }
        }),
      )
      if (!cancelled) setLinkedRecordsByTable(results)
    })()
    return () => { cancelled = true }
  }, [peInputDefs])

  // Map input_code → input_id for the logic engine
  const codeToIdMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const inp of peInputDefs) m.set(inp.input_code, String(inp.id))
    return m
  }, [peInputDefs])
  const idToCodeMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const inp of peInputDefs) m.set(String(inp.id), inp.input_code)
    return m
  }, [peInputDefs])

  // Address group index: maps address_group name → { role → input_code }
  const addressGroupIndex = useMemo(() => {
    const groups = new Map<string, Map<string, string>>()
    for (const inp of peInputDefs) {
      const role = inp.config?.address_role as string | undefined
      const group = inp.config?.address_group as string | undefined
      if (!role || !group) continue
      let roleMap = groups.get(group)
      if (!roleMap) {
        roleMap = new Map<string, string>()
        groups.set(group, roleMap)
      }
      roleMap.set(role, inp.input_code)
    }
    return groups
  }, [peInputDefs])

  // First address group (used for auto-detecting Google Maps address)
  const primaryAddressGroup = useMemo(() => {
    const first = addressGroupIndex.entries().next()
    return first.done ? null : first.value[1]
  }, [addressGroupIndex])

  // Expression-based default values: maps input_code → expression string for defaults containing {input_id} references
  const expressionDefaults = useMemo(() => {
    const map = new Map<string, string>()
    for (const inp of peInputDefs) {
      if (inp.default_value && inp.default_value.includes("{")) {
        map.set(inp.input_code, inp.default_value)
      }
    }
    return map
  }, [peInputDefs])

  // All form values come from extraFormValues (single source of truth)
  const formValues = useMemo<Record<string, unknown>>(() => {
    return { ...extraFormValues }
  }, [extraFormValues])

  // Values keyed by input_id for the logic engine
  const formValuesById = useMemo(() => {
    const byId: Record<string, unknown> = {}
    for (const [code, val] of Object.entries(formValues)) {
      const id = codeToIdMap.get(code)
      if (id) byId[id] = val
    }
    return byId
  }, [formValues, codeToIdMap])

  // Stable serialized key for formValuesById to avoid excessive refetches
  const formValuesByIdKey = useMemo(() => {
    try { return JSON.stringify(formValuesById) } catch { return "" }
  }, [formValuesById])

  // Prefetch program catalog filtered by current input values via program conditions
  useEffect(() => {
    let active = true
    if (!formValuesByIdKey) return
    ;(async () => {
      try {
        const res = await fetch("/api/pricing/programs", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          body: JSON.stringify({ inputValues: formValuesById }),
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
    return () => { active = false }
  }, [formValuesByIdKey])

  // Evaluate expression-based defaults from current form values
  const computedDefaults = useMemo(() => {
    const result: Record<string, string> = {}
    for (const [code, expr] of expressionDefaults) {
      if (touched[code]) continue
      const val = evaluateExpression(expr, formValuesById)
      if (val !== null) result[code] = String(val)
    }
    return result
  }, [expressionDefaults, formValuesById, touched])

  // Track which fields currently show an expression-computed default
  const hasExpressionDefault = useMemo(() => {
    const codes = new Set<string>()
    for (const [code] of expressionDefaults) {
      if (!touched[code] && computedDefaults[code] !== undefined) codes.add(code)
    }
    return codes
  }, [expressionDefaults, touched, computedDefaults])

  // Human-readable expression labels: replaces {input_id} with input labels
  const expressionLabels = useMemo(() => {
    const idToLabel = new Map<string, string>()
    for (const inp of peInputDefs) idToLabel.set(String(inp.id), inp.input_label)
    const labels: Record<string, string> = {}
    for (const [code, expr] of expressionDefaults) {
      labels[code] = expr.replace(/\{([^}]+)\}/g, (_m, id) => idToLabel.get(id) ?? id)
    }
    return labels
  }, [peInputDefs, expressionDefaults])

  // Merged values keyed by both input_code AND input_id (for number constraint conditions that reference by ID)
  const formValuesMerged = useMemo(() => ({ ...formValues, ...formValuesById }), [formValues, formValuesById])

  // Config-based full address for Google Maps (auto-detects from address_role config, falls back to hardcoded)
  const resolvedFullAddress = useMemo(() => {
    if (primaryAddressGroup) {
      const roleOrder: string[] = ["street", "apt", "city", "state", "zip"]
      const parts = roleOrder
        .map((role) => {
          const code = primaryAddressGroup.get(role)
          return code ? formValues[code] : undefined
        })
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean)
      if (parts.length > 0) return parts.join(", ")
    }
    return fullAddress
  }, [primaryAddressGroup, formValues, fullAddress])

  // Logic engine
  const peLogicResult = usePELogicEngine(formValuesById)
  const peHiddenCodes = useMemo(() => {
    const codes = new Set<string>()
    for (const id of peLogicResult.hiddenFields) {
      const code = idToCodeMap.get(id)
      if (code) codes.add(code)
    }
    return codes
  }, [peLogicResult.hiddenFields, idToCodeMap])
  const peRequiredCodes = useMemo(() => {
    const codes = new Set<string>()
    for (const id of peLogicResult.requiredFields) {
      const code = idToCodeMap.get(id)
      if (code) codes.add(code)
    }
    return codes
  }, [peLogicResult.requiredFields, idToCodeMap])

  // All input changes go to extraFormValues (single source of truth)
  const updateValue = useCallback((code: string, value: unknown) => {
    setTouched((prev) => prev[code] ? prev : { ...prev, [code]: true })
    clearSignalColor(code)
    setExtraFormValues((prev) => prev[code] === value ? prev : { ...prev, [code]: value })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddressSelect = useCallback(
    (sourceInputCode: string, fields: AddressFields) => {
      const sourceDef = peInputDefs.find((d) => d.input_code === sourceInputCode)
      const group = sourceDef?.config?.address_group as string | undefined
      if (!group) return
      const roleMap = addressGroupIndex.get(group)
      if (!roleMap) return
      const mapping: [keyof AddressFields, string][] = [
        ["street", "street"],
        ["apt", "apt"],
        ["city", "city"],
        ["state", "state"],
        ["zip", "zip"],
        ["county", "county"],
      ]
      for (const [addrKey, role] of mapping) {
        const code = roleMap.get(role)
        if (!code || code === sourceInputCode) continue
        const val = fields[addrKey]
        if (val !== undefined && val !== "") updateValue(code, val)
      }
    },
    [peInputDefs, addressGroupIndex, updateValue],
  )

  // Build layout rows for a category
  type DynLayoutRow = { rowIndex: number; items: PEInputDef[] }
  function buildDynRows(catInputs: PEInputDef[]): DynLayoutRow[] {
    const sorted = [...catInputs].sort((a, b) => a.layout_row - b.layout_row || a.display_order - b.display_order)
    const rowMap = new Map<number, PEInputDef[]>()
    for (const inp of sorted) {
      const existing = rowMap.get(inp.layout_row) ?? []
      existing.push(inp)
      rowMap.set(inp.layout_row, existing)
    }
    return [...rowMap.keys()].sort((a, b) => a - b).map((k) => ({ rowIndex: k, items: rowMap.get(k)! }))
  }

  function getDynWidthClass(width: string): string {
    switch (width) {
      case "100": return "col-span-4"
      case "75": return "col-span-3"
      case "50": return "col-span-2"
      case "25": return "col-span-1"
      default: return "col-span-2"
    }
  }

  // Keep calendar month in sync with typed/selected dates
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
    if (!resolvedFullAddress) {
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
    geocoder.geocode({ address: resolvedFullAddress }, (results: Array<any> | null, status: string) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location
        setMapsCenter({ lat: loc.lat(), lng: loc.lng() })
      } else {
        setMapsCenter(null)
        setMapsError("Could not locate that address")
      }
      setMapsLoading(false)
    })
  }, [resolvedFullAddress, mapsApiKey, mapsLoadError, mapsModalOpen, gmapsReady])

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
      const payload = buildPayload()
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      // Dynamically map RE API response keys → input_code by matching against peInputDefs
      const applyReApiResponse = (data: Record<string, unknown>) => {
        const autoKeys: string[] = []
        const dataKeys = new Set(Object.keys(data))
        const normalize = (k: string) => k.replace(/-/g, "_").toLowerCase()
        const normalizedData = new Map<string, unknown>()
        for (const [k, v] of Object.entries(data)) {
          normalizedData.set(normalize(k), v)
        }
        for (const inp of peInputDefs) {
          const code = inp.input_code
          let val: unknown = undefined
          if (dataKeys.has(code)) {
            val = data[code]
          } else {
            val = normalizedData.get(normalize(code))
          }
          if (val === undefined || val === null) continue
          if (inp.input_type === "date") {
            const d = parseDateLocal(val)
            if (d) { updateValue(code, d); autoKeys.push(code) }
          } else if (inp.input_type === "number" || inp.input_type === "currency" || inp.input_type === "calc_currency") {
            updateValue(code, String(val))
            autoKeys.push(code)
          } else if (inp.input_type === "boolean") {
            const s = String(val).trim().toLowerCase()
            const bv = (typeof val === "boolean") ? val : ["yes", "y", "true", "1"].includes(s)
            updateValue(code, bv); autoKeys.push(code)
          } else if (inp.dropdown_options?.length === 2 && inp.dropdown_options.includes("Yes") && inp.dropdown_options.includes("No")) {
            const s = String(val).trim().toLowerCase()
            const yn = (typeof val === "boolean")
              ? (val ? "Yes" : "No")
              : (["yes", "y", "true", "1"].includes(s) ? "Yes" : ["no", "n", "false", "0"].includes(s) ? "No" : undefined)
            if (yn) { updateValue(code, yn); autoKeys.push(code) }
          } else {
            updateValue(code, val)
            autoKeys.push(code)
          }
        }
        if (autoKeys.length > 0) markSignalColors(autoKeys, "green")
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

  // Build payload dynamically from peInputDefs + formValues (no hardcoded field names)
  function buildPayload() {
    const payload: Record<string, unknown> = {}

    for (const input of peInputDefs) {
      const val = formValues[input.input_code] ?? computedDefaults[input.input_code]

      if (input.input_type === "date") {
        payload[input.input_code] = formatDateOnly(val as Date | string | undefined)
      } else if (input.input_type === "tags") {
        payload[input.input_code] = Array.isArray(val)
          ? val.map((t: unknown) => typeof t === "string" ? t : (t as { name: string })?.name ?? t)
          : val ?? []
      } else if (input.input_type === "table") {
        payload[input.input_code] = val ?? []
      } else if (input.input_type === "boolean") {
        payload[input.input_code] = (val === "true" || val === true || val === "Yes") ? "true" : "false"
      } else {
        payload[input.input_code] = val ?? ""
      }
    }

    // Include any extra values not defined as peInputDefs (e.g. record IDs, grid data)
    for (const [code, val] of Object.entries(extraFormValues)) {
      if (!(code in payload) && val !== undefined && val !== null) {
        payload[code] = val instanceof Date ? formatDateOnly(val) : val
      }
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
      setSelectedMainRow(null)
      setResultsStale(false)
      setProgramResults([])
      setProgramPlaceholders([])
      setIsDispatching(true)
      let placeholdersLocal: Array<{ id?: string; internal_name?: string; external_name?: string }> = []
      try {
        const pre = await fetch("/api/pricing/programs", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          body: JSON.stringify({ inputValues: formValuesById }),
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
              body: JSON.stringify({ programId: p.id ?? p.internal_name ?? p.external_name, inputValuesById: formValuesById, data: { ...payload, organization_member_id: memberIdLocal ?? null } }),
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
      const selectedWithMeta = selectedMainRow
        ? {
            ...selectedMainRow.values,
            program_name:
              selectedMainRow.programName ??
              (programResults?.[selectedMainRow.programIdx ?? 0]?.external_name ?? null),
            program_id:
              selectedMainRow.programId ??
              (programResults?.[selectedMainRow.programIdx ?? 0]?.id ?? null),
            program_index: selectedMainRow.programIdx ?? 0,
            row_index: selectedMainRow.rowIdx ?? 0,
          }
        : null
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



  // Returns array of missing required field labels (driven entirely by logic engine rules)
  const missingFields = useMemo(() => {
    const missing: string[] = []
    const has = (v: unknown) => !(v === undefined || v === null || v === "")

    for (const code of peRequiredCodes) {
      if (peHiddenCodes.has(code)) continue
      const val = formValues[code]
      if (!has(val)) {
        const def = peInputDefs.find((d) => d.input_code === code)
        if (def) missing.push(def.input_label)
      }
    }

    return missing
  }, [peRequiredCodes, peHiddenCodes, formValues, peInputDefs])

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

  // Legacy key → input_code migration map for loading old saved scenarios
  const legacyKeyMap: Record<string, string> = {
    num_units: "number_of_units",
    max_leverage_requested: "request_max_leverage",
    gla_sq_ft: "sq_footage",
    admin_fee: "lender_admin_fee",
    aiv: "as_is_value",
    arv: "arv",
    rehab_completed: "rehab_completed_amount",
    taxes_annual: "annual_taxes",
    hoi_annual: "annual_hoi",
    flood_annual: "annual_flood",
    hoa_annual: "annual_hoa",
    mgmt_annual: "annual_management",
    mortgage_debt: "mortgage_debt",
    fico: "fico_score",
    closing_date: "projected_closing_date",
    projected_note_date: "projected_closing_date",
    note_date: "projected_closing_date",
    hoi_effective_date: "hoi_effective",
    flood_effective_date: "flood_effective",
    fthb: "first_time_homebuyer",
    ppp: "pre_payment_penalty",
    str: "short_term_rental",
    section8: "section_8",
    lender_orig_percent: "lender_origination",
    origination_points: "lender_origination",
    broker_orig_percent: "broker_origination",
    num_flips: "number_of_flips",
    num_gunc: "number_of_gunc",
    other_exp: "other_experience",
    term: "bridge_term",
    acq_date: "acquisition_date",
    "acq-date": "acquisition_date",
  }

  function applyInputsPayload(payload: Record<string, unknown>) {
    suppressPredictionsRef.current = true
    const hydrated: Record<string, unknown> = {}

    // Map all payload keys through legacy migration, then store in hydrated
    for (const [key, val] of Object.entries(payload)) {
      if (val === undefined || val === null) continue

      const canonicalCode = legacyKeyMap[key] ?? key

      const inputDef = peInputDefs.find((d) => d.input_code === canonicalCode)
      if (inputDef?.input_type === "date" && !(val instanceof Date)) {
        const d = parseDateLocal(val)
        if (d) hydrated[canonicalCode] = d
      } else if (inputDef?.input_type === "table" && Array.isArray(val)) {
        hydrated[canonicalCode] = val
      } else if (inputDef?.input_type === "boolean") {
        if (!(canonicalCode in hydrated)) {
          hydrated[canonicalCode] = (val === true || val === "true" || val === "yes" || val === "Yes")
        }
      } else {
        if (!(canonicalCode in hydrated)) hydrated[canonicalCode] = val
      }
    }

    // Normalize booleans from legacy payloads
    for (const inp of peInputDefs) {
      if (inp.input_type !== "boolean") continue
      const legacyCode = Object.entries(legacyKeyMap).find(([, v]) => v === inp.input_code)?.[0]
      const raw = legacyCode && legacyCode in payload ? payload[legacyCode] : undefined
      if (raw !== undefined && !(inp.input_code in hydrated)) {
        hydrated[inp.input_code] = (raw === "yes" || raw === true || raw === "true" || raw === "Yes")
      }
    }

    // Hydrate record IDs for linked inputs from legacy payload keys
    for (const inp of peInputDefs) {
      if (!inp.linked_table) continue
      const idKey = `${inp.input_code}_record_id`
      const legacyId = payload[`${inp.input_code}_id`] ?? payload[`${inp.input_code}_record_id`]
      if (typeof legacyId === "string" && legacyId) hydrated[idKey] = legacyId
    }

    // Apply all hydrated values to extraFormValues in one batch
    setExtraFormValues((prev) => ({ ...prev, ...hydrated }))
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

      const addrValues: Record<string, string> = {
        street: [streetNumber, route].filter(Boolean).join(" "),
        city: locality,
        state: admin1,
        zip: postal,
        county: countyName,
      }
      for (const [, roleMap] of addressGroupIndex) {
        for (const [role, code] of roleMap) {
          if (role in addrValues) updateValue(code, addrValues[role])
        }
      }
      setPredictions([])
      setShowPredictions(false)
      // Prevent the next input value change from reopening the menu immediately
      suppressPredictionsRef.current = true
      // New token after a selection, per session semantics
      sessionTokenRef.current = new places.AutocompleteSessionToken()
    })
  }

  return (
    <div data-layout="fixed" className="flex min-h-0 h-full flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
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
                        const quickSaveSelected = selectedMainRow
                          ? {
                              ...selectedMainRow.values,
                              program_name:
                                selectedMainRow.programName ??
                                (programResults?.[selectedMainRow.programIdx ?? 0]?.external_name ?? null),
                              program_id:
                                selectedMainRow.programId ??
                                (programResults?.[selectedMainRow.programIdx ?? 0]?.id ?? null),
                              program_index: selectedMainRow.programIdx ?? 0,
                              row_index: selectedMainRow.rowIdx ?? 0,
                            }
                          : null
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
                              outputs: programResults?.map(r => {
                                if (!r.data) return null
                                return { ...r.data, program_id: r.id ?? null, program_name: r.external_name ?? null }
                              }).filter(Boolean) ?? null,
                              selected: quickSaveSelected,
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
                              outputs: programResults?.map(r => {
                                if (!r.data) return null
                                return { ...r.data, program_id: r.id ?? null, program_name: r.external_name ?? null }
                              }).filter(Boolean) ?? null,
                              selected: quickSaveSelected,
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
                value={openAccordionSections}
                onValueChange={setOpenAccordionSections}
                className="w-full"
              >
                {peCategories.map((cat) => {
                  const catInputs = peInputDefs.filter(
                    (inp) => inp.category_id === cat.id && !inp.input_code?.startsWith("__")
                  )
                  const visibleInputs = catInputs.filter(
                    (inp) => !peHiddenCodes.has(inp.input_code)
                  )
                  if (visibleInputs.length === 0) return null
                  const rows = buildDynRows(visibleInputs)

                  const catButtons = sectionButtons.filter((b) => b.category_id === cat.id)

                  return (
                    <AccordionItem key={cat.id} value={`pe-cat-${cat.id}`} className="border-b">
                      <AccordionTrigger asDiv className="text-left text-base font-bold italic hover:no-underline">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="hover:underline">{cat.category}</span>
                          {catButtons.length > 0 && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {catButtons.map((btn) => (
                                <SectionActionButton
                                  key={btn.id}
                                  btn={btn}
                                  onGoogleMaps={handleOpenMapsModal}
                                  buildPayload={buildPayload}
                                  formValues={formValues}
                                  codeToIdMap={codeToIdMap}
                                  onApplyInputs={(inputs, color) => {
                                    const codes: string[] = []
                                    for (const [code, val] of Object.entries(inputs)) {
                                      updateValue(code, val)
                                      if (color) codes.push(code)
                                    }
                                    if (color && codes.length > 0) markSignalColors(codes, color)
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {rows.map((row) => (
                            <div key={row.rowIndex} className="grid grid-cols-4 gap-4">
                              {row.items.map((field) => {
                                if (field.input_type === "table") {
                                  const tc = field.config as Record<string, unknown> | null | undefined
                                  const hasTableConfig = tc && Array.isArray(tc.columns) && (tc.columns as unknown[]).length > 0

                                  if (hasTableConfig) {
                                    const tableConf = tc as unknown as TableConfig
                                    const linkedCode = tableConf.row_source.type === "input" ? tableConf.row_source.input_code : undefined
                                    let linkedVal: number | undefined
                                    if (linkedCode) {
                                      const raw = formValues[linkedCode] ?? extraFormValues[linkedCode]
                                      const n = raw !== undefined && raw !== null && raw !== "" ? Number(raw) : NaN
                                      linkedVal = Number.isFinite(n) && n > 0 ? n : 0
                                    }
                                    const tableData = (extraFormValues[field.input_code] as Record<string, unknown>[] | undefined) ?? []

                                    return (
                                      <div key={String(field.id)} className="col-span-4">
                                        <Label className="text-sm font-medium mb-1 block">{field.input_label}</Label>
                                        <ConfigurableGrid
                                          config={tableConf}
                                          data={tableData}
                                          onDataChange={(next) => setExtraFormValues((prev) => ({ ...prev, [field.input_code]: next }))}
                                          rowCount={linkedVal}
                                        />
                                      </div>
                                    )
                                  }

                                  return null
                                }
                                return (
                                  <div key={String(field.id)} className={getDynWidthClass(field.layout_width)}>
                                    <DynamicPEInput
                                      field={field}
                                      value={computedDefaults[field.input_code] ?? formValues[field.input_code]}
                                      onChange={(val) => updateValue(field.input_code, val)}
                                      onAddressSelect={(addrFields) => handleAddressSelect(field.input_code, addrFields)}
                                      onLinkedRecordSelect={(code, recId) => {
                                        setExtraFormValues((prev) => {
                                          const idKey = `${code}_record_id`
                                          if (prev[idKey] === recId) return prev
                                          return { ...prev, [idKey]: recId }
                                        })
                                      }}
                                      isRequired={peRequiredCodes.has(field.input_code)}
                                      isExpressionDefault={hasExpressionDefault.has(field.input_code)}
                                      expressionLabel={expressionLabels[field.input_code]}
                                      touched={!!touched[field.input_code]}
                                      formValues={formValuesMerged}
                                      signalColor={signalColors[field.input_code] ?? null}
                                      linkedRecords={field.linked_table ? linkedRecordsByTable[field.linked_table] : undefined}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
              {/* Old hardcoded AccordionItems removed - replaced by dynamic rendering above */}
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
              const origCode = peInputDefs.find((d) => d.input_code.includes("lender") && d.input_code.includes("origination"))?.input_code
              const adminCode = peInputDefs.find((d) => d.input_code.includes("lender") && d.input_code.includes("admin"))?.input_code
              if (origCode && typeof lo === "string" && lo.trim().length > 0) updateValue(origCode, lo)
              if (adminCode && typeof la === "string" && la.trim().length > 0) updateValue(adminCode, la)
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
              {resolvedFullAddress || "Enter street, city, state, and zip to preview the subject property."}
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


// ---------- Section Action Button ----------

function SectionActionButton({
  btn,
  onGoogleMaps,
  buildPayload,
  onApplyInputs,
  formValues,
  codeToIdMap,
}: {
  btn: SectionButton
  onGoogleMaps: (e?: React.MouseEvent) => void
  buildPayload: () => Record<string, unknown>
  onApplyInputs?: (inputs: Record<string, unknown>, signalColor: string | null) => void
  formValues?: Record<string, unknown>
  codeToIdMap?: Map<string, string>
}) {
  const [loading, setLoading] = React.useState(false)
  const [clicked, setClicked] = React.useState(false)

  // Sync glow animation across all buttons by anchoring to wall-clock time
  const glowSyncDelay = React.useMemo(() => {
    const periodMs = 3500
    const offset = Date.now() % periodMs
    return `-${offset}ms`
  }, [])

  const isGoogleMaps = btn.actions.some((a) => a.action_type === "google_maps")

  const requiredSatisfied = React.useMemo(() => {
    const required = btn.required_inputs ?? []
    if (required.length === 0) return true
    if (!formValues || !codeToIdMap) return true
    const idToCode = new Map<string, string>()
    for (const [code, id] of codeToIdMap.entries()) idToCode.set(id, code)
    return required.every((inputId) => {
      const code = idToCode.get(inputId)
      if (!code) return true
      const val = formValues[code]
      return val !== undefined && val !== null && val !== ""
    })
  }, [btn.required_inputs, formValues, codeToIdMap])

  if (isGoogleMaps) {
    const glowing = !clicked && requiredSatisfied
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={!requiredSatisfied}
        className={cn(
          "h-7 not-italic",
          glowing && "border border-primary/50 animate-attention-glow",
        )}
        style={glowing ? { animationDelay: glowSyncDelay } : undefined}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setClicked(true)
          onGoogleMaps(e)
        }}
      >
        {btn.label}
      </Button>
    )
  }

  const workflowActions = btn.actions.filter((a) => a.action_type === "workflow" && a.action_uuid)
  const canRun = workflowActions.length > 0 && requiredSatisfied
  const glowing = !clicked && !loading && canRun

  return (
    <Button
      size="sm"
      variant="secondary"
      className={cn(
        "h-7 not-italic",
        glowing && "border border-primary/50 animate-attention-glow",
      )}
      style={glowing ? { animationDelay: glowSyncDelay } : undefined}
      disabled={loading || !canRun}
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (loading || !canRun) return
        setClicked(true)
        setLoading(true)
        try {
          const payload = buildPayload()
          const results = await Promise.allSettled(
            workflowActions.map(async (a) => {
              const res = await fetch(`/api/workflows/${a.action_uuid}/webhook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
              if (!res.ok) {
                const errBody = await res.text().catch(() => "")
                let detail = ""
                try { detail = JSON.parse(errBody)?.error ?? errBody } catch { detail = errBody }
                throw new Error(detail || `Request failed (${res.status})`)
              }
              const data = await res.json().catch(() => ({}))
              if (data.inputs && typeof data.inputs === "object" && onApplyInputs) {
                onApplyInputs(data.inputs as Record<string, unknown>, btn.signal_color ?? null)
              }
              return data
            })
          )
        } catch {
          // silently ignore automation errors
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : null}
      {btn.label}
    </Button>
  )
}


// ---------- Results UI ----------
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
  const [mcpOpen, setMcpOpen] = useState<boolean>(false)
  const [resolvedSheets, setResolvedSheets] = useState<ResolvedTermSheet[]>([])
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0)
  const [isInternalOrg, setIsInternalOrg] = useState(false)
  const [sheetProps, setSheetProps] = useState<DSCRTermSheetData>({})
  const previewRef = useRef<HTMLDivElement | null>(null)

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

  function getCleanHtmlFromIframe(srcIframe: HTMLIFrameElement): string | null {
    const srcDoc = srcIframe.contentDocument || srcIframe.contentWindow?.document
    if (!srcDoc) return null
    const clone = srcDoc.documentElement.cloneNode(true) as HTMLElement
    clone.querySelectorAll(".ts-edit").forEach((el) => el.classList.remove("ts-edit"))
    clone.querySelectorAll(".ts-replaceable").forEach((el) => el.classList.remove("ts-replaceable"))
    clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"))
    clone.querySelectorAll("[data-ts-empty]").forEach((el) => el.removeAttribute("data-ts-empty"))
    clone.querySelectorAll(".ts-img-popover").forEach((el) => el.remove())
    const overflow = clone.querySelector("style")
    if (!overflow) {
      const style = srcDoc.createElement("style")
      style.textContent = "html,body{overflow:visible!important}"
      clone.querySelector("head")?.appendChild(style)
    }
    return `<!DOCTYPE html>${clone.outerHTML}`
  }

  async function renderIframeToPdf(srcIframe: HTMLIFrameElement): Promise<File | null> {
    const html = getCleanHtmlFromIframe(srcIframe)
    if (!html) return null
    const res = await fetch("/api/pdf/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "PDF generation failed" }))
      throw new Error(err.error || "PDF generation failed")
    }
    const blob = await res.blob()
    return new File([blob], `term-sheet-${Date.now()}.pdf`, { type: "application/pdf" })
  }

  // Render the currently open preview into a PDF File
  const renderPreviewToPdf = async (): Promise<File | null> => {
    const iframe = previewRef.current?.querySelector("iframe") as HTMLIFrameElement | null
    if (iframe) {
      return renderIframeToPdf(iframe)
    }
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

  const TERMSHEET_WEBHOOK_NEW = "https://n8n.axora.info/webhook/ac651502-6422-400c-892e-c268b8c66201"

  async function openTermSheetPreview(rowIndex?: number, opts?: { autoDownloadPdf?: boolean; autoShare?: boolean }) {
    try {
      setResolvedSheets([])
      setActiveSheetIdx(0)
      setMcpOpen(true)

      const rawInputs = (typeof getInputs === "function" ? getInputs() : {}) as Record<string, unknown>
      const idx = rowIndex ?? Number(d?.highlight_display ?? 0)
      const payloadRow: Record<string, unknown> = {
        loan_price: pick<string | number>(d?.loan_price, idx),
        interest_rate: pick<string | number>(d?.interest_rate, idx),
      }
      if (isBridgeResp) {
        payloadRow["initial_loan_amount"] = pick<string | number>(d?.initial_loan_amount, idx)
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

      // 1. Evaluate which term sheets match current inputs
      const evalRes = await fetch("/api/pe-term-sheets/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_values: inputs }),
      })
      const evalJson = await evalRes.json().catch(() => ({ term_sheets: [], org_logos: null }))
      const matchingSheets = evalJson.term_sheets as Array<{
        id: string; template_name: string; html_content: string;
        variables: TemplateVariable[]
      }>
      const evalOrgLogos = (evalJson.org_logos ?? { light: null, dark: null }) as OrgLogos
      setIsInternalOrg(evalJson.is_internal === true)

      if (!matchingSheets || matchingSheets.length === 0) {
        setResolvedSheets([])
        return
      }

      // 2. Call the n8n webhook for variable values
      const webhookBody = {
        program: isBroker ? (r.external_name ?? "Program") : (r.internal_name ?? r.external_name ?? "Program"),
        program_id: r.id ?? null,
        row_index: idx,
        inputs,
        row: normalizedRow,
        organization_member_id: memberId ?? null,
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const webhookRes = await fetch(`${TERMSHEET_WEBHOOK_NEW}?_=${encodeURIComponent(nonce)}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "X-Client-Request-Id": nonce,
        },
        body: JSON.stringify(webhookBody),
      })
      const webhookRaw = await webhookRes.json().catch(() => ({}))
      const webhookData: Record<string, string> = Array.isArray(webhookRaw) ? (webhookRaw[0] ?? {}) : (webhookRaw ?? {})

      // 3. Resolve variables into HTML for each matching template
      const resolved: ResolvedTermSheet[] = matchingSheets.map((sheet) => ({
        id: sheet.id,
        template_name: sheet.template_name,
        resolvedHtml: resolveTemplateVariables(sheet.html_content, sheet.variables, webhookData, evalOrgLogos),
      }))

      setResolvedSheets(resolved)

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
                if (msg.includes("cancel") || name === "AbortError" || name === "NotAllowedError") {
                  // user cancelled
                } else {
                  toast({ title: "PDF error", description: (shareErr as any)?.message || "Share failed", variant: "destructive" })
                }
              }
            } else if (opts?.autoDownloadPdf) {
              await saveFileWithPrompt(file)
              void logCardTermSheetActivity("downloaded", file)
            }
          } catch (e) {
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
        <DialogContent showCloseButton={false} className="sm:max-w-[min(1060px,calc(100vw-2rem))] max-h-[90vh] overflow-hidden px-6 pt-4 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95vh] max-sm:px-4 max-sm:pt-2 max-sm:pb-2">
          <DialogHeader className="mb-1">
            <DialogTitle className="text-base">Term Sheet</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            aria-label="Share term sheet"
            className="absolute right-[104px] top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            onClick={async () => {
              try {
                const hasShareApi = typeof navigator !== "undefined" && "share" in navigator
                const handle = hasShareApi ? null : await openSaveDialog(`term-sheet-${Date.now()}.pdf`)
                const file = await renderPreviewToPdf()
                if (!file) throw new Error("Could not render PDF")
                const canShareFiles =
                  hasShareApi &&
                  "canShare" in navigator &&
                  (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
                const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
                if (nav?.share && canShareFiles) {
                  await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                  void logCardTermSheetActivity("shared", file)
                } else {
                  await saveFileWithPrompt(file, handle)
                  toast({ title: "PDF Downloaded", description: "You can now share the downloaded file." })
                  void logCardTermSheetActivity("downloaded", file)
                }
              } catch (e) {
                if ((e as any)?.name === "AbortError") return
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
            className="absolute right-[60px] top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            onClick={async () => {
              try {
                const handle = await openSaveDialog(`term-sheet-${Date.now()}.pdf`)
                const file = await renderPreviewToPdf()
                if (!file) throw new Error("Could not render PDF")
                await saveFileWithPrompt(file, handle)
                void logCardTermSheetActivity("downloaded", file)
              } catch (e) {
                if ((e as any)?.name === "AbortError") return
                const message = e instanceof Error ? e.message : "Unknown error"
                toast({ title: "Download failed", description: message, variant: "destructive" })
              }
            }}
          >
            <IconDownload />
          </button>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            onClick={() => setMcpOpen(false)}
          >
            <IconX />
          </button>
          {resolvedSheets.length > 0 ? (
            <div className="flex gap-3 min-h-0">
              {resolvedSheets.length > 1 && (
                <div className="w-[180px] shrink-0 border-r pr-3 overflow-y-auto">
                  <div className="space-y-1">
                    {resolvedSheets.map((sheet, idx) => (
                      <button
                        key={sheet.id}
                        type="button"
                        onClick={() => setActiveSheetIdx(idx)}
                        className={cn(
                          "w-full text-left rounded-md px-3 py-2 text-sm transition-colors truncate",
                          idx === activeSheetIdx
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                        title={sheet.template_name}
                      >
                        {sheet.template_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <ScaledHtmlPreview
                  html={resolvedSheets[activeSheetIdx]?.resolvedHtml ?? ""}
                  previewRef={previewRef}
                  isEditable={isInternalOrg}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-[70vh] items-center justify-center">
              <div className="text-sm text-muted-foreground">
                {mcpOpen && resolvedSheets.length === 0 ? "Preparing term sheet…" : "No term sheets match current inputs."}
              </div>
            </div>
          )}
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

  const [mcpOpenMain, setMcpOpenMain] = useState<boolean>(false)
  const [resolvedSheetsMain, setResolvedSheetsMain] = useState<ResolvedTermSheet[]>([])
  const [activeSheetIdxMain, setActiveSheetIdxMain] = useState<number>(0)
  const [isInternalOrgMain, setIsInternalOrgMain] = useState(false)
  const [sheetPropsMain, setSheetPropsMain] = useState<DSCRTermSheetData>({})
  const previewRefMain = useRef<HTMLDivElement | null>(null)
  const TERMSHEET_WEBHOOK_MAIN = "https://n8n.axora.info/webhook/ac651502-6422-400c-892e-c268b8c66201"

  const renderPreviewToPdfMain = async (): Promise<File | null> => {
    const iframe = previewRefMain.current?.querySelector("iframe") as HTMLIFrameElement | null
    if (iframe) {
      return renderIframeToPdf(iframe)
    }
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
      setResolvedSheetsMain([])
      setActiveSheetIdxMain(0)
      setMcpOpenMain(true)

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
      const normalizedRow = toYesNoDeepGlobal(payloadRow) as Record<string, unknown>

      // 1. Evaluate which term sheets match
      const evalRes = await fetch("/api/pe-term-sheets/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_values: inputs }),
      })
      const evalJson = await evalRes.json().catch(() => ({ term_sheets: [], org_logos: null }))
      const matchingSheets = evalJson.term_sheets as Array<{
        id: string; template_name: string; html_content: string;
        variables: TemplateVariable[]
      }>
      const evalOrgLogos = (evalJson.org_logos ?? { light: null, dark: null }) as OrgLogos
      setIsInternalOrgMain(evalJson.is_internal === true)

      if (!matchingSheets || matchingSheets.length === 0) {
        setResolvedSheetsMain([])
        return
      }

      // 2. Call n8n webhook for variable values
      const r = results?.[selected.programIdx]
      const webhookBody = {
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
        body: JSON.stringify(webhookBody),
      })
      const webhookRaw = await res.json().catch(() => ({}))
      const webhookData: Record<string, string> = Array.isArray(webhookRaw) ? (webhookRaw[0] ?? {}) : (webhookRaw ?? {})

      // 3. Resolve variables
      const resolved: ResolvedTermSheet[] = matchingSheets.map((sheet) => ({
        id: sheet.id,
        template_name: sheet.template_name,
        resolvedHtml: resolveTemplateVariables(sheet.html_content, sheet.variables, webhookData, evalOrgLogos),
      }))

      setResolvedSheetsMain(resolved)

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
                void logPanelTermSheetActivity("shared", file)
              } else {
                await saveFileWithPrompt(file)
                toast({ title: "Saved", description: "PDF saved to your device." })
                void logPanelTermSheetActivity("downloaded", file)
              }
            } else if (opts?.autoDownloadPdf) {
              await saveFileWithPrompt(file)
              void logPanelTermSheetActivity("downloaded", file)
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
            <DialogContent showCloseButton={false} className="sm:max-w-[min(1060px,calc(100vw-2rem))] max-h-[90vh] overflow-hidden px-6 pt-4 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95vh] max-sm:px-4 max-sm:pt-2 max-sm:pb-2">
              <DialogHeader className="mb-1">
                <DialogTitle className="text-base">Term Sheet</DialogTitle>
              </DialogHeader>
              <button
                type="button"
                aria-label="Share term sheet"
                className="absolute right-[104px] top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                onClick={async () => {
                  try {
                    const hasShareApi = typeof navigator !== "undefined" && "share" in navigator
                    const handle = hasShareApi ? null : await openSaveDialog(`term-sheet-${Date.now()}.pdf`)
                    const file = await renderPreviewToPdfMain()
                    if (!file) throw new Error("Could not render PDF")
                    const canShareFiles =
                      hasShareApi &&
                      "canShare" in navigator &&
                      (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
                    const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
                    if (nav?.share && canShareFiles) {
                      await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                      void logPanelTermSheetActivity("shared", file)
                    } else {
                      await saveFileWithPrompt(file, handle)
                      toast({ title: "PDF Downloaded", description: "You can now share the downloaded file." })
                      void logPanelTermSheetActivity("downloaded", file)
                    }
                  } catch (e) {
                    if ((e as any)?.name === "AbortError") return
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
                className="absolute right-[60px] top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                onClick={async () => {
                  try {
                    const handle = await openSaveDialog(`term-sheet-${Date.now()}.pdf`)
                    const file = await renderPreviewToPdfMain()
                    if (!file) throw new Error("Could not render PDF")
                    await saveFileWithPrompt(file, handle)
                    void logPanelTermSheetActivity("downloaded", file)
                  } catch (e) {
                    if ((e as any)?.name === "AbortError") return
                    const message = e instanceof Error ? e.message : "Unknown error"
                    toast({ title: "Download failed", description: message, variant: "destructive" })
                  }
                }}
              >
                <IconDownload />
              </button>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                onClick={() => setMcpOpenMain(false)}
              >
                <IconX />
              </button>
              {resolvedSheetsMain.length > 0 ? (
                <div className="flex gap-3 min-h-0">
                  {resolvedSheetsMain.length > 1 && (
                    <div className="w-[180px] shrink-0 border-r pr-3 overflow-y-auto">
                      <div className="space-y-1">
                        {resolvedSheetsMain.map((sheet, idx) => (
                          <button
                            key={sheet.id}
                            type="button"
                            onClick={() => setActiveSheetIdxMain(idx)}
                            className={cn(
                              "w-full text-left rounded-md px-3 py-2 text-sm transition-colors truncate",
                              idx === activeSheetIdxMain
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                            title={sheet.template_name}
                          >
                            {sheet.template_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <ScaledHtmlPreview
                      html={resolvedSheetsMain[activeSheetIdxMain]?.resolvedHtml ?? ""}
                      previewRef={previewRefMain}
                      isEditable={isInternalOrgMain}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-[70vh] items-center justify-center">
                  <div className="text-sm text-muted-foreground">
                    {mcpOpenMain && resolvedSheetsMain.length === 0 ? "Preparing term sheet…" : "No term sheets match current inputs."}
                  </div>
                </div>
              )}
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
          <DialogContent className="sm:max-w-[min(1060px,calc(100vw-2rem))] max-h-[90vh] px-6 pt-4 pb-3 gap-2 max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[95vh] max-sm:px-4 max-sm:pt-2 max-sm:pb-2">
            <DialogHeader className="mb-1">
              <DialogTitle className="text-base">Term Sheet</DialogTitle>
            </DialogHeader>
            <button
              type="button"
              aria-label="Share term sheet"
              className="absolute right-24 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              onClick={async () => {
                try {
                  const hasShareApi = typeof navigator !== "undefined" && "share" in navigator
                  const handle = hasShareApi ? null : await openSaveDialog(`term-sheet-${Date.now()}.pdf`)
                  const file = await renderPreviewToPdfMain()
                  if (!file) throw new Error("Could not render PDF")
                  const canShareFiles =
                    hasShareApi &&
                    "canShare" in navigator &&
                    (navigator as unknown as { canShare: (data: { files: File[] }) => boolean }).canShare?.({ files: [file] })
                  const nav = navigator as unknown as { share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> }
                  if (nav?.share && canShareFiles) {
                    await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." })
                    void logPanelTermSheetActivity("shared", file)
                  } else {
                    await saveFileWithPrompt(file, handle)
                    toast({ title: "Saved", description: "PDF saved to your device." })
                    void logPanelTermSheetActivity("downloaded", file)
                  }
                } catch (e) {
                  if ((e as any)?.name === "AbortError") return
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
                  const handle = await openSaveDialog(`term-sheet-${Date.now()}.pdf`)
                  const file = await renderPreviewToPdfMain()
                  if (!file) throw new Error("Could not render PDF")
                  await saveFileWithPrompt(file, handle)
                  void logPanelTermSheetActivity("downloaded", file)
                } catch (e) {
                  if ((e as any)?.name === "AbortError") return
                  const message = e instanceof Error ? e.message : "Unknown error"
                  toast({ title: "Download failed", description: message, variant: "destructive" })
                }
              }}
            >
              <IconDownload />
            </button>
            {resolvedSheetsMain.length > 0 ? (
              <div className="flex gap-3 min-h-0">
                {resolvedSheetsMain.length > 1 && (
                  <div className="w-[180px] shrink-0 border-r pr-3 overflow-y-auto">
                    <div className="space-y-1">
                      {resolvedSheetsMain.map((sheet, idx) => (
                        <button
                          key={sheet.id}
                          type="button"
                          onClick={() => setActiveSheetIdxMain(idx)}
                          className={cn(
                            "w-full text-left rounded-md px-3 py-2 text-sm transition-colors truncate",
                            idx === activeSheetIdxMain
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                          title={sheet.template_name}
                        >
                          {sheet.template_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <ScaledHtmlPreview
                    html={resolvedSheetsMain[activeSheetIdxMain]?.resolvedHtml ?? ""}
                    previewRef={previewRefMain}
                    isEditable={isInternalOrgMain}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-[70vh] items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  {mcpOpenMain && resolvedSheetsMain.length === 0 ? "Preparing term sheet…" : "No term sheets match current inputs."}
                </div>
              </div>
            )}
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

