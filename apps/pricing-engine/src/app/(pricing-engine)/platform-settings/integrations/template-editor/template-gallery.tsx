"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus, IconLoader2 } from "@tabler/icons-react"
import { DocumentTemplate } from "./template-types"
import { TemplateCard } from "./template-card"
import { CreateTemplateDialog } from "./create-template-dialog"

interface TemplateGalleryProps {
  onSelectTemplate: (template: DocumentTemplate) => void
  onCreateTemplate: (name: string) => void
}

export function TemplateGallery({ 
  onSelectTemplate,
  onCreateTemplate,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/document-templates")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to fetch templates")
      }
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    
    try {
      const res = await fetch(`/api/document-templates/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete template")
      }
      // Remove from local state
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete template")
    }
  }

  const handleDuplicate = async (template: DocumentTemplate) => {
    try {
      const res = await fetch("/api/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          html_content: template.html_content,
          gjs_data: template.gjs_data,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to duplicate template")
      }
      const data = await res.json()
      // Add to local state at the beginning
      setTemplates(prev => [data.template, ...prev])
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to duplicate template")
    }
  }

  const handleCreate = (name: string) => {
    onCreateTemplate(name)
    setCreateDialogOpen(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 className="h-5 w-5 animate-spin" />
          <span>Loading templates...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchTemplates}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex-none flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Document Templates</h3>
          <p className="text-muted-foreground text-sm">
            Create and manage reusable document templates.
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
              Create your first document template to get started. Templates can be reused across multiple deals.
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
