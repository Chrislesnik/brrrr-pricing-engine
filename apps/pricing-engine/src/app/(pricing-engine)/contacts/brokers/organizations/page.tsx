"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/shadcn/breadcrumb"
import { BrokerCompaniesTable } from "../../components/broker-companies-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { BrokerCompanyRow, OrgMemberRow } from "../../data/fetch-broker-companies"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type BrokerCompaniesResponse = {
  items: BrokerCompanyRow[]
  membersMap: Record<string, OrgMemberRow[]>
}

export default function BrokerOrganizationsPage() {
  const { data, isLoading } = useSWR<BrokerCompaniesResponse>(
    "/api/brokers/companies/list",
    fetcher
  )
  const companies = data?.items ?? []
  const membersMap = data?.membersMap ?? {}

  if (isLoading) {
    return <PageSkeleton title="Broker Organizations" columns={6} rows={10} />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/contacts/brokers">Brokers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Organizations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Broker Organizations
          </h2>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <BrokerCompaniesTable data={companies} initialMembersMap={membersMap} />
      </div>
    </>
  )
}
