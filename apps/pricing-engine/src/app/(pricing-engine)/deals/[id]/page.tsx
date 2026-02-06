"use client";

import { RouteProtection } from "@/components/auth/route-protection";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@repo/ui/shadcn/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DealDetailsTab } from "../components/deal-details-tab";
import { DealDocumentsTab } from "../components/deal-documents-tab";
import { DealSignatureRequestsTab } from "../components/deal-signature-requests-tab";
import { DealCalendarTab } from "../components/deal-calendar-tab";

interface DealData {
  id: string;
  deal_name: string | null;
  deal_stage_2: string | null;
  loan_amount_total: number | null;
  funding_date: string | null;
  project_type: string | null;
  property_address: string | null;
  guarantor_name: string | null;
  loan_number: string | null;
}

function DealRecordContent() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

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
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between py-4 px-1">
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
              {deal.deal_name || deal.property_address || `Deal ${deal.loan_number}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {deal.loan_number && `Loan #${deal.loan_number}`}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="signature-requests"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            Signature Requests
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
          >
            Calendar
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 py-6">
          <TabsContent value="details" className="mt-0">
            <DealDetailsTab deal={deal} />
          </TabsContent>
          
          <TabsContent value="documents" className="mt-0">
            <DealDocumentsTab dealId={dealId} />
          </TabsContent>
          
          <TabsContent value="signature-requests" className="mt-0">
            <DealSignatureRequestsTab dealId={dealId} />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-0">
            <DealCalendarTab dealId={dealId} />
          </TabsContent>
        </div>
      </Tabs>
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
