import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';
import { PWAProvider } from '@/components/pwa/PWAProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExpenseAI — Smart AI-Powered Expense Tracking for India',
  description: 'Track your expenses in INR with AI-powered categorization. Built for Indian users with smart budgets, group splitting, and beautiful analytics.',
  keywords: 'expense tracker, india, INR, money management, budget, AI, finance, pwa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ExpenseAI',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#06070e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#7c3aed',
          colorBackground: '#0a0b14',
          colorInputBackground: '#12131f',
          colorInputText: '#e2e8f0',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8',
        },
        elements: {
          formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20',
          card: 'bg-[#0e0f1a] shadow-2xl border border-white/[0.06]',
          headerTitle: 'text-white font-display',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]',
          formFieldLabel: 'text-gray-400',
          formFieldInput: 'bg-white/[0.04] border-white/[0.08] text-white focus:border-violet-500/40',
          footerActionLink: 'text-violet-400 hover:text-violet-300',
          identityPreviewEditButton: 'text-violet-400',
        },
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={inter.className}>
          {/* Subtle noise overlay for texture */}
          <div className="noise-overlay" />
          <PWAProvider>
            {children}
          </PWAProvider>
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: 'rgba(14, 15, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
