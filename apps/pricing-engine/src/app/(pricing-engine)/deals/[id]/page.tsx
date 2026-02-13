"use client";

import { RouteProtection } from "@/components/auth/route-protection";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@repo/ui/shadcn/button";
import { ArrowLeft, Loader2, MessageSquare, Check } from "lucide-react";
import { cn } from "@repo/lib/cn";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperNav,
} from "@/components/ui/stepper";
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

  // Fetch deal stepper
  useEffect(() => {
    if (!dealId) return;
    const fetchStepper = async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/stepper`);
        if (res.ok) {
          const data = await res.json();
          setDealStepper(data.stepper ?? null);
        }
      } catch {
        // Non-critical
      }
    };
    fetchStepper();
  }, [dealId]);

  // Handle stepper step click
  const handleStepClick = useCallback(async (step: string) => {
    if (!dealStepper || step === dealStepper.current_step) return;
    setStepperUpdating(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/stepper`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_step: step }),
      });
      if (res.ok) {
        const data = await res.json();
        setDealStepper(data.stepper);
        // Trigger refresh of deal data to sync stage value
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("app:deals:changed"));
        }
      }
    } catch (err) {
      console.error("Failed to update stepper:", err);
    } finally {
      setStepperUpdating(false);
    }
  }, [dealId, dealStepper]);

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

        <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between py-4 px-4 shrink-0">
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
        {dealStepper && dealStepper.step_order.length > 0 && (
          <div className="px-4 pb-2">
            <Stepper
              value={dealStepper.step_order.indexOf(dealStepper.current_step) + 1}
              onValueChange={(val) => {
                const step = dealStepper.step_order[val - 1];
                if (step) handleStepClick(step);
              }}
              indicators={{
                completed: <Check className="size-3.5" />,
              }}
              className="w-full"
            >
              <StepperNav className="gap-3">
                {dealStepper.step_order.map((step, idx) => {
                  const stepNum = idx + 1;
                  const currentIdx = dealStepper.step_order.indexOf(dealStepper.current_step);
                  const isCompleted = idx < currentIdx;
                  return (
                    <StepperItem
                      key={step}
                      step={stepNum}
                      completed={isCompleted}
                      className={cn(
                        "relative flex-1 items-start",
                        stepperUpdating && "pointer-events-none opacity-60"
                      )}
                    >
                      <StepperTrigger
                        className="flex grow flex-col items-start justify-center gap-1.5"
                        asChild
                      >
                        <StepperIndicator className="size-8 border-2 data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=inactive]:bg-transparent data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground">
                          {stepNum}
                        </StepperIndicator>
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="text-muted-foreground text-[10px] font-semibold uppercase">
                            Step {stepNum}
                          </div>
                          <StepperTitle className="group-data-[state=inactive]/step:text-muted-foreground text-start text-xs font-semibold whitespace-nowrap">
                            {step}
                          </StepperTitle>
                        </div>
                      </StepperTrigger>

                      {idx < dealStepper.step_order.length - 1 && (
                        <StepperSeparator className="group-data-[state=completed]/step:bg-primary absolute inset-x-0 start-9 top-4 m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none" />
                      )}
                    </StepperItem>
                  );
                })}
              </StepperNav>
            </Stepper>
          </div>
        )}

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

          <div className="flex-1 p-6">
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
              <DealCalendarTab dealId={dealId} />
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
