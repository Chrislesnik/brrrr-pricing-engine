export type ContactType =
  | "Balance Sheet Investor"
  | "Lender"
  | "Borrower"
  | "Broker"
  | "Point of Contact"
  | string

export type UserRole = "owner" | "admin" | "member" | string

export type UserPermissions = {
  contactType: ContactType
  role: UserRole
  canAccessDeals?: boolean
  [key: string]: boolean | ContactType | UserRole | undefined
}
