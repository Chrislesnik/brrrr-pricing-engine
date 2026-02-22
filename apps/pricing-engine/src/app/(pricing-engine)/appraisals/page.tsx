"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { RouteProtection } from "@/components/auth/route-protection";
import { AppraisalsTable } from "./components/appraisals-table";
import { NewAppraisalSheet } from "./components/new-appraisal-sheet";

function AppraisalsPageContent() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4 pr-5">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appraisals</h1>
            <p className="text-muted-foreground">
              Track appraisal property orders and their status.
            </p>
          </div>
          <AppraisalsTable
            key={refreshKey}
            actionButton={
              <Button size="sm" className="h-8" onClick={() => setSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            }
          />
        </div>
      </div>
      <NewAppraisalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

export default function AppraisalsPage() {
  return (
    <RouteProtection
      requiredResource={{
        resourceType: "table",
        resourceName: "appraisal",
        action: "select",
      }}
    >
      <AppraisalsPageContent />
    </RouteProtection>
  );
}
