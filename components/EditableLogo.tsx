"use client"

import React, { useRef, useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface EditableLogoProps {
  url: string
  onLogoChange?: (url: string | null) => void
  readOnly?: boolean
  maxHeight?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * EditableLogo - A term sheet logo component that can be edited inline.
 * When not in readOnly mode, displays an orange editable border and allows
 * clicking to delete or replace the logo via drag-and-drop.
 */
export function EditableLogo({
  url,
  onLogoChange,
  readOnly = false,
  maxHeight = 52,
  className,
  style,
}: EditableLogoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up preview URL on unmount or when changed
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (file: File) => {
    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      return
    }

    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file)
    
    // Convert to data URL for PDF compatibility
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL(file.type || "image/png")
        onLogoChange?.(dataUrl)
        setIsOpen(false)
        setPreviewUrl(null)
      }
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => {
      // Fallback to object URL if canvas conversion fails
      onLogoChange?.(objectUrl)
      setIsOpen(false)
      setPreviewUrl(null)
    }
    img.src = objectUrl
    setPreviewUrl(objectUrl)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDelete = () => {
    onLogoChange?.(null)
    setIsOpen(false)
  }

  // If no URL or readOnly, render as simple image
  if (!url || url.startsWith("{{")) {
    if (readOnly) return null
    // Show placeholder for adding logo when editable
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="ts-edit"
            style={{
              display: "inline-block",
              border: "1px dashed #f59e0b",
              background: "rgba(245, 158, 11, 0.06)",
              borderRadius: 4,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 10,
              color: "#f59e0b",
              ...style,
            }}
          >
            + Add Logo
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-3"
          style={{ backgroundColor: "#fff", color: "#000" }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <div className="text-sm font-medium" style={{ color: "#000" }}>Add Logo</div>
            <div
              className={`rounded-md border-2 border-dashed p-4 text-center transition-colors ${
                isDragOver ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}
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
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              <div className="text-xs text-gray-500 mb-2">
                Drag & drop image here
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundColor: "#f3f4f6", color: "#000" }}
              >
                Choose File
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Read-only mode: simple image
  if (readOnly || !onLogoChange) {
    return (
      <img
        src={url}
        crossOrigin="anonymous"
        alt="Logo"
        className={className}
        style={{
          height: "100%",
          maxHeight,
          width: "auto",
          objectFit: "contain",
          display: "block",
          ...style,
        }}
      />
    )
  }

  // Editable mode: image with orange border and click handler
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ts-edit"
          style={{
            display: "inline-block",
            border: "1px dashed rgba(245, 158, 11, 0.6)",
            background: "rgba(245, 158, 11, 0.06)",
            borderRadius: 4,
            padding: 2,
            cursor: "pointer",
            ...style,
          }}
        >
          <img
            src={url}
            crossOrigin="anonymous"
            alt="Logo"
            className={className}
            style={{
              height: "100%",
              maxHeight: maxHeight - 4,
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        style={{ backgroundColor: "#fff", color: "#000" }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: "#000" }}>Edit Logo</div>
          
          {/* Current logo preview */}
          <div className="flex justify-center p-2 bg-gray-50 rounded-md">
            <img
              src={previewUrl || url}
              alt="Current logo"
              style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }}
            />
          </div>

          {/* Drag and drop area */}
          <div
            className={`rounded-md border-2 border-dashed p-3 text-center transition-colors ${
              isDragOver ? "border-orange-500 bg-orange-50" : "border-gray-300"
            }`}
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
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
            <div className="text-xs text-gray-500 mb-2">
              Drag & drop to replace
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: "#f3f4f6", color: "#000" }}
            >
              Choose File
            </Button>
          </div>

          {/* Delete button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleDelete}
          >
            Remove Logo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default EditableLogo
