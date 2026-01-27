import Link from "next/link"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ApplicantsPrimaryActions } from "../components/applicants-primary-actions"
import { getEntitiesForOrg } from "../data/fetch-entities"
import { EntitiesTable } from "../components/entities-table"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export default async function EntitiesPage() {
	const { orgId } = await auth()
	const orgUuid = await getOrgUuidFromClerkId(orgId)
	const { entities, ownersMap } = orgUuid ? await getEntitiesForOrg(orgUuid) : { entities: [], ownersMap: {} }
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
								<Link href="/applicants/entities">Applicants</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Entities</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
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


