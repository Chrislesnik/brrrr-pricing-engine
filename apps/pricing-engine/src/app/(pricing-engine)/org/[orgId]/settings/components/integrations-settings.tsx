"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Settings2, Trash2, Loader2 } from "lucide-react";

import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { IntegrationIcon } from "@/components/workflow-builder/ui/integration-icon";
import { IntegrationSettingsSheet } from "./integration-settings-sheet";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const SYSTEM_LOGO_MAP: Record<string, { src: string; alt: string }> = {
  floify: { src: "/integrations/floify-logo.png", alt: "Floify" },
  xactus: { src: "/integrations/xactus-logo.png", alt: "Xactus" },
  clear: { src: "/integrations/clear-thomson-reuters-logo.png", alt: "Clear Capital" },
  nadlan: { src: "/integrations/nadlan-logo.png", alt: "Nadlan" },
};

function IntegrationLogo({ slug, name }: { slug: string; name: string }) {
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

export function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<IntegrationSettingsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationSettingsRow | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("integration_settings")
        .select("*")
        .order("name");

      setIntegrations((data ?? []) as IntegrationSettingsRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const getStatusBadge = (active: boolean) => {
    if (active) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getLevelBadges = (row: IntegrationSettingsRow) => {
    const badges: string[] = [];
    if (row.level_global) badges.push("Global");
    if (row.level_org) badges.push("Org");
    if (row.level_individual) badges.push("User");
    return badges;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading integrations...</span>
      </div>
    );
  }

  return (
    <section>
      <div className="max-w-4xl">
        <div className="space-y-2 border-b pb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            View and manage your connected services.
          </p>
        </div>

        <div className="mt-6">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Levels</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <IntegrationLogo
                          slug={integration.slug}
                          name={integration.name}
                        />
                        <div>
                          <span className="font-medium">{integration.name}</span>
                          {integration.description && (
                            <p className="text-xs text-muted-foreground">
                              {integration.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {integration.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {getLevelBadges(integration).map((level) => (
                          <Badge
                            key={level}
                            variant="outline"
                            className="text-xs"
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(integration.tags ?? []).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(integration.active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingIntegration(integration)}
                            >
                              <Settings2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Settings</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </div>

      <IntegrationSettingsSheet
        open={editingIntegration !== null}
        onOpenChange={(open) => {
          if (!open) setEditingIntegration(null);
        }}
        integration={editingIntegration}
        onSaved={loadIntegrations}
      />
    </section>
  );
}

export { IntegrationsSettings as SettingsIntegrations6 };
