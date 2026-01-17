import { source } from '@/lib/source';
import { DocsLayout as FumadocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode, ComponentType } from 'react';
import { AISearch, AISearchTrigger, AISearchPanel } from '@/components/search';

// Workaround: Fumadocs v16.4.7 type definitions are missing 'children' prop
const DocsLayout = FumadocsLayout as ComponentType<
  Parameters<typeof FumadocsLayout>[0] & { children: ReactNode }
>;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AISearch>
      <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
        {children}
        <AISearchPanel />
      </DocsLayout>
      <AISearchTrigger />
    </AISearch>
  );
}
