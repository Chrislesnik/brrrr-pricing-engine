"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconUserPlus, IconUsersPlus } from "@tabler/icons-react"
import { NewBorrowerModal } from "./new-borrower-modal"
import { NewEntityModal } from "./new-entity-modal"

export function ApplicantsPrimaryActions({
	label,
	href,
	type,
}: {
	label: string
	href: string
	type: "borrower" | "entity"
}) {
	const Icon = type === "borrower" ? IconUserPlus : IconUsersPlus
	const [open, setOpen] = useState(false)
	return (
		<div className="flex justify-end gap-2">
			<>
				<Button className="space-x-1" onClick={() => setOpen(true)}>
					<span>{label}</span> <Icon size={18} />
				</Button>
				{type === "borrower" ? (
					<NewBorrowerModal open={open} onOpenChange={setOpen} />
				) : (
					<NewEntityModal open={open} onOpenChange={setOpen} />
				)}
			</>
		</div>
	)
}


