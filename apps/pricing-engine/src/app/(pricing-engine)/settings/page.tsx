import ContentSection from "./components/content-section"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/shadcn/table"
import { addProgramAction, deleteProgramAction, updateProgramAction } from "./programs-actions"
import { AddProgramDialog } from "./components/add-program-dialog"
import { ProgramRowActions } from "./components/program-row-actions"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { Badge } from "@repo/ui/shadcn/badge"
import { cn } from "@repo/lib/cn"

interface ProgramRow {
  id: string
  internal_name: string
  external_name: string
  webhook_url: string | null
  status: "active" | "inactive"
}

export default async function SettingsProgramsPage() {
  const { orgId, orgRole, has } = await auth()

  // Gate access to Programs by Clerk permission granted via Feature "Manage Programs"
  const isOwner = orgRole === "org:owner" || orgRole === "owner"
  const canAccess = isOwner || (await has({ permission: "org:manage_programs" }))
  if (!canAccess) {
    notFound()
  }

  const { data } = await supabaseAdmin
    .from("programs")
    .select("id, internal_name, external_name, webhook_url, status")
    .order("updated_at", { ascending: false })
  const programs: ProgramRow[] = (data as ProgramRow[]) ?? []

  return (
    <ContentSection
      title="Programs"
      desc="Manage your loan programs."
      className="w-full lg:max-w-full"
      showHeader={false}
    >
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full justify-end">
          {/* Client dialog calls server action and revalidates on success */}
          <AddProgramDialog action={addProgramAction} canCreate={!!orgId} orgId={orgId ?? null} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%]">ID</TableHead>
              <TableHead className="w-[22%]">Internal Name</TableHead>
              <TableHead className="w-[22%]">External Name</TableHead>
              <TableHead className="w-[24%]">Webhook URL</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[4%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="font-medium">{p.internal_name}</TableCell>
                <TableCell>{p.external_name}</TableCell>
                <TableCell className="truncate">{p.webhook_url ?? ""}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      p.status === "active"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ProgramRowActions
                    program={p}
                    updateAction={updateProgramAction}
                    deleteAction={deleteProgramAction}
                    orgId={orgId ?? null}
                  />
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No records yet. Add your first one above.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </ContentSection>
  )
}
