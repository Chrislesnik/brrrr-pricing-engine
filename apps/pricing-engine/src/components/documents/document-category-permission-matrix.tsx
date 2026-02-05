"use client";

import * as React from "react";
import { useState } from "react";
import { Save, RotateCcw, ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
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
import { Badge } from "@repo/ui/shadcn/badge";

type ActionKey = "can_view" | "can_insert" | "can_upload" | "can_delete";
type DocPermission = Record<ActionKey, boolean>;
type PermissionState = Record<string, Record<string, DocPermission>>;

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  group: string;
}

interface DocumentCategoryPermissionMatrixProps {
  roles: Role[];
  categories: Category[];
  value: PermissionState;
  onChange: (state: PermissionState) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
}

const actionLabels: Record<ActionKey, string> = {
  can_view: "View",
  can_insert: "Insert",
  can_upload: "Upload",
  can_delete: "Delete",
};

export function DocumentCategoryPermissionMatrix({
  roles,
  categories,
  value,
  onChange,
  onSave,
  onReset,
  saving,
}: DocumentCategoryPermissionMatrixProps) {
  const [hasChanges, setHasChanges] = useState(false);
  
  // Track which roles are expanded (start with all expanded)
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      roles.forEach((role) => {
        initial[role.id] = true; // All expanded by default
      });
      return initial;
    }
  );

  const toggleRole = (roleId: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  // Toggle all roles at once
  const toggleAllRoles = () => {
    const allExpanded = Object.values(expandedRoles).every((v) => v === true);
    const newState: Record<string, boolean> = {};
    roles.forEach((role) => {
      newState[role.id] = !allExpanded;
    });
    setExpandedRoles(newState);
  };

  const allExpanded = Object.values(expandedRoles).every((v) => v === true);

  console.log("DocumentCategoryPermissionMatrix rendering with:", {
    rolesCount: roles.length,
    categoriesCount: categories.length,
    roles: roles.map(r => r.name),
    categories: categories.map(c => c.name),
  });

  const handlePermissionChange = (
    roleId: string,
    categoryId: string,
    action: ActionKey,
    checked: boolean
  ) => {
    const newState = {
      ...value,
      [roleId]: {
        ...value[roleId],
        [categoryId]: {
          ...value[roleId][categoryId],
          [action]: checked,
        },
      },
    };
    onChange(newState);
    setHasChanges(true);
  };

  // Select all checkboxes in a column for a specific role
  const handleColumnSelectAll = (
    roleId: string,
    action: ActionKey,
    checked: boolean
  ) => {
    const newState = { ...value };
    if (!newState[roleId]) return;

    // Toggle all categories for this action
    Object.keys(newState[roleId]).forEach((categoryId) => {
      newState[roleId][categoryId] = {
        ...newState[roleId][categoryId],
        [action]: checked,
      };
    });

    onChange(newState);
    setHasChanges(true);
  };

  // Select all checkboxes in a row for a specific role
  const handleRowSelectAll = (
    roleId: string,
    categoryId: string,
    checked: boolean
  ) => {
    const newState = {
      ...value,
      [roleId]: {
        ...value[roleId],
        [categoryId]: {
          can_view: checked,
          can_insert: checked,
          can_upload: checked,
          can_delete: checked,
        },
      },
    };
    onChange(newState);
    setHasChanges(true);
  };

  // Check if all checkboxes in a column are checked
  const isColumnAllChecked = (roleId: string, action: ActionKey): boolean => {
    if (!value[roleId]) return false;
    return Object.values(value[roleId]).every((perms) => perms[action]);
  };

  // Check if all checkboxes in a row are checked
  const isRowAllChecked = (roleId: string, categoryId: string): boolean => {
    const perms = value[roleId]?.[categoryId];
    if (!perms) return false;
    return perms.can_view && perms.can_insert && perms.can_upload && perms.can_delete;
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  const handleReset = () => {
    onReset();
    setHasChanges(false);
  };

  // Group categories by their group
  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllRoles}
            className="gap-2"
          >
            {allExpanded ? (
              <>
                <ChevronsUpDown className="size-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronsDownUp className="size-4" />
                Expand All
              </>
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset to Template
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <Save className="mr-2 size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Roles */}
      {roles.map((role) => {
        const isExpanded = expandedRoles[role.id] ?? true;
        
        return (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {role.name}
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                  </CardTitle>
                  {role.description && (
                    <CardDescription className="mt-1">
                      {role.description}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRole(role.id)}
                  className="ml-4"
                >
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  <span className="ml-2 text-xs">
                    {isExpanded ? "Collapse" : "Expand"}
                  </span>
                </Button>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Document Category</TableHead>
                  {(Object.keys(actionLabels) as ActionKey[]).map((action) => (
                    <TableHead key={action} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">
                          {actionLabels[action]}
                        </span>
                        <Checkbox
                          checked={isColumnAllChecked(role.id, action)}
                          onCheckedChange={(checked) =>
                            handleColumnSelectAll(role.id, action, checked === true)
                          }
                          disabled={role.isSystem}
                          className="mt-1"
                          title={`Select all ${actionLabels[action]}`}
                        />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[80px] text-center">
                    <span className="text-xs font-medium">All</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <React.Fragment key={group}>
                    {/* Group header row */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="font-semibold">
                        {group}
                      </TableCell>
                    </TableRow>
                    {/* Category rows */}
                    {cats.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-muted-foreground">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {(Object.keys(actionLabels) as ActionKey[]).map((action) => (
                          <TableCell key={action} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={
                                  value[role.id]?.[category.id]?.[action] || false
                                }
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    role.id,
                                    category.id,
                                    action,
                                    checked === true
                                  )
                                }
                                disabled={role.isSystem}
                              />
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={isRowAllChecked(role.id, category.id)}
                              onCheckedChange={(checked) =>
                                handleRowSelectAll(
                                  role.id,
                                  category.id,
                                  checked === true
                                )
                              }
                              disabled={role.isSystem}
                              title="Select all actions for this category"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
