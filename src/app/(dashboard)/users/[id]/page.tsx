import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { userListSchema } from "../data/schema"
import { getUsers } from "../data/users"
import { UserDetailForm } from "./components/user-detail-form"

interface Props {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: Props) {
  const { id } = React.use(params)

  const users = getUsers()
  const userList = userListSchema.parse(users)
  const user = userList.find((user) => user.id === id)

  if (!user) {
    return redirect(`/pipeline`)
  }

  return (
    <div>
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
              <Link href="/pipeline">Pipeline</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-4 space-y-1">
        <div className="flex flex-wrap gap-2">
          <h1 className="text-lg font-bold">
            User Details: {`${user.firstName} ${user.lastName}`}
          </h1>
          <Badge variant="outline" className="text-muted-foreground">
            {user.id}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Comprehensive user information, including details, role, status, and
          management options.
        </p>
      </div>

      <div className="mt-4">
        <UserDetailForm user={user} />
      </div>
    </div>
  )
}
