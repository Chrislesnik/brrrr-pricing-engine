"use client"

import useSWR from "swr"
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
    <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broker Individuals</h1>
        <p className="text-muted-foreground">
          Manage individual broker contacts and their organizations.
        </p>
      </div>
      <BrokerIndividualsTable data={individuals} initialOrgsMap={orgsMap} />
    </div>
  )
}
