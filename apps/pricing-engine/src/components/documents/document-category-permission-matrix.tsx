"use client";

import * as React from "react";
import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
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
        <div className="text-sm text-muted-foreground">
          {hasChanges && "You have unsaved changes"}
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
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
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
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Document Category</TableHead>
                  {(Object.keys(actionLabels) as ActionKey[]).map((action) => (
                    <TableHead key={action} className="text-center">
                      {actionLabels[action]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <React.Fragment key={group}>
                    {/* Group header row */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold">
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
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
