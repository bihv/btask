import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { HeaderProvider } from '@/providers/HeaderProvider';
import './globals.css';

export const metadata: Metadata = {
    title: 'Mello - Task Management',
    description: 'A modern Kanban-style task management application',
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: '/mello-icon.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AntdRegistry>
                    <QueryProvider>
                        <ThemeProvider>
                            <HeaderProvider>{children}</HeaderProvider>
                        </ThemeProvider>
                    </QueryProvider>
                </AntdRegistry>
            </body>
        </html>
    );
}
