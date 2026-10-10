import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import QueryProvider from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'Field Pulse® — Pharma Sales, Supercharged',
  description:
    'The AI-powered commercial excellence platform for pharma field forces. Doctor CRM, visit tracking, distributor excellence and an AI copilot — all in one place.',
  keywords: ['pharmaceutical', 'CRM', 'sales force automation', 'doctor engagement', 'medical representative', 'AI copilot'],
  openGraph: {
    title: 'Field Pulse® — Pharma Sales, Supercharged',
    description: 'AI-powered commercial excellence platform for pharma field forces.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

