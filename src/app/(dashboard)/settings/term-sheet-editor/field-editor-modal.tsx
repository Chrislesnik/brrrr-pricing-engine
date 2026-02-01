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
} from "@tabler/icons-react"
import { Field, FieldType } from "./field-types"
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

  return (
    <Select value={itemData.value} onValueChange={handleTypeChange}>
      <SelectTrigger className="w-[130px] shrink-0 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700">
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent className="z-[100002]" position="popper" sideOffset={4}>
        {fieldTypes.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FieldEditorModal({
  open,
  onOpenChange,
  fields,
  onFieldsChange,
}: FieldEditorModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localFields, setLocalFields] = useState<Field[]>(fields)

  // Sync local state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalFields(fields)
    }
    onOpenChange(newOpen)
  }

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
        type: i.value as FieldType
      }))
      // Only update if actually different to prevent loops
      if (JSON.stringify(prev) === JSON.stringify(newFields)) return prev
      return newFields
    })
  }, [])

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

  // Save changes
  const handleSave = () => {
    onFieldsChange(localFields)
    onOpenChange(false)
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
            "fixed left-[50%] top-[50%] z-[100001] flex w-full max-w-2xl h-[70vh] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
          )}
        >
        <DialogHeader className="flex-none">
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
                  <KeyValueRemove className="shrink-0" />
                </KeyValueItem>
              </KeyValueList>
              <KeyValueAdd className="w-full" />
            </KeyValue>
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-none flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSchema}
              className="text-muted-foreground"
            >
              <IconTrash className="h-4 w-4 mr-1" />
              Clear Schema
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <IconDownload className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700">
              Save
            </Button>
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
