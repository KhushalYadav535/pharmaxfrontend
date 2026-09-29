import type { Metadata } from 'next';
import { Inter, Anton, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import QueryProvider from '@/lib/query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-display' });
const grot = Space_Grotesk({ subsets: ['latin'], variable: '--font-grot', weight: ['400', '500', '600', '700'] });
const jbmono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono', weight: ['400', '500', '700'] });

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
    <html lang="en" className={`${inter.variable} ${anton.variable} ${grot.variable} ${jbmono.variable}`}>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
