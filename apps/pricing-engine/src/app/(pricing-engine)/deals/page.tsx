"use client";

import { RouteProtection } from "@/components/auth/route-protection";
import { useState } from "react";
import { DealsDataTable } from "./components/deals-data-table";
import { NewDealInline } from "./components/new-deal-inline";

function DealsPageContent() {
  const [newDealOpen, setNewDealOpen] = useState(false);

  if (newDealOpen) {
    return <NewDealInline onClose={() => setNewDealOpen(false)} />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
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
