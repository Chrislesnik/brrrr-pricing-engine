"use client";

import { useState } from "react";
import { cn } from "@repo/lib/cn";
import { InputsSettings } from "./inputs-settings";
import { DocumentsSettings } from "./documents-settings";
import { TasksSettings } from "./tasks-settings";

type SubTab = "inputs" | "documents" | "tasks";

export function DealsSettings() {
  const [subTab, setSubTab] = useState<SubTab>("inputs");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Deals</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage deal inputs, documents, and tasks.
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
          onClick={() => setSubTab("documents")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            subTab === "documents"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Documents
        </button>
        <button
          type="button"
          onClick={() => setSubTab("tasks")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            subTab === "tasks"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Tasks
        </button>
      </div>

      {subTab === "inputs" && <InputsSettings />}

      {subTab === "documents" && <DocumentsSettings />}

      {subTab === "tasks" && <TasksSettings />}
    </div>
  );
}
