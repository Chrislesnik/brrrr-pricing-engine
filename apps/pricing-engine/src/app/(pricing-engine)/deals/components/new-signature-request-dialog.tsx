"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import { Button } from "@repo/ui/shadcn/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { EmbedCreateDocumentV1 } from "@documenso/embed-react";

/**
 * Read a CSS custom property from :root and convert from the Tailwind HSL
 * format ("0 0% 9%") to a standard `hsl(...)` string that Documenso accepts.
 * Returns undefined if the variable isn't set so Documenso falls back to its default.
 */
function getCssVarAsHsl(varName: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${varName}`)
    .trim();
  if (!raw) return undefined;
  // Our vars are in "H S% L%" format — wrap in hsl()
  return `hsl(${raw})`;
}

/**
 * Build a cssVars object that maps our app's dynamic theme variables
 * (which may be overridden by the Supabase org theme) to Documenso's
 * embed CSS variable names.
 */
function buildDocumensoThemeVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  const mapping: Record<string, string> = {
    background: "background",
    foreground: "foreground",
    muted: "muted",
    mutedForeground: "muted-foreground",
    popover: "popover",
    popoverForeground: "popover-foreground",
    card: "card",
    cardForeground: "card-foreground",
    primary: "primary",
    primaryForeground: "primary-foreground",
    secondary: "secondary",
    secondaryForeground: "secondary-foreground",
    accent: "accent",
    accentForeground: "accent-foreground",
    destructive: "destructive",
    destructiveForeground: "destructive-foreground",
    border: "border",
    input: "input",
    ring: "ring",
  };

  for (const [docKey, cssVar] of Object.entries(mapping)) {
    const val = getCssVarAsHsl(cssVar);
    if (val) vars[docKey] = val;
  }

  // Map border radius
  if (typeof window !== "undefined") {
    const radius = getComputedStyle(document.documentElement)
      .getPropertyValue("--radius")
      .trim();
    if (radius) vars.radius = radius;
  }

  return vars;
}

interface NewSignatureRequestDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  suggestedRecipients?: Array<{ email: string; name: string }>;
}

type DialogState = "loading" | "authoring" | "finalizing" | "success" | "error";

export function NewSignatureRequestDialog({
  dealId,
  open,
  onOpenChange,
  onSuccess,
}: NewSignatureRequestDialogProps) {
  const [state, setState] = useState<DialogState>("loading");
  const [presignToken, setPresignToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Read the app's live CSS variables and map them to Documenso's cssVars
  // so the embed inherits the dynamic org theme instead of its default green.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const documensoTheme = useMemo(() => (open ? buildDocumensoThemeVars() : {}), [open]);

  // Fetch presign token when dialog opens
  useEffect(() => {
    if (open) {
      fetchPresignToken();
    } else {
      // Reset state when dialog closes
      setState("loading");
      setPresignToken(null);
      setError(null);
    }
  }, [open, dealId]);

  const fetchPresignToken = async () => {
    setState("loading");
    setError(null);

    try {
      const response = await fetch("/api/signature-requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initialize signature request");
      }

      const data = await response.json();
      setPresignToken(data.token);
      setState("authoring");
    } catch (err) {
      console.error("Error fetching presign token:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize");
      setState("error");
    }
  };

  // Handle document creation from Documenso embed
  const handleDocumentCreated = useCallback(
    async (data: { externalId: string; documentId: number }) => {
      setState("finalizing");

      try {
        // Save the signature request to our database
        const response = await fetch(`/api/signature-requests/${dealId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: String(data.documentId),
            documentName: "Signature Request",
            recipients: [],
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to save signature request");
        }

        setState("success");
        
        // Close dialog after a brief success message
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } catch (err) {
        console.error("Error finalizing signature request:", err);
        setError(err instanceof Error ? err.message : "Failed to finalize");
        setState("error");
      }
    },
    [dealId, onOpenChange, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>New Signature Request</DialogTitle>
          <DialogDescription>
            Upload a document, add signature fields, and send for signing
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Initializing document editor...
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <h3 className="font-semibold mb-2">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error || "An unexpected error occurred"}
                </p>
                <Button onClick={fetchPresignToken}>Try Again</Button>
              </div>
            </div>
          )}

          {state === "authoring" && presignToken && (
            <div className="h-full w-full">
              <EmbedCreateDocumentV1
                presignToken={presignToken}
                host={process.env.NEXT_PUBLIC_DOCUMENSO_URL || "https://app.documenso.com"}
                externalId={dealId}
                onDocumentCreated={handleDocumentCreated}
                cssVars={documensoTheme}
                className="h-full w-full border-0"
              />
            </div>
          )}

          {state === "finalizing" && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Saving signature request...
              </p>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <CheckCircle className="h-12 w-12" style={{ color: "hsl(var(--success))" }} />
              <div className="text-center">
                <h3 className="font-semibold mb-2">Signature Request Sent!</h3>
                <p className="text-sm text-muted-foreground">
                  Recipients will receive an email to sign the document.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
