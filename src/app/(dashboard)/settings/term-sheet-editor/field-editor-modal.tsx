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
} from "@tabler/icons-react"
import { Switch } from "@/components/ui/switch"
import { Field, FieldType, typeColorConfig, getTypeColors } from "./field-types"
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

interface FieldEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: Field[]
  onFieldsChange: (fields: Field[]) => void
  templateId?: string // If provided, saves to Supabase
}

const fieldTypes: FieldType[] = ["String", "Number", "Boolean", "Array", "Object", "Binary Data"]

// Custom type selector component that uses KeyValue's item context
function FieldTypeSelect({ fieldTypes }: { fieldTypes: FieldType[] }) {
  const itemData = useKeyValueItemContext("FieldTypeSelect")
  const store = useKeyValueStoreContext("FieldTypeSelect")

  const handleTypeChange = (newType: string) => {
    const state = store.getState()
    const newValue = state.value.map((item) =>
      item.id === itemData.id ? { ...item, value: newType } : item
    )
    store.setState("value", newValue)
  }

  const colors = getTypeColors(itemData.value)

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
        {fieldTypes.map((type) => {
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

// Required toggle component
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
    <div className="flex items-center gap-1.5 shrink-0" title={isRequired ? "Required field" : "Optional field"}>
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

export function FieldEditorModal({
  open,
  onOpenChange,
  fields,
  onFieldsChange,
  templateId,
}: FieldEditorModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localFields, setLocalFields] = useState<Field[]>(fields)
  // Track required state separately (by field id)
  const [requiredMap, setRequiredMap] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync local state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalFields(fields)
      // Initialize required map from fields
      const initialRequired: Record<string, boolean> = {}
      fields.forEach(f => {
        initialRequired[f.id] = f.required ?? false
      })
      setRequiredMap(initialRequired)
    }
    onOpenChange(newOpen)
  }

  // Handle required toggle change
  const handleRequiredChange = useCallback((id: string, required: boolean) => {
    setRequiredMap(prev => ({ ...prev, [id]: required }))
  }, [])

  // Convert Field[] to KeyValueItemData[] for the KeyValue component
  const keyValueItems = useMemo<KeyValueItemData[]>(() =>
    localFields.map(f => ({ id: f.id, key: f.name, value: f.type })),
    [localFields]
  )

  // Handle changes from KeyValue component
  const handleKeyValueChange = useCallback((items: KeyValueItemData[]) => {
    setLocalFields(prev => {
      const newFields = items.map(i => ({
        id: i.id,
        name: i.key,
        type: i.value as FieldType,
        required: requiredMap[i.id] ?? false
      }))
      // Only update if actually different to prevent loops
      const prevWithoutRequired = prev.map(f => ({ id: f.id, name: f.name, type: f.type }))
      const newWithoutRequired = newFields.map(f => ({ id: f.id, name: f.name, type: f.type }))
      if (JSON.stringify(prevWithoutRequired) === JSON.stringify(newWithoutRequired)) return prev
      return newFields
    })
  }, [requiredMap])

  // Move field up
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newFields = [...localFields]
    ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
    setLocalFields(newFields)
  }

  // Move field down
  const handleMoveDown = (index: number) => {
    if (index === localFields.length - 1) return
    const newFields = [...localFields]
    ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
    setLocalFields(newFields)
  }

  // Clear all fields
  const handleClearSchema = () => {
    if (confirm("Are you sure you want to clear all fields?")) {
      setLocalFields([])
    }
  }

  // Download fields as JSON
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(localFields, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "term-sheet-fields.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Check if all fields have valid types
  const validTypes = ["String", "Number", "Boolean", "Array", "Object", "Binary Data"]
  const invalidFields = localFields.filter(f => !validTypes.includes(f.type))
  const hasInvalidFields = invalidFields.length > 0

  // Save changes
  const handleSave = async () => {
    // Validate all fields have a type selected
    if (hasInvalidFields) {
      setSaveError("Please select a type for all fields")
      return
    }

    // Merge required state into fields before saving
    const fieldsWithRequired = localFields.map(f => ({
      ...f,
      required: requiredMap[f.id] ?? false
    }))

    // If we have a templateId, save to Supabase
    if (templateId) {
      setSaving(true)
      setSaveError(null)
      try {
        const res = await fetch(`/api/term-sheet-templates/${templateId}/fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: fieldsWithRequired }),
        })
        
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to save fields")
        }
        
        const data = await res.json()
        // Update local state with saved fields (which now have proper IDs)
        onFieldsChange(data.fields || fieldsWithRequired)
        onOpenChange(false)
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Failed to save fields")
      } finally {
        setSaving(false)
      }
    } else {
      // No templateId, just update local state
      onFieldsChange(fieldsWithRequired)
      onOpenChange(false)
    }
  }

  // Get the body element for the portal container
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
            Field Editor
          </DialogTitle>
        </DialogHeader>

        {/* Search and Controls */}
        <div className="flex-none flex items-center gap-2 py-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
            <IconSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search fields..."
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

        {/* KeyValue Component - using native appearance */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <KeyValue
              value={keyValueItems}
              onValueChange={handleKeyValueChange}
              keyPlaceholder="Field name"
              className="p-2"
            >
              <KeyValueList>
                <KeyValueItem className="flex items-center gap-2">
                  <KeyValueKeyInput className="flex-1" />
                  <FieldTypeSelect fieldTypes={fieldTypes} />
                  <RequiredToggle 
                    requiredMap={requiredMap} 
                    onRequiredChange={handleRequiredChange} 
                  />
                  <KeyValueRemove className="shrink-0" />
                </KeyValueItem>
              </KeyValueList>
              <KeyValueAdd className="w-full" />
            </KeyValue>
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-none flex flex-col gap-2 border-t pt-4">
          {saveError && (
            <p className="text-sm text-destructive text-center w-full">{saveError}</p>
          )}
          {!saveError && hasInvalidFields && (
            <p className="text-sm text-muted-foreground text-center w-full">
              Select a type for {invalidFields.length === 1 ? "1 field" : `all ${invalidFields.length} fields`} to save
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
                disabled={saving || hasInvalidFields}
                title={hasInvalidFields ? "Select a type for all fields before saving" : undefined}
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
        
        {/* Close button */}
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
