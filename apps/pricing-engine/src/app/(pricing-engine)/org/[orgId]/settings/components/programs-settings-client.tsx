"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Loader2, Plus } from "lucide-react";
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
import { cn } from "@repo/lib/cn";
import { AddProgramDialog } from "@/app/(pricing-engine)/settings/components/add-program-dialog";
import { ProgramRowActions } from "@/app/(pricing-engine)/settings/components/program-row-actions";
import {
  addProgramAction,
  updateProgramAction,
  deleteProgramAction,
} from "@/app/(pricing-engine)/settings/programs-actions";

interface ProgramRow {
  id: string;
  loan_type: "dscr" | "bridge" | string;
  internal_name: string;
  external_name: string;
  webhook_url: string | null;
  status: "active" | "inactive";
}

interface ProgramsSettingsClientProps {
  initialPrograms: ProgramRow[];
}

export function ProgramsSettingsClient({
  initialPrograms,
}: ProgramsSettingsClientProps) {
  const { organization } = useOrganization();
  const [programs, setPrograms] = useState<ProgramRow[]>(initialPrograms);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh programs data
  const refreshPrograms = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/programs?orgId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error("Failed to refresh programs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Wrap actions to trigger refresh
  const handleAddProgram = async (formData: FormData) => {
    const result = await addProgramAction(formData);
    if (result.ok) {
      await refreshPrograms();
    }
    return result;
  };

  const handleUpdateProgram = async (formData: FormData) => {
    const result = await updateProgramAction(formData);
    if (result.ok) {
      await refreshPrograms();
    }
    return result;
  };

  const handleDeleteProgram = async (formData: FormData) => {
    const result = await deleteProgramAction(formData);
    if (result.ok) {
      await refreshPrograms();
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programs</h2>
          <p className="mt-1 text-muted-foreground">
            Manage loan programs and product offerings for your organization
          </p>
        </div>
        <AddProgramDialog
          action={handleAddProgram}
          canCreate={!!organization?.id}
          orgId={organization?.id || null}
        />
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Programs</CardTitle>
          <CardDescription>
            Configure and manage your loan program offerings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No programs yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first loan program
              </p>
              <AddProgramDialog
                action={handleAddProgram}
                canCreate={!!organization?.id}
                orgId={organization?.id || null}
              />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Internal Name</TableHead>
                    <TableHead>External Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {program.loan_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {program.internal_name}
                      </TableCell>
                      <TableCell>{program.external_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            program.status === "active" ? "default" : "secondary"
                          }
                          className={cn(
                            program.status === "active" &&
                              "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                          )}
                        >
                          {program.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ProgramRowActions
                          program={program}
                          updateAction={handleUpdateProgram}
                          deleteAction={handleDeleteProgram}
                          orgId={organization?.id || null}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
