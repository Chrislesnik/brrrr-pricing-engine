"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Building2, Settings } from "lucide-react";
import {
  useOrganization,
  useOrganizationList,
  CreateOrganization,
} from "@clerk/nextjs";
import type { OrganizationResource } from "@clerk/types";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/shadcn/sidebar";
import { Skeleton } from "@repo/ui/shadcn/skeleton";

export function TeamSwitcherV2() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  
  // Prevent hydration mismatch by only rendering dynamic content after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // State for managing modals and dropdown
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get current organization and user's role
  const currentOrg = organization;
  const currentMembership = userMemberships?.data?.find(
    (m) => m.organization.id === currentOrg?.id
  );
  const userRole = currentMembership?.role || "Member";

  // Handle create organization - open modal
  const handleCreateOrganization = () => {
    setShowCreateOrg(true);
  };

  // Handle organization switching with proper error handling
  const handleSetActive = (org: OrganizationResource) => {
    if (setActive) {
      setActive({ organization: org });
    }
  };

  // Handle opening organization profile - navigate to dedicated page with org ID
  const handleOpenOrgProfile = (event: React.MouseEvent, orgId: string) => {
    event.stopPropagation(); // Prevent dropdown item click
    setDropdownOpen(false); // Close dropdown
    router.push(`/org/${orgId}/settings`);
  };

  // Show skeleton during SSR/initial mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="h-12 flex items-center gap-2 px-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // If no organization, show create organization button
  if (!currentOrg) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="h-12 rounded-lg hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            onClick={handleCreateOrganization}
          >
            {/* Same structure as nav-user.tsx but for "Create Organization" */}
            <div className="size-8 flex items-center justify-center rounded-lg border shrink-0 overflow-hidden">
              <Building2 className="size-5" />
            </div>
            <div className="grid flex-1 text-left">
              <span className="truncate text-sm font-medium">
                Create Organization
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Get started
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="h-12 rounded-lg hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="org-switcher"
              >
                {/* EXACT same structure as nav-user.tsx - just with organization data */}

                {/* Organization icon - same size as nav-user avatar */}
                <div className="h-8 w-8 flex items-center justify-center rounded-lg border shrink-0 overflow-hidden">
                  {currentOrg.imageUrl ? (
                    <Image
                      src={currentOrg.imageUrl}
                      alt={currentOrg.name}
                      width={60}
                      height={60}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="size-5" />
                  )}
                </div>
                <div className="grid flex-1 text-left">
                  <span className="truncate text-sm font-medium">
                    {currentOrg.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userRole}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {userMemberships?.data?.map((membership) => (
                <DropdownMenuItem
                  key={membership.organization.id}
                  onClick={() => handleSetActive(membership.organization)}
                  className="gap-2 p-2 flex items-center"
                >
                  <div className="size-6 flex items-center justify-center rounded-md border shrink-0 overflow-hidden">
                    {membership.organization.imageUrl ? (
                      <Image
                        src={membership.organization.imageUrl}
                        alt={membership.organization.name}
                        width={24}
                        height={24}
                        className="size-6 rounded-md object-cover"
                      />
                    ) : (
                      <Building2 className="size-5" />
                    )}
                  </div>
                  <span className="flex-1 truncate">
                    {membership.organization.name}
                  </span>
                  <button
                    onClick={(e) => handleOpenOrgProfile(e, membership.organization.id)}
                    className="ml-auto p-1 hover:bg-accent rounded-sm"
                    title="Organization settings"
                  >
                    <Settings className="size-3" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={handleCreateOrganization}
              >
                <div className="size-6 flex items-center justify-center rounded-md border shrink-0">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Create organization
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Organization Modal - using shadcn Dialog for proper portal cleanup */}
      <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <CreateOrganization
            afterCreateOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                modalBackdrop: "hidden",
                card: "shadow-none border-0",
              },
            }}
          />
        </DialogContent>
      </Dialog>

    </>
  );
}
