import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ApplicationsTable } from "./components/applications-table"
import type { ApplicationRow } from "./data/fetch-applications"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getApplicationsForOrg } from "./data/fetch-applications"

export default async function ApplicationsPage() {
  const { orgId } = await auth()
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  const data: ApplicationRow[] = orgUuid ? await getApplicationsForOrg(orgUuid) : []
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
              <BreadcrumbPage>Applications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Applications
          </h2>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <ApplicationsTable data={data} />
      </div>
    </>
  )
}


