'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Archive, BarChart3, Bell, CreditCard, FileText, Home, Image, Layout, Menu,
  Package, Percent, RotateCcw, Settings, Shield, ShoppingCart, Star, Tags, Users, X,
  type LucideIcon,
} from 'lucide-react';
import { ErrorState, Skeleton } from './ui/primitives';

type Locale = 'en' | 'bn';
type AccessState = 'loading' | 'allowed' | 'denied' | 'error';
type StaffRole = 'super-admin' | 'manager' | 'editor' | 'support';
type AdminIdentity = { firstName: string; lastName: string; email: string; role: StaffRole };
type NavItem = { key: string; icon: LucideIcon; href?: string; roles?: readonly StaffRole[] };

const ALL_STAFF: readonly StaffRole[] = ['super-admin', 'manager', 'editor', 'support'];
const SUPER_ADMIN: readonly StaffRole[] = ['super-admin'];
const ORDER_ROLES: readonly StaffRole[] = ['super-admin', 'manager', 'support'];
const CATALOG_ROLES: readonly StaffRole[] = ['super-admin', 'manager', 'editor'];
const CUSTOMER_ROLES: readonly StaffRole[] = ['super-admin', 'manager', 'support'];
const CONTENT_ROLES: readonly StaffRole[] = ['super-admin', 'manager', 'editor'];

const copy = {
  en: {
    admin: 'Admin workspace', workspace: 'A calm view of your commerce.', operations: 'Operations', administrator: 'Administrator',
    unauthorized: 'You do not have administrator access.', open: 'Open navigation', close: 'Close navigation',
    language: 'Switch language', notifications: 'Notifications', user: 'Admin user', verifyError: 'Unable to verify administrator session.',
    comingSoon: '🚀 This module is under development and coming soon!',
    nav: {
      overview: 'Overview', orders: 'Orders', payments: 'Payments', products: 'Products', categories: 'Categories',
      inventory: 'Inventory', customers: 'Customers', reviews: 'Reviews', coupons: 'Coupons & Promotions', cms: 'Website CMS',
      media: 'Media Library', analytics: 'Analytics & Reports', returns: 'Returns & Refunds', notifications: 'Notifications',
      team: 'Team & Roles', settings: 'Settings', audit: 'Audit Logs',
    },
  },
  bn: {
    admin: 'অ্যাডমিন ওয়ার্কস্পেস', workspace: 'আপনার কমার্স পরিচালনার একটি স্বচ্ছ চিত্র।', operations: 'অপারেশনস',
    administrator: 'অ্যাডমিনিস্ট্রেটর', unauthorized: 'আপনার অ্যাডমিন অ্যাক্সেস নেই।', open: 'নেভিগেশন খুলুন',
    close: 'নেভিগেশন বন্ধ করুন', language: 'ভাষা পরিবর্তন করুন', notifications: 'নোটিফিকেশন', user: 'অ্যাডমিন ইউজার',
    verifyError: 'অ্যাডমিন সেশন যাচাই করা যায়নি।', comingSoon: '🚀 এই মডিউলটি নির্মাণাধীন এবং শীঘ্রই আসছে!',
    nav: {
      overview: 'ওভারভিউ', orders: 'অর্ডার', payments: 'পেমেন্ট', products: 'পণ্য', categories: 'ক্যাটাগরি',
      inventory: 'ইনভেন্টরি', customers: 'কাস্টমার', reviews: 'রিভিউ', coupons: 'কুপন ও প্রোমোশন', cms: 'ওয়েবসাইট CMS',
      media: 'মিডিয়া লাইব্রেরি', analytics: 'অ্যানালিটিক্স ও রিপোর্ট', returns: 'রিটার্ন ও রিফান্ড',
      notifications: 'নোটিফিকেশন', team: 'টিম ও রোল', settings: 'সেটিংস', audit: 'অডিট লগ',
    },
  },
} as const;

const navItems: NavItem[] = [
  { key: 'overview', icon: Home, href: '/', roles: ALL_STAFF },
  { key: 'orders', icon: ShoppingCart, href: '/orders', roles: ORDER_ROLES },
  { key: 'payments', icon: CreditCard, roles: ORDER_ROLES },
  { key: 'products', icon: Package, href: '/products', roles: CATALOG_ROLES },
  { key: 'categories', icon: Tags, href: '/categories', roles: CATALOG_ROLES },
  { key: 'inventory', icon: Archive, href: '/inventory', roles: CATALOG_ROLES },
  { key: 'customers', icon: Users, href: '/customers', roles: CUSTOMER_ROLES },
  { key: 'reviews', icon: Star, href: '/reviews', roles: ALL_STAFF },
  { key: 'coupons', icon: Percent, href: '/coupons', roles: CONTENT_ROLES },
  { key: 'cms', icon: Layout, href: '/cms', roles: ['super-admin', 'editor'] },
  { key: 'media', icon: Image, href: '/media-library', roles: ['super-admin', 'editor'] },
  { key: 'analytics', icon: BarChart3, href: '/analytics', roles: ['super-admin', 'manager'] },
  { key: 'returns', icon: RotateCcw, roles: ORDER_ROLES },
  { key: 'notifications', icon: Bell, roles: ALL_STAFF },
  { key: 'team', icon: Shield, href: '/team-&-roles', roles: SUPER_ADMIN },
  { key: 'settings', icon: Settings, href: '/settings', roles: SUPER_ADMIN },
  { key: 'audit', icon: FileText, href: '/audit-logs', roles: SUPER_ADMIN },
];

const isActiveRoute = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const [access, setAccess] = useState<AccessState>('loading');
  const [user, setUser] = useState<AdminIdentity | null>(null);
  const pathname = usePathname();
  const t = copy[locale];

  useEffect(() => {
    const controller = new AbortController();
    const api = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${api}/admin/access`, { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          const body = await response.json();
          setUser(body.data.user as AdminIdentity);
          setAccess('allowed');
        } else if (response.status === 401 || response.status === 403) setAccess('denied');
        else setAccess('error');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setAccess('error');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (access === 'loading') return <main className="flex min-h-screen items-center justify-center p-6"><Skeleton className="h-32 w-full max-w-xl" /></main>;
  if (access === 'denied') return <main className="flex min-h-screen items-center justify-center p-6"><ErrorState title={t.unauthorized} retry={() => window.location.reload()} /></main>;
  if (access === 'error') return <main className="flex min-h-screen items-center justify-center p-6"><ErrorState title={t.verifyError} retry={() => window.location.reload()} /></main>;

  const handleComingSoon = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    toast(t.comingSoon, { duration: 3500 });
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto border-r border-border bg-white/95 p-5 shadow-xl backdrop-blur-xl transition-transform duration-300 sm:p-6 md:static md:w-72 md:shrink-0 md:translate-x-0 md:shadow-none`} aria-label={t.operations}>
        <div className="flex items-center gap-3 border-b border-border pb-7">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-white">R</span>
          <div className="min-w-0 flex-1"><p className="truncate font-bold">ReadyCommerce</p><p className="truncate text-xs text-slate-500">{t.admin}</p></div>
          <button type="button" aria-label={t.close} onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-muted md:hidden"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <nav className="mt-8 space-y-1.5" aria-label={t.operations}>
          {navItems.filter((item) => user && item.roles?.includes(user.role)).map(({ key, icon: Icon, href }) => {
            const label = t.nav[key as keyof typeof t.nav];
            const active = href ? isActiveRoute(pathname, href) : false;
            const styles = `flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${active ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-muted hover:text-foreground'}`;
            return href ? (
              <Link href={href} key={key} aria-current={active ? 'page' : undefined} className={styles}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{label}</span>
              </Link>
            ) : (
              <a href="#" key={key} onClick={handleComingSoon} aria-disabled="true" className={styles}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="flex-1">{label}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">Soon</span>
              </a>
            );
          })}
        </nav>
      </aside>
      {open && <button type="button" aria-label={t.close} onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px] md:hidden" />}
      <div className="min-w-0 flex-1">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-border bg-white/75 px-4 py-4 backdrop-blur-xl sm:gap-4 sm:px-8">
          <button type="button" aria-label={t.open} onClick={() => setOpen(true)} className="rounded-xl border border-border p-2.5 text-slate-700 md:hidden"><Menu className="h-5 w-5" aria-hidden="true" /></button>
          <div className="hidden md:block"><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{t.operations}</p><p className="mt-1 text-sm text-slate-500">{t.workspace}</p></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')} className="rounded-full border border-border px-3 py-2 text-xs font-bold" aria-label={t.language}>{locale === 'en' ? 'BN' : 'EN'}</button>
            <button type="button" aria-label={t.notifications} onClick={() => toast(t.comingSoon, { duration: 3500 })} className="relative rounded-xl border border-border p-2.5"><Bell className="h-4 w-4" aria-hidden="true" /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" /></button>
            <span className="hidden text-right sm:block"><span className="block text-sm font-bold">{user ? `${user.firstName} ${user.lastName}` : t.user}</span><span className="block text-xs capitalize text-slate-500">{user?.role.replace('-', ' ') || t.administrator}</span></span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold uppercase text-primary">{user?.firstName?.[0] || 'A'}</span>
          </div>
        </header>
        <main className="p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
