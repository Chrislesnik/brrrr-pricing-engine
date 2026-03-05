"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import {
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  Info,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
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
} from "@repo/ui/shadcn/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/shadcn/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/shadcn/tooltip";
import {
  createOrganizationAction,
  searchClerkUsersAction,
  addExistingUserToOrgAction,
  createUserAndAddToOrgAction,
  inviteUserToOrgAction,
  getOrgRolesAction,
  getMemberRoleOptionsAction,
} from "./create-org-wizard-actions";

type ClerkUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string;
};

type RoleOption = { value: string; label: string };

interface CreateOrgWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgWizard({ open, onOpenChange }: CreateOrgWizardProps) {
  const { setActive } = useOrganizationList();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [membersAdded, setMembersAdded] = useState(0);

  // Step 1 state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgType, setOrgType] = useState<"external" | "internal">("external");

  // Step 2 shared state
  const [createdOrgId, setCreatedOrgId] = useState("");
  const [createdOrgName, setCreatedOrgName] = useState("");
  const [orgRoleOptions, setOrgRoleOptions] = useState<RoleOption[]>([]);
  const [memberRoleOptions, setMemberRoleOptions] = useState<RoleOption[]>([]);

  // Existing User tab
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ClerkUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClerkUser | null>(null);
  const [existingUserOrgRole, setExistingUserOrgRole] = useState("org:member");
  const [existingUserMemberRole, setExistingUserMemberRole] = useState("");

  // Create User tab
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [skipPasswordChecks, setSkipPasswordChecks] = useState(false);
  const [createUserOrgRole, setCreateUserOrgRole] = useState("org:member");
  const [createUserMemberRole, setCreateUserMemberRole] = useState("");

  // Invite User tab
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgRole, setInviteOrgRole] = useState("org:member");
  const [inviteMemberRole, setInviteMemberRole] = useState("");
  const [inviteExpiryDays, setInviteExpiryDays] = useState("30");

  const resetAll = useCallback(() => {
    setStep(1);
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
    setMembersAdded(0);
    setName("");
    setSlug("");
    setOrgType("external");
    setCreatedOrgId("");
    setCreatedOrgName("");
    setUserSearch("");
    setSearchResults([]);
    setSelectedUser(null);
    setExistingUserOrgRole("org:member");
    setExistingUserMemberRole("");
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("");
    setSkipPasswordChecks(false);
    setCreateUserOrgRole("org:member");
    setCreateUserMemberRole("");
    setInviteEmail("");
    setInviteOrgRole("org:member");
    setInviteMemberRole("");
    setInviteExpiryDays("30");
  }, []);

  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  // Load role options when entering step 2
  useEffect(() => {
    if (step !== 2 || !createdOrgId) return;

    if (orgRoleOptions.length === 0) {
      getOrgRolesAction()
        .then(setOrgRoleOptions)
        .catch(() => {
          setOrgRoleOptions([
            { value: "org:member", label: "Member" },
            { value: "org:admin", label: "Admin" },
          ]);
        });
    }

    if (memberRoleOptions.length === 0) {
      getMemberRoleOptionsAction(createdOrgId)
        .then(setMemberRoleOptions)
        .catch(() => setMemberRoleOptions([]));
    }
  }, [step, createdOrgId, orgRoleOptions.length, memberRoleOptions.length]);

  const autoSlug = useCallback((orgName: string) => {
    return orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === autoSlug(name)) {
      setSlug(autoSlug(value));
    }
  };

  // Step 1: Create organization
  const step1Valid = name.trim().length > 0 && slug.trim().length > 0;

  const handleCreateOrg = async () => {
    if (!step1Valid) {
      setError("Organization name and slug are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createOrganizationAction({
        name: name.trim(),
        slug: slug.trim(),
        isInternal: orgType === "internal",
      });
      setCreatedOrgId(result.clerkOrgId);
      setCreatedOrgName(result.name);
      if (setActive) {
        await setActive({ organization: result.clerkOrgId });
      }
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // User search with debounce
  useEffect(() => {
    if (userSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchClerkUsersAction(userSearch);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Step 2 handlers
  const handleAddExistingUser = async () => {
    if (!selectedUser) return;
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await addExistingUserToOrgAction({
        orgId: createdOrgId,
        userId: selectedUser.id,
        role: existingUserOrgRole,
        memberRole: existingUserMemberRole,
      });
      setMembersAdded((c) => c + 1);
      setSuccess(
        `Added ${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""} to ${createdOrgName}`,
      );
      setSelectedUser(null);
      setUserSearch("");
      setSearchResults([]);
      setExistingUserMemberRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    if (
      !newFirstName.trim() ||
      !newLastName.trim() ||
      !newEmail.trim() ||
      !newPhone.trim() ||
      !newPassword
    ) {
      setError("First name, last name, email, phone, and password are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await createUserAndAddToOrgAction({
        orgId: createdOrgId,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        password: newPassword,
        role: createUserOrgRole,
        memberRole: createUserMemberRole,
        skipPasswordChecks,
      });
      setMembersAdded((c) => c + 1);
      setSuccess(`Created and added ${newEmail} to ${createdOrgName}`);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setSkipPasswordChecks(false);
      setCreateUserMemberRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      setError("Email is required.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await inviteUserToOrgAction({
        orgId: createdOrgId,
        email: inviteEmail.trim(),
        role: inviteOrgRole,
        memberRole: inviteMemberRole,
        expiresInDays: parseInt(inviteExpiryDays, 10) || 30,
      });
      setMembersAdded((c) => c + 1);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteMemberRole("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExternal = orgType === "external";

  // Auto-select "broker" for external orgs when member role options load
  useEffect(() => {
    if (!isExternal || memberRoleOptions.length === 0) return;
    const brokerOption = memberRoleOptions.find(
      (r) => r.value.toLowerCase() === "broker",
    );
    if (brokerOption) {
      const brokerVal = brokerOption.value;
      if (!existingUserMemberRole) setExistingUserMemberRole(brokerVal);
      if (!createUserMemberRole) setCreateUserMemberRole(brokerVal);
      if (!inviteMemberRole) setInviteMemberRole(brokerVal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExternal, memberRoleOptions]);

  const orgRoleSelect = (
    value: string,
    onChange: (v: string) => void,
    id: string,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>Organization Role</Label>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              Scopes intra-organization permissions. Controls what a member
              can manage within this organization (e.g. admin vs. member
              access to settings, billing, and member management).
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {orgRoleOptions.length > 0
            ? orgRoleOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                  {r.value === "org:member" && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      Default
                    </span>
                  )}
                </SelectItem>
              ))
            : [
                <SelectItem key="org:member" value="org:member">
                  Member
                </SelectItem>,
                <SelectItem key="org:admin" value="org:admin">
                  Admin
                </SelectItem>,
              ]}
        </SelectContent>
      </Select>
    </div>
  );

  const filteredMemberRoleOptions = isExternal
    ? memberRoleOptions.filter(
        (r) => r.value.toLowerCase() === "broker",
      )
    : memberRoleOptions;

  const memberRoleSelect = (
    value: string,
    onChange: (v: string) => void,
    id: string,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>Member Role</Label>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              The system role defining what the user does for the
              organization. Determines the general scope of functionality
              and data access (e.g. Broker, Underwriter, Loan Officer).
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select member role" />
        </SelectTrigger>
        <SelectContent>
          {filteredMemberRoleOptions.length > 0 ? (
            filteredMemberRoleOptions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="_none" disabled>
              {isExternal
                ? "Broker (auto-assigned for external orgs)"
                : "No roles configured"}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  const canFinish = membersAdded > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetAll();
      }}
    >
      <DialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Set up a new organization for your team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">
                  Organization name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org-name"
                  placeholder="Acme Inc"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org-slug"
                  placeholder="acme-inc"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Auto-generated from name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-type">
                  Organization Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={orgType}
                  onValueChange={(v) =>
                    setOrgType(v as "external" | "internal")
                  }
                >
                  <SelectTrigger id="org-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Internal organizations have elevated access for policy
                  evaluation.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={isSubmitting || !step1Valid}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ChevronRight className="mr-2 size-4" />
                  )}
                  Create & Continue
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => setStep(1)}
                  aria-label="Back to organization details"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="min-w-0">
                  <DialogTitle>Add user to {createdOrgName}</DialogTitle>
                  <DialogDescription>
                    Add at least one member to your new organization.
                    {membersAdded > 0 && (
                      <span className="ml-1 font-medium text-green-600">
                        ({membersAdded} added)
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="existing" className="pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="existing" className="flex-1">
                  Existing User
                </TabsTrigger>
                <TabsTrigger value="create" className="flex-1">
                  Create User
                </TabsTrigger>
                <TabsTrigger value="invite" className="flex-1">
                  Invite User
                </TabsTrigger>
              </TabsList>

              {/* ── Existing User Tab ── */}
              <TabsContent value="existing" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-9"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setSelectedUser(null);
                      }}
                    />
                  </div>
                  {isSearching && (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Searching...
                    </div>
                  )}
                  {!isSearching &&
                    searchResults.length > 0 &&
                    !selectedUser && (
                      <div className="max-h-40 overflow-y-auto rounded-md border">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearch(
                                `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                                  u.email,
                              );
                            }}
                          >
                            {u.imageUrl ? (
                              <Image
                                src={u.imageUrl}
                                alt=""
                                width={24}
                                height={24}
                                className="size-6 rounded-full"
                              />
                            ) : (
                              <div className="flex size-6 items-center justify-center rounded-full bg-muted">
                                <User className="size-3" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  {selectedUser && (
                    <div className="flex items-center gap-2 rounded-md border bg-accent/50 p-2 text-sm">
                      <Check className="size-4 text-green-600" />
                      <span>
                        {selectedUser.firstName} {selectedUser.lastName} (
                        {selectedUser.email})
                      </span>
                    </div>
                  )}
                </div>

                {orgRoleSelect(
                  existingUserOrgRole,
                  setExistingUserOrgRole,
                  "existing-org-role",
                )}
                {memberRoleSelect(
                  existingUserMemberRole,
                  setExistingUserMemberRole,
                  "existing-member-role",
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={!canFinish}
                    >
                      Done
                    </Button>
                    <Button
                      onClick={handleAddExistingUser}
                      disabled={isSubmitting || !selectedUser}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Add user
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ── Create User Tab ── */}
              <TabsContent value="create" className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-first">
                      First name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="new-first"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-last">
                      Last name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="new-last"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-phone">
                    Phone number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-phone"
                    type="tel"
                    placeholder="+1"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="skip-pw"
                    checked={skipPasswordChecks}
                    onCheckedChange={(c) =>
                      setSkipPasswordChecks(c === true)
                    }
                  />
                  <div>
                    <Label htmlFor="skip-pw" className="text-sm font-normal">
                      Ignore password policies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      If checked, password policies will not be enforced on
                      this password.
                    </p>
                  </div>
                </div>

                {orgRoleSelect(
                  createUserOrgRole,
                  setCreateUserOrgRole,
                  "create-org-role",
                )}
                {memberRoleSelect(
                  createUserMemberRole,
                  setCreateUserMemberRole,
                  "create-member-role",
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={!canFinish}
                    >
                      Done
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={
                        isSubmitting ||
                        !newFirstName.trim() ||
                        !newLastName.trim() ||
                        !newEmail.trim() ||
                        !newPhone.trim() ||
                        !newPassword
                      }
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Create user
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ── Invite User Tab ── */}
              <TabsContent value="invite" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                {orgRoleSelect(
                  inviteOrgRole,
                  setInviteOrgRole,
                  "invite-org-role",
                )}
                {memberRoleSelect(
                  inviteMemberRole,
                  setInviteMemberRole,
                  "invite-member-role",
                )}

                <div className="space-y-2">
                  <Label htmlFor="invite-expiry">Set invitation expiry</Label>
                  <p className="text-xs text-muted-foreground">
                    Invite links will expire after the specified number of days
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="invite-expiry"
                      type="number"
                      min="1"
                      className="w-20"
                      value={inviteExpiryDays}
                      onChange={(e) => setInviteExpiryDays(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">Days</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={!canFinish}
                    >
                      Done
                    </Button>
                    <Button
                      onClick={handleInviteUser}
                      disabled={isSubmitting || !inviteEmail.trim()}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Invite user
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {!canFinish && (
              <p className="text-xs text-muted-foreground">
                You must add at least one member before finishing.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
