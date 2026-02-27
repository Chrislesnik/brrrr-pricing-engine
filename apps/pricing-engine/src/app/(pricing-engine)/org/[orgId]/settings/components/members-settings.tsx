"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  UserPlus,
  MoreHorizontal,
  Loader2,
  User,
} from "lucide-react";
import { isPrivilegedRole } from "@/lib/utils";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Card,
  CardContent,
} from "@repo/ui/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
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
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import {
  getOrgMemberRoles,
  setOrgMemberRole,
  getActiveMemberRoleOptions,
} from "./metadata-actions";

export function MembersSettings() {
  const { organization, isLoaded, memberships } = useOrganization({
    memberships: {
      infinite: true,
      keepPreviousData: true,
    },
  });
  const { user } = useUser();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberRoles, setMemberRoles] = useState<Record<string, string | null>>(
    {}
  );
  const [memberRoleOptions, setMemberRoleOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [memberRoleError, setMemberRoleError] = useState<string | null>(null);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [isMemberRoleLoading, setIsMemberRoleLoading] = useState(true);
  const [isSavingMemberRole, startMemberRoleTransition] = useTransition();

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;
    async function loadMemberRoles() {
      setIsMemberRoleLoading(true);
      setMemberRoleError(null);
      try {
        const [rolesResult, roleOptionsResult] = await Promise.all([
          getOrgMemberRoles(),
          getActiveMemberRoleOptions(),
        ]);
        if (isMounted) {
          setMemberRoles(rolesResult.roles ?? {});
          setMemberRoleOptions(roleOptionsResult);
        }
      } catch (error) {
        if (isMounted) {
          setMemberRoleError(
            error instanceof Error
              ? error.message
              : "Failed to load member roles."
          );
        }
      } finally {
        if (isMounted) setIsMemberRoleLoading(false);
      }
    }
    loadMemberRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  const membersList = memberships?.data || [];
  const filteredMembers = membersList.filter((m) => {
    const name = `${m.publicUserData?.firstName || ""} ${m.publicUserData?.lastName || ""}`.toLowerCase();
    const email = m.publicUserData?.identifier?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const handleRemoveMember = async (membershipId: string) => {
    setRemovalError(null);
    try {
      const memberToRemove = membersList.find((m) => m.id === membershipId);
      if (!memberToRemove) return;

      const isSelf =
        memberToRemove.publicUserData?.userId === user?.id;
      if (isSelf) {
        const otherAdmins = membersList.filter(
          (m) => m.id !== membershipId && isPrivilegedRole(m.role)
        );
        if (otherAdmins.length === 0) {
          setRemovalError(
            "You cannot leave the organization because you are the only Admin/Owner. " +
              "Promote another member to Admin first."
          );
          return;
        }
      }

      await memberToRemove.destroy();
    } catch (error) {
      setRemovalError(
        error instanceof Error ? error.message : "Failed to remove member."
      );
    }
  };

  const handleUpdateRole = async (
    membershipId: string,
    newRole: string
  ) => {
    try {
      const memberToUpdate = membersList.find((m) => m.id === membershipId);
      if (memberToUpdate) {
        await memberToUpdate.update({ role: newRole as "org:admin" | "org:member" });
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleUpdateMemberRole = (clerkUserId: string, newRole: string) => {
    setMemberRoleError(null);
    startMemberRoleTransition(async () => {
      try {
        const normalized = newRole || null;
        await setOrgMemberRole({ clerkUserId, memberRole: normalized });
        setMemberRoles((prev) => ({
          ...prev,
          [clerkUserId]: normalized,
        }));
      } catch (error) {
        setMemberRoleError(
          error instanceof Error
            ? error.message
            : "Failed to update member role."
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this organization
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="mr-2 size-4" />
          Invite member
        </Button>
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onSuccess={() => memberships?.revalidate()}
          orgName={organization.name}
          orgReadOnly
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="secondary">{membersList.length} members</Badge>
      </div>

      {memberRoleError && (
        <p className="text-sm text-destructive">{memberRoleError}</p>
      )}
      {removalError && (
        <p className="text-sm text-destructive">{removalError}</p>
      )}

      {/* Members table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">User</TableHead>
                <TableHead className="w-[15%]">Joined</TableHead>
                <TableHead className="w-[15%]">Role</TableHead>
                <TableHead className="w-[15%]">Member Role</TableHead>
                <TableHead className="w-[15%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const isCurrentUser =
                  member.publicUserData?.userId === user?.id;
                const clerkUserId = member.publicUserData?.userId || "";
                const memberRoleValue =
                  (clerkUserId && memberRoles[clerkUserId]) || "member";

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.publicUserData?.imageUrl ? (
                          <Image
                            src={member.publicUserData.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                            <User className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {member.publicUserData?.firstName}{" "}
                            {member.publicUserData?.lastName}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.publicUserData?.identifier}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.id, value)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="org:member">Member</SelectItem>
                          <SelectItem value="org:admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={memberRoleValue || ""}
                        onValueChange={(value) =>
                          clerkUserId &&
                          handleUpdateMemberRole(clerkUserId, value)
                        }
                        disabled={
                          !clerkUserId ||
                          isMemberRoleLoading ||
                          isSavingMemberRole
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {memberRoleOptions.length === 0 ? (
                            <SelectItem value="_none" disabled>
                              No roles configured
                            </SelectItem>
                          ) : (
                            memberRoleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            {isCurrentUser
                              ? "Leave organization"
                              : "Remove from organization"}
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
    </div>
  );
}
