'use client';
import {useTranslations} from 'next-intl';
import {useSearchParams} from 'next/navigation';
import {Link} from '@/i18n/routing';
import {Suspense} from 'react';

function SuccessContent() {
  const t = useTranslations('Success');
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'RC-UNKNOWN';
  return <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafbff] px-5 py-16 text-center"><Link href="/" className="absolute left-5 top-6 flex items-center gap-3 sm:left-8"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">R</span><span className="text-[15px] font-semibold tracking-tight text-slate-950">ReadyCommerce</span></Link><div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-5xl text-emerald-600 shadow-inner">✓</div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">{t('eyebrow')}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl">{t('title')}</h1><p className="mt-5 max-w-md text-base leading-7 text-slate-500">{t('description')}</p><div className="mt-8 rounded-2xl border border-slate-200 bg-white px-8 py-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t('orderLabel')}</p><p className="mt-2 text-lg font-semibold tracking-wide text-slate-950">{orderId}</p></div><Link href="/shop" className="mt-9 inline-flex min-h-12 items-center rounded-full bg-slate-950 px-7 text-sm font-semibold text-white shadow-xl shadow-slate-950/10 transition hover:bg-indigo-700">{t('continue')}</Link></main>;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafbff]">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
