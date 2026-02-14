"use client";

import { RouteProtection } from "@/components/auth/route-protection";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@repo/ui/shadcn/button";
import { ArrowLeft, Loader2, MessageSquare, Check } from "lucide-react";
import { cn } from "@repo/lib/cn";
import { DealDetailsTab } from "../components/deal-details-tab";
import { DealDocumentsTab } from "../components/deal-documents-tab";
import { DealSignatureRequestsTab } from "../components/deal-signature-requests-tab";
import { DealCalendarTab } from "../components/deal-calendar-tab";
import { CommentsPanel } from "@/components/liveblocks/comments-panel";

interface DealData {
  id: string;
  inputs: Record<string, unknown>;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

function DealRecordContent() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Stepper state
  const [dealStepper, setDealStepper] = useState<{
    id: number;
    current_step: string;
    step_order: string[];
  } | null>(null);
  const [stepperUpdating, setStepperUpdating] = useState(false);
  const [stepperAnimatingTo, setStepperAnimatingTo] = useState<number>(0);
  const [stepperRefreshKey, setStepperRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchDeal() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/deals/${dealId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load deal");
        }
        
        const data = await response.json();
        setDeal(data.deal);
      } catch (err) {
        console.error("Error fetching deal:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    if (dealId) {
      fetchDeal();
    }

    // Listen for deal changes and refresh
    const handleRefresh = () => {
      fetchDeal();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("app:deals:changed", handleRefresh);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app:deals:changed", handleRefresh);
      }
    };
  }, [dealId]);

  // Fetch deal stepper (also re-fetches on app:deals:changed)
  useEffect(() => {
    if (!dealId) return;
    const fetchStepper = async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/stepper`);
        if (res.ok) {
          const data = await res.json();
          const stepper = data.stepper ?? null;
          setDealStepper(stepper);
          // Start animation from step 0
          if (stepper) {
            setStepperAnimatingTo(0);
          }
        }
      } catch {
        // Non-critical
      }
    };
    fetchStepper();

    // Re-fetch stepper when deal data changes (e.g., stage edited via Edit Details)
    const handleStepperRefresh = () => {
      setStepperRefreshKey((k) => k + 1);
      fetchStepper();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("app:deals:changed", handleStepperRefresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app:deals:changed", handleStepperRefresh);
      }
    };
  }, [dealId]);

  // Animate stepper progression on load
  useEffect(() => {
    if (!dealStepper) return;
    const targetIdx = dealStepper.step_order.indexOf(dealStepper.current_step);
    if (targetIdx < 0) return;
    if (stepperAnimatingTo > targetIdx) return;

    const timer = setTimeout(() => {
      setStepperAnimatingTo((prev) => Math.min(prev + 1, targetIdx));
    }, 150);
    return () => clearTimeout(timer);
  }, [dealStepper, stepperAnimatingTo]);


  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/deals")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 max-w-md">
            <h3 className="font-semibold text-destructive mb-2">
              Unable to load deal
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "Deal not found"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/deals")}
            >
              Back to Deals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-row h-full overflow-hidden">
      {/* Main content — shrinks when comments panel is open */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* Floating Chat button — positioned outside the scroll container so it stays fixed */}
        {!commentsOpen && (
          <Button
            variant="default"
            size="sm"
            className="absolute bottom-6 right-6 z-10 gap-2 shadow-lg rounded-full px-4 py-2 h-10"
            onClick={() => setCommentsOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        )}

        <div className="flex-1 overflow-y-auto px-6">
        <div className="flex items-center justify-between py-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/deals")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Deal {deal.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                {deal.id}
              </p>
            </div>
          </div>
        </div>

        {/* Deal Stepper */}
        {dealStepper && dealStepper.step_order.length > 0 && (() => {
          const activeIdx = stepperAnimatingTo;
          const totalSteps = dealStepper.step_order.length;
          // Each step gets equal share; percentage of active step's center
          const stepPct = 100 / totalSteps;
          const activeCenterPct = activeIdx * stepPct + stepPct / 2;
          // Shift so active step is centered: 50% - activeCenterPct%
          const shift = Math.min(0, Math.max(-(100 - 100), 50 - activeCenterPct));
          return (
            <div className="pb-3 overflow-x-auto w-full" style={{ scrollbarWidth: "none" }}>
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  minWidth: `${totalSteps * 120}px`,
                  transform: `translateX(${shift}%)`,
                }}
              >
                {dealStepper.step_order.map((step, idx) => {
                  const isCompleted = idx < activeIdx;
                  const isActive = idx === activeIdx;
                  const isLast = idx === totalSteps - 1;
                  return (
                    <div
                      key={step}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2 relative flex-1 min-w-0",
                        stepperUpdating && "opacity-60"
                      )}
                    >
                      {/* Connector line - before circle */}
                      {idx > 0 && (
                        <div
                          className={cn(
                            "absolute top-[26px] h-0.5 transition-colors duration-300",
                            isCompleted || isActive ? "bg-success" : "bg-border"
                          )}
                          style={{ left: 0, width: "calc(50% - 22px)" }}
                        />
                      )}
                      {/* Connector line - after circle */}
                      {!isLast && (
                        <div
                          className={cn(
                            "absolute top-[26px] h-0.5 transition-colors duration-300",
                            isCompleted ? "bg-success" : "bg-border"
                          )}
                          style={{ right: 0, width: "calc(50% - 22px)" }}
                        />
                      )}
                      <div
                        className={cn(
                          "flex items-center justify-center size-9 rounded-full border-2 text-sm font-semibold transition-all duration-300 relative z-10",
                          isCompleted && "border-success bg-success text-success-foreground",
                          isActive && "border-primary bg-primary text-primary-foreground",
                          !isCompleted && !isActive && "border-border bg-background text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="size-4" /> : idx + 1}
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Step {idx + 1}
                      </div>
                      <div className={cn(
                        "text-xs font-semibold whitespace-nowrap",
                        !isCompleted && !isActive && "text-muted-foreground"
                      )}>
                        {step}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          isCompleted && "bg-success/10 text-success",
                          isActive && "bg-primary/10 text-primary",
                          !isCompleted && !isActive && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? "Completed" : isActive ? "In Progress" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto shrink-0">
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              onClick={() => setActiveTab("details")}
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="signature-requests"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              onClick={() => setActiveTab("signature-requests")}
            >
              Signature Requests
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
              onClick={() => setActiveTab("calendar")}
            >
              Calendar
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 py-6">
            <TabsContent value="details" className="mt-0">
              <DealDetailsTab deal={deal} />
            </TabsContent>
            
            <TabsContent value="documents" className="mt-0">
              <DealDocumentsTab dealId={dealId} dealInputs={deal.inputs ?? {}} />
            </TabsContent>
            
            <TabsContent value="signature-requests" className="mt-0">
              <DealSignatureRequestsTab dealId={dealId} />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              <DealCalendarTab dealId={dealId} dealInputs={deal.inputs ?? {}} />
            </TabsContent>
          </div>
        </Tabs>
        </div>{/* end scroll wrapper */}
      </div>

      {/* Liveblocks Comments — full-height inline side panel */}
      <CommentsPanel
        dealId={dealId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
}

export default function DealRecordPage() {
  return (
    <RouteProtection>
      <DealRecordContent />
    </RouteProtection>
  );
}
