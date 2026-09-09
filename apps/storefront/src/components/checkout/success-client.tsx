'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ShoppingBag, ArrowRight, PackageCheck, Clock, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function SuccessClient() {
  const t = useTranslations('Success');
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setOrderId(
          searchParams.get('orderId') ||
            window.localStorage.getItem('readycommerce_last_order_id') ||
            ''
        ),
      0
    );
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-16 text-center animate-in fade-in duration-300">
      {/* Top Brand Logo */}
      <Link href="/" className="absolute left-5 top-6 flex items-center gap-3 sm:left-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background shadow-md">
          R
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          ReadyCommerce
        </span>
      </Link>

      <div className="w-full max-w-xl">
        {/* Animated Green Checkmark with Double Ring */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-100">
          <CheckCircle2 className="h-12 w-12 stroke-[2.25]" />
        </div>

        {/* Eyebrow & Main Heading */}
        <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-600">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          {t('description')}
        </p>

        {/* Order Details Card */}
        <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('orderLabel')}
              </p>
              <p className="mt-1 font-mono text-xl font-bold tracking-wide text-foreground">
                {orderId || 'PENDING-CONFIRMATION'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Confirmed
            </span>
          </div>

          {/* Timeline Summary */}
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <PackageCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>We have received your order details and are preparing packaging.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
              <span>Estimated delivery within 24–48 hours across Bangladesh.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>Receipt and tracking updates dispatched via email and SMS.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/account/orders"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-8 text-[15px] font-bold text-white shadow-premium transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95"
          >
            <span>View Order in Account</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/shop"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-7 text-[15px] font-bold text-foreground transition-all hover:bg-muted active:scale-95"
          >
            <ShoppingBag className="h-4 w-4 text-slate-500" />
            <span>{t('continue')}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
