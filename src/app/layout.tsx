import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workforcely - Enterprise HR Management & People Intelligence',
  description: 'Enterprise HR Management Platform, Payroll, Attendance, LMS, and Scoped AI Analytics for modern businesses',
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
