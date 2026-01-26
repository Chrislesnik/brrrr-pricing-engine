"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export interface PDFViewerHandle {
  goToPage: (page: number, bbox?: BBox) => void
  clearHighlight: () => void
}

interface PDFViewerProps {
  url: string
  className?: string
}

export const PDFViewer = React.forwardRef<PDFViewerHandle, PDFViewerProps>(
  function PDFViewer({ url, className }, ref) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const [pdf, setPdf] = React.useState<any>(null)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(0)
    const [scale, setScale] = React.useState(1.0)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [highlightBox, setHighlightBox] = React.useState<BBox | null>(null)
    const [viewportInfo, setViewportInfo] = React.useState<{ scale: number; width: number; height: number } | null>(null)

    // Expose imperative methods via ref
    React.useImperativeHandle(ref, () => ({
      goToPage: (page: number, bbox?: BBox) => {
        if (page >= 1 && page <= totalPages) {
          setCurrentPage(page)
          setHighlightBox(bbox ?? null)
          // Scroll to top of the PDF container
          setTimeout(() => {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }, 100)
        }
      },
      clearHighlight: () => {
        setHighlightBox(null)
      },
    }), [totalPages])

    // Load PDF document
    React.useEffect(() => {
      let cancelled = false

      async function loadPdf() {
        try {
          setLoading(true)
          setError(null)

          // Dynamically import pdfjs-dist
          const pdfjs = await import("pdfjs-dist")
          
          // Use local worker file copied to public folder
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

          const loadingTask = pdfjs.getDocument(url)
          const pdfDoc = await loadingTask.promise

          if (!cancelled) {
            setPdf(pdfDoc)
            setTotalPages(pdfDoc.numPages)
            setCurrentPage(1)
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load PDF")
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

      loadPdf()

      return () => {
        cancelled = true
      }
    }, [url])

    // Render current page
    React.useEffect(() => {
      if (!pdf || !canvasRef.current) return

      let cancelled = false

      async function renderPage() {
        try {
          const page = await pdf.getPage(currentPage)
          
          if (cancelled || !canvasRef.current) return

          const canvas = canvasRef.current
          const context = canvas.getContext("2d")
          
          if (!context) return

          // Calculate scale to fit container width
          const containerWidth = containerRef.current?.clientWidth ?? 800
          const viewport = page.getViewport({ scale: 1 })
          const fitScale = (containerWidth - 48) / viewport.width // 48px for padding
          const finalScale = fitScale * scale

          const scaledViewport = page.getViewport({ scale: finalScale })

          canvas.height = scaledViewport.height
          canvas.width = scaledViewport.width

          // Store viewport info for highlight scaling
          setViewportInfo({
            scale: finalScale,
            width: viewport.width,
            height: viewport.height,
          })

          const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
          }

          await page.render(renderContext).promise
        } catch (err) {
          console.error("Error rendering page:", err)
        }
      }

      renderPage()

      return () => {
        cancelled = true
      }
    }, [pdf, currentPage, scale])

    // Clear highlight when page changes manually
    const goToPrevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1)
        setHighlightBox(null)
      }
    }

    const goToNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1)
        setHighlightBox(null)
      }
    }

    const zoomIn = () => {
      setScale((prev) => Math.min(prev + 0.25, 3))
    }

    const zoomOut = () => {
      setScale((prev) => Math.max(prev - 0.25, 0.5))
    }

    // Calculate highlight position based on viewport scale
    const getHighlightStyle = (): React.CSSProperties | null => {
      if (!highlightBox || !viewportInfo) return null

      const { scale: vpScale } = viewportInfo
      
      return {
        position: "absolute",
        left: highlightBox.x * vpScale,
        top: highlightBox.y * vpScale,
        width: highlightBox.w * vpScale,
        height: highlightBox.h * vpScale,
        backgroundColor: "rgba(255, 235, 59, 0.4)",
        border: "2px solid rgba(255, 193, 7, 0.8)",
        borderRadius: "2px",
        pointerEvents: "none",
        animation: "pulse 2s ease-in-out infinite",
      }
    }

    if (loading) {
      return (
        <div className={cn("flex h-full items-center justify-center bg-muted/30", className)}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading PDF...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className={cn("flex h-full items-center justify-center bg-muted/30", className)}>
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <span className="text-sm text-destructive">Error: {error}</span>
            <span className="text-xs text-muted-foreground">
              Make sure to add a PDF file at <code className="bg-muted px-1 rounded">public/test/sample.pdf</code>
            </span>
          </div>
        </div>
      )
    }

    const highlightStyle = getHighlightStyle()

    return (
      <div className={cn("flex h-full flex-col bg-muted/30", className)} ref={containerRef}>
        {/* Highlight animation keyframes */}
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}</style>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            {highlightBox && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHighlightBox(null)}
                className="text-xs"
              >
                Clear Highlight
              </Button>
            )}
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-6" ref={scrollContainerRef}>
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="shadow-lg rounded-sm bg-white"
              />
              {/* Highlight overlay */}
              {highlightStyle && (
                <div style={highlightStyle} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
