import { RootProvider as FumadocsRootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode, ComponentType } from 'react';

// Workaround: Fumadocs v16.4.7 type definitions are missing 'children' prop
const RootProvider = FumadocsRootProvider as ComponentType<
  Parameters<typeof FumadocsRootProvider>[0] & { children: ReactNode }
>;

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Mello',
    template: '%s | Mello',
  },
  description: 'Open source task management inspired by Trello',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
