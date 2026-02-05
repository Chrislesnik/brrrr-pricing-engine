'use client';

import { UniversalLayout, UniversalSidebar, TeamSwitcher } from '@repo/ui/layouts';
import { RESOURCES_NAV_ITEMS } from '@/config/navigation';

export function ResourcesLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UniversalLayout
      sidebar={
        <UniversalSidebar
          teamSwitcher={<TeamSwitcher />}
          navItems={RESOURCES_NAV_ITEMS}
          navLabel="Resources"
        />
      }
      headerTitle="Lender Resources"
    >
      {children}
    </UniversalLayout>
  );
}
