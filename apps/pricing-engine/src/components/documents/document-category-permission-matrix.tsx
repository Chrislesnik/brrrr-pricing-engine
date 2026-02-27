"use client";

import * as React from "react";
import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import {
  Card,
  CardContent,
} from "@repo/ui/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/shadcn/tabs";
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

  const isAllChecked = (roleId: string): boolean => {
    if (!value[roleId]) return false;
    return Object.values(value[roleId]).every(
      (p) => p.can_view && p.can_insert && p.can_upload && p.can_delete
    );
  };

  const handleSelectAll = (roleId: string, checked: boolean) => {
    const newState = { ...value };
    if (!newState[roleId]) return;
    Object.keys(newState[roleId]).forEach((catId) => {
      newState[roleId][catId] = {
        can_view: checked,
        can_insert: checked,
        can_upload: checked,
        can_delete: checked,
      };
    });
    onChange(newState);
    setHasChanges(true);
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

  const defaultTab = roles[0]?.id ?? "";

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
              You have unsaved changes
            </div>
          )}
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

      {/* Tabbed roles */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex h-auto gap-1 overflow-x-auto justify-start w-full">
          {roles.map((role) => (
            <TabsTrigger key={role.id} value={role.id} className="gap-1.5">
              {role.name}
              {role.isSystem && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  System
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => (
          <TabsContent key={role.id} value={role.id}>
            <Card>
              <CardContent className="overflow-x-auto pt-6 pb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[360px] align-bottom">Document Category</TableHead>
                      {(Object.keys(actionLabels) as ActionKey[]).map((action) => (
                        <TableHead key={action} className="w-[100px] text-center align-bottom">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium">
                              {actionLabels[action]}
                            </span>
                            <Checkbox
                              checked={isColumnAllChecked(role.id, action)}
                              onCheckedChange={(checked) =>
                                handleColumnSelectAll(role.id, action, checked === true)
                              }
                              disabled={role.isSystem}
                              title={`Select all ${actionLabels[action]}`}
                            />
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px] text-center align-bottom">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium">All</span>
                          <Checkbox
                            checked={isAllChecked(role.id)}
                            onCheckedChange={(checked) =>
                              handleSelectAll(role.id, checked === true)
                            }
                            disabled={role.isSystem}
                            title="Select all permissions"
                          />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedCategories).map(([group, cats]) => (
                      <React.Fragment key={group}>
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
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
