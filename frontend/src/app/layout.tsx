import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { HeaderProvider } from '@/providers/HeaderProvider';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
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
            <head>
                <ColorSchemeScript />
            </head>
            <body>
                <QueryProvider>
                    <ThemeProvider>
                        <HeaderProvider>{children}</HeaderProvider>
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
