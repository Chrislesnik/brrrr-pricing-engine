"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, Loader2, Save } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";

// Mock data for demonstration
const documentCategories = [
  { id: 1, name: "Financial Statements", group: "Financial" },
  { id: 2, name: "Tax Documents", group: "Financial" },
  { id: 3, name: "Legal Contracts", group: "Legal" },
  { id: 4, name: "Property Documents", group: "Property" },
  { id: 5, name: "Insurance Policies", group: "Property" },
];

const dealRoles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Borrower" },
  { id: 3, name: "Lender" },
  { id: 4, name: "Broker" },
];

export default function PermissionsPage() {
  const { organization, isLoaded } = useOrganization();
  const params = useParams();
  const orgId = params.orgId as string;
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize permissions state (role x category x permission type)
  const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const initial: Record<string, Record<string, Record<string, boolean>>> = {};
    dealRoles.forEach((role) => {
      initial[role.id] = {};
      documentCategories.forEach((category) => {
        initial[role.id][category.id] = {
          view: true,
          insert: role.id === 1,
          upload: role.id === 1 || role.id === 2,
          delete: role.id === 1,
        };
      });
    });
    return initial;
  });

  if (!isLoaded || !organization) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const handlePermissionChange = (
    roleId: number,
    categoryId: number,
    permissionType: string,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [categoryId]: {
          ...prev[roleId][categoryId],
          [permissionType]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual API call to save permissions
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Saving permissions:", permissions);
    } catch (error) {
      console.error("Failed to save permissions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-6xl">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href={`/org/${orgId}/settings`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold">Document Permissions</h1>
          <p className="mt-1 text-muted-foreground">
            Control which roles can access different document types
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4" />
              Permission Types
            </CardTitle>
            <CardDescription>
              Understanding document permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>View:</strong> Can see and download documents
              </div>
              <div>
                <strong>Insert:</strong> Can create new document records
              </div>
              <div>
                <strong>Upload:</strong> Can upload document files
              </div>
              <div>
                <strong>Delete:</strong> Can remove documents
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access Control Matrix</CardTitle>
            <CardDescription>
              Configure permissions for each role and document category
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {dealRoles.map((role) => (
              <div key={role.id} className="mb-8 last:mb-0">
                <h3 className="mb-4 text-lg font-semibold">{role.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Category</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Insert</TableHead>
                      <TableHead className="text-center">Upload</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.group}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={
                                permissions[role.id]?.[category.id]?.view ||
                                false
                              }
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  role.id,
                                  category.id,
                                  "view",
                                  checked === true
                                )
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={
                                permissions[role.id]?.[category.id]?.insert ||
                                false
                              }
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  role.id,
                                  category.id,
                                  "insert",
                                  checked === true
                                )
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={
                                permissions[role.id]?.[category.id]?.upload ||
                                false
                              }
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  role.id,
                                  category.id,
                                  "upload",
                                  checked === true
                                )
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={
                                permissions[role.id]?.[category.id]?.delete ||
                                false
                              }
                              onCheckedChange={(checked) =>
                                handlePermissionChange(
                                  role.id,
                                  category.id,
                                  "delete",
                                  checked === true
                                )
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Save className="mr-2 size-4" />
                Save Permissions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
