"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Palette, Check, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Label } from "@repo/ui/shadcn/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { cn } from "@repo/lib/cn";

const themes = [
  {
    id: "default",
    name: "Default",
    description: "Clean and professional",
    colors: {
      primary: "hsl(222.2 47.4% 11.2%)",
      secondary: "hsl(210 40% 96.1%)",
      accent: "hsl(210 40% 96.1%)",
    },
  },
  {
    id: "blue",
    name: "Ocean Blue",
    description: "Calm and trustworthy",
    colors: {
      primary: "hsl(221.2 83.2% 53.3%)",
      secondary: "hsl(210 40% 96.1%)",
      accent: "hsl(221.2 83.2% 95%)",
    },
  },
  {
    id: "purple",
    name: "Royal Purple",
    description: "Creative and bold",
    colors: {
      primary: "hsl(262.1 83.3% 57.8%)",
      secondary: "hsl(270 40% 96.1%)",
      accent: "hsl(262.1 83.3% 95%)",
    },
  },
  {
    id: "green",
    name: "Forest Green",
    description: "Natural and growth-focused",
    colors: {
      primary: "hsl(142.1 76.2% 36.3%)",
      secondary: "hsl(138 40% 96.1%)",
      accent: "hsl(142.1 76.2% 95%)",
    },
  },
];

export function ThemesSettings() {
  const { organization, isLoaded } = useOrganization();
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      // Store theme preference in organization metadata
      const updateParams = {
        name: organization.name,
        slug: organization.slug || undefined,
        publicMetadata: {
          ...organization.publicMetadata,
          theme: selectedTheme,
        },
      } as any;
      await organization.update(updateParams);
    } catch (error) {
      console.error("Failed to save theme:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold">Themes</h2>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of your organization&apos;s interface
        </p>
      </div>

      {/* Theme Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Color Theme</CardTitle>
          <CardDescription>
            Choose a color theme for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={cn(
                  "relative rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50",
                  selectedTheme === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                {selectedTheme === theme.id && (
                  <div className="absolute right-3 top-3">
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </div>
                  </div>
                )}
                
                <div className="mb-3 flex items-center gap-2">
                  <Palette className="size-4 text-muted-foreground" />
                  <span className="font-medium">{theme.name}</span>
                </div>
                
                <p className="mb-3 text-sm text-muted-foreground">
                  {theme.description}
                </p>
                
                <div className="flex gap-2">
                  <div
                    className="size-8 rounded-md border"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="size-8 rounded-md border"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />
                  <div
                    className="size-8 rounded-md border"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveTheme} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme Preview</CardTitle>
          <CardDescription>
            See how your selected theme will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              Theme preview functionality coming soon. Your selected theme will be applied across the organization&apos;s interface.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
