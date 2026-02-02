"use client"

import { useState, useCallback, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconTestPipe, IconRefresh } from "@tabler/icons-react"
import { Field } from "./field-types"

interface VariablePreviewPanelProps {
  fields: Field[]
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
}

export function VariablePreviewPanel({
  fields,
  values,
  onValuesChange,
}: VariablePreviewPanelProps) {
  // Local state for immediate input feedback
  const [localValues, setLocalValues] = useState<Record<string, string>>(values)

  // Sync local values when external values change
  useEffect(() => {
    setLocalValues(values)
  }, [values])

  // Handle input change with debounce
  const handleInputChange = useCallback((fieldName: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Debounce the parent update
    const timeoutId = setTimeout(() => {
      onValuesChange({ ...localValues, [fieldName]: value })
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [localValues, onValuesChange])

  // Clear all values
  const handleClearAll = useCallback(() => {
    const emptyValues: Record<string, string> = {}
    fields.forEach(f => {
      emptyValues[f.name] = ""
    })
    setLocalValues(emptyValues)
    onValuesChange(emptyValues)
  }, [fields, onValuesChange])

  // Get placeholder based on field type
  const getPlaceholder = (field: Field): string => {
    switch (field.type) {
      case "Number":
        return "0"
      case "Boolean":
        return "true / false"
      case "Array":
        return "item1, item2, ..."
      case "Object":
        return "{}"
      default:
        return `Enter ${field.name.replace(/_/g, " ")}`
    }
  }

  // Get input type based on field type
  const getInputType = (field: Field): string => {
    switch (field.type) {
      case "Number":
        return "text" // Keep text for flexibility with currency, etc.
      default:
        return "text"
    }
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <IconTestPipe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Test Data</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            No fields defined.<br />
            Click "Edit Fields" to add variables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <IconTestPipe className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Test Data</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleClearAll}
          title="Clear all values"
        >
          <IconRefresh className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      </div>

      {/* Fields List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label 
                htmlFor={`preview-${field.id}`}
                className="text-xs font-medium text-muted-foreground flex items-center gap-1"
              >
                <span className="font-mono">{field.name}</span>
                {field.required && (
                  <span className="text-destructive">*</span>
                )}
                <span className="ml-auto text-[10px] opacity-60">{field.type}</span>
              </Label>
              <Input
                id={`preview-${field.id}`}
                type={getInputType(field)}
                placeholder={getPlaceholder(field)}
                value={localValues[field.name] || ""}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t">
        <p className="text-[11px] text-muted-foreground text-center">
          Enter test values to see how variables will appear in the preview.
        </p>
      </div>
    </div>
  )
}
