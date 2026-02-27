"use client"

import { useEffect, useRef, useState } from "react"
import { HTMLPreview } from "./html-preview"

interface HTMLEmbedDialogProps {
  open: boolean
  onClose: () => void
  onSave: (html: string) => void
}

export function HTMLEmbedDialog({ open, onClose, onSave }: HTMLEmbedDialogProps) {
  const [html, setHtml] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setHtml("")
    const id = window.setTimeout(() => textareaRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (previewOpen) {
        setPreviewOpen(false)
        return
      }
      onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose, previewOpen])

  useEffect(() => {
    if (open) return
    setPreviewOpen(false)
  }, [open])

  if (!open) return null

  const handleSave = () => {
    if (html.trim()) onSave(html.trim())
    onClose()
  }

  const lineCount = Math.max(html.split("\n").length, 1)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={() => {
        if (previewOpen) return
        onClose()
      }}
    >
      <div
        className="flex w-full max-w-[560px] max-h-[90vh] flex-col rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <h3 className="text-[15px] font-semibold">Write or paste your raw HTML</h3>
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

        <div className="min-h-0 flex-1 overflow-hidden px-5 pb-3">
          <div className="relative flex h-full overflow-hidden rounded-lg border border-border bg-background font-mono text-sm">
            <div className="select-none overflow-y-auto border-r border-border bg-muted/30 px-3 py-3 text-right text-[13px] leading-[1.65] text-muted-foreground">
              {Array.from({ length: lineCount }, (_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              placeholder="<table>content...</table>"
              spellCheck={false}
              className="min-h-[260px] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-3 text-[13px] leading-[1.65] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={!html.trim()}
            className="rounded-md border border-border px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preview / Source
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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

      <HTMLPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        html={html || "<!-- Empty HTML -->"}
        title="HTML Embed"
      />
    </div>
  )
}
