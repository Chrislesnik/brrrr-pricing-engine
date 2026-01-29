"use client"

import * as React from "react"
import { PDFViewer, type PDFViewerHandle, type BBox } from "@/components/pdf-viewer"
import { TestChatPanel } from "@/components/test-chat-panel"

export default function PDFChatTestPage() {
  // Use a test PDF from the public folder
  const pdfUrl = "/test/appraisal-nutrient-test.pdf"

  // Ref to control the PDF viewer
  const pdfViewerRef = React.useRef<PDFViewerHandle>(null)

  // Handle citation click - navigate to the page and highlight the area
  const handleCitationClick = (page: number, bbox: BBox) => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.goToPage(page, bbox)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* PDF Viewer - 75% */}
      <div className="w-3/4 h-full">
        <PDFViewer ref={pdfViewerRef} url={pdfUrl} className="h-full" />
      </div>

      {/* AI Chat Panel - 25% */}
      <div className="w-1/4 h-full min-w-[300px]">
        <TestChatPanel 
          title="Document Assistant" 
          onCitationClick={handleCitationClick}
        />
      </div>
    </div>
  )
}
