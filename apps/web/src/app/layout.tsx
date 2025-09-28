/**
 * Elite Web Application Layout
 * 
 * Root layout component with providers, metadata, and global styling
 * for the Nationwide Toll Hub web application.
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { Navigation } from '@/components/navigation/navigation';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Nationwide Toll Hub',
    template: '%s | Nationwide Toll Hub',
  },
  description: 'Manage your toll payments, view statements, and track expenses across all toll agencies nationwide.',
  keywords: ['toll', 'payments', 'statements', 'expenses', 'transportation'],
  authors: [{ name: 'Nationwide Toll Hub Team' }],
  creator: 'Nationwide Toll Hub',
  publisher: 'Nationwide Toll Hub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nationwidetollhub.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nationwidetollhub.com',
    title: 'Nationwide Toll Hub',
    description: 'Manage your toll payments, view statements, and track expenses across all toll agencies nationwide.',
    siteName: 'Nationwide Toll Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nationwide Toll Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nationwide Toll Hub',
    description: 'Manage your toll payments, view statements, and track expenses across all toll agencies nationwide.',
    images: ['/og-image.png'],
    creator: '@nationwidetollhub',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Toll Hub" />
        <meta name="application-name" content="Nationwide Toll Hub" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable
      )}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthProvider>
                <ToastProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <Navigation />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                </ToastProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
