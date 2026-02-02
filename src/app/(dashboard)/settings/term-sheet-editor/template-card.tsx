"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconDotsVertical,
  IconPencil,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react"
import { TermSheetTemplate } from "./template-types"
import { TemplatePreview } from "./template-preview"

interface TemplateCardProps {
  template: TermSheetTemplate
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  return (
    <div
      className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
      onClick={onEdit}
    >
      {/* Preview Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
        <TemplatePreview html={template.html_content} />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <IconPencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{template.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Updated {format(new Date(template.updated_at), "MMM d, yyyy")}
            </p>
          </div>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}>
                <IconPencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}>
                <IconCopy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Created date */}
        <p className="text-xs text-muted-foreground/70 mt-2">
          Created {format(new Date(template.created_at), "MMM d, yyyy")}
        </p>
      </div>
    </div>
  )
}
