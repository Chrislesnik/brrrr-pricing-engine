'use client';

import { UniversalLayout, UniversalSidebar, TeamSwitcher } from '@repo/ui/layouts';
import { DOCS_NAV_ITEMS } from '@/config/navigation';

export function HomeLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UniversalLayout
      sidebar={
        <UniversalSidebar
          teamSwitcher={<TeamSwitcher />}
          navItems={DOCS_NAV_ITEMS}
          navLabel="Documentation"
        />
      }
      headerTitle="BRRRR Developer Docs"
    >
      {children}
    </UniversalLayout>
  );
}
