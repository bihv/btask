import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mello - Open Source Task Management | Trello Alternative",
  description: "A powerful, open-source task management and project collaboration tool. Built with modern technologies, free forever. Self-host or use our cloud version.",
  keywords: ["task management", "project management", "kanban", "trello alternative", "open source", "collaboration"],
  authors: [{ name: "Mello Team" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/mello-icon.svg",
  },
  openGraph: {
    title: "Mello - Open Source Task Management",
    description: "A powerful, open-source task management and project collaboration tool. Free forever.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
