"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import {
  ArrowLeft,
  Building2,
  Users,
  Globe,
  Loader2,
} from "lucide-react";
import { cn } from "@repo/lib/cn";

// Import the tab content components
import { GeneralSettings } from "./components/general-settings";
import { MembersSettings } from "./components/members-settings";
import { DomainsSettings } from "./components/domains-settings";

type SettingsTab = "general" | "members" | "domains";

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: typeof Building2;
  description: string;
}

const settingsNavItems: NavItem[] = [
  {
    id: "general",
    label: "General",
    icon: Building2,
    description: "Organization profile and settings",
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    description: "Manage organization members",
  },
  {
    id: "domains",
    label: "Domains",
    icon: Globe,
    description: "Verified domains and SSO",
  },
];

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const orgIdFromUrl = params.orgId as string;
  
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { setActive } = useOrganizationList();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isValidating, setIsValidating] = useState(true);

  // Validate that the URL org matches the active org, or switch to it
  useEffect(() => {
    if (!orgLoaded || !orgIdFromUrl) return;

    // If there's no organization context yet, wait
    if (!organization) {
      setIsValidating(false);
      return;
    }

    // If URL org matches active org, we're good
    if (organization.id === orgIdFromUrl) {
      setIsValidating(false);
      return;
    }

    // URL org doesn't match active org - redirect to correct URL
    router.replace(`/org/${organization.id}/settings`);
  }, [orgLoaded, organization, orgIdFromUrl, router, setActive]);

  if (!orgLoaded || isValidating) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading organization...</span>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="text-center">
          <Building2 className="mx-auto size-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-medium">No organization selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select an organization to view settings
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your organization profile, members, and preferences.
          </p>
        </div>

        {/* Main content with sidebar */}
        <div className="flex gap-8">
          {/* Left sidebar navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-4">
              {/* Organization info */}
              <div className="mb-6 flex items-center gap-3 rounded-lg border bg-card p-4">
                {organization.imageUrl ? (
                  <Image
                    src={organization.imageUrl}
                    alt={organization.name}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{organization.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {organization.slug || "organization"}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {settingsNavItems.map((item) => {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        activeTab === item.id
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "members" && <MembersSettings />}
            {activeTab === "domains" && <DomainsSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
