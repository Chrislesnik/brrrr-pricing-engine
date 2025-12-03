import ContentSection from "@/app/(dashboard)/settings/components/content-section"
import { DefaultBrokerSettingsDialog } from "./components/default-broker-settings-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function BrokersPage() {
  // UI only placeholder matching Programs layout
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
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground">
                No brokers yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ContentSection>
  )
}


