import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import ContentSection from "@/app/(dashboard)/settings/components/content-section"
import { DefaultBrokerSettingsDialog } from "./components/default-broker-settings-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getBrokersForOrg } from "./data/fetch-brokers"
import RowActions from "./components/broker-row-actions"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default async function BrokersPage() {
  const { orgId, userId, orgRole } = await auth()
  // Hide/Ban access for brokers
  if (orgRole === "org:broker" || orgRole === "broker") {
    notFound()
  }
  const rows = orgId ? await getBrokersForOrg(orgId, userId ?? undefined) : []

  const fmt = (v?: string | null) => {
    const s = String(v ?? "").trim()
    return s.length ? s : "-"
  }
  const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "-")
  const statusBadge = (status: string) => {
    const s = (status || "").toLowerCase()
    const color =
      s === "active"
        ? "bg-green-100 text-green-800 border-green-200"
        : s === "inactive"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-yellow-100 text-yellow-800 border-yellow-200" // pending
    return <Badge variant="outline" className={cn("capitalize", color)}>{s || "-"}</Badge>
  }
  const permissionBadge = (perm: string) => {
    const p = (perm || "").toLowerCase()
    const color =
      p === "custom"
        ? "bg-purple-100 text-purple-800 border-purple-200"
        : "bg-yellow-100 text-yellow-800 border-yellow-200" // default
    return <Badge variant="outline" className={cn("uppercase", color)}>{(p || "-").toUpperCase()}</Badge>
  }

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
                  <TableCell>{fmt(r.name)}</TableCell>
                  <TableCell>{fmt(r.company)}</TableCell>
                  <TableCell>{fmt(r.email)}</TableCell>
                  <TableCell>{fmt(r.managers)}</TableCell>
                  <TableCell>{permissionBadge(r.permissions)}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell>{fmtDate(r.joinedAt)}</TableCell>
                  <TableCell className="text-right"><RowActions brokerId={r.id} status={r.status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ContentSection>
  )
}


