"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconFileText } from "@tabler/icons-react"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("")
      setError("")
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Please enter a template name")
      return
    }
    
    if (trimmedName.length < 3) {
      setError("Name must be at least 3 characters")
      return
    }
    
    onSubmit(trimmedName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5 text-primary" />
              Create New Template
            </DialogTitle>
            <DialogDescription>
              Enter a name for your new term sheet template. You can customize the design after creation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <Label htmlFor="template-name" className="text-sm font-medium">
              Template Name
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="e.g., Standard DSCR Term Sheet"
              className="mt-2"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
