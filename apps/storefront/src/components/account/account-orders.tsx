'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { CustomerOrder, orderService } from '@/services/api-service';

export default function AccountOrders() {
  const t = useTranslations('Account'); const [orders, setOrders] = useState<CustomerOrder[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { orderService.myOrders().then((result) => setOrders(result.data)).catch(() => toast.error(t('errors.generic'))).finally(() => setLoading(false)); }, [t]);
  const statusClass = (status: string) => status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : status === 'shipped' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700';
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">{t('orders.title')}</h2><p className="mt-2 text-sm text-slate-500">{t('orders.description')}</p></div>{loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />}</div>{!loading && !orders.length && <p className="mt-8 text-sm text-slate-500">{t('orders.description')}</p>}{!loading && <div className="mt-7 space-y-3">{orders.map((order) => <div key={order._id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()} · ৳{order.total.toLocaleString()}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(order.status)}`}>{t(`orders.status.${order.status}`, { fallback: order.status === 'pending' ? 'Pending' : order.status })}</span></div></div>)}</div>}</section>;
}
