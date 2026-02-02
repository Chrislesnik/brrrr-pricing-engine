"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { TermSheetTemplate, mockTemplates } from "./template-types"
import { TemplateCard } from "./template-card"
import { CreateTemplateDialog } from "./create-template-dialog"

interface TemplateGalleryProps {
  onSelectTemplate: (template: TermSheetTemplate) => void
  onCreateTemplate: (name: string) => void
}

export function TemplateGallery({ 
  onSelectTemplate,
  onCreateTemplate,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TermSheetTemplate[]>(mockTemplates)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  const handleDuplicate = (template: TermSheetTemplate) => {
    const newTemplate: TermSheetTemplate = {
      ...template,
      id: `${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date(),
      updated_at: new Date(),
    }
    setTemplates(prev => [newTemplate, ...prev])
  }

  const handleCreate = (name: string) => {
    onCreateTemplate(name)
    setCreateDialogOpen(false)
  }

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex-none flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Term Sheet Templates</h3>
          <p className="text-muted-foreground text-sm">
            Create and manage reusable term sheet templates.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-auto">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <IconPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">No templates yet</h4>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Create your first term sheet template to get started. Templates can be reused across multiple deals.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => onSelectTemplate(template)}
                onDuplicate={() => handleDuplicate(template)}
                onDelete={() => handleDelete(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}
