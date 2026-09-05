'use client';

import {useEffect, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';

export default function SuccessClient() {
  const t = useTranslations('Success'); const searchParams = useSearchParams(); const [orderId, setOrderId] = useState('');
  useEffect(() => {const timer = window.setTimeout(() => setOrderId(searchParams.get('orderId') || window.localStorage.getItem('readycommerce_last_order_id') || ''), 0); return () => window.clearTimeout(timer);}, [searchParams]);
  return <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-20 text-center animate-in fade-in zoom-in duration-500"><Link href="/" className="absolute left-5 top-6 flex items-center gap-3 sm:left-8"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background shadow-md">R</span><span className="text-[17px] font-semibold tracking-tight text-foreground">ReadyCommerce</span></Link><div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-emerald-50 text-5xl text-emerald-500 shadow-sm">✓</div><p className="mt-10 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{t('eyebrow')}</p><h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground sm:text-7xl">{t('title')}</h1><p className="mt-6 max-w-[460px] text-[16px] leading-relaxed text-muted-foreground">{t('description')}</p><div className="mt-10 rounded-[1.5rem] border border-border bg-surface px-10 py-7 shadow-sm"><p className="text-[13px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('orderLabel')}</p><p className="mt-2.5 text-2xl font-bold tracking-wide text-foreground">{orderId || '—'}</p></div><Link href="/shop" className="mt-12 inline-flex min-h-[56px] items-center justify-center rounded-xl bg-primary px-10 text-[15px] font-bold text-white shadow-premium transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95">{t('continue')}</Link></main>;
}
