"use client";

import { useCallback, useEffect, useState } from "react";
import { TinteEditor } from "@/components/tinte-editor";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { RotateCcw, Loader2 } from "lucide-react";

interface ThemeData {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export function ThemesSettings() {
  const { toast } = useToast();
  const [initialTheme, setInitialTheme] = useState<ThemeData | null>(null);
  const [hasCustomTheme, setHasCustomTheme] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/org/theme");
        if (res.ok) {
          const data = await res.json();
          if (data.light && Object.keys(data.light).length > 0) {
            setInitialTheme(data);
            setHasCustomTheme(true);
          }
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, []);

  const handleSave = useCallback(
    async (theme: ThemeData) => {
      try {
        const res = await fetch("/api/org/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(theme),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save theme");
        }

        // Update state to reflect saved theme
        setInitialTheme(theme);
        setHasCustomTheme(true);

        toast({
          title: "Theme saved",
          description: "Your organization's theme has been saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Error saving theme",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        throw error; // Re-throw so TinteEditor can show error state
      }
    },
    [toast]
  );

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/org/theme", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset theme");
      }

      // Remove dynamic theme styles
      const styleElement = document.getElementById("tinte-dynamic-theme");
      if (styleElement) {
        styleElement.remove();
      }

      toast({
        title: "Theme reset",
        description:
          "Your organization's theme has been reset to defaults. Refresh the page to see changes.",
      });

      setInitialTheme(null);
      setHasCustomTheme(false);
    } catch (error) {
      toast({
        title: "Error resetting theme",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Themes</h2>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of your organization&apos;s interface
          </p>
        </div>
        {hasCustomTheme && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={resetting}>
                {resetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset to Default
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to default theme?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset your organization&apos;s theme to the default
                  colors. This action cannot be undone.
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
        )}
      </div>

      {/* Inline Theme Editor */}
      <TinteEditor
        inline
        initialTheme={initialTheme ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
