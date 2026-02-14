"use client";

import { RouteProtection } from "@/components/auth/route-protection";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@repo/ui/shadcn/button";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { DealDetailsTab } from "../components/deal-details-tab";
import { DealDocumentsTab } from "../components/deal-documents-tab";
import { DealSignatureRequestsTab } from "../components/deal-signature-requests-tab";
import { DealCalendarTab } from "../components/deal-calendar-tab";
import { DealTasksTab } from "../components/deal-tasks-tab";
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

  // Animated underline
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const dealTabs = [
    { name: "Details", value: "details" },
    { name: "Tasks", value: "tasks" },
    { name: "Documents", value: "documents" },
    { name: "Signature Requests", value: "signature-requests" },
    { name: "Calendar", value: "calendar" },
  ];

  useLayoutEffect(() => {
    const activeIndex = dealTabs.findIndex((tab) => tab.value === activeTab);
    const activeTabElement = tabRefs.current[activeIndex];
    if (activeTabElement) {
      setUnderlineStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      });
    }
  }, [activeTab]);

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
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => router.push("/deals")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Deals</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight truncate">
                Deal {deal.id.slice(0, 8)}
              </h1>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {deal.id}
              </p>
            </div>
          </div>

          {/* Tabs with animated underline */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-background relative w-full justify-start rounded-none border-b p-0 h-auto px-6">
              {dealTabs.map((tab, index) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  className="bg-background dark:data-[state=active]:bg-background relative z-10 rounded-none border-0 px-4 py-2.5 text-sm data-[state=active]:shadow-none data-[state=active]:text-foreground"
                >
                  {tab.name}
                </TabsTrigger>
              ))}

              <motion.div
                className="bg-primary absolute bottom-0 z-20 h-0.5"
                layoutId="deal-tabs-underline"
                style={{
                  left: underlineStyle.left,
                  width: underlineStyle.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 40,
                }}
              />
            </TabsList>

            {/* Tasks tab: full-bleed, no padding (Linear-style) */}
            <TabsContent value="tasks" className="mt-0 flex-1">
              <DealTasksTab dealId={dealId} />
            </TabsContent>

            {/* Other tabs: standard padding */}
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
