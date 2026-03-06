"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { ArtifactFrame } from "./artifact-frame";

// ─── Types ───────────────────────────────────────────────────────────
type ArtifactState =
  | "loading"
  | "mapping"
  | "choose-mode"
  | "manual-input"
  | "generating"
  | "results"
  | "error";

interface MappedField {
  input_code: string;
  display_name: string;
  value: unknown;
  source: "deal_input" | "missing";
  is_required: boolean;
}

interface MissingField {
  input_code: string;
  display_name: string;
  data_type: string;
  options?: unknown;
}

interface PricingArtifactProps {
  dealId: string;
  onClose: () => void;
}

// ─── PostMessage Types ───────────────────────────────────────────────
type ParentMessage =
  | { type: "SET_FIELD"; inputCode: string; value: unknown }
  | { type: "GENERATE" };

type IframeMessage =
  | { type: "READY" }
  | { type: "RESULTS"; data: { scenarios: unknown[] } }
  | { type: "ERROR"; message: string };

// ─── Component ───────────────────────────────────────────────────────
export function PricingArtifact({ dealId, onClose }: PricingArtifactProps) {
  const [state, setState] = useState<ArtifactState>("loading");
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<unknown[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [fillMode, setFillMode] = useState<"auto" | "manual" | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch deal pricing data
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/chat/deal-pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId }),
        });

        if (!res.ok) throw new Error("Failed to fetch pricing data");

        const data = await res.json();
        setMappedFields(data.mappedFields ?? []);
        setMissingFields(data.missingRequired ?? []);

        if (data.allRequiredFilled) {
          setState("mapping");
        } else {
          setState("choose-mode");
        }
      } catch (err) {
        setState("error");
        setErrorMessage("Failed to load deal pricing data.");
      }
    }

    fetchPricing();
  }, [dealId]);

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Same-origin validation
      if (event.origin !== window.location.origin) return;

      const msg = event.data as IframeMessage;

      switch (msg.type) {
        case "READY":
          // Iframe is ready — send mapped fields
          sendFieldsToIframe();
          break;
        case "RESULTS":
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setResults(msg.data.scenarios);
          setState("results");
          break;
        case "ERROR":
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setState("error");
          setErrorMessage(msg.message);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [mappedFields, manualValues]);

  // Send fields to iframe
  const sendFieldsToIframe = useCallback(() => {
    const iframe = iframeRef.current?.contentWindow;
    if (!iframe) return;

    // Send deal-input-mapped fields
    for (const field of mappedFields) {
      if (field.value !== null && field.value !== undefined) {
        const msg: ParentMessage = {
          type: "SET_FIELD",
          inputCode: field.input_code,
          value: field.value,
        };
        iframe.postMessage(msg, window.location.origin);
      }
    }

    // Send manual values for missing fields
    for (const [code, value] of Object.entries(manualValues)) {
      if (value) {
        const msg: ParentMessage = {
          type: "SET_FIELD",
          inputCode: code,
          value,
        };
        iframe.postMessage(msg, window.location.origin);
      }
    }
  }, [mappedFields, manualValues]);

  // Generate pricing
  const handleGenerate = useCallback(() => {
    setState("generating");

    const iframe = iframeRef.current?.contentWindow;
    if (iframe) {
      // Send any remaining fields first
      sendFieldsToIframe();
      // Then trigger generation
      iframe.postMessage({ type: "GENERATE" }, window.location.origin);
    }

    // Set timeout (30 seconds)
    timeoutRef.current = setTimeout(() => {
      setState("error");
      setErrorMessage("Pricing generation timed out. Try again.");
    }, 30000);
  }, [sendFieldsToIframe]);

  // Auto-fill missing fields with random values
  const handleAutoFill = useCallback(() => {
    const autoValues: Record<string, string> = {};

    for (const field of missingFields) {
      switch (field.data_type) {
        case "number":
        case "numeric":
          autoValues[field.input_code] = String(
            Math.floor(Math.random() * 100) + 1
          );
          break;
        case "percentage":
          autoValues[field.input_code] = String(
            (Math.random() * 10).toFixed(3)
          );
          break;
        case "select":
        case "dropdown": {
          const options = Array.isArray(field.options) ? field.options : [];
          if (options.length > 0) {
            const randomOption =
              options[Math.floor(Math.random() * options.length)];
            autoValues[field.input_code] =
              typeof randomOption === "string"
                ? randomOption
                : (randomOption as { value?: string })?.value ?? "";
          }
          break;
        }
        case "boolean":
          autoValues[field.input_code] = Math.random() > 0.5 ? "true" : "false";
          break;
        default:
          autoValues[field.input_code] = "N/A";
      }
    }

    setManualValues(autoValues);
    setFillMode("auto");
    setState("mapping");
  }, [missingFields]);

  // Render content based on state
  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading deal pricing data...
            </span>
          </div>
        );

      case "choose-mode":
        return (
          <div className="p-4 space-y-4">
            <div className="text-sm text-foreground">
              <span className="font-medium text-destructive">
                {missingFields.length} required field
                {missingFields.length !== 1 ? "s" : ""} missing
              </span>
              . How would you like to proceed?
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Auto-fill option */}
              <button
                onClick={handleAutoFill}
                className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary transition-colors cursor-pointer"
              >
                <div className="text-sm font-medium text-foreground">
                  Auto-fill
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Fill missing fields with type-safe random values
                </div>
              </button>

              {/* Manual input option */}
              <button
                onClick={() => {
                  setFillMode("manual");
                  setState("manual-input");
                }}
                className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary transition-colors cursor-pointer"
              >
                <div className="text-sm font-medium text-foreground">
                  Manual Input
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Enter values manually in a table
                </div>
              </button>
            </div>
          </div>
        );

      case "manual-input":
        return (
          <div className="p-4 space-y-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Missing Required Fields
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Field
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {missingFields.map((field) => (
                  <tr key={field.input_code} className="border-b border-border">
                    <td className="px-2 py-1.5 text-foreground">
                      {field.display_name}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={manualValues[field.input_code] ?? ""}
                        onChange={(e) =>
                          setManualValues((prev) => ({
                            ...prev,
                            [field.input_code]: e.target.value,
                          }))
                        }
                        placeholder={field.data_type}
                        className="w-full border-0 bg-transparent px-1 py-0.5 text-sm text-foreground focus:bg-muted/20 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setState("mapping")}>
                Continue to Pricing
              </Button>
            </div>
          </div>
        );

      case "mapping":
      case "generating":
        return (
          <div className="relative">
            <iframe
              ref={iframeRef}
              src={`/pricing?embed=true&dealId=${dealId}`}
              className="w-full border-0"
              style={{ height: "500px" }}
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
            />

            {state === "mapping" && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-card/90 to-transparent p-4">
                <Button onClick={handleGenerate}>Generate Pricing</Button>
              </div>
            )}

            {state === "generating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <div className="flex items-center gap-2 rounded-md bg-card px-4 py-3 shadow-lg border border-border">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Generating pricing...
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case "results":
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Pricing Results
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(results, null, 2)
                  );
                }}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-md bg-muted/20 p-3">
              <pre className="text-xs text-foreground whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setState("loading");
                setErrorMessage("");
              }}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Try Again
            </Button>
          </div>
        );
    }
  };

  return (
    <ArtifactFrame title="Loan Pricing" onClose={onClose}>
      {renderContent()}
    </ArtifactFrame>
  );
}
