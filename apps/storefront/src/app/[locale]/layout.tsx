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
  title: "ReadyCommerce CMS",
  description: "Premium self-hosted commerce platform",
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
