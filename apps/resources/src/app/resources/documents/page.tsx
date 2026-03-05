import { Suspense } from "react";
import { DocumentsClient } from "./documents-client";

export const metadata = {
  title: "Document Library",
  description: "Download forms, templates, rate sheets, and closing documents",
};

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading documents...
            </p>
          </div>
        </div>
      }
    >
      <DocumentsClient />
    </Suspense>
  );
}
