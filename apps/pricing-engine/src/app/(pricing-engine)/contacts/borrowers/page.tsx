"use client"

import useSWR from "swr"
import { ApplicantsPrimaryActions } from "../components/applicants-primary-actions"
import { BorrowersTable } from "../components/borrowers-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { Borrower } from "../data/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BorrowersPage() {
  const { data, isLoading } = useSWR<{ items: Borrower[] }>("/api/applicants/borrowers/list", fetcher)
  const borrowers = data?.items ?? []

  if (isLoading) {
    return <PageSkeleton title="Borrowers Pipeline" columns={6} rows={10} />
  }

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Borrowers</h1>
        <p className="text-muted-foreground">
          Manage individual borrower contacts and their information.
        </p>
      </div>
      <BorrowersTable
        data={borrowers}
        actionButton={
          <ApplicantsPrimaryActions
            label="New Borrower"
            href="/applicants/borrowers/new"
            type="borrower"
          />
        }
      />
    </div>
  )
}
