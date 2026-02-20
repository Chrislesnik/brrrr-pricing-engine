"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Loader2, Settings2, X } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Label } from "@repo/ui/shadcn/label";
import { Input } from "@repo/ui/shadcn/input";
import { Textarea } from "@repo/ui/shadcn/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import { IntegrationIcon } from "@/components/workflow-builder/ui/integration-icon";
import { updateIntegrationSettings } from "./integration-settings-actions";

interface IntegrationSettingsRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  tags: string[];
  active: boolean;
  level_global: boolean;
  level_org: boolean;
  level_individual: boolean;
  type: string;
  created_at: string;
}

interface IntegrationSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: IntegrationSettingsRow | null;
  onSaved: () => void;
}

const SYSTEM_LOGO_MAP: Record<string, { src: string; alt: string }> = {
  floify: { src: "/integrations/floify-logo.png", alt: "Floify" },
  xactus: { src: "/integrations/xactus-logo.png", alt: "Xactus" },
  clear: { src: "/integrations/clear-thomson-reuters-logo.png", alt: "Clear Capital" },
  nadlan: { src: "/integrations/nadlan-logo.png", alt: "Nadlan" },
};

function SheetIntegrationLogo({ slug }: { slug: string }) {
  const systemLogo = SYSTEM_LOGO_MAP[slug];
  if (systemLogo) {
    return (
      <div className="relative size-5">
        <Image
          src={systemLogo.src}
          alt={systemLogo.alt}
          fill
          sizes="20px"
          className="object-contain"
        />
      </div>
    );
  }
  return <IntegrationIcon integration={slug} className="size-5" />;
}

export function IntegrationSettingsSheet({
  open,
  onOpenChange,
  integration,
  onSaved,
}: IntegrationSettingsSheetProps) {
  const [saving, setSaving] = useState(false);

  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [levelGlobal, setLevelGlobal] = useState(false);
  const [levelOrg, setLevelOrg] = useState(false);
  const [levelIndividual, setLevelIndividual] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (integration) {
      setActive(integration.active);
      setDescription(integration.description ?? "");
      setLevelGlobal(integration.level_global);
      setLevelOrg(integration.level_org);
      setLevelIndividual(integration.level_individual);
      setTags(integration.tags ?? []);
      setTagInput("");
    }
  }, [integration]);

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = useCallback(async () => {
    if (!integration) return;
    setSaving(true);
    try {
      await updateIntegrationSettings({
        id: integration.id,
        active,
        description: description.trim() || null,
        level_global: levelGlobal,
        level_org: levelOrg,
        level_individual: levelIndividual,
        tags,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save integration settings:", err);
    } finally {
      setSaving(false);
    }
  }, [integration, active, description, levelGlobal, levelOrg, levelIndividual, tags, onSaved, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {integration && <SheetIntegrationLogo slug={integration.slug} />}
            {integration?.name ?? "Integration"} Settings
          </SheetTitle>
          <SheetDescription>
            {integration
              ? <>Configure settings for <code className="text-xs bg-muted px-1 py-0.5 rounded">{integration.slug}</code> ({integration.type})</>
              : "Select an integration to configure."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 px-1">
          {!integration ? (
            <p className="text-sm text-muted-foreground">No integration selected.</p>
          ) : (
            <div className="space-y-6">
              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="integration-active" className="text-sm font-medium">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable this integration platform-wide.
                  </p>
                </div>
                <Switch
                  id="integration-active"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="integration-description">Description</Label>
                <Textarea
                  id="integration-description"
                  placeholder="Brief description of this integration..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Level toggles */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Access Levels</Label>
                <p className="text-xs text-muted-foreground">
                  Control at which levels this integration can be configured.
                </p>
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="level-global" className="text-sm">Global</Label>
                      <p className="text-xs text-muted-foreground">
                        Shared across all organizations
                      </p>
                    </div>
                    <Switch
                      id="level-global"
                      checked={levelGlobal}
                      onCheckedChange={setLevelGlobal}
                    />
                  </div>
                  <div className="border-t" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="level-org" className="text-sm">Organization</Label>
                      <p className="text-xs text-muted-foreground">
                        Configured per organization
                      </p>
                    </div>
                    <Switch
                      id="level-org"
                      checked={levelOrg}
                      onCheckedChange={setLevelOrg}
                    />
                  </div>
                  <div className="border-t" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="level-individual" className="text-sm">User</Label>
                      <p className="text-xs text-muted-foreground">
                        Configured per individual user
                      </p>
                    </div>
                    <Switch
                      id="level-individual"
                      checked={levelIndividual}
                      onCheckedChange={setLevelIndividual}
                    />
                  </div>
                </div>
              </div>

              {/* Tags editor */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!integration || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
