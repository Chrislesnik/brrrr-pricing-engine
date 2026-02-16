import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import ContentSection from "@/app/(pricing-engine)/settings/components/content-section"
import { DefaultBrokerSettingsDialog } from "./components/default-broker-settings-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/shadcn/table"
import { getBrokersForOrg } from "./data/fetch-brokers"
import RowActions from "./components/broker-row-actions"
import { Badge } from "@repo/ui/shadcn/badge"
import { cn } from "@repo/lib/cn"
import { BrokerStatusCell } from "./components/broker-status-cell"

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
  const permissionBadge = (perm: string) => {
    const p = (perm || "").toLowerCase()
    const color =
      p === "custom"
        ? "bg-purple-100 text-purple-800 border-purple-200"
        : "bg-highlight-muted text-highlight-foreground border-highlight/30" // default
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

        {/* Desktop table */}
        <div className="hidden md:block">
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
                  <TableCell colSpan={9} className="text-muted-foreground">
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
                    <TableCell><BrokerStatusCell id={r.id} initialStatus={r.status} /></TableCell>
                    <TableCell>{fmtDate(r.joinedAt)}</TableCell>
                    <TableCell className="text-right"><RowActions brokerId={r.id} status={r.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No brokers yet.
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold">{fmt(r.name)}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{fmt(r.company)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BrokerStatusCell id={r.id} initialStatus={r.status} />
                    <RowActions brokerId={r.id} status={r.status} />
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div>{fmt(r.email)}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {permissionBadge(r.permissions)}
                  <span className="text-xs text-muted-foreground">{fmtDate(r.joinedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ContentSection>
  )
}


