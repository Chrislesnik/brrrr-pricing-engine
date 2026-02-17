import { IconApps, IconSettings, IconUsers, IconUser, IconSparkles, IconInbox, IconPlug, IconBuilding, IconPalette, IconFileText, IconSquareRoundedNumber1, IconSquareRoundedNumber2, IconSquareRoundedNumber3, IconSquareRoundedNumber4, IconSquareRoundedNumber5, IconSquareRoundedNumber6, IconSquareRoundedNumber7, IconSquareRoundedNumber8, IconSquareRoundedNumber9, IconSquareRoundedNumber0 } from "@tabler/icons-react"
import { AudioWaveform, GalleryVerticalEnd } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Logo } from "@/components/logo"
import { type SidebarData } from "../types"

export const sidebarData: SidebarData = {
  user: {
    name: "ausrobdev",
    email: "rob@shadcnblocks.com",
    avatar: "/avatars/ausrobdev-avatar.png",
  },
  teams: [
    {
      name: "Loan Pricing Engine",
      logo: ({ className }: { className: string }) => (
        <Logo className={cn("invert dark:invert-0", className)} />
      ),
      plan: "Nextjs + shadcn/ui",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "Main",
      items: [
        {
          title: "Pipeline",
          url: "/pipeline",
          icon: IconUsers,
        },
        {
          title: "Loan Setup",
          icon: IconSquareRoundedNumber1,
          items: [
            {
              title: "Applications",
              url: "/applications",
              icon: IconInbox,
            },
          ],
        },
        {
          title: "Processing 1",
          icon: IconSquareRoundedNumber2,
        },
        {
          title: "Appraisal Review",
          icon: IconSquareRoundedNumber3,
        },
        {
          title: "Processing 2",
          icon: IconSquareRoundedNumber4,
        },
        {
          title: "QC 1",
          icon: IconSquareRoundedNumber5,
        },
        {
          title: "Underwriting",
          icon: IconSquareRoundedNumber6,
        },
        {
          title: "Conditionally Approved",
          icon: IconSquareRoundedNumber7,
        },
        {
          title: "QC 2",
          icon: IconSquareRoundedNumber8,
        },
        {
          title: "Clear to Close",
          icon: IconSquareRoundedNumber9,
        },
        {
          title: "Closed and Funded",
          icon: IconSquareRoundedNumber0,
        },
        {
          title: "Borrowers",
          icon: IconUsers,
          items: [
            {
              title: "Individuals",
              url: "/contacts/borrowers",
              icon: IconUser,
            },
            {
              title: "Entities",
              url: "/contacts/entities",
              icon: IconBuilding,
            },
            {
              title: "Guarantors",
              url: "/contacts/guarantors",
              icon: IconUser,
            },
          ],
        },
        {
          title: "Brokers",
          icon: IconUser,
          policyCheck: { resourceType: "feature", resourceName: "organization_invitations", action: "view" },
          items: [
            {
              title: "Individuals",
              url: "/contacts/brokers/individual",
              icon: IconUser,
            },
            {
              title: "Organizations",
              url: "/contacts/brokers/organizations",
              icon: IconBuilding,
            },
          ],
        },
        {
          title: "3rd Parties",
          icon: IconUser,
          items: [
            {
              title: "Individuals",
              url: "/contacts/third-parties/individuals",
            },
            {
              title: "Companies",
              url: "/contacts/third-parties/companies",
            },
          ],
        },
        {
          title: "AI Agent",
          url: "/ai-agent",
          icon: IconSparkles,
        },
        {
          title: "Settings",
          icon: IconSettings,
          items: [
            {
              title: "Integrations",
              icon: IconPlug,
              url: "/settings/integrations",
            },
            {
              title: "Company",
              icon: IconUser,
              url: "/settings/company",
              allowOrgRoles: ["org:broker", "broker"],
            },
            {
              title: "Appearance",
              icon: IconPalette,
              url: "/settings/appearance",
              policyCheck: { resourceType: "table", resourceName: "organization_themes", action: "update" },
            },
          ],
        }
      ],
    },
  ],
}
