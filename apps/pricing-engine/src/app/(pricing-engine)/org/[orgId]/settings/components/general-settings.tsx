"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";
import { Building2, Upload, Loader2, FileText, X, Sun, Moon } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Separator } from "@repo/ui/shadcn/separator";
import { Switch } from "@repo/ui/shadcn/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { getOrgInternalFlag, setOrgInternalFlag } from "./metadata-actions";

export function GeneralSettings() {
  const { organization, isLoaded } = useOrganization();
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(organization?.name || "");
  const [slug, setSlug] = useState(organization?.slug || "");
  const [isInternal, setIsInternal] = useState(false);
  const [isInternalLoading, setIsInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isSavingInternal, startInternalTransition] = useTransition();

  // Whitelabel logo state (light mode)
  const [lightLogoUrl, setLightLogoUrl] = useState<string | null>(null);
  const [lightLogoFile, setLightLogoFile] = useState<File | null>(null);
  const [lightPreviewUrl, setLightPreviewUrl] = useState<string | null>(null);
  const [isLightDragOver, setIsLightDragOver] = useState(false);
  const lightFileInputRef = useRef<HTMLInputElement>(null);

  // Whitelabel logo state (dark mode)
  const [darkLogoUrl, setDarkLogoUrl] = useState<string | null>(null);
  const [darkLogoFile, setDarkLogoFile] = useState<File | null>(null);
  const [darkPreviewUrl, setDarkPreviewUrl] = useState<string | null>(null);
  const [isDarkDragOver, setIsDarkDragOver] = useState(false);
  const darkFileInputRef = useRef<HTMLInputElement>(null);

  // Shared whitelabel state
  const [isWhitelabelLoading, setIsWhitelabelLoading] = useState(true);
  const [isWhitelabelSaving, setIsWhitelabelSaving] = useState(false);
  const [whitelabelError, setWhitelabelError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    setName(organization.name || "");
    setSlug(organization.slug || "");
  }, [organization]);

  useEffect(() => {
    let isMounted = true;
    async function loadInternalFlag() {
      setIsInternalLoading(true);
      setInternalError(null);
      try {
        const result = await getOrgInternalFlag();
        if (isMounted) {
          setIsInternal(!!result.isInternal);
        }
      } catch (error) {
        if (isMounted) {
          setInternalError(
            error instanceof Error ? error.message : "Failed to load flag."
          );
        }
      } finally {
        if (isMounted) setIsInternalLoading(false);
      }
    }
    if (organization) {
      loadInternalFlag();
    }
    return () => {
      isMounted = false;
    };
  }, [organization]);

  // Load whitelabel logos on mount
  useEffect(() => {
    let isMounted = true;
    async function loadWhitelabelLogos() {
      setIsWhitelabelLoading(true);
      setWhitelabelError(null);
      try {
        const res = await fetch("/api/org/whitelabel-logo");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load logos");
        if (isMounted) {
          setLightLogoUrl(data.light_url || null);
          setDarkLogoUrl(data.dark_url || null);
        }
      } catch (error) {
        if (isMounted) {
          setWhitelabelError(
            error instanceof Error ? error.message : "Failed to load logos."
          );
        }
      } finally {
        if (isMounted) setIsWhitelabelLoading(false);
      }
    }
    if (organization) {
      loadWhitelabelLogos();
    }
    return () => {
      isMounted = false;
    };
  }, [organization]);

  // Build/revoke preview URL for light mode logo
  useEffect(() => {
    if (!lightLogoFile) {
      setLightPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(lightLogoFile);
    setLightPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [lightLogoFile]);

  // Build/revoke preview URL for dark mode logo
  useEffect(() => {
    if (!darkLogoFile) {
      setDarkPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(darkLogoFile);
    setDarkPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [darkLogoFile]);

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!organization) return;

    setIsUpdating(true);
    try {
      await organization.update({
        name,
        slug,
      });
    } catch (error) {
      console.error("Failed to update organization:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    try {
      await organization.setLogo({ file });
    } catch (error) {
      console.error("Failed to upload logo:", error);
    }
  };

  const handleWhitelabelLogosSave = async () => {
    if (!lightLogoFile && !darkLogoFile) return;
    
    setIsWhitelabelSaving(true);
    setWhitelabelError(null);
    
    try {
      const formData = new FormData();
      if (lightLogoFile) formData.set("logo_light", lightLogoFile);
      if (darkLogoFile) formData.set("logo_dark", darkLogoFile);
      
      const res = await fetch("/api/org/whitelabel-logo", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save logos");
      
      setLightLogoUrl(data.light_url);
      setDarkLogoUrl(data.dark_url);
      setLightLogoFile(null);
      setDarkLogoFile(null);
    } catch (error) {
      setWhitelabelError(
        error instanceof Error ? error.message : "Failed to save logos."
      );
    } finally {
      setIsWhitelabelSaving(false);
    }
  };

  const handleDeleteLogo = async (mode: "light" | "dark") => {
    setIsWhitelabelSaving(true);
    setWhitelabelError(null);
    
    try {
      const res = await fetch(`/api/org/whitelabel-logo?mode=${mode}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete logo");
      
      if (mode === "light") {
        setLightLogoUrl(null);
        setLightLogoFile(null);
      } else {
        setDarkLogoUrl(null);
        setDarkLogoFile(null);
      }
    } catch (error) {
      setWhitelabelError(
        error instanceof Error ? error.message : "Failed to delete logo."
      );
    } finally {
      setIsWhitelabelSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization profile and settings
        </p>
      </div>

      {/* Organization Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Profile</CardTitle>
          <CardDescription>
            Update your organization&apos;s public profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {organization.imageUrl ? (
                <Image
                  src={organization.imageUrl}
                  alt={organization.name}
                  width={80}
                  height={80}
                  className="rounded-xl"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-xl bg-muted">
                  <Building2 className="size-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="mr-2 size-4" />
                    Upload logo
                  </span>
                </Button>
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                aria-label="Upload organization logo"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 256x256px
              </p>
            </div>
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="org-slug">Organization slug</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="organization-slug"
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and API calls
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Branding</CardTitle>
          <CardDescription>
            Logos used for white-labeling documents like term sheets and proposals.
            Upload separate logos for light and dark mode themes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isWhitelabelLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Light Mode Logo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-amber-500" />
                    <Label className="text-sm font-medium">Light Mode Logo</Label>
                  </div>
                  <div
                    className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                      isLightDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 bg-white dark:bg-zinc-100"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsLightDragOver(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsLightDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsLightDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsLightDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        setLightLogoFile(file);
                      }
                    }}
                  >
                    <input
                      ref={lightFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-label="Upload light mode logo"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLightLogoFile(file);
                      }}
                    />

                    {lightPreviewUrl ? (
                      <div className="relative mx-auto mb-3 inline-block">
                        <img
                          src={lightPreviewUrl}
                          alt="Selected light mode logo"
                          className="max-h-16 rounded object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setLightLogoFile(null)}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                          aria-label="Remove selected file"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : lightLogoUrl ? (
                      <div className="relative mx-auto mb-3 inline-block">
                        <img
                          src={lightLogoUrl}
                          alt="Current light mode logo"
                          className="max-h-16 rounded object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteLogo("light")}
                          disabled={isWhitelabelSaving}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          aria-label="Delete logo"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-zinc-100">
                        <FileText className="size-6 text-zinc-400" />
                      </div>
                    )}

                    <p className="mb-2 text-xs text-zinc-500">
                      {lightLogoFile ? lightLogoFile.name : "For light backgrounds"}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lightFileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Upload className="mr-1.5 size-3" />
                      Choose file
                    </Button>
                  </div>
                </div>

                {/* Dark Mode Logo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Moon className="size-4 text-indigo-400" />
                    <Label className="text-sm font-medium">Dark Mode Logo</Label>
                  </div>
                  <div
                    className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                      isDarkDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 bg-zinc-900 dark:bg-zinc-900"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDarkDragOver(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsDarkDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDarkDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDarkDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        setDarkLogoFile(file);
                      }
                    }}
                  >
                    <input
                      ref={darkFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-label="Upload dark mode logo"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setDarkLogoFile(file);
                      }}
                    />

                    {darkPreviewUrl ? (
                      <div className="relative mx-auto mb-3 inline-block">
                        <img
                          src={darkPreviewUrl}
                          alt="Selected dark mode logo"
                          className="max-h-16 rounded object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setDarkLogoFile(null)}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                          aria-label="Remove selected file"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : darkLogoUrl ? (
                      <div className="relative mx-auto mb-3 inline-block">
                        <img
                          src={darkLogoUrl}
                          alt="Current dark mode logo"
                          className="max-h-16 rounded object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteLogo("dark")}
                          disabled={isWhitelabelSaving}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          aria-label="Delete logo"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-zinc-800">
                        <FileText className="size-6 text-zinc-500" />
                      </div>
                    )}

                    <p className="mb-2 text-xs text-zinc-400">
                      {darkLogoFile ? darkLogoFile.name : "For dark backgrounds"}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => darkFileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Upload className="mr-1.5 size-3" />
                      Choose file
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Recommended: PNG or SVG with transparent background, at least 200px wide.
                If you only upload one logo, it will be used for both themes.
              </p>

              {whitelabelError && (
                <p className="text-sm text-destructive">{whitelabelError}</p>
              )}

              {(lightLogoFile || darkLogoFile) && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleWhitelabelLogosSave}
                    disabled={isWhitelabelSaving}
                  >
                    {isWhitelabelSaving && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Save logos
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Access</CardTitle>
          <CardDescription>
            Mark this organization as internal for policy evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Internal organization</p>
              <p className="text-sm text-muted-foreground">
                Enables internal-user policy matching in JWT and RLS.
              </p>
            </div>
            <Switch
              aria-label="Internal organization"
              checked={isInternal}
              disabled={isInternalLoading || isSavingInternal}
              onCheckedChange={(checked) => {
                setIsInternal(checked);
                startInternalTransition(async () => {
                  try {
                    await setOrgInternalFlag({ isInternal: checked });
                  } catch (error) {
                    setInternalError(
                      error instanceof Error
                        ? error.message
                        : "Failed to update flag."
                    );
                    setIsInternal(!checked);
                  }
                });
              }}
            />
          </div>
          {internalError && (
            <p className="text-sm text-destructive">{internalError}</p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Leave organization</p>
              <p className="text-sm text-muted-foreground">
                Remove yourself from this organization
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Leave
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
