"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { IconDatabase, IconArrowLeft, IconLoader2, IconTestPipe } from "@tabler/icons-react"
import { Field, defaultFields, fieldsToGlobalData } from "./field-types"
import { FieldEditorModal } from "./field-editor-modal"
import { TemplateGallery } from "./template-gallery"
import { VariablePreviewPanel } from "./variable-preview-panel"
import { DocumentTemplate, defaultTemplateHtml } from "./template-types"

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

const grapejsThemeStyles = `
  [data-radix-dialog-content]:not([data-radix-popper-content-wrapper] *),
  [role="dialog"][data-state="open"]:not(.gs-cmp-modal-container):not([class*="gs-"]):not([data-radix-popper-content-wrapper] *):not([data-side]) {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 100001 !important;
    max-height: 85vh !important;
  }
  
  [data-radix-dialog-overlay] {
    position: fixed !important;
    inset: 0 !important;
    z-index: 100000 !important;
  }

  #headlessui-portal-root {
    position: fixed !important;
    z-index: 99999 !important;
  }
  
  .gs-cmp-modal-wrapper {
    position: fixed !important;
    inset: 0 !important;
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: rgba(0, 0, 0, 0.5) !important;
  }
  
  .gs-cmp-modal-container {
    position: relative !important;
    z-index: 100000 !important;
    background-color: white !important;
    border-radius: 8px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    max-height: 90vh !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
  }
  
  .dark .gs-cmp-modal-container {
    background-color: hsl(0 0% 12%) !important;
    color: #f3f4f6 !important;
  }

  .gs-cmp-modal-container > * {
    overflow: visible !important;
  }

  .gs-cmp-modal-container [class*="footer"],
  .gs-cmp-modal-container [class*="button"],
  .gs-cmp-modal-container button,
  .gs-cmp-modal-container [role="button"] {
    visibility: visible !important;
    opacity: 1 !important;
    display: flex !important;
  }

  .gs-cmp-modal-container [class*="content"] {
    overflow-y: auto !important;
    flex: 1 1 auto !important;
    max-height: calc(90vh - 120px) !important;
  }

  .gs-cmp-modal-container [class*="footer"] {
    flex: 0 0 auto !important;
    padding: 16px !important;
    border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    gap: 8px !important;
    justify-content: flex-end !important;
  }

  .dark .gs-cmp-modal-container [class*="footer"] {
    border-top-color: rgba(255, 255, 255, 0.1) !important;
  }

  .gs-studio-root .gs-cmp-modal-container button,
  .gs-studio-root .gs-cmp-modal-container [role="button"],
  .gs-studio-root .gs-cmp-modal-container [type="button"],
  .gs-studio-root .gs-cmp-modal-container [type="submit"],
  .gs-studio-root [data-headlessui-state] button {
    visibility: visible !important;
    opacity: 1 !important;
    display: inline-flex !important;
    pointer-events: auto !important;
  }

  .gs-cmp-modal-container {
    overflow: visible !important;
  }

  .gs-cmp-modal-container > div {
    overflow: visible !important;
  }

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

  .gs-studio-root [data-tooltip-content="Settings"],
  .gs-studio-root button[aria-label="Settings"],
  .gs-studio-root [data-test-id="settings"],
  .gs-studio-root .gs-cmp-top-bar-right button:last-child {
    display: none !important;
  }

  .gs-studio-root .gs-utl-text-violet-800,
  .gs-studio-root .gs-utl-text-violet-700,
  .gs-studio-root .gs-utl-text-violet-600,
  .gs-studio-root .gs-utl-text-violet-500 {
    color: hsl(var(--primary)) !important;
  }

  .dark .gs-studio-root .gs-utl-text-violet-400,
  .dark .gs-studio-root .gs-utl-text-violet-300,
  .dark .gs-studio-root .gs-utl-text-violet-200 {
    color: hsl(var(--primary)) !important;
  }

  .gs-studio-root .gs-utl-bg-violet-100,
  .gs-studio-root .gs-utl-bg-violet-50 {
    background-color: hsl(var(--primary) / 0.1) !important;
  }

  .dark .gs-studio-root .gs-utl-bg-violet-900,
  .dark .gs-studio-root .gs-utl-bg-violet-800 {
    background-color: hsl(var(--primary) / 0.2) !important;
  }

  .gs-studio-root [class*="gs-utl-bg-violet"]:not(button):not([role="button"]) {
    background-color: hsl(var(--primary) / 0.15) !important;
  }

  .dark .gs-studio-root [class*="gs-utl-bg-violet"]:not(button):not([role="button"]) {
    background-color: hsl(var(--primary) / 0.25) !important;
  }

  .gs-studio-root button.gs-utl-bg-violet-500,
  .gs-studio-root button[class*="gs-utl-bg-violet-500"],
  .gs-studio-root [role="button"].gs-utl-bg-violet-500,
  #headlessui-portal-root button.gs-utl-bg-violet-500,
  #headlessui-portal-root button[class*="gs-utl-bg-violet-500"] {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  .gs-studio-root button.gs-utl-bg-violet-500:hover,
  .gs-studio-root button[class*="gs-utl-bg-violet-500"]:hover,
  .gs-studio-root [role="button"].gs-utl-bg-violet-500:hover,
  #headlessui-portal-root button.gs-utl-bg-violet-500:hover,
  #headlessui-portal-root button[class*="gs-utl-bg-violet-500"]:hover {
    background-color: hsl(var(--primary) / 0.9) !important;
  }

  .dark .gs-studio-root button.gs-utl-bg-violet-500,
  .dark .gs-studio-root button[class*="gs-utl-bg-violet-500"],
  .dark .gs-studio-root [role="button"].gs-utl-bg-violet-500,
  .dark #headlessui-portal-root button.gs-utl-bg-violet-500,
  .dark #headlessui-portal-root button[class*="gs-utl-bg-violet-500"] {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  .dark .gs-studio-root button.gs-utl-bg-violet-500:hover,
  .dark .gs-studio-root button[class*="gs-utl-bg-violet-500"]:hover,
  .dark .gs-studio-root [role="button"].gs-utl-bg-violet-500:hover,
  .dark #headlessui-portal-root button.gs-utl-bg-violet-500:hover,
  .dark #headlessui-portal-root button[class*="gs-utl-bg-violet-500"]:hover {
    background-color: hsl(var(--primary) / 0.8) !important;
  }

  .gs-studio-root .gs-theme-cl-hTAo:hover,
  .gs-studio-root [class*="hover\\:gs-utl-text-violet"]:hover {
    color: hsl(var(--primary)) !important;
  }

  .dark .gs-studio-root .gs-theme-cl-hTAo:hover,
  .dark .gs-studio-root [class*="hover\\:dark\\:gs-utl-text-violet"]:hover {
    color: hsl(var(--primary)) !important;
  }

  .gs-studio-root .gs-utl-border-violet-500,
  .gs-studio-root .gs-utl-border-violet-400,
  .gs-studio-root .gs-utl-border-violet-300 {
    border-color: hsl(var(--primary)) !important;
  }

  .gs-studio-root .gs-utl-ring-violet-500,
  .gs-studio-root .gs-utl-ring-violet-400 {
    --tw-ring-color: hsl(var(--primary)) !important;
  }

  .gs-studio-root .gs-block-item--active,
  .gs-studio-root .gs-layer-item--selected {
    border-color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.1) !important;
  }

  .dark .gs-studio-root .gs-block-item--active,
  .dark .gs-studio-root .gs-layer-item--selected {
    border-color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.2) !important;
  }
`

export function DocumentsTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const templateId = searchParams.get("template")
  const isNewTemplate = searchParams.get("new") === "true"
  const templateName = searchParams.get("name") || "Untitled Template"
  const isEditorMode = templateId !== null || isNewTemplate

  const [fields, setFields] = useState<Field[]>(defaultFields)
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  const [previewApplyCounter, setPreviewApplyCounter] = useState(0)
  
  const handleApplyPreviewValues = useCallback((values: Record<string, string>) => {
    setPreviewValues(values)
    setPreviewApplyCounter(prev => prev + 1)
  }, [])

  const hasPreviewValues = useMemo(() =>
    Object.values(previewValues).some(v => v.trim() !== ""),
    [previewValues]
  )

  const globalData = useMemo(() => {
    const baseData = fieldsToGlobalData(fields)
    Object.entries(previewValues).forEach(([key, value]) => {
      if (value.trim()) {
        if (!baseData[key]) {
          baseData[key] = { data: "" }
        }
        baseData[key].data = value
      }
    })
    return baseData
  }, [fields, previewValues])

  const variableOptions = useMemo(() => 
    fields.map(field => ({
      id: `{{${field.name}}}`,
      label: field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })),
    [fields]
  )

  useEffect(() => {
    if (!templateId) return

    let cancelled = false
    setLoadingTemplate(true)
    setTemplateError(null)
    setCurrentTemplate(null)
    setFields(defaultFields)

    Promise.all([
      fetch(`/api/document-templates/${templateId}`).then(res => {
        if (!res.ok) throw new Error("Template not found")
        return res.json()
      }),
      fetch(`/api/document-templates/${templateId}/fields`).then(res => {
        if (!res.ok) throw new Error("Failed to load fields")
        return res.json()
      })
    ])
      .then(([templateData, fieldsData]) => {
        if (cancelled) return
        setCurrentTemplate(templateData.template)
        setFields(fieldsData.fields || [])
      })
      .catch(e => {
        if (cancelled) return
        setTemplateError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplate(false)
      })

    return () => { cancelled = true }
  }, [templateId])

  const handleSelectTemplate = useCallback((template: DocumentTemplate) => {
    router.push(`/platform-settings/integrations/template-editor?tab=documents&template=${template.id}`)
  }, [router])

  const handleCreateTemplate = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          html_content: defaultTemplateHtml,
          gjs_data: {},
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create template")
      }
      
      const data = await res.json()
      setCurrentTemplate(data.template)
      router.push(`/platform-settings/integrations/template-editor?tab=documents&template=${data.template.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create template")
    }
  }, [router])

  const handleBackToGallery = useCallback(() => {
    setCurrentTemplate(null)
    setTemplateError(null)
    router.push("/platform-settings/integrations/template-editor?tab=documents")
  }, [router])

  const handleEditorSave = useCallback(async (html: string, projectData: object) => {
    const id = currentTemplate?.id ?? templateId
    if (!id || id.startsWith("new-")) return
    try {
      await fetch(`/api/document-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html_content: html,
          gjs_data: projectData,
        }),
      })
    } catch (e) {
      console.error("Failed to persist template:", e)
    }
  }, [currentTemplate?.id, templateId])

  const editorTemplate = useMemo(() => {
    if (currentTemplate) return currentTemplate
    if (isNewTemplate) {
      return {
        id: `new-${Date.now()}`,
        name: templateName,
        html_content: defaultTemplateHtml,
        gjs_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "",
      }
    }
    return null
  }, [currentTemplate, isNewTemplate, templateName])

  if (!isEditorMode) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <TemplateGallery
            onSelectTemplate={handleSelectTemplate}
            onCreateTemplate={handleCreateTemplate}
          />
        </div>
      </div>
    )
  }

  if (loadingTemplate) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconLoader2 className="h-5 w-5 animate-spin" />
            <span>Loading template...</span>
          </div>
        </div>
      </div>
    )
  }

  if (templateError) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <p className="text-destructive">{templateError}</p>
          <Button variant="outline" onClick={handleBackToGallery}>
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: grapejsThemeStyles }} />
      
      <div className="px-4 py-3 flex-none flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToGallery}
            className="text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-medium">
              {editorTemplate?.name || "Template Editor"}
            </h3>
            <p className="text-muted-foreground text-sm">
              Edit template design
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showTestPanel ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowTestPanel(!showTestPanel)}
          >
            <IconTestPipe className="h-4 w-4 mr-1.5" />
            Test Data
          </Button>
          <Button
            variant="outline"
            onClick={() => setFieldEditorOpen(true)}
            className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          >
            <IconDatabase className="h-4 w-4 mr-2" />
            Edit Fields
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 gap-0 px-4 pb-4">
        <div className="flex-1 min-w-0 h-full rounded-lg border bg-background overflow-hidden isolate">
          <StudioEditorWrapper
            key={`editor-${templateId}-${fields.length}-${previewApplyCounter}`}
            globalData={globalData}
            variableOptions={variableOptions}
            fields={fields}
            isPreviewMode={hasPreviewValues}
            template={editorTemplate}
            onSave={handleEditorSave}
          />
        </div>
        
        {showTestPanel && (
          <div className="w-[280px] flex-shrink-0">
            <VariablePreviewPanel
              fields={fields}
              values={previewValues}
              onValuesChange={handleApplyPreviewValues}
            />
          </div>
        )}
      </div>

      <FieldEditorModal
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        fields={fields}
        onFieldsChange={setFields}
        templateId={templateId || undefined}
      />
    </div>
  )
}
