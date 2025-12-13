import { IconApps, IconSettings, IconUsers, IconUser, IconSparkles } from "@tabler/icons-react"
import { AudioWaveform, GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
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
          title: "Brokers",
          url: "/brokers",
          icon: IconUser,
          denyOrgRoles: ["org:broker", "broker"],
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
              title: "Programs",
              icon: IconApps,
              url: "/settings",
              requiredPermission: "org:manage_programs",
            },
            {
              title: "Company",
              icon: IconUser,
              url: "/settings/company",
              // Visible only to broker role
              allowOrgRoles: ["org:broker", "broker"],
            },
          ],
        }
      ],
    },
  ],
}
