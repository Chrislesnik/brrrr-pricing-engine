import { auth } from "@clerk/nextjs/server"
import ContentSection from "@/app/(dashboard)/settings/components/content-section"
import { DefaultBrokerSettingsDialog } from "./components/default-broker-settings-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getBrokersForOrg } from "./data/fetch-brokers"
import RowActions from "./components/broker-row-actions"

export default async function BrokersPage() {
  const { orgId, userId } = await auth()
  const rows = orgId ? await getBrokersForOrg(orgId, userId ?? undefined) : []

  return (
    <ContentSection
      title="Brokers"
      desc="Organization brokers."
      className="w-full lg:max-w-full"
      showHeader={false}
    >
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full justify-end">
          <DefaultBrokerSettingsDialog />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%]">ID</TableHead>
              <TableHead className="w-[18%]">Name</TableHead>
              <TableHead className="w-[18%]">Company</TableHead>
              <TableHead className="w-[18%]">Email</TableHead>
              <TableHead className="w-[12%]">Managers</TableHead>
              <TableHead className="w-[10%]">Permissions</TableHead>
              <TableHead className="w-[6%]">Status</TableHead>
              <TableHead className="w-[6%]">Joined At</TableHead>
              <TableHead className="w-[2%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  No brokers yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.name ?? ""}</TableCell>
                  <TableCell>{r.company ?? ""}</TableCell>
                  <TableCell>{r.email ?? ""}</TableCell>
                  <TableCell>{r.managers ?? ""}</TableCell>
                  <TableCell className="uppercase text-xs">{r.permissions}</TableCell>
                  <TableCell className={r.status === 'active' ? 'text-green-600' : r.status === 'inactive' ? 'text-red-600' : 'text-muted-foreground'}>
                    {r.status}
                  </TableCell>
                  <TableCell>{r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : ''}</TableCell>
                  <TableCell className="text-right"><RowActions brokerId={r.id} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ContentSection>
  )
}


