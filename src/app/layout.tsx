import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import QueryProvider from '@/lib/query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pharmax — Pharmaceutical Commercial Excellence Platform',
  description: 'AI-powered platform for pharmaceutical sales teams. Manage doctors, retailers, distributors, visits, and analytics — all in one place.',
  keywords: ['pharmaceutical', 'CRM', 'sales force automation', 'doctor engagement', 'medical representative'],
  openGraph: {
    title: 'Pharmax',
    description: 'Pharmaceutical Commercial Excellence Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
