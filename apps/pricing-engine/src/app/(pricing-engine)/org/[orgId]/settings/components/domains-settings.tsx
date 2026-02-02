"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import type { OrganizationDomainResource } from "@clerk/types";
import {
  Globe,
  Plus,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";

export function DomainsSettings() {
  const { organization, isLoaded, domains } = useOrganization({
    domains: {
      infinite: true,
    },
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const domainsList = domains?.data || [];

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    setIsAdding(true);
    try {
      await organization.createDomain(newDomain);
      setNewDomain("");
      setShowAddDialog(false);
    } catch (error) {
      console.error("Failed to add domain:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    try {
      const domainToRemove = domainsList.find((d) => d.id === domainId);
      if (domainToRemove) {
        await domainToRemove.delete();
      }
    } catch (error) {
      console.error("Failed to remove domain:", error);
    }
  };

  const getVerificationStatus = (domain: OrganizationDomainResource) => {
    if (domain.verification?.status === "verified") {
      return {
        icon: CheckCircle2,
        label: "Verified",
        variant: "default" as const,
        className: "text-green-600",
      };
    }
    return {
      icon: AlertCircle,
      label: "Unverified",
      variant: "outline" as const,
      className: "text-muted-foreground",
    };
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Verified Domains</h2>
          <p className="text-sm text-muted-foreground">
            Manage domains for automatic member enrollment and SSO
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a domain</DialogTitle>
              <DialogDescription>
                Add a domain to allow automatic member enrollment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain-name">Domain</Label>
                <Input
                  id="domain-name"
                  placeholder="company.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You&apos;ll need to verify ownership by adding a DNS record
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={isAdding}>
                  {isAdding && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Add domain
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            What are verified domains?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Verified domains allow users with email addresses from these domains
            to automatically join your organization or request access. This
            makes it easier to onboard team members.
          </p>
        </CardContent>
      </Card>

      {/* Domains table */}
      {domainsList.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollment mode</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainsList.map((domain) => {
                  const status = getVerificationStatus(domain);
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        {domain.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={`size-4 ${status.className}`}
                          />
                          <span className={status.className}>
                            {status.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {domain.enrollmentMode === "automatic_invitation"
                            ? "Auto invite"
                            : domain.enrollmentMode === "automatic_suggestion"
                              ? "Auto suggest"
                              : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveDomain(domain.id)}
                            >
                              Remove domain
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="size-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium">No domains added</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a domain to enable automatic member enrollment
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 size-4" />
              Add your first domain
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
