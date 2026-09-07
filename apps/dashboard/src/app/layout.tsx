import type { Metadata } from 'next';
import './globals.css';
import DashboardShell from '@/components/dashboard-shell';
import { Toaster } from 'react-hot-toast';
import { CommandPalette } from '@/components/ui/command-palette';
export const metadata: Metadata = { title: { default: 'ReadyCommerce Admin', template: '%s · ReadyCommerce' }, description: 'ReadyCommerce commerce operations dashboard.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><DashboardShell>{children}</DashboardShell><CommandPalette /><Toaster position="top-right" /></body></html>; }
