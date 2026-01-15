import { z } from "zod"

const userStatusSchema = z.union([
  z.literal("active"),
  z.literal("dead"),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userSchema = z.object({
  id: z.string(),
  // Borrower
  firstName: z.string(),
  lastName: z.string(),
  // Loan/Deal fields
  propertyAddress: z.string(),
  guarantors: z.array(z.string()),
  loanType: z.string(),
  transactionType: z.string(),
  loanAmount: z.number(),
  rate: z.number(),
  assignedTo: z.string(),
  // Legacy/user fields kept for compatibility where referenced
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(), // Last Edited
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
