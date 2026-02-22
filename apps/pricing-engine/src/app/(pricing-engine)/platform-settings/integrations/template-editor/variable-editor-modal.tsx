"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconDownload,
  IconTypography,
  IconTrash,
  IconAsterisk,
  IconLoader2,
  IconRoute,
} from "@tabler/icons-react"
import { Switch } from "@/components/ui/switch"
import { Variable, VariableType, typeColorConfig, getTypeColors } from "./variable-types"
import {
  KeyValue,
  KeyValueList,
  KeyValueItem,
  KeyValueKeyInput,
  KeyValueRemove,
  KeyValueAdd,
  useKeyValueItemContext,
  useKeyValueStoreContext,
  type KeyValueItemData,
} from "@/components/ui/key-value"

interface VariableEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variables: Variable[]
  onVariablesChange: (variables: Variable[]) => void
  templateId?: string
}

const variableTypes: VariableType[] = ["String", "Number", "Boolean", "Array", "Object", "Binary Data"]

function VariableTypeSelect({ variableTypes }: { variableTypes: VariableType[] }) {
  const itemData = useKeyValueItemContext("VariableTypeSelect")
  const store = useKeyValueStoreContext("VariableTypeSelect")

  const handleTypeChange = (newType: string) => {
    const state = store.getState()
    const newValue = state.value.map((item) =>
      item.id === itemData.id ? { ...item, value: newType } : item
    )
    store.setState("value", newValue)
  }

  const colors = getTypeColors(itemData.value as VariableType)

  return (
    <Select value={itemData.value} onValueChange={handleTypeChange}>
      <SelectTrigger className={cn(
        "w-[130px] shrink-0 font-medium transition-colors",
        colors.bg,
        colors.text,
        colors.border
      )}>
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent className="z-[100002]" position="popper" sideOffset={4}>
        {variableTypes.map((type) => {
          const typeColors = getTypeColors(type)
          return (
            <SelectItem 
              key={type} 
              value={type}
              className={cn(
                "font-medium transition-colors",
                typeColors.text,
                typeColors.hover
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  typeColors.bg,
                  typeColors.border,
                  "border"
                )} />
                {type}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

function RequiredToggle({ 
  requiredMap, 
  onRequiredChange 
}: { 
  requiredMap: Record<string, boolean>
  onRequiredChange: (id: string, required: boolean) => void 
}) {
  const itemData = useKeyValueItemContext("RequiredToggle")
  const isRequired = requiredMap[itemData.id] ?? false

  return (
    <div className="flex items-center gap-1.5 shrink-0" title={isRequired ? "Required variable" : "Optional variable"}>
      <IconAsterisk className={cn(
        "h-3 w-3 transition-colors",
        isRequired ? "text-destructive" : "text-muted-foreground/30"
      )} />
      <Switch
        checked={isRequired}
        onCheckedChange={(checked) => onRequiredChange(itemData.id, checked)}
        className="data-[state=checked]:bg-destructive h-4 w-7"
      />
    </div>
  )
}

function PathInput({
  pathMap,
  onPathChange,
}: {
  pathMap: Record<string, string>
  onPathChange: (id: string, path: string) => void
}) {
  const itemData = useKeyValueItemContext("PathInput")
  const currentPath = pathMap[itemData.id] ?? ""

  return (
    <div className="flex w-full items-center gap-1.5 pl-1">
      <IconRoute className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      <input
        value={currentPath}
        onChange={(e) => onPathChange(itemData.id, e.target.value)}
        placeholder="Data path (e.g. borrower_name)"
        className="flex h-7 w-full rounded-md border border-input/50 bg-muted/30 px-2 py-1 text-xs font-mono text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-input"
      />
    </div>
  )
}

export function VariableEditorModal({
  open,
  onOpenChange,
  variables,
  onVariablesChange,
  templateId,
}: VariableEditorModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localVariables, setLocalVariables] = useState<Variable[]>(variables)
  const [requiredMap, setRequiredMap] = useState<Record<string, boolean>>({})
  const [pathMap, setPathMap] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalVariables(variables)
      const initialRequired: Record<string, boolean> = {}
      const initialPaths: Record<string, string> = {}
      variables.forEach(v => {
        initialRequired[v.id] = v.required ?? false
        initialPaths[v.id] = v.path ?? ""
      })
      setRequiredMap(initialRequired)
      setPathMap(initialPaths)
    }
    onOpenChange(newOpen)
  }

  const handleRequiredChange = useCallback((id: string, required: boolean) => {
    setRequiredMap(prev => ({ ...prev, [id]: required }))
  }, [])

  const handlePathChange = useCallback((id: string, path: string) => {
    setPathMap(prev => ({ ...prev, [id]: path }))
  }, [])

  const keyValueItems = useMemo<KeyValueItemData[]>(() =>
    localVariables.map(v => ({ id: v.id, key: v.name, value: v.type })),
    [localVariables]
  )

  const handleKeyValueChange = useCallback((items: KeyValueItemData[]) => {
    setLocalVariables(prev => {
      const newVariables = items.map(i => ({
        id: i.id,
        name: i.key,
        type: i.value as VariableType,
        required: requiredMap[i.id] ?? false,
        path: pathMap[i.id] ?? undefined,
      }))
      const prevCore = prev.map(v => ({ id: v.id, name: v.name, type: v.type }))
      const newCore = newVariables.map(v => ({ id: v.id, name: v.name, type: v.type }))
      if (JSON.stringify(prevCore) === JSON.stringify(newCore)) return prev
      return newVariables
    })
  }, [requiredMap, pathMap])

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newVariables = [...localVariables]
    ;[newVariables[index - 1], newVariables[index]] = [newVariables[index], newVariables[index - 1]]
    setLocalVariables(newVariables)
  }

  const handleMoveDown = (index: number) => {
    if (index === localVariables.length - 1) return
    const newVariables = [...localVariables]
    ;[newVariables[index], newVariables[index + 1]] = [newVariables[index + 1], newVariables[index]]
    setLocalVariables(newVariables)
  }

  const handleClearSchema = () => {
    if (confirm("Are you sure you want to clear all variables?")) {
      setLocalVariables([])
    }
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(localVariables, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template-variables.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const validTypes = ["String", "Number", "Boolean", "Array", "Object", "Binary Data"]
  const invalidVariables = localVariables.filter(v => !validTypes.includes(v.type))
  const hasInvalidVariables = invalidVariables.length > 0

  const handleSave = async () => {
    if (hasInvalidVariables) {
      setSaveError("Please select a type for all variables")
      return
    }

    const variablesWithMeta = localVariables.map(v => ({
      ...v,
      required: requiredMap[v.id] ?? false,
      path: pathMap[v.id] || undefined,
    }))

    if (templateId) {
      setSaving(true)
      setSaveError(null)
      try {
        const res = await fetch(`/api/document-templates/${templateId}/variables`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variables: variablesWithMeta }),
        })
        
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to save variables")
        }
        
        const data = await res.json()
        onVariablesChange(data.variables || variablesWithMeta)
        onOpenChange(false)
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Failed to save variables")
      } finally {
        setSaving(false)
      }
    } else {
      onVariablesChange(variablesWithMeta)
      onOpenChange(false)
    }
  }

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    setPortalContainer(document.body)
  }, [])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100000] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-[100001] flex w-full max-w-2xl h-[70vh] flex-col overflow-hidden border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
          )}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
        <DialogHeader className="flex-none pb-4">
          <DialogTitle className="flex items-center gap-2">
            <IconTypography className="h-5 w-5" />
            Variable Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-none flex items-center gap-2 py-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
            <IconSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full bg-transparent py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMoveUp(0)}
              disabled
              title="Move selection up"
            >
              <IconChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMoveDown(0)}
              disabled
              title="Move selection down"
            >
              <IconChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <KeyValue
              value={keyValueItems}
              onValueChange={handleKeyValueChange}
              keyPlaceholder="Variable name"
              className="p-2"
            >
              <KeyValueList>
                <KeyValueItem className="flex flex-wrap items-center gap-2">
                  <KeyValueKeyInput className="flex-1 min-w-[120px]" />
                  <VariableTypeSelect variableTypes={variableTypes} />
                  <RequiredToggle 
                    requiredMap={requiredMap} 
                    onRequiredChange={handleRequiredChange} 
                  />
                  <KeyValueRemove className="shrink-0" />
                  <PathInput
                    pathMap={pathMap}
                    onPathChange={handlePathChange}
                  />
                </KeyValueItem>
              </KeyValueList>
              <KeyValueAdd className="w-full" />
            </KeyValue>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-none flex flex-col gap-2 border-t pt-4">
          {saveError && (
            <p className="text-sm text-destructive text-center w-full">{saveError}</p>
          )}
          {!saveError && hasInvalidVariables && (
            <p className="text-sm text-muted-foreground text-center w-full">
              Select a type for {invalidVariables.length === 1 ? "1 variable" : `all ${invalidVariables.length} variables`} to save
            </p>
          )}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSchema}
                className="text-muted-foreground"
                disabled={saving}
              >
                <IconTrash className="h-4 w-4 mr-1" />
                Clear Schema
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={saving}>
                <IconDownload className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Close
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={saving || hasInvalidVariables}
                title={hasInvalidVariables ? "Select a type for all variables before saving" : undefined}
              >
                {saving ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
        
        <DialogPrimitive.Close asChild>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
