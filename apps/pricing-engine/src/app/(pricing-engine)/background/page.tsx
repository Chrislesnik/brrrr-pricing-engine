"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { RouteProtection } from "@/components/auth/route-protection";
import { BackgroundTable } from "./components/background-table";
import { RunBackgroundSheet } from "./components/run-background-sheet";

function BackgroundPageContent() {
  const [runSheetOpen, setRunSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4 pr-5">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Background Reports</h1>
              <p className="text-muted-foreground">
                View background check reports for borrowers and entities.
              </p>
            </div>
            <Button onClick={() => setRunSheetOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Run Background
            </Button>
          </div>
          <BackgroundTable key={refreshKey} />
        </div>
      </div>
      <RunBackgroundSheet
        open={runSheetOpen}
        onOpenChange={setRunSheetOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

export default function BackgroundPage() {
  return (
    <RouteProtection
      requiredResource={{
        resourceType: "table",
        resourceName: "background_reports",
        action: "select",
      }}
    >
      <BackgroundPageContent />
    </RouteProtection>
  );
}
