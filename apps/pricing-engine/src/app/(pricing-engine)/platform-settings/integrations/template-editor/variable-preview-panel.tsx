"use client"

import { useState, useCallback, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconTestPipe, IconRefresh, IconPlayerPlay } from "@tabler/icons-react"
import { Variable, VariableType, getTypeColors } from "./variable-types"
import { cn } from "@/lib/utils"

interface VariablePreviewPanelProps {
  variables: Variable[]
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
}

export function VariablePreviewPanel({
  variables,
  values,
  onValuesChange,
}: VariablePreviewPanelProps) {
  const [localValues, setLocalValues] = useState<Record<string, string>>(values)

  useEffect(() => {
    setLocalValues(values)
  }, [values])

  const handleInputChange = useCallback((variableName: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [variableName]: value }))
  }, [])

  const handleApplyToPreview = useCallback(() => {
    onValuesChange(localValues)
  }, [localValues, onValuesChange])

  const hasUnappliedChanges = Object.keys(localValues).some(
    key => localValues[key] !== values[key]
  )

  const handleClearAll = useCallback(() => {
    const emptyValues: Record<string, string> = {}
    variables.forEach(v => {
      emptyValues[v.name] = ""
    })
    setLocalValues(emptyValues)
    onValuesChange(emptyValues)
  }, [variables, onValuesChange])

  const getPlaceholder = (variable: Variable): string => {
    switch (variable.type) {
      case "Number":
        return "0"
      case "Boolean":
        return "true / false"
      case "Array":
        return "item1, item2, ..."
      case "Object":
        return "{}"
      default:
        return `Enter ${variable.name.replace(/_/g, " ")}`
    }
  }

  const getInputType = (variable: Variable): string => {
    switch (variable.type) {
      case "Number":
        return "text"
      default:
        return "text"
    }
  }

  if (variables.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col h-full bg-background border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <IconTestPipe className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Test Data</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              No variables defined.<br />
              Click &quot;Edit Variables&quot; to add variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-full bg-background border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <IconTestPipe className="h-4 w-4 text-primary" />
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

        {/* Variables List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {variables.map((variable) => (
              <div key={variable.id} className="space-y-1.5">
                <Label 
                  htmlFor={`preview-${variable.id}`}
                  className="text-xs font-medium text-muted-foreground flex items-center gap-1"
                >
                  <span className="font-mono">{variable.name}</span>
                  <span className={cn(
                    "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded",
                    getTypeColors(variable.type).bg,
                    getTypeColors(variable.type).text
                  )}>
                    {variable.type}
                  </span>
                </Label>
                <Input
                  id={`preview-${variable.id}`}
                  type={getInputType(variable)}
                  placeholder={getPlaceholder(variable)}
                  value={localValues[variable.name] || ""}
                  onChange={(e) => handleInputChange(variable.name, e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer with Apply button */}
        <div className="px-4 py-3 border-t bg-muted/30 space-y-2">
          <Button
            onClick={handleApplyToPreview}
            className="w-full"
            size="sm"
            disabled={!hasUnappliedChanges}
          >
            <IconPlayerPlay className="h-4 w-4 mr-2" />
            Apply to Preview
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Enter test values to see how variables will appear in the preview.
          </p>
        </div>
      </div>
    </div>
  )
}
