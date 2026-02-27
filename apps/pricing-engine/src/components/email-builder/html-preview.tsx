"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Download } from "lucide-react"

interface HTMLPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  html: string
  title: string
}

export function HTMLPreview({ open, onOpenChange, html, title }: HTMLPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview")

  useEffect(() => {
    if (!open) return
    setActiveTab("preview")
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const downloadHTML = () => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="mx-4 w-full max-w-4xl rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">Email Template - {title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy HTML"}
            </button>
            <button
              type="button"
              onClick={downloadHTML}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download className="size-3.5" />
              Download
            </button>
          </div>
        </div>

        <div className="px-5 pt-4">
          <div className="inline-flex items-center rounded-md border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("source")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "source"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Source Code
            </button>
          </div>
        </div>

        <div className="p-5 pt-3">
          {activeTab === "preview" ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                srcDoc={html}
                className="h-[500px] w-full bg-background"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto rounded-lg border border-border bg-zinc-900 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-200">{html}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
