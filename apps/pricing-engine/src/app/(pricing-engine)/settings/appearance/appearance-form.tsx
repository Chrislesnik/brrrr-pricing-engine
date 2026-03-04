"use client"

import { useCallback, useEffect, useState } from "react"
import { TinteEditor } from "@/components/tinte-editor"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RotateCcw, Loader2 } from "lucide-react"

interface ThemeData {
  light: Record<string, string>
  dark: Record<string, string>
}

export function AppearanceForm() {
  const { toast } = useToast()
  const [initialTheme, setInitialTheme] = useState<ThemeData | null>(null)
  const [hasCustomTheme, setHasCustomTheme] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  // Load saved theme on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/org/theme")
        if (res.ok) {
          const data = await res.json()
          if (data.light && Object.keys(data.light).length > 0) {
            setInitialTheme(data)
            setHasCustomTheme(true)
          }
        }
      } catch (error) {
        console.error("Failed to load theme:", error)
      } finally {
        setLoading(false)
      }
    }
    loadTheme()
  }, [])

  const handleSave = useCallback(async (theme: ThemeData) => {
    try {
      const res = await fetch("/api/org/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save theme")
      }
      
      // Update state to reflect saved theme
      setInitialTheme(theme)
      setHasCustomTheme(true)
      
      toast({
        title: "Theme saved",
        description: "Your organization's theme has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error saving theme",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      throw error // Re-throw so TinteEditor can show error state
    }
  }, [toast])

  const handleReset = useCallback(async () => {
    setResetting(true)
    try {
      const res = await fetch("/api/org/theme", { method: "DELETE" })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to reset theme")
      }
      
      // Remove dynamic theme styles
      const styleElement = document.getElementById("tinte-dynamic-theme")
      if (styleElement) {
        styleElement.remove()
      }
      
      toast({
        title: "Theme reset",
        description: "Your organization's theme has been reset to defaults. Refresh the page to see changes.",
      })
      
      setInitialTheme(null)
      setHasCustomTheme(false)
    } catch (error) {
      toast({
        title: "Error resetting theme",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setResetting(false)
    }
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-6">
        <h4 className="text-sm font-medium mb-2">Theme Editor</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Customize your organization&apos;s color theme using the Tinte editor.
          Changes will apply to all users in your organization.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">1</span>
            <span>Click the floating <strong className="text-foreground">Tinte button</strong> (bottom-right corner)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">2</span>
            <span>Use <strong className="text-foreground">AI</strong>, browse community themes, or edit colors manually</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">3</span>
            <span>Click <strong className="text-foreground">Save</strong> to persist changes for your organization</span>
          </li>
        </ul>
        
        {hasCustomTheme && (
          <div className="mt-4 pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={resetting}
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reset to Default Theme
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to default theme?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your organization&apos;s theme to the default colors. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Reset Theme
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* TinteEditor renders as a floating button + dialog portal */}
      <TinteEditor 
        initialTheme={initialTheme ?? undefined}
        onSave={handleSave}
      />
    </>
  )
}
