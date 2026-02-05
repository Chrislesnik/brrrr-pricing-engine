"use client";

import { useEffect, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { ProgramsSettingsClient } from "./programs-settings-client";

interface ProgramRow {
  id: string;
  loan_type: "dscr" | "bridge" | string;
  internal_name: string;
  external_name: string;
  webhook_url: string | null;
  status: "active" | "inactive";
}

export function ProgramsSettings() {
  const { organization, isLoaded } = useOrganization();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrograms() {
      if (!isLoaded || !organization?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/programs?orgId=${organization.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch programs");
        }
        const data = await response.json();
        setPrograms(data.programs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load programs");
      } finally {
        setIsLoading(false);
      }
    }

    loadPrograms();
  }, [organization?.id, isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  return <ProgramsSettingsClient initialPrograms={programs} />;
}
