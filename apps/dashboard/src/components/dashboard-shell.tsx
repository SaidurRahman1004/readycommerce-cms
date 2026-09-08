'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Archive, BarChart3, Bell, CreditCard, FileText, Home, Image, Layout, Menu,
  Package, Percent, RotateCcw, Settings, Shield, ShoppingCart, Sparkles, Star, Tags, Users, X,
  LogOut, Lock, Mail, ArrowRight, Loader2,
  type LucideIcon,
} from 'lucide-react';
import { ErrorState, Skeleton } from './ui/primitives';
import NotificationBell from './notification-bell';

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
      inventory: 'Inventory', customers: 'Customers', reviews: 'Reviews', coupons: 'Coupons & Promotions', campaigns: 'Campaigns & Landing', cms: 'Website CMS',
      media: 'Media Library', analytics: 'Analytics & Reports', returns: 'Returns & Refunds', notifications: 'Notifications',
      team: 'Team & Roles', settings: 'Settings', audit: 'Audit Logs',
    },
  },
  bn: {
    admin: 'অ্যাডমিন ওয়ার্কস্পেস', workspace: 'আপনার বাণিজ্যের একটি স্থির চিত্র।', operations: 'অপারেশনস', administrator: 'অ্যাডমিনিস্ট্রেটর',
    unauthorized: 'আপনার অ্যাডমিন অ্যাক্সেস নেই।', open: 'মেনু খুলুন', close: 'মেনু বন্ধ করুন',
    language: 'ভাষা পরিবর্তন', notifications: 'নোটিফিকেশন', user: 'অ্যাডমিন ব্যবহারকারী',
    verifyError: 'অ্যাডমিন সেশন যাচাই করা যায়নি।', comingSoon: '🚀 এই মডিউলটি নির্মাণাধীন এবং শীঘ্রই আসছে!',
    nav: {
      overview: 'ওভারভিউ', orders: 'অর্ডার', payments: 'পেমেন্ট', products: 'পণ্য', categories: 'ক্যাটাগরি',
      inventory: 'ইনভেন্টরি', customers: 'কাস্টমার', reviews: 'রিভিউ', coupons: 'কুপন ও প্রোমোশন', campaigns: 'ক্যাম্পেইন ও ল্যান্ডিং', cms: 'ওয়েবসাইট CMS',
      media: 'মিডিয়া লাইব্রেরি', analytics: 'অ্যানালিটিক্স ও রিপোর্ট', returns: 'রিটার্ন ও রিফান্ড',
      notifications: 'নোটিফিকেশন', team: 'টিম ও রোল', settings: 'সেটিংস', audit: 'অডিট লগ',
    },
  },
} as const;

const navItems: NavItem[] = [
  { key: 'overview', icon: Home, href: '/', roles: ALL_STAFF },
  { key: 'orders', icon: ShoppingCart, href: '/orders', roles: ORDER_ROLES },
  { key: 'returns', icon: RotateCcw, href: undefined, roles: ORDER_ROLES },
  { key: 'payments', icon: CreditCard, href: undefined, roles: ['super-admin', 'manager'] },
  { key: 'products', icon: Package, href: '/products', roles: CATALOG_ROLES },
  { key: 'categories', icon: Tags, href: '/categories', roles: CATALOG_ROLES },
  { key: 'inventory', icon: Archive, href: '/inventory', roles: CATALOG_ROLES },
  { key: 'customers', icon: Users, href: '/customers', roles: CUSTOMER_ROLES },
  { key: 'reviews', icon: Star, href: '/reviews', roles: ALL_STAFF },
  { key: 'coupons', icon: Percent, href: '/coupons', roles: CONTENT_ROLES },
  { key: 'campaigns', icon: Sparkles, href: '/campaigns', roles: CONTENT_ROLES },
  { key: 'cms', icon: Layout, href: '/cms', roles: ['super-admin', 'editor'] },
  { key: 'media', icon: Image, href: '/media-library', roles: ['super-admin', 'editor'] },
  { key: 'analytics', icon: BarChart3, href: '/analytics', roles: ['super-admin', 'manager'] },
  { key: 'notifications', icon: Bell, href: '/notifications', roles: ['super-admin', 'manager'] },
  { key: 'team', icon: Shield, href: '/team-&-roles', roles: SUPER_ADMIN },
  { key: 'settings', icon: Settings, href: '/settings', roles: SUPER_ADMIN },
  { key: 'audit', icon: FileText, href: '/audit-logs', roles: SUPER_ADMIN },
];

const isActiveRoute = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

function AdminLoginCard({ onLoginSuccess }: { onLoginSuccess: (user: AdminIdentity) => void }) {
  const [email, setEmail] = useState('siyamsdev2005@gmail.com');
  const [password, setPassword] = useState('siyamsdev2005@');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    const api = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      const res = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Login failed.');
      }

      const accessRes = await fetch(`${api}/admin/access`, { credentials: 'include' });
      if (!accessRes.ok) {
        throw new Error('User logged in, but lacks administrative privileges.');
      }
      const accessData = await accessRes.json();
      toast.success(`Welcome back, ${accessData.data.user.firstName}!`);
      onLoginSuccess(accessData.data.user as AdminIdentity);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-2xl font-black text-white shadow-md">
            R
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Admin Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage ReadyCommerce store & campaigns
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
          <div className="flex items-center justify-between font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>Configured Super-Admin:</span>
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase">Active</span>
          </div>
          <p className="mt-1.5 font-mono text-slate-700">
            <strong>Email:</strong> siyamsdev2005@gmail.com
          </p>
          <p className="mt-0.5 font-mono text-slate-700">
            <strong>Pass:</strong> siyamsdev2005@
          </p>
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={loading}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>⚡ Instant One-Click Login</span>}
          </button>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@readycommerce.com"
                className="h-11 w-full rounded-xl border border-border bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-border bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white shadow-lg transition hover:bg-black active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const [access, setAccess] = useState<AccessState>('loading');
  const [user, setUser] = useState<AdminIdentity | null>(null);
  const pathname = usePathname();
  const t = copy[locale];

  const checkAccess = (signal?: AbortSignal) => {
    const api = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${api}/admin/access`, { credentials: 'include', signal })
      .then(async (response) => {
        if (response.ok) {
          const body = await response.json();
          setUser(body.data.user as AdminIdentity);
          setAccess('allowed');
        } else if (response.status === 401 || response.status === 403) {
          setAccess('denied');
        } else {
          setAccess('error');
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setAccess('error');
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    checkAccess(controller.signal);
    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    const api = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      await fetch(`${api}/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      setAccess('denied');
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Logout error.');
    }
  };

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
  if (access === 'denied') return <AdminLoginCard onLoginSuccess={(loggedInUser) => { setUser(loggedInUser); setAccess('allowed'); }} />;
  if (access === 'error') return <main className="flex min-h-screen items-center justify-center p-6"><ErrorState title={t.verifyError} retry={() => checkAccess()} /></main>;

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
            <NotificationBell label={t.notifications} />
            <span className="hidden text-right sm:block"><span className="block text-sm font-bold">{user ? `${user.firstName} ${user.lastName}` : t.user}</span><span className="block text-xs capitalize text-slate-500">{user?.role.replace('-', ' ') || t.administrator}</span></span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold uppercase text-primary">{user?.firstName?.[0] || 'A'}</span>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
