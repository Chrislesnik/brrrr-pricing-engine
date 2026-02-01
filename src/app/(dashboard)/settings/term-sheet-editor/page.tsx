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

// Custom styles to integrate GrapeJS with your theme + fix ProseMirror toolbar
const grapejsThemeStyles = `
  /* ===== ProseMirror Toolbar Fixes ===== */
  .gs-rte-toolbar {
    min-width: 500px !important;
    max-width: none !important;
    overflow: visible !important;
  }
  .gs-rte-toolbar-container {
    overflow: visible !important;
  }
  .ProseMirror-menubar {
    min-width: 500px !important;
    flex-wrap: nowrap !important;
  }

  /* ===== GrapeJS Theme Integration ===== */
  /* Main editor backgrounds */
  .gs-studio-root,
  .gs-studio-root .gs-theme-cl-bg {
    background-color: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
  }

  /* Sidebar and panel backgrounds */
  .gs-studio-root [class*="gs-utl-bg-zinc-900"],
  .gs-studio-root [class*="gs-utl-bg-zinc-800"],
  .gs-studio-root [class*="gs-utl-bg-zinc-950"] {
    background-color: hsl(var(--card)) !important;
  }

  .gs-studio-root [class*="gs-utl-bg-zinc-100"],
  .gs-studio-root [class*="gs-utl-bg-zinc-50"],
  .gs-studio-root [class*="gs-utl-bg-gray-100"],
  .gs-studio-root [class*="gs-utl-bg-gray-50"] {
    background-color: hsl(var(--secondary)) !important;
  }

  .gs-studio-root [class*="gs-utl-bg-white"] {
    background-color: hsl(var(--card)) !important;
  }

  /* Text colors */
  .gs-studio-root .gs-theme-cl-txt,
  .gs-studio-root [class*="gs-utl-text-gray-900"],
  .gs-studio-root [class*="gs-utl-text-zinc-900"] {
    color: hsl(var(--foreground)) !important;
  }

  .gs-studio-root [class*="gs-utl-text-gray-400"],
  .gs-studio-root [class*="gs-utl-text-gray-500"],
  .gs-studio-root [class*="gs-utl-text-gray-600"],
  .gs-studio-root [class*="gs-utl-text-zinc-400"],
  .gs-studio-root [class*="gs-utl-text-zinc-500"] {
    color: hsl(var(--muted-foreground)) !important;
  }

  /* Borders */
  .gs-studio-root .gs-theme-cl-br,
  .gs-studio-root [class*="gs-utl-border-gray"],
  .gs-studio-root [class*="gs-utl-border-zinc"] {
    border-color: hsl(var(--border)) !important;
  }

  /* Accent colors - buttons, active states */
  .gs-studio-root [class*="gs-utl-bg-violet"],
  .gs-studio-root [class*="gs-utl-bg-indigo"],
  .gs-studio-root [class*="gs-utl-bg-blue-600"] {
    background-color: hsl(var(--primary)) !important;
  }

  .gs-studio-root [class*="gs-utl-text-violet"],
  .gs-studio-root [class*="gs-utl-text-indigo"] {
    color: hsl(var(--primary)) !important;
  }

  /* Input fields */
  .gs-studio-root input,
  .gs-studio-root select,
  .gs-studio-root textarea {
    background-color: hsl(var(--input)) !important;
    border-color: hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
  }

  .gs-studio-root input:focus,
  .gs-studio-root select:focus,
  .gs-studio-root textarea:focus {
    border-color: hsl(var(--ring)) !important;
    outline-color: hsl(var(--ring)) !important;
  }

  /* Scrollbars */
  .gs-studio-root ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .gs-studio-root ::-webkit-scrollbar-track {
    background: hsl(var(--muted));
  }
  .gs-studio-root ::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 4px;
  }
  .gs-studio-root ::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground));
  }

  /* Buttons */
  .gs-studio-root button {
    color: hsl(var(--foreground)) !important;
  }

  .gs-studio-root button:hover {
    background-color: hsl(var(--accent)) !important;
  }

  /* Panel headers */
  .gs-studio-root [class*="gs-panel-header"],
  .gs-studio-root [class*="gs-sidebar-header"] {
    background-color: hsl(var(--card)) !important;
    border-color: hsl(var(--border)) !important;
  }

  /* Dropdown menus and popovers */
  .gs-studio-root [class*="gs-dropdown"],
  .gs-studio-root [class*="gs-popover"],
  .gs-studio-root [class*="gs-menu"] {
    background-color: hsl(var(--popover)) !important;
    border-color: hsl(var(--border)) !important;
    color: hsl(var(--popover-foreground)) !important;
  }

  /* GrapeJS Modal Container - rendered in HeadlessUI portal outside studio root */
  /* Use very specific selectors to avoid affecting other modals */
  #headlessui-portal-root .gs-cmp-modal-container {
    background-color: #ffffff !important;
    background: #ffffff !important;
    color: #111827 !important;
  }

  /* Dark mode - only when .dark is on a parent */
  .dark #headlessui-portal-root .gs-cmp-modal-container {
    background-color: hsl(0 0% 18%) !important;
    background: hsl(0 0% 18%) !important;
    color: #f3f4f6 !important;
  }

  /* GrapeJS modal wrapper backdrop - be specific */
  #headlessui-portal-root .gs-cmp-modal-wrapper {
    background-color: rgba(0, 0, 0, 0.5) !important;
  }

  /* Force inputs inside GrapeJS modals to be visible */
  #headlessui-portal-root .gs-cmp-modal-container input,
  #headlessui-portal-root .gs-cmp-modal-container select,
  #headlessui-portal-root .gs-cmp-modal-container textarea {
    background-color: #f9fafb !important;
    border: 1px solid #d1d5db !important;
    color: #111827 !important;
  }

  .dark #headlessui-portal-root .gs-cmp-modal-container input,
  .dark #headlessui-portal-root .gs-cmp-modal-container select,
  .dark #headlessui-portal-root .gs-cmp-modal-container textarea {
    background-color: hsl(0 0% 12%) !important;
    border: 1px solid hsl(0 0% 25%) !important;
    color: #f3f4f6 !important;
  }

  /* ===== Radix Dialog (shadcn/ui) protection from GrapeJS styles ===== */
  /* Ensure our app's dialogs are not affected by GrapeJS */
  /* Target by role and data-state which Radix actually uses */
  [role="dialog"][data-state="open"]:not(.gs-cmp-modal-container) {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 100001 !important;
  }
  
  /* Also ensure the overlay is correct */
  [data-state="open"][data-aria-hidden="true"],
  .fixed.inset-0.bg-black\\/80 {
    position: fixed !important;
    inset: 0 !important;
    z-index: 100000 !important;
  }

  /* GrapeJS Modal/Dialog backgrounds - inside studio root */
  .gs-studio-root [class*="gs-modal"],
  .gs-studio-root [class*="gs-dialog"],
  .gs-studio-root [class*="gs-popup"],
  .gs-studio-root [class*="gs-floating"],
  .gs-studio-root [data-popper-placement] {
    background-color: #ffffff !important;
    background: #ffffff !important;
    border: 1px solid hsl(var(--border)) !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    border-radius: 8px !important;
  }

  .dark .gs-studio-root [class*="gs-modal"],
  .dark .gs-studio-root [class*="gs-dialog"],
  .dark .gs-studio-root [class*="gs-popup"],
  .dark .gs-studio-root [class*="gs-floating"],
  .dark .gs-studio-root [data-popper-placement] {
    background-color: hsl(0 0% 18%) !important;
    background: hsl(0 0% 18%) !important;
  }

  /* Hover states for list items */
  .gs-studio-root [class*="gs-utl-hover\\:bg-zinc"]:hover,
  .gs-studio-root [class*="gs-utl-hover\\:bg-gray"]:hover {
    background-color: hsl(var(--accent)) !important;
  }

  /* Selected/active states */
  .gs-studio-root [class*="gs-utl-bg-violet-100"],
  .gs-studio-root [class*="gs-selected"],
  .gs-studio-root [aria-selected="true"] {
    background-color: hsl(var(--accent)) !important;
  }

  /* Dark mode specific overrides */
  .dark .gs-studio-root,
  .dark .gs-studio-root .gs-theme-cl-bg {
    background-color: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
  }

  .dark .gs-studio-root [class*="gs-utl-bg-white"] {
    background-color: hsl(var(--card)) !important;
  }

  .dark .gs-studio-root .gs-theme-cl-txt {
    color: hsl(var(--foreground)) !important;
  }

  /* ===== Data Variable Field Styling ===== */
  .gs-studio-root [data-gjs-type="data-variable"],
  .data-variable-field {
    display: inline-block;
    background-color: #fef3c7 !important;
    border: 1px solid #f59e0b !important;
    border-radius: 4px;
    padding: 2px 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #92400e !important;
    cursor: pointer;
    white-space: nowrap;
  }

  .gs-studio-root [data-gjs-type="data-variable"]:hover,
  .data-variable-field:hover {
    background-color: #fde68a !important;
    border-color: #d97706 !important;
  }

  .gs-studio-root [data-gjs-type="data-variable"].gjs-selected,
  .gs-studio-root [data-gjs-type="data-variable"]:focus {
    outline: 2px solid #f59e0b !important;
    outline-offset: 1px;
  }

  .dark .gs-studio-root [data-gjs-type="data-variable"],
  .dark .data-variable-field {
    background-color: #78350f !important;
    border-color: #d97706 !important;
    color: #fef3c7 !important;
  }

  .dark .gs-studio-root [data-gjs-type="data-variable"]:hover,
  .dark .data-variable-field:hover {
    background-color: #92400e !important;
    border-color: #f59e0b !important;
  }

  /* Data blocks in the blocks panel */
  .gs-studio-root [data-category="Data"] .gjs-block,
  .gs-studio-root .gjs-block[data-category="Data"] {
    border-color: #f59e0b !important;
  }

  .gs-studio-root [data-category="Data"] .gjs-block:hover {
    background-color: #fef3c7 !important;
  }

  /* Style the data variable picker */
  .gs-studio-root .gs-data-variable-picker,
  .gs-studio-root [class*="data-picker"] {
    border-color: #f59e0b !important;
  }

  /* Collection and condition styling */
  .gs-studio-root [data-gjs-type="data-collection"],
  .gs-studio-root [data-gjs-type="data-condition"] {
    border: 2px dashed #f59e0b !important;
    padding: 8px;
    margin: 4px 0;
    border-radius: 4px;
    background-color: rgba(251, 191, 36, 0.05) !important;
  }

  .dark .gs-studio-root [data-gjs-type="data-collection"],
  .dark .gs-studio-root [data-gjs-type="data-condition"] {
    background-color: rgba(251, 191, 36, 0.1) !important;
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
        {/* GrapeJS Editor - Wrapper includes styles */}
        <div className="flex-1 min-w-0">
          <StudioEditorWrapper
            globalData={globalData}
            variableOptions={variableOptions}
          />
        </div>
        
        {/* Data Panel - Right Side */}
        <div className="w-[280px] flex-shrink-0">
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
