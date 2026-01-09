import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
    title: 'BTask - Task Management',
    description: 'A Trello-like task management application',
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
                        <ThemeProvider>{children}</ThemeProvider>
                    </QueryProvider>
                </AntdRegistry>
            </body>
        </html>
    );
}
