'use client'
import React, { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function CompanyForm({ initialName, initialLogoUrl }: { initialName?: string; initialLogoUrl?: string }) {
  const { toast } = useToast()
  const [companyName, setCompanyName] = useState<string>(initialName ?? "")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | undefined>(initialLogoUrl)
  const [isPending, startTransition] = useTransition()
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Build/revoke a preview URL when user selects a file
  React.useEffect(() => {
    if (!logoFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  const onSubmit = () => {
    startTransition(async () => {
      try {
        const form = new FormData()
        form.set("company_name", companyName)
        if (logoFile) form.set("logo", logoFile)
        const res = await fetch("/api/org/company-branding", {
          method: "POST",
          body: form,
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.error ?? "Failed to save")
        toast({ title: "Saved", description: "Company branding updated." })
        setCompanyName(j?.company_name ?? companyName)
        if (j?.logo_url) setExistingLogoUrl(j.logo_url)
      } catch (e) {
        toast({
          title: "Save failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold">Company</h2>
        <p className="text-sm text-muted-foreground">Broker-managed company details.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-name">Company Name</Label>
        <Input
          id="company-name"
          placeholder="e.g., Example Capital"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <Label htmlFor="company-logo">Company Logo</Label>
          <span className="text-xs italic text-muted-foreground">(used for white labeled documents)</span>
        </div>
        <div
          className={`rounded-md border border-dashed p-6 text-center bg-background transition-all ${isDragOver ? "border-primary ring-2 ring-primary/30" : ""}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) setLogoFile(f)
          }}
        >
          <input
            ref={fileInputRef}
            id="company-logo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-sm mb-3">
            {logoFile ? logoFile.name : "Drag & drop image here, or click to choose a file"}
          </div>
          {/* Inline preview (selected file takes precedence) */}
          {previewUrl ? (
            <div className="mb-3 flex items-center justify-center relative">
              <button
                type="button"
                aria-label="Remove selected image"
                className="absolute -right-2 -top-2 rounded-full bg-black/70 text-white text-xs px-2 py-0.5"
                onClick={() => setLogoFile(null)}
              >
                ×
              </button>
              <img
                src={previewUrl}
                alt="Selected logo preview"
                className="max-h-28 object-contain rounded-md"
              />
            </div>
          ) : existingLogoUrl ? (
            <div className="mb-3 flex items-center justify-center relative">
              <button
                type="button"
                aria-label="Delete current logo"
                className="absolute -right-2 -top-2 rounded-full bg-black/70 text-white text-xs px-2 py-0.5"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      const res = await fetch("/api/org/company-branding", { method: "DELETE" })
                      const j = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(j?.error ?? "Failed to delete")
                      setExistingLogoUrl(undefined)
                      toast({ title: "Deleted", description: "Company logo removed." })
                    } catch (e) {
                      toast({
                        title: "Delete failed",
                        description: e instanceof Error ? e.message : "Unknown error",
                        variant: "destructive",
                      })
                    }
                  })
                }}
              >
                ×
              </button>
              <img
                src={existingLogoUrl}
                alt="Current logo"
                className="max-h-28 object-contain rounded-md"
              />
            </div>
          ) : null}
          <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
            Choose File
          </Button>
        </div>
      </div>
      <div className="pt-2">
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}