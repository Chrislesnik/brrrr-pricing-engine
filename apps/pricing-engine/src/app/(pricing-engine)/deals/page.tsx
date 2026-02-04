"use client";

import { RouteProtection } from "@/components/auth/route-protection";
import { useState } from "react";
import { DealsDataTable } from "./components/deals-data-table";
import { NewDealSheet } from "./components/new-deal-sheet";

function DealsPageContent() {
  const [newDealOpen, setNewDealOpen] = useState(false);
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
              <p className="text-muted-foreground">
                Manage your investment deals and track their performance.
              </p>
            </div>
          </div>
          <DealsDataTable onNewDeal={() => setNewDealOpen(true)} />
        </div>
      </div>
      <NewDealSheet open={newDealOpen} onOpenChange={setNewDealOpen} />
    </div>
  );
}

export default function DealsPage() {
  return (
    <RouteProtection>
      <DealsPageContent />
    </RouteProtection>
  );
}
