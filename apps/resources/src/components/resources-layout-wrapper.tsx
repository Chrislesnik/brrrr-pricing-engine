'use client';

import { UniversalLayout, UniversalSidebar, TeamSwitcher } from '@repo/ui/layouts';
import { QUICK_ACTIONS } from '@/config/navigation';

export function ResourcesLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UniversalLayout
      sidebar={
        <UniversalSidebar
          teamSwitcher={<TeamSwitcher />}
          navItems={QUICK_ACTIONS}
          navLabel="Resources"
        />
      }
      headerTitle="Resource Hub"
    >
      {children}
    </UniversalLayout>
  );
}
