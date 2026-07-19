import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  title: 'Recipe Vault',
  description: "Reba's private recipe & meal-planning vault.",
  manifest: 'manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Recipe Vault' },
  icons: {
    icon: 'icon-192.png',
    apple: 'apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A1613',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-bg font-sans text-ink antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
