"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { IconDatabase } from "@tabler/icons-react"
import { Field, defaultFields, fieldsToGlobalData } from "./field-types"
import { FieldEditorModal } from "./field-editor-modal"
import { DataPanel } from "./data-panel"

// Dynamic import the wrapper which contains the GrapeJS styles
// This ensures styles only load when the editor is actually rendered
const StudioEditorWrapper = dynamic(
  () => import("./studio-editor-wrapper").then(mod => ({ default: mod.StudioEditorWrapper })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }
)

// Minimal GrapesJS theme styles - let GrapesJS handle its own layout
const grapejsThemeStyles = `
  /* ===== Radix Dialog protection from GrapesJS ===== */
  /* Ensure our app's dialogs are not affected by GrapesJS */
  [role="dialog"][data-state="open"]:not(.gs-cmp-modal-container) {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 100001 !important;
  }

  /* ===== Data Variable Field Styling ===== */
  .gs-studio-root [data-gjs-type="data-variable"],
  .data-variable-field {
    display: inline-block;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    padding: 2px 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #92400e;
    cursor: pointer;
    white-space: nowrap;
  }

  .gs-studio-root [data-gjs-type="data-variable"]:hover,
  .data-variable-field:hover {
    background-color: #fde68a;
    border-color: #d97706;
  }

  .dark .gs-studio-root [data-gjs-type="data-variable"],
  .dark .data-variable-field {
    background-color: #78350f;
    border-color: #d97706;
    color: #fef3c7;
  }
`

export default function TermSheetEditorPage() {
  const [fields, setFields] = useState<Field[]>(defaultFields)
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false)

  // Convert fields to globalData for GrapeJS
  const globalData = useMemo(() => fieldsToGlobalData(fields), [fields])

  // Generate variable options for RTE toolbar from fields
  const variableOptions = useMemo(() => 
    fields.map(field => ({
      id: `{{${field.name}}}`,
      label: field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })),
    [fields]
  )

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: grapejsThemeStyles }} />
      
      {/* Header */}
      <div className="mb-4 flex-none flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Term Sheet Editor</h3>
          <p className="text-muted-foreground text-sm">
            Create and customize term sheet documents.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setFieldEditorOpen(true)}
          className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30"
        >
          <IconDatabase className="h-4 w-4 mr-2" />
          Edit Fields
        </Button>
      </div>

      {/* Main Content - Editor + Data Panel */}
      <div className="flex-1 flex min-h-0 gap-0 rounded-lg border bg-background overflow-hidden">
        {/* GrapeJS Editor - takes remaining space */}
        <div className="flex-1 min-w-0 h-full">
          <StudioEditorWrapper
            globalData={globalData}
            variableOptions={variableOptions}
          />
        </div>
        
        {/* Data Panel - Right Side */}
        <div className="w-[280px] flex-shrink-0 border-l">
          <DataPanel
            fields={fields}
            onOpenFieldEditor={() => setFieldEditorOpen(true)}
          />
        </div>
      </div>

      {/* Field Editor Modal */}
      <FieldEditorModal
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        fields={fields}
        onFieldsChange={setFields}
      />
    </div>
  )
}
