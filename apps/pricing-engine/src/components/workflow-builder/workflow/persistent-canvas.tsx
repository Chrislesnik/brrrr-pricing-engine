"use client";

import { WorkflowCanvas } from "./workflow-canvas";

/**
 * PersistentCanvas - renders the workflow canvas.
 * Adapted from the template to always render (parent controls visibility).
 */
export function PersistentCanvas() {
  return (
    <div className="h-full w-full">
      <WorkflowCanvas />
    </div>
  );
}
