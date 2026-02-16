"use client"

import * as React from "react"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  Printer,
  Download,
  RotateCw,
  Search,
  X,
  FileText,
  Rows3,
} from "lucide-react"
import { cn } from "@repo/lib/cn"

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

/* -------------------------------------------------------------------------- */
/*  ScrollPageCanvas — renders a single page in scroll mode                    */
/* -------------------------------------------------------------------------- */

interface ScrollPageCanvasProps {
  pdf: any
  pageNum: number
  scale: number
  containerWidth: number
  rotation: number
  isVisible: boolean
  highlightBox: BBox | null
  highlightPage: number | null
  onRendered?: (pageNum: number, info: { scale: number; width: number; height: number }) => void
}

function ScrollPageCanvas({
  pdf,
  pageNum,
  scale,
  containerWidth,
  rotation,
  isVisible,
  highlightBox,
  highlightPage,
  onRendered,
}: ScrollPageCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = React.useState<{
    width: number
    height: number
  } | null>(null)
  const [rendered, setRendered] = React.useState(false)
  const [viewScale, setViewScale] = React.useState(1)

  // Get page dimensions on mount
  React.useEffect(() => {
    if (!pdf) return
    let cancelled = false
    pdf.getPage(pageNum).then((page: any) => {
      if (cancelled) return
      const vp = page.getViewport({ scale: 1 })
      const fitScale = (containerWidth - 48) / vp.width
      const finalScale = fitScale * scale
      setDimensions({
        width: Math.floor(vp.width * finalScale),
        height: Math.floor(vp.height * finalScale),
      })
      setViewScale(finalScale)
    })
    return () => {
      cancelled = true
    }
  }, [pdf, pageNum, scale, containerWidth])

  // Render when visible
  React.useEffect(() => {
    if (!pdf || !isVisible || !canvasRef.current || !dimensions) return

    let cancelled = false
    let renderTask: any = null

    async function render() {
      try {
        const page = await pdf.getPage(pageNum)
        if (cancelled || !canvasRef.current) return

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")
        if (!context) return

        const vp = page.getViewport({ scale: 1 })
        const fitScale = (containerWidth - 48) / vp.width
        const finalScale = fitScale * scale
        const scaledVp = page.getViewport({ scale: finalScale })

        canvas.width = scaledVp.width
        canvas.height = scaledVp.height

        renderTask = page.render({ canvasContext: context, viewport: scaledVp })
        await renderTask.promise

        if (!cancelled) {
          setRendered(true)
          onRendered?.(pageNum, {
            scale: finalScale,
            width: vp.width,
            height: vp.height,
          })
        }
      } catch (err: any) {
        if (err?.name === "RenderingCancelledException") return
        console.error(`Error rendering page ${pageNum}:`, err)
      }
    }

    render()
    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [pdf, pageNum, isVisible, scale, containerWidth, dimensions, onRendered])

  // Re-render when scale changes
  React.useEffect(() => {
    setRendered(false)
  }, [scale])

  const showHighlight =
    highlightBox && highlightPage === pageNum && rendered

  return (
    <div
      data-page={pageNum}
      className="flex flex-col items-center"
    >
      <div
        className="relative"
        style={{
          width: dimensions?.width ?? 0,
          height: dimensions?.height ?? 0,
          transform: `rotate(${rotation}deg)`,
          transition: "transform 0.3s",
        }}
      >
        {dimensions && (
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded-sm bg-white"
            style={{
              width: dimensions.width,
              height: dimensions.height,
            }}
          />
        )}
        {!rendered && dimensions && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {showHighlight && (
          <div
            style={{
              position: "absolute",
              left: `${highlightBox!.x * viewScale}px`,
              top: `${highlightBox!.y * viewScale}px`,
              width: `${highlightBox!.w * viewScale}px`,
              height: `${highlightBox!.h * viewScale}px`,
              backgroundColor: "rgba(255, 235, 59, 0.35)",
              border: "2px solid rgba(255, 193, 7, 0.8)",
              borderRadius: "3px",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}
      </div>
      <span className="text-[10px] text-muted-foreground mt-1.5 select-none">
        Page {pageNum}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  PDFViewer                                                                  */
/* -------------------------------------------------------------------------- */

export const PDFViewer = React.forwardRef<PDFViewerHandle, PDFViewerProps>(
  function PDFViewer({ url, className }, ref) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const pageRefsMap = React.useRef<Map<number, HTMLDivElement>>(new Map())

    const [pdf, setPdf] = React.useState<any>(null)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(0)
    const [scale, setScale] = React.useState(1.0)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [highlightBox, setHighlightBox] = React.useState<BBox | null>(null)
    const [highlightPage, setHighlightPage] = React.useState<number | null>(null)
    const [viewportInfo, setViewportInfo] = React.useState<{
      scale: number
      width: number
      height: number
      pdfHeight: number
    } | null>(null)
    const viewportInfoRef = React.useRef<{
      scale: number
      width: number
      height: number
      pdfHeight: number
    } | null>(null)
    const [rotation, setRotation] = React.useState(0)
    const [showSearch, setShowSearch] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [searchResults, setSearchResults] = React.useState<number[]>([])
    const [currentSearchIndex, setCurrentSearchIndex] = React.useState(0)
    const [isSearching, setIsSearching] = React.useState(false)
    const [pageInputValue, setPageInputValue] = React.useState("")
    const [searchMessage, setSearchMessage] = React.useState("")

    // View mode: single page vs continuous scroll
    const [viewMode, setViewMode] = React.useState<"single" | "scroll">("scroll")

    // Scroll mode: track which pages are visible for lazy rendering
    const [visiblePages, setVisiblePages] = React.useState<Set<number>>(new Set())
    const scrollTrackingRef = React.useRef(true)

    // Container width for scale calculations in scroll mode
    const [containerWidth, setContainerWidth] = React.useState(800)

    React.useEffect(() => {
      const el = containerRef.current
      if (!el) return
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width)
        }
      })
      ro.observe(el)
      return () => ro.disconnect()
    }, [])

    // Expose imperative methods via ref
    React.useImperativeHandle(
      ref,
      () => ({
        goToPage: (page: number, bbox?: BBox) => {
          if (page < 1 || page > totalPages) return

          setHighlightBox(bbox ?? null)
          setHighlightPage(bbox ? page : null)

          if (viewMode === "scroll") {
            // In scroll mode, scroll the page element into view
            setCurrentPage(page)
            setTimeout(() => {
              const el = pageRefsMap.current.get(page)
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }, 100)
          } else {
            setCurrentPage(page)
            setTimeout(() => {
              const vInfo = viewportInfoRef.current
              if (bbox && vInfo) {
                const scrollY = Math.max(0, bbox.y * vInfo.scale - 100)
                scrollContainerRef.current?.scrollTo({
                  top: scrollY,
                  behavior: "smooth",
                })
              } else {
                scrollContainerRef.current?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            }, 300)
          }
        },
        clearHighlight: () => {
          setHighlightBox(null)
          setHighlightPage(null)
        },
      }),
      [totalPages, viewMode]
    )

    // Load PDF document
    React.useEffect(() => {
      let cancelled = false

      async function loadPdf() {
        try {
          setLoading(true)
          setError(null)

          const pdfjs = await import("pdfjs-dist")
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
            setError(
              err instanceof Error ? err.message : "Failed to load PDF"
            )
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

    // Single-page mode: render current page to the single canvas
    React.useEffect(() => {
      if (viewMode !== "single" || !pdf || !canvasRef.current) return

      let cancelled = false
      let renderTask: any = null

      async function renderPage() {
        try {
          const page = await pdf.getPage(currentPage)
          if (cancelled || !canvasRef.current) return

          const canvas = canvasRef.current
          const context = canvas.getContext("2d")
          if (!context) return

          const cWidth = containerRef.current?.clientWidth ?? 800
          const viewport = page.getViewport({ scale: 1 })
          const fitScale = (cWidth - 48) / viewport.width
          const finalScale = fitScale * scale

          const scaledViewport = page.getViewport({ scale: finalScale })

          canvas.height = scaledViewport.height
          canvas.width = scaledViewport.width

          const newViewportInfo = {
            scale: finalScale,
            width: viewport.width,
            height: viewport.height,
            pdfHeight: viewport.height,
          }
          setViewportInfo(newViewportInfo)
          viewportInfoRef.current = newViewportInfo

          renderTask = page.render({
            canvasContext: context,
            viewport: scaledViewport,
          })
          await renderTask.promise
        } catch (err: any) {
          if (err?.name === "RenderingCancelledException") return
          console.error("Error rendering page:", err)
        }
      }

      renderPage()
      return () => {
        cancelled = true
        renderTask?.cancel()
      }
    }, [pdf, currentPage, scale, viewMode])

    // Scroll mode: IntersectionObserver for visibility + page tracking
    React.useEffect(() => {
      if (viewMode !== "scroll" || !pdf || totalPages === 0) return

      const scrollEl = scrollContainerRef.current
      if (!scrollEl) return

      // Observe all page containers for visibility (lazy render) and tracking
      const observer = new IntersectionObserver(
        (entries) => {
          const newVisible = new Set(visiblePages)
          let changed = false

          for (const entry of entries) {
            const pageNum = Number(
              (entry.target as HTMLElement).dataset.page
            )
            if (!pageNum) continue

            if (entry.isIntersecting) {
              // Also mark pages in buffer range
              for (
                let p = Math.max(1, pageNum - 2);
                p <= Math.min(totalPages, pageNum + 2);
                p++
              ) {
                if (!newVisible.has(p)) {
                  newVisible.add(p)
                  changed = true
                }
              }
            }
          }

          if (changed) {
            setVisiblePages(new Set(newVisible))
          }

          // Track which page is most visible for the toolbar indicator
          if (!scrollTrackingRef.current) return
          let bestPage = currentPage
          let bestRatio = 0
          for (const entry of entries) {
            const pageNum = Number(
              (entry.target as HTMLElement).dataset.page
            )
            if (pageNum && entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio
              bestPage = pageNum
            }
          }
          if (bestRatio > 0) {
            setCurrentPage(bestPage)
          }
        },
        {
          root: scrollEl,
          rootMargin: "200px 0px",
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      )

      // Observe page divs
      const timeout = setTimeout(() => {
        pageRefsMap.current.forEach((el) => observer.observe(el))
      }, 100)

      return () => {
        clearTimeout(timeout)
        observer.disconnect()
      }
    }, [viewMode, pdf, totalPages]) // eslint-disable-line react-hooks/exhaustive-deps

    // Initialize visible pages when switching to scroll mode
    React.useEffect(() => {
      if (viewMode === "scroll" && totalPages > 0) {
        // Start by making the first few pages visible
        const initial = new Set<number>()
        for (let i = 1; i <= Math.min(5, totalPages); i++) {
          initial.add(i)
        }
        // Also include the current page range
        for (
          let i = Math.max(1, currentPage - 2);
          i <= Math.min(totalPages, currentPage + 2);
          i++
        ) {
          initial.add(i)
        }
        setVisiblePages(initial)

        // Scroll to current page after a tick
        if (currentPage > 1) {
          setTimeout(() => {
            const el = pageRefsMap.current.get(currentPage)
            if (el) {
              el.scrollIntoView({ block: "start" })
            }
          }, 50)
        }
      }
    }, [viewMode, totalPages]) // eslint-disable-line react-hooks/exhaustive-deps

    // Page navigation (single mode)
    const goToPrevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1)
        setHighlightBox(null)
        setHighlightPage(null)
      }
    }

    const goToNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1)
        setHighlightBox(null)
        setHighlightPage(null)
      }
    }

    const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))
    const rotate = () => setRotation((prev) => (prev + 90) % 360)

    const handlePrint = () => {
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print()
        })
      }
    }

    const handleDownload = () => {
      const link = document.createElement("a")
      link.href = url
      link.download = url.split("/").pop() || "document.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    const handlePageInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      setPageInputValue(e.target.value)
    }

    const handlePageInputKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Enter") {
        const pageNum = parseInt(pageInputValue, 10)
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          setCurrentPage(pageNum)
          setHighlightBox(null)
          setHighlightPage(null)
          if (viewMode === "scroll") {
            setTimeout(() => {
              const el = pageRefsMap.current.get(pageNum)
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }, 50)
          }
        }
        setPageInputValue("")
      } else if (e.key === "Escape") {
        setPageInputValue("")
      }
    }

    // Search
    const handleSearch = async () => {
      if (!pdf || !searchQuery.trim()) return

      setIsSearching(true)
      setSearchMessage("")
      const results: number[] = []
      let totalTextLength = 0

      try {
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const text = textContent.items
            .map((item: any) => item.str)
            .join(" ")
          totalTextLength += text.length

          if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push(i)
          }
        }

        setSearchResults(results)
        setCurrentSearchIndex(0)

        if (results.length > 0) {
          setCurrentPage(results[0])
          setHighlightBox(null)
          setHighlightPage(null)
          setSearchMessage("")
          if (viewMode === "scroll") {
            setTimeout(() => {
              const el = pageRefsMap.current.get(results[0])
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }, 50)
          }
        } else if (totalTextLength < 100) {
          setSearchMessage("PDF has no searchable text")
        } else {
          setSearchMessage("No results found")
        }
      } catch (err) {
        console.error("Search error:", err)
        setSearchMessage("Search failed")
      } finally {
        setIsSearching(false)
      }
    }

    const handleSearchKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Enter") {
        handleSearch()
      } else if (e.key === "Escape") {
        setShowSearch(false)
        setSearchQuery("")
        setSearchResults([])
      }
    }

    const navigateSearchResult = (index: number) => {
      setCurrentSearchIndex(index)
      const page = searchResults[index]
      setCurrentPage(page)
      if (viewMode === "scroll") {
        setTimeout(() => {
          const el = pageRefsMap.current.get(page)
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }, 50)
      }
    }

    const goToNextSearchResult = () => {
      if (searchResults.length === 0) return
      navigateSearchResult(
        (currentSearchIndex + 1) % searchResults.length
      )
    }

    const goToPrevSearchResult = () => {
      if (searchResults.length === 0) return
      navigateSearchResult(
        (currentSearchIndex - 1 + searchResults.length) %
          searchResults.length
      )
    }

    const closeSearch = () => {
      setShowSearch(false)
      setSearchQuery("")
      setSearchResults([])
      setCurrentSearchIndex(0)
      setSearchMessage("")
    }

    // Toggle view mode
    const toggleViewMode = () => {
      setViewMode((prev) => (prev === "single" ? "scroll" : "single"))
    }

    // Page array for scroll mode
    const pageNumbers = React.useMemo(
      () => Array.from({ length: totalPages }, (_, i) => i + 1),
      [totalPages]
    )

    // Callback ref for scroll page containers
    const setPageRef = React.useCallback(
      (pageNum: number) => (el: HTMLDivElement | null) => {
        if (el) {
          pageRefsMap.current.set(pageNum, el)
        } else {
          pageRefsMap.current.delete(pageNum)
        }
      },
      []
    )

    // ---------- Render ----------

    if (loading) {
      return (
        <div
          className={cn(
            "flex h-full items-center justify-center bg-muted/30",
            className
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading PDF...
            </span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div
          className={cn(
            "flex h-full items-center justify-center bg-muted/30",
            className
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <span className="text-sm text-destructive">Error: {error}</span>
            <span className="text-xs text-muted-foreground">
              Could not load the PDF document.
            </span>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn("flex h-full flex-col bg-muted/30", className)}
        ref={containerRef}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-2 gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            {viewMode === "single" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Input
                type="text"
                value={pageInputValue || currentPage}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                onFocus={() => setPageInputValue(String(currentPage))}
                onBlur={() => setPageInputValue("")}
                className="h-7 w-12 text-center text-sm p-1"
              />
              <span>/ {totalPages}</span>
            </div>
            {viewMode === "single" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Zoom, View Toggle & Actions */}
          <div className="flex items-center gap-1">
            {/* View mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleViewMode}
              className="h-8 w-8"
              title={
                viewMode === "single"
                  ? "Switch to scroll view"
                  : "Switch to single page"
              }
            >
              {viewMode === "single" ? (
                <Rows3 className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= 3}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {showSearch ? (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSearchMessage("")
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="h-7 w-28 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="h-7 w-7"
                >
                  {isSearching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Search className="h-3 w-3" />
                  )}
                </Button>
                {searchResults.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {currentSearchIndex + 1}/{searchResults.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToPrevSearchResult}
                      className="h-6 w-6"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNextSearchResult}
                      className="h-6 w-6"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {searchMessage && (
                  <span className="text-xs text-muted-foreground">
                    {searchMessage}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSearch}
                  className="h-7 w-7"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(true)}
                  className="h-8 w-8"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={rotate}
                  className="h-8 w-8"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-8 w-8"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrint}
                  className="h-8 w-8"
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </>
            )}

            {highlightBox && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHighlightBox(null)
                    setHighlightPage(null)
                  }}
                  className="text-xs h-8"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content area */}
        <div
          className="flex-1 overflow-auto p-6"
          ref={scrollContainerRef}
        >
          {viewMode === "single" ? (
            /* ----- Single page mode ----- */
            <div className="flex justify-center">
              <div
                className="relative transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <canvas
                  ref={canvasRef}
                  className="shadow-lg rounded-sm bg-white"
                />
                {highlightBox &&
                  viewportInfo &&
                  (highlightPage === null ||
                    highlightPage === currentPage) && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${highlightBox.x * viewportInfo.scale}px`,
                        top: `${highlightBox.y * viewportInfo.scale}px`,
                        width: `${highlightBox.w * viewportInfo.scale}px`,
                        height: `${highlightBox.h * viewportInfo.scale}px`,
                        backgroundColor: "rgba(255, 235, 59, 0.35)",
                        border: "2px solid rgba(255, 193, 7, 0.8)",
                        borderRadius: "3px",
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    />
                  )}
              </div>
            </div>
          ) : (
            /* ----- Continuous scroll mode ----- */
            <div className="flex flex-col items-center gap-4">
              {pageNumbers.map((pageNum) => (
                <div
                  key={pageNum}
                  ref={setPageRef(pageNum)}
                  data-page={pageNum}
                >
                  <ScrollPageCanvas
                    pdf={pdf}
                    pageNum={pageNum}
                    scale={scale}
                    containerWidth={containerWidth}
                    rotation={rotation}
                    isVisible={visiblePages.has(pageNum)}
                    highlightBox={highlightBox}
                    highlightPage={highlightPage}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)
