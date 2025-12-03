import ContentSection from "@/app/(dashboard)/settings/components/content-section"
import { Button } from "@/components/ui/button"
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
          <Button variant="default" size="sm" type="button">
            Default Broker Settings
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[24%]">ID</TableHead>
              <TableHead className="w-[22%]">Managers</TableHead>
              <TableHead className="w-[20%]">Permissions</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[20%]">Joined At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No brokers yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ContentSection>
  )
}


