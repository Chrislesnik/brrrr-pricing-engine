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
import { getBorrowersForOrg } from "../data/fetch-borrowers"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { BorrowersTable } from "../components/borrowers-table"

export default async function BorrowersPage() {
	const { orgId } = await auth()
	const orgUuid = await getOrgUuidFromClerkId(orgId)
	const data = orgUuid ? await getBorrowersForOrg(orgUuid) : []
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
								<Link href="/applicants/borrowers">Applicants</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Borrowers</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="flex-none text-xl font-bold tracking-tight">
						Borrowers Pipeline
					</h2>
					<ApplicantsPrimaryActions
						label="New Borrower"
						href="/applicants/borrowers/new"
						type="borrower"
					/>
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<BorrowersTable data={data} />
			</div>
		</>
	)
}


