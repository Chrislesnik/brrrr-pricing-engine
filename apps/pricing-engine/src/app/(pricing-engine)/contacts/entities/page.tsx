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
    <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
        <p className="text-muted-foreground">
          Manage borrowing entities and their ownership structure.
        </p>
      </div>
      <EntitiesTable
        data={entities}
        initialOwnersMap={ownersMap}
        actionButton={
          <ApplicantsPrimaryActions
            label="New Entity"
            href="/applicants/entities/new"
            type="entity"
          />
        }
      />
    </div>
  )
}
