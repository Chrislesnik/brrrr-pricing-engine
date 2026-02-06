"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Textarea } from "@repo/ui/shadcn/textarea";
import { Switch } from "@repo/ui/shadcn/switch";

interface MemberRole {
  id: string;
  role_code: string;
  role_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export function MemberRolesSettings() {
  const [roles, setRoles] = useState<MemberRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MemberRole | null>(null);

  // Form state
  const [roleCode, setRoleCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Member Roles</h2>
          <p className="mt-1 text-muted-foreground">
            Define custom member roles for your organization
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Add Role
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Member Roles</CardTitle>
          <CardDescription>
            These roles can be assigned to members and used in access policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No member roles yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first member role
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Add Role
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Code</TableHead>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {role.role_code}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {role.role_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role.is_active ? "default" : "secondary"}
                        >
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingRole(role);
                              setRoleCode(role.role_code);
                              setRoleName(role.role_name);
                              setDescription(role.description || "");
                              setIsActive(role.is_active);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Member Role" : "Add Member Role"}
            </DialogTitle>
            <DialogDescription>
              Define a custom role that can be assigned to organization members
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleCode">Role Code</Label>
              <Input
                id="roleCode"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                placeholder="e.g., analyst"
                disabled={!!editingRole}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, no spaces (used in database)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., Analyst"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this role's responsibilities..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label className="cursor-pointer">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingRole(null);
                setRoleCode("");
                setRoleName("");
                setDescription("");
                setIsActive(true);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => console.log("Save role")}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
