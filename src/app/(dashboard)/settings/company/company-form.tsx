\"use client\"
import React, { useRef, useState, useTransition } from \"react\"
import { Button } from \"@/components/ui/button\"
import { Input } from \"@/components/ui/input\"
import { Label } from \"@/components/ui/label\"
import { useToast } from \"@/hooks/use-toast\"

export default function CompanyForm() {
  const { toast } = useToast()
  const [companyName, setCompanyName] = useState<string>(\"\")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const onSubmit = () => {
    startTransition(async () => {
      try {
        const form = new FormData()
        form.set(\"company_name\", companyName)
        if (logoFile) form.set(\"logo\", logoFile)
        const res = await fetch(\"/api/org/company-branding\", {
          method: \"POST\",
          body: form,
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.error ?? \"Failed to save\")
        toast({ title: \"Saved\", description: \"Company branding updated.\" })
        setCompanyName(j?.company_name ?? companyName)
      } catch (e) {
        toast({
          title: \"Save failed\",
          description: e instanceof Error ? e.message : \"Unknown error\",
          variant: \"destructive\",
        })
      }
    })
  }

  return (
    <div className=\"max-w-2xl w-full space-y-6\">
      <div>
        <h2 className=\"text-xl font-bold\">Company</h2>
        <p className=\"text-sm text-muted-foreground\">Broker-managed company details.</p>
      </div>
      <div className=\"space-y-2\">
        <Label htmlFor=\"company-name\">Company Name</Label>
        <Input
          id=\"company-name\"
          placeholder=\"e.g., Example Capital\"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>
      <div className=\"space-y-2\">
        <div className=\"flex items-baseline gap-2\">
          <Label htmlFor=\"company-logo\">Company Logo</Label>
          <span className=\"text-xs italic text-muted-foreground\">(used for white labeled documents)</span>
        </div>
        <div
          className=\"rounded-md border border-dashed p-6 text-center bg-background\"
          onDragOver={(e) => {
            e.preventDefault()
          }}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) setLogoFile(f)
          }}
        >
          <input
            ref={fileInputRef}
            id=\"company-logo\"
            type=\"file\"
            accept=\"image/*\"
            className=\"hidden\"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          <div className=\"text-sm mb-2\">{logoFile ? logoFile.name : \"Drag & drop image here, or click to choose a file\"}</div>
          <Button variant=\"secondary\" type=\"button\" onClick={() => fileInputRef.current?.click()}>
            Choose File
          </Button>
        </div>
      </div>
      <div className=\"pt-2\">
        <Button type=\"button\" onClick={onSubmit} disabled={isPending}>
          {isPending ? \"Saving...\" : \"Save\"}
        </Button>
      </div>
    </div>
  )
}


