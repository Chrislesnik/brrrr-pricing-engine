"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PDFViewer, type PDFViewerHandle, type BBox } from "@/components/pdf-viewer";
import { TestChatPanel } from "@/components/test-chat-panel";
import { Button } from "@repo/ui/shadcn/button";
import { ArrowLeft, Loader2, FileWarning } from "lucide-react";

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const docId = params.docId as string;

  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const pdfViewerRef = React.useRef<PDFViewerHandle>(null);

  // Fetch signed URL on mount
  React.useEffect(() => {
    async function fetchUrl() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/deals/${dealId}/deal-documents/${docId}/url`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load document");
        }

        const data = await res.json();
        setPdfUrl(data.url);
        setFileName(data.fileName || "Document");
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    if (dealId && docId) {
      fetchUrl();
    }
  }, [dealId, docId]);

  // Handle citation click from chat panel
  const handleCitationClick = (page: number, bbox: BBox) => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.goToPage(page, bbox);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pdfUrl) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <FileWarning className="h-12 w-12 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Unable to load document</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error || "This document has no file attached."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/deals/${dealId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deal
          </Button>
        </div>
      </div>
    );
  }

  // Main viewer layout
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Top bar with back button and file name */}
      <div className="flex items-center gap-3 border-b px-4 py-2 shrink-0 bg-background">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push(`/deals/${dealId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deal
        </Button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-medium truncate">{fileName}</span>
      </div>

      {/* Content: PDF + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer - 75% */}
        <div className="w-3/4 h-full">
          <PDFViewer ref={pdfViewerRef} url={pdfUrl} className="h-full" />
        </div>

        {/* AI Chat Panel - 25% */}
        <div className="w-1/4 h-full min-w-[300px]">
          <TestChatPanel
            title="Document Assistant"
            dealId={dealId}
            dealDocumentId={docId}
            onCitationClick={handleCitationClick}
          />
        </div>
      </div>
    </div>
  );
}
