import ContentSection from "./components/content-section"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addProgramAction } from "./programs-actions"
import { AddProgramDialog } from "./components/add-program-dialog"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

interface ProgramRow {
  id: string
  loan_type: "dscr" | "bridge" | string
  internal_name: string
  external_name: string
  webhook_url: string | null
  status: "active" | "inactive"
}

export default async function SettingsProgramsPage() {
  const { orgId } = auth()
  let programs: ProgramRow[] = []
  if (orgId) {
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (orgUuid) {
    const { data } = await supabaseAdmin
      .from("programs")
      .select("id, loan_type, internal_name, external_name, webhook_url, status")
        .eq("organization_id", orgUuid)
      .order("updated_at", { ascending: false })
      programs = (data as ProgramRow[]) ?? []
    }
  }

  return (
    <ContentSection
      title="Programs"
      desc="Pipeline records."
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
              <TableHead className="w-[18%]">Loan Type</TableHead>
              <TableHead className="w-[20%]">Internal Name</TableHead>
              <TableHead className="w-[20%]">External Name</TableHead>
              <TableHead className="w-[20%]">Webhook URL</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="uppercase">{p.loan_type}</TableCell>
                <TableCell className="font-medium">{p.internal_name}</TableCell>
                <TableCell>{p.external_name}</TableCell>
                <TableCell className="truncate">{p.webhook_url ?? ""}</TableCell>
                <TableCell className="capitalize">{p.status}</TableCell>
              </TableRow>
            ))}
            {programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
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
