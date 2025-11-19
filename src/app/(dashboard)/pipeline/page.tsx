import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { UserPrimaryActions } from "../users/components/user-primary-actions"
import { pipelineColumns } from "./components/pipeline-columns"
import { PipelineTable } from "./components/pipeline-table"
import { getPipelineLoansForOrg } from "./data/fetch-loans"

export default async function PipelinePage() {
  const { orgId } = auth()
  const data = orgId ? await getPipelineLoansForOrg(orgId) : []
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
              <BreadcrumbPage>Pipeline</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Loan Pipeline
          </h2>
          <UserPrimaryActions />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <PipelineTable data={data} columns={pipelineColumns} />
      </div>
    </>
  )
}


