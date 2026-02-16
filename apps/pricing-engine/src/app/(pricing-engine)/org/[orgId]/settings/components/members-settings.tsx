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
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
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
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("org:member");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberRoles, setMemberRoles] = useState<Record<string, string | null>>(
    {}
  );
  const [memberRoleOptions, setMemberRoleOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [memberRoleError, setMemberRoleError] = useState<string | null>(null);
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

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await organization.inviteMember({
        emailAddress: inviteEmail,
        role: inviteRole as "org:admin" | "org:member",
      });
      setInviteEmail("");
      setShowInviteDialog(false);
    } catch (error) {
      console.error("Failed to invite member:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    try {
      const memberToRemove = membersList.find((m) => m.id === membershipId);
      if (memberToRemove) {
        await memberToRemove.destroy();
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
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
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 size-4" />
              Invite member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {organization.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org:member">Member</SelectItem>
                    <SelectItem value="org:admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isInviting}>
                  {isInviting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Send invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                        disabled={isCurrentUser}
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
                          isCurrentUser ||
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
                      {!isCurrentUser && (
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
                              Remove from organization
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
