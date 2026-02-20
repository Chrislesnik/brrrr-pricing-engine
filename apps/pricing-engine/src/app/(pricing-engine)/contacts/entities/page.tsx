"use client"

import useSWR from "swr"
import { ApplicantsPrimaryActions } from "../components/applicants-primary-actions"
import { EntitiesTable } from "../components/entities-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { EntityProfile } from "../data/types"
import type { EntityOwner } from "../data/fetch-entities"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type EntitiesResponse = {
  items: EntityProfile[]
  ownersMap: Record<string, EntityOwner[]>
}

export default function EntitiesPage() {
  const { data, isLoading } = useSWR<EntitiesResponse>("/api/applicants/entities/list", fetcher)
  const entities = data?.items ?? []
  const ownersMap = data?.ownersMap ?? {}

  if (isLoading) {
    return <PageSkeleton title="Entities Pipeline" columns={6} rows={10} />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Entities Pipeline
          </h2>
          <ApplicantsPrimaryActions
            label="New Entity"
            href="/applicants/entities/new"
            type="entity"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <EntitiesTable data={entities} initialOwnersMap={ownersMap} />
      </div>
    </>
  )
}
