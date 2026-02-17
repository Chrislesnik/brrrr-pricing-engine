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
    <>
      <div className="mb-4 flex flex-col gap-2">
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
