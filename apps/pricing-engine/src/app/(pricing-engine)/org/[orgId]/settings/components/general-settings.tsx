"use client";

import { useState } from "react";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";
import { Building2, Upload, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Separator } from "@repo/ui/shadcn/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";

export function GeneralSettings() {
  const { organization, isLoaded } = useOrganization();
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(organization?.name || "");
  const [slug, setSlug] = useState(organization?.slug || "");

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
