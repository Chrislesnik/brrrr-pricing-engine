"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface ButtonInsertDialogProps {
  open: boolean
  onClose: () => void
  onSave: (label: string, href: string) => void
}

export function ButtonInsertDialog({ open, onClose, onSave }: ButtonInsertDialogProps) {
  const [label, setLabel] = useState("Button text")
  const [href, setHref] = useState("https://")
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setLabel("Button text")
    setHref("https://")
    const id = setTimeout(() => labelRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const handleSave = useCallback(() => {
    if (!href.trim()) return
    onSave(label.trim() || "Button text", href.trim())
    onClose()
  }, [label, href, onSave, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h3 className="text-[15px] font-semibold">Insert Button</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3 px-5 pb-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Label
            </label>
            <input
              ref={labelRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Button text"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Destination URL
            </label>
            <input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={handleSave}
            disabled={!href.trim()}
            className="rounded-md bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
