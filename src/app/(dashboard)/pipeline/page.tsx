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
  const { orgId, userId } = await auth()

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H8",
      location: "pipeline/page.tsx:22",
      message: "pipeline page entry run5",
      data: { hasOrg: Boolean(orgId), hasUser: Boolean(userId) },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  const data = orgId && userId ? await getPipelineLoansForOrg(orgId, userId) : []

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H8",
      location: "pipeline/page.tsx:37",
      message: "pipeline data loaded run5",
      data: { length: Array.isArray(data) ? data.length : -1 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

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


