"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FileText, Loader2 } from "lucide-react"

interface PdfThumbnailProps {
  /** URL to the PDF file */
  url: string
  /** Alt text / title for the thumbnail */
  title?: string
  /** Additional CSS classes */
  className?: string
  /** Width of the thumbnail in pixels */
  width?: number
  /** Height of the thumbnail in pixels */
  height?: number
}

export function PdfThumbnail({
  url,
  title,
  className,
  width = 120,
  height = 156,
}: PdfThumbnailProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    if (!url) {
      setError(true)
      setLoading(false)
      return
    }

    let cancelled = false

    async function renderThumbnail() {
      try {
        setLoading(true)
        setError(false)

        // Dynamically import pdfjs-dist
        const pdfjs = await import("pdfjs-dist")

        // Use local worker file copied to public folder
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

        const loadingTask = pdfjs.getDocument(url)
        const pdfDoc = await loadingTask.promise

        if (cancelled) return

        // Get the first page
        const page = await pdfDoc.getPage(1)

        if (cancelled || !canvasRef.current) return

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (!context) {
          setError(true)
          setLoading(false)
          return
        }

        // Calculate scale to fit the thumbnail dimensions
        const viewport = page.getViewport({ scale: 1 })
        const scaleX = width / viewport.width
        const scaleY = height / viewport.height
        const scale = Math.min(scaleX, scaleY)

        const scaledViewport = page.getViewport({ scale })

        canvas.height = scaledViewport.height
        canvas.width = scaledViewport.width

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        }

        await page.render(renderContext).promise

        if (!cancelled) {
          setLoading(false)
        }
      } catch (err) {
        console.error("Error rendering PDF thumbnail:", err)
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    renderThumbnail()

    return () => {
      cancelled = true
    }
  }, [url, width, height])

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-sm border bg-white shadow-md",
        className
      )}
      style={{ width, height }}
      title={title}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <span className="text-[10px]">Preview unavailable</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={cn(
          "rounded-sm",
          (loading || error) && "invisible"
        )}
      />
    </div>
  )
}

interface FileThumbnailProps {
  /** File object to preview */
  file: File
  /** Additional CSS classes */
  className?: string
  /** Width of the thumbnail in pixels */
  width?: number
  /** Height of the thumbnail in pixels */
  height?: number
}

export function FileThumbnail({
  file,
  className,
  width = 120,
  height = 156,
}: FileThumbnailProps) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (file.type === "application/pdf") {
      const url = URL.createObjectURL(file)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return
  }, [file])

  // If it's a PDF, render thumbnail
  if (file.type === "application/pdf" && objectUrl) {
    return (
      <PdfThumbnail
        url={objectUrl}
        title={file.name}
        className={className}
        width={width}
        height={height}
      />
    )
  }

  // For non-PDF files, show a generic file icon
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-sm border bg-white shadow-md",
        className
      )}
      style={{ width, height }}
      title={file.name}
    >
      <FileText className="h-8 w-8 text-muted-foreground" />
      <span className="mt-1 text-[10px] text-muted-foreground">
        {file.name.split(".").pop()?.toUpperCase()}
      </span>
    </div>
  )
}
