import type { ReactNode } from 'react';
import { DocsLayoutWrapper } from '@/components/docs-layout-wrapper';
import '@repo/ui/globals.css';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsLayoutWrapper>{children}</DocsLayoutWrapper>;
}
