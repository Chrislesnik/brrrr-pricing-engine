"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { RouteProtection } from "@/components/auth/route-protection";
import { CreditTable } from "./components/credit-table";
import { RunCreditSheet } from "./components/run-credit-sheet";

function CreditPageContent() {
  const [runSheetOpen, setRunSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4 pr-5">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credit Reports</h1>
            <p className="text-muted-foreground">
              View credit reports and scores for borrowers.
            </p>
          </div>
          <CreditTable
            key={refreshKey}
            actionButton={
              <Button size="sm" className="h-8" onClick={() => setRunSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Run Credit
              </Button>
            }
          />
        </div>
      </div>
      <RunCreditSheet
        open={runSheetOpen}
        onOpenChange={setRunSheetOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

export default function CreditPage() {
  return (
    <RouteProtection
      requiredResource={{
        resourceType: "table",
        resourceName: "credit_reports",
        action: "select",
      }}
    >
      <CreditPageContent />
    </RouteProtection>
  );
}
