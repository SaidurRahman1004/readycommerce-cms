'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { CustomerOrder, orderService } from '@/services/api-service';

const TRACKING_STEPS = ['pending', 'processing', 'shipped', 'delivered'] as const;

function statusClass(status: string) {
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (status === 'shipped') return 'bg-indigo-50 text-indigo-700';
  if (status === 'cancelled' || status === 'refunded' || status === 'returned') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

function OrderTimeline({ status, t }: { status: string; t: (key: string, values?: Record<string, string | number>) => string }) {
  const terminal = ['cancelled', 'refunded', 'returned'].includes(status);
  const normalizedStatus = status === 'confirmed' ? 'processing' : status;
  const currentIndex = TRACKING_STEPS.indexOf(normalizedStatus as typeof TRACKING_STEPS[number]);
  return <div className="mt-6 rounded-2xl border border-border/80 bg-surface/70 p-4 sm:p-5">
    {terminal ? <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100">!</span>{t(`status.${status}`)}</div> : <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {TRACKING_STEPS.map((step, index) => { const complete = currentIndex >= index; return <div key={step} className="relative text-center">
        {index < TRACKING_STEPS.length - 1 && <span className={`absolute left-[calc(50%+15px)] right-[calc(-50%+15px)] top-3 h-0.5 ${currentIndex > index ? 'bg-primary' : 'bg-border'}`} aria-hidden="true" />}
        <span className={`relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold ${complete ? 'border-primary bg-primary text-white' : 'border-border bg-background text-muted-foreground'}`}>{complete ? '✓' : index + 1}</span>
        <span className={`mt-2 block text-[10px] font-semibold sm:text-xs ${complete ? 'text-foreground' : 'text-muted-foreground'}`}>{t(`status.${step}`)}</span>
      </div>; })}
    </div>}
  </div>;
}

export default function AccountOrders() {
  const t = useTranslations('Account');
  const t13 = useTranslations('Phase13F');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState('');

  useEffect(() => { orderService.myOrders().then((result) => setOrders(result.data)).catch(() => toast.error(t('errors.generic'))).finally(() => setLoading(false)); }, [t]);

  const cancel = async (id: string) => {
    setCancelling(id);
    try { await orderService.cancel(id); setOrders((current) => current.map((order) => order._id === id ? { ...order, status: 'cancelled' } : order)); toast.success(t13('status.cancelled')); }
    catch { toast.error(t('errors.generic')); }
    finally { setCancelling(''); }
  };

  return <section className="rounded-2xl border border-border bg-background p-5 sm:p-7">
    <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">{t('orders.title')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('orders.description')}</p></div>{loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-label={t('loading')} />}</div>
    {!loading && !orders.length && <p className="mt-8 text-sm text-muted-foreground">{t('orders.description')}</p>}
    <div className="mt-7 space-y-4">{orders.map((order) => <article key={order._id} className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} <span aria-hidden="true">·</span> ৳{order.total.toLocaleString()}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(order.status)}`}>{t13(`status.${order.status}`)}</span>{order.status === 'pending' && <button type="button" disabled={cancelling === order._id} onClick={() => cancel(order._id)} className="text-sm font-semibold text-rose-600 disabled:opacity-50">{cancelling === order._id ? t('loading') : t('addresses.remove')}</button>}</div></div>
      <OrderTimeline status={order.status} t={t13} />
    </article>)}</div>
  </section>;
}
