"use client";

import { useState } from "react";
import { cn } from "@repo/lib/cn";
import { ProgramsSettings } from "./programs-settings";
import { PricingEngineLayoutSettings } from "./pricing-engine-layout-settings";
import { PricingEngineGridLayout } from "./pricing-engine-grid-layout";
import { TermSheetsSettings } from "./term-sheets-settings";

type SubTab = "inputs" | "layout" | "programs" | "term-sheets";

export function PricingEngineSettings() {
  const [subTab, setSubTab] = useState<SubTab>("inputs");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Pricing Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the pricing engine inputs, layout, programs, and term sheet templates.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b">
        <button
          type="button"
          onClick={() => setSubTab("inputs")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            subTab === "inputs"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Inputs
        </button>
        <button
          type="button"
          onClick={() => setSubTab("layout")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            subTab === "layout"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Layout
        </button>
        <button
          type="button"
          onClick={() => setSubTab("programs")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            subTab === "programs"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Programs
        </button>
        <button
          type="button"
          onClick={() => setSubTab("term-sheets")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            subTab === "term-sheets"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Term Sheets
        </button>
      </div>

      {subTab === "inputs" && <PricingEngineLayoutSettings />}

      {subTab === "layout" && <PricingEngineGridLayout />}

      {subTab === "programs" && <ProgramsSettings />}

      {subTab === "term-sheets" && <TermSheetsSettings />}
    </div>
  );
}
