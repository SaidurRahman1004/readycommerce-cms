'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link, usePathname, useRouter} from '@/i18n/routing';
import toast from 'react-hot-toast';
import {useAuth} from '@/components/auth/auth-context';

export default function AccountShell({children}: {children: React.ReactNode}) {
  const t = useTranslations('Account'); const pathname = usePathname(); const router = useRouter(); const [loggingOut, setLoggingOut] = useState(false); const {user, loading: authLoading, logout: clearSession} = useAuth();
  useEffect(() => {if (!authLoading && !user) router.replace('/login');}, [authLoading, user, router]);
  const logout = async () => {setLoggingOut(true); try {await clearSession(); toast.success(t('logoutSuccess')); router.push('/');} catch {toast.error(t('errors.generic'));} finally {setLoggingOut(false);}};
  if (authLoading || !user) return <main className="flex min-h-screen items-center justify-center bg-[#fafbff] text-sm text-slate-500">{t('loading')}</main>;
  const links = [{href: '/account/profile', key: 'profile'}, {href: '/account/orders', key: 'orders'}, {href: '/account/addresses', key: 'addresses'}] as const;
  return <main className="min-h-screen bg-[#fafbff] text-slate-950"><div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><div className="mb-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{t('eyebrow')}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{t('title')}</h1></div><div className="grid gap-8 lg:grid-cols-[230px_1fr] lg:gap-14"><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-28"><nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">{links.map((link) => <Link key={link.key} href={link.href} className={`block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === link.href ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}>{t(`navigation.${link.key}`)}</Link>)}<button type="button" disabled={loggingOut} onClick={logout} className="block w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">{loggingOut ? t('loading') : t('navigation.logout')}</button></nav></aside><section className="min-w-0">{children}</section></div></div></main>;
}
