import {
  IconCash,
  IconShield,
  IconUserCheck,
  IconUserScan,
  IconUsersGroup,
  IconUserShield,
  TablerIcon,
} from "@tabler/icons-react"
import { UserStatus } from "./schema"

export const callTypes = new Map<UserStatus, string>([
  ["active", "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
  ["dead", "bg-neutral-300/40 border-neutral-300 text-neutral-700 dark:text-neutral-300"],
])

export const userTypes = [
  {
    label: "Superadmin",
    value: "superadmin",
    icon: IconShield,
  },
  {
    label: "Admin",
    value: "admin",
    icon: IconUserShield,
  },
  {
    label: "Manager",
    value: "manager",
    icon: IconUsersGroup,
  },
  {
    label: "Cashier",
    value: "cashier",
    icon: IconCash,
  },
] as const

/* ========== User Stats ========== */

export interface UserStatProps {
  title: string
  desc: string
  stat: string
  statDesc: string
  icon: TablerIcon
}

export const userStats: UserStatProps[] = [
  {
    title: "Total Loans",
    desc: "Total number of loans",
    stat: "12,000",
    statDesc: "as of today",
    icon: IconUsersGroup,
    // icon: <IconUsersGroup size={16} />,
  },
  {
    title: "Active Loans",
    desc: "Number of currently active loans",
    stat: "7,800",
    statDesc: "as of today",
    icon: IconUserCheck,
  },
  {
    title: "Dead Loans",
    desc: "Number of closed or charged-off loans",
    stat: "42",
    statDesc: "as of today",
    icon: IconUserScan,
  },
  {
    title: "Total UPB",
    desc: "Unpaid principal balance across all loans",
    stat: "$125,000,000",
    statDesc: "as of today",
    icon: IconCash,
  },
  // {
  //   title: "New Users",
  //   desc: "Total number of users who joined this month",
  //   stat: "+350",
  //   statDesc: "+10% vs last month",
  //   icon: <IconUsersPlus size={16} />,
  // },
  // {
  //   title: "Pending Verifications",
  //   desc: "Total number of users pending verification",
  //   stat: "42",
  //   statDesc: "2% of users",
  //   icon: <IconUserScan size={16} />,
  // },
  // {
  //   title: "Active Users",
  //   desc: "Number of active users in the last 30 days",
  //   stat: "7800",
  //   statDesc: "65% of all users",
  //   icon: <IconUserCheck size={16} />,
  // },
]
