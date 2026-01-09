import { Borrower } from "./types"

export const mockBorrowers: Borrower[] = [
	{
		id: "BRW-10001",
		firstName: "Alex",
		lastName: "Johnson",
		email: "alex.johnson@example.com",
		phone: "(555) 123-4567",
		dateOfBirth: new Date(1986, 4, 12),
		ficoScore: 742,
		createdAt: new Date(2024, 10, 3),
	},
	{
		id: "BRW-10002",
		firstName: "Maria",
		lastName: "Lopez",
		email: "maria.lopez@example.com",
		phone: "(555) 987-6543",
		dateOfBirth: new Date(1990, 1, 21),
		ficoScore: 701,
		createdAt: new Date(2024, 8, 17),
	},
]





