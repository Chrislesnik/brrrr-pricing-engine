"use client"

import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  IconSearch,
  IconDatabase,
  IconGripVertical,
  IconSettings,
} from "@tabler/icons-react"
import { Field } from "./field-types"

interface DataPanelProps {
  fields: Field[]
  onOpenFieldEditor: () => void
  onDragStart?: (field: Field) => void
}

export function DataPanel({ fields, onOpenFieldEditor, onDragStart }: DataPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return fields
    return fields.filter((field) =>
      field.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [fields, searchQuery])

  const handleDragStart = (e: React.DragEvent, field: Field) => {
    // Set drag data for GrapeJS
    e.dataTransfer.setData("text/plain", `{{${field.name}}}`)
    e.dataTransfer.setData("application/json", JSON.stringify(field))
    e.dataTransfer.effectAllowed = "copy"
    
    if (onDragStart) {
      onDragStart(field)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <IconDatabase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Data</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onOpenFieldEditor}
          title="Edit Fields"
        >
          <IconSettings className="h-4 w-4" />
        </Button>
      </div>

      {/* Source Section */}
      <div className="px-4 py-3 border-b">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Source
        </div>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <IconDatabase className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Custom Data Source</span>
          <span className="ml-auto text-xs text-muted-foreground">...</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring h-9">
          <IconSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Fields List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {filteredFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "No fields found" : "No fields defined"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFields.map((field) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing group transition-colors"
                >
                  <IconGripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                  <span className="text-amber-500 font-mono text-sm font-medium">Tt</span>
                  <span className="text-sm font-mono truncate flex-1">{field.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30"
          onClick={onOpenFieldEditor}
        >
          <IconSettings className="h-4 w-4 mr-2" />
          Manage Fields
        </Button>
      </div>
    </div>
  )
}
