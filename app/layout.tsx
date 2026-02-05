import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'Family Finance - Budget, Save, Grow',
  description: 'Track your family budget, savings, pension (IPP), and net worth',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Family Finance',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <div className="mx-auto min-h-screen max-w-md bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}