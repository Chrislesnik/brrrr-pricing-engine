"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Input } from "@repo/ui/shadcn/input"
import { SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LinkedRecord {
  id: string
  label: string
}

interface LinkedAutocompleteInputProps {
  value?: string
  onChange: (value: string) => void
  onRecordSelect?: (record: LinkedRecord | null) => void
  records: LinkedRecord[]
  placeholder?: string
  className?: string
  id?: string
}

export function LinkedAutocompleteInput({
  value,
  onChange,
  onRecordSelect,
  records,
  placeholder,
  className,
  id,
}: LinkedAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const pointerInMenuRef = useRef(false)
  const [text, setText] = useState<string>(value ?? "")
  const [show, setShow] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    if (value !== undefined) setText(value)
  }, [value])

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) => r.label.toLowerCase().includes(q))
  }, [text, records])

  const isLinkedMatch = useMemo(() => {
    const t = text.trim().toLowerCase()
    return t !== "" && records.some((r) => r.label.toLowerCase() === t)
  }, [text, records])

  function handleChange(newText: string) {
    setText(newText)
    onChange(newText)
    onRecordSelect?.(null)
    setShow(true)
    setActiveIdx(-1)
  }

  function selectRecord(rec: LinkedRecord) {
    setText(rec.label)
    onChange(rec.label)
    onRecordSelect?.(rec)
    setShow(false)
    setActiveIdx(-1)
  }

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const updateMenuPos = useCallback(() => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    if (!show) return
    updateMenuPos()
    window.addEventListener("scroll", updateMenuPos, true)
    window.addEventListener("resize", updateMenuPos)
    return () => {
      window.removeEventListener("scroll", updateMenuPos, true)
      window.removeEventListener("resize", updateMenuPos)
    }
  }, [show, updateMenuPos])

  return (
    <div ref={wrapperRef} className="relative">
      <div className={cn("relative rounded-md", isLinkedMatch && "ring-2 ring-blue-500")}>
        <SearchIcon className={cn("pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5", isLinkedMatch ? "text-blue-500" : "text-muted-foreground")} />
        <Input
          id={id}
          ref={inputRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (records.length > 0) setShow(true)
          }}
          onKeyDown={(e) => {
            if (!show || filtered.length === 0) return
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActiveIdx((idx) => Math.min(idx + 1, filtered.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActiveIdx((idx) => Math.max(idx - 1, 0))
            } else if (e.key === "Enter") {
              if (activeIdx >= 0) {
                e.preventDefault()
                selectRecord(filtered[activeIdx])
              }
            } else if (e.key === "Escape") {
              setShow(false)
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!pointerInMenuRef.current) setShow(false)
            }, 0)
          }}
          placeholder={placeholder ?? "Type to search..."}
          className={cn("pl-8", className)}
          autoComplete="off"
        />
      </div>
      {show && filtered.length > 0 && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 overflow-hidden rounded-md border bg-background shadow max-h-48 overflow-y-auto"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          role="listbox"
          onMouseDown={() => (pointerInMenuRef.current = true)}
          onMouseUp={() => (pointerInMenuRef.current = false)}
        >
          {filtered.map((rec, idx) => (
            <button
              key={rec.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent",
                idx === activeIdx && "bg-accent",
              )}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => selectRecord(rec)}
            >
              <span className="truncate">{rec.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
