import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Hind_Siliguri } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import StorefrontShell from '@/components/store/storefront-shell';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-primary",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-sans-bengali",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'ReadyCommerce', template: '%s | ReadyCommerce' },
  description: 'Premium beauty, fragrance and lifestyle essentials for considered everyday rituals.',
  manifest: "/manifest.json",
  openGraph: { type: 'website', siteName: 'ReadyCommerce', title: 'ReadyCommerce', description: 'Premium beauty, fragrance and lifestyle essentials.' },
  twitter: { card: 'summary_large_image', title: 'ReadyCommerce', description: 'Premium beauty, fragrance and lifestyle essentials.' },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReadyCommerce",
  },
};

export const viewport = {
  themeColor: "#4f46e5",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${plusJakartaSans.variable} ${hindSiliguri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <StorefrontShell locale={locale}>{children}</StorefrontShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
