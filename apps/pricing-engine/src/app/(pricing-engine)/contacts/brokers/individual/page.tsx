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
import { BrokerIndividualsTable } from "../../components/broker-individuals-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type {
  BrokerIndividualRow,
  MemberOrgRow,
} from "../../data/fetch-broker-individuals"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type BrokerIndividualsResponse = {
  items: BrokerIndividualRow[]
  orgsMap: Record<string, MemberOrgRow[]>
}

export default function BrokerIndividualsPage() {
  const { data, isLoading } = useSWR<BrokerIndividualsResponse>(
    "/api/brokers/individuals/list",
    fetcher
  )
  const individuals = data?.items ?? []
  const orgsMap = data?.orgsMap ?? {}

  if (isLoading) {
    return <PageSkeleton title="Broker Individuals" columns={6} rows={10} />
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
                <Link href="/contacts/brokers/individual">Brokers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Individuals</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Broker Individuals
          </h2>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <BrokerIndividualsTable data={individuals} initialOrgsMap={orgsMap} />
      </div>
    </>
  )
}
