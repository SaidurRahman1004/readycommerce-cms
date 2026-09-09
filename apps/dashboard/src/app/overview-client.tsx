'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService, type AdminOverview } from '../services/api-service';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/primitives';
import { Breadcrumbs, PageHeader } from '../components/ui/page-header';
import { AlertCircle, Package, TrendingUp, Users, Megaphone, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Locale = 'en' | 'bn';
const copy = {
  en: { 
    overview: 'Overview', title: 'Command Center', description: 'A live operational view of your commerce business.', range: 'Range', days7: '7 Days', days30: '30 Days', 
    revenue: 'Total Revenue', today: 'Today', orders: 'Total Orders', customers: 'New Customers', products: 'Active Products', pending: 'Pending Fulfillment', low: 'Low stock', out: 'Out of stock', 
    trend: 'Revenue Trend', trendDescription: 'Paid orders over time', status: 'Order status', recent: 'Recent orders', inventory: 'Inventory attention', 
    noSales: 'No sales data for this period.', noOrders: 'No recent orders.', noStock: 'No low-stock products.', order: 'Order', customer: 'Customer', amount: 'Amount', date: 'Date', stock: 'Stock', threshold: 'Threshold', 
    action: 'View', unavailable: 'Coming soon', paid: 'Paid', paymentPending: 'Pending', retry: 'Retry', loadError: 'Overview data could not be loaded.',
    actionCenter: 'Action Center', actionRequired: 'Action Required', inventoryAlert: 'Inventory Alert', demandAlert: 'Demand Alert', 
    campaigns: 'Active Campaigns', restockLeads: 'Restock Leads', pendingRestocks: 'Customers waiting', topProducts: 'Top Products', topProductsDesc: 'By revenue', views: 'Views', conversions: 'Conversions', sales: 'Sales'
  },
  bn: { 
    overview: 'ওভারভিউ', title: 'কমান্ড সেন্টার', description: 'আপনার কমার্স ব্যবসার লাইভ অপারেশনাল ভিউ।', range: 'সময়কাল', days7: '৭ দিন', days30: '৩০ দিন', 
    revenue: 'মোট রাজস্ব', today: 'আজকের', orders: 'মোট অর্ডার', customers: 'নতুন কাস্টমার', products: 'সক্রিয় পণ্য', pending: 'অপেক্ষমাণ অর্ডার', low: 'কম স্টক', out: 'স্টক শেষ', 
    trend: 'রাজস্ব ট্রেন্ড', trendDescription: 'সময়ের সাথে পরিশোধিত অর্ডার', status: 'অর্ডার স্ট্যাটাস', recent: 'সাম্প্রতিক অর্ডার', inventory: 'ইনভেন্টরি মনোযোগ', 
    noSales: 'এই সময়কালে কোনো বিক্রয় তথ্য নেই।', noOrders: 'কোনো সাম্প্রতিক অর্ডার নেই।', noStock: 'কম স্টকের কোনো পণ্য নেই।', order: 'অর্ডার', customer: 'কাস্টমার', amount: 'পরিমাণ', date: 'তারিখ', stock: 'স্টক', threshold: 'সীমা', 
    action: 'দেখুন', unavailable: 'শীঘ্রই আসছে', paid: 'পরিশোধিত', paymentPending: 'অপেক্ষমাণ', retry: 'আবার চেষ্টা করুন', loadError: 'ওভারভিউ তথ্য লোড করা যায়নি।',
    actionCenter: 'অ্যাকশন সেন্টার', actionRequired: 'পদক্ষেপ প্রয়োজন', inventoryAlert: 'ইনভেন্টরি অ্যালার্ট', demandAlert: 'চাহিদা অ্যালার্ট', 
    campaigns: 'সক্রিয় ক্যাম্পেইন', restockLeads: 'রিস্টক লিড', pendingRestocks: 'অপেক্ষমাণ কাস্টমার', topProducts: 'শীর্ষ পণ্য', topProductsDesc: 'রাজস্ব অনুযায়ী', views: 'ভিউ', conversions: 'কনভার্সন', sales: 'বিক্রয়'
  },
} as const;

const statusLabels: Record<string, [string, string]> = { pending: ['Pending', 'অপেক্ষমাণ'], confirmed: ['Confirmed', 'নিশ্চিত'], processing: ['Processing', 'প্রক্রিয়াধীন'], shipped: ['Shipped', 'শিপড'], delivered: ['Delivered', 'ডেলিভারড'], cancelled: ['Cancelled', 'বাতিল'], failed: ['Failed', 'ব্যর্থ'], returned: ['Returned', 'ফেরত'], refunded: ['Refunded', 'রিফান্ডেড'] };
const money = (value: number, locale: Locale) => new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value);
const dateText = (value: string, locale: Locale) => new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'short' }).format(new Date(value));

function Badge({ value, kind = 'neutral', locale }: { value: string; kind?: string; locale: Locale }) { const label = kind === 'status' ? statusLabels[value]?.[locale === 'bn' ? 1 : 0] || value : value === 'paid' ? (locale === 'bn' ? 'পরিশোধিত' : 'Paid') : (locale === 'bn' ? 'অপেক্ষমাণ' : 'Pending'); return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${kind === 'status' ? `status-${value}` : value === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{label}</span>; }

function Kpi({ label, value, detail, icon: Icon, tone = 'primary' }: { label: string; value: string | number; detail?: string; icon: React.ElementType; tone?: 'primary' | 'amber' | 'rose' | 'emerald' }) { 
  const tones = {
    primary: 'bg-primary text-white', amber: 'bg-amber-400 text-amber-950', rose: 'bg-rose-500 text-white', emerald: 'bg-emerald-500 text-white'
  };
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]">
      <div className={`absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full opacity-10 ${tones[tone]}`}>
        <Icon className="h-8 w-8" />
      </div>
      <div className={`mb-4 inline-flex items-center justify-center rounded-xl p-2.5 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      {detail && <p className="mt-2 text-sm font-medium text-slate-500">{detail}</p>}
    </article>
  ); 
}

export default function OverviewClient() {
  const [locale, setLocale] = useState<Locale>('en'); 
  const [range, setRange] = useState<7 | 30>(7); 
  const [data, setData] = useState<AdminOverview | null>(null); 
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'); 
  const t = copy[locale];

  const load = useCallback(() => { 
    setState('loading'); 
    adminService.overview(range).then((result) => { 
      setData(result.data); 
      setState('ready'); 
    }).catch(() => setState('error')); 
  }, [range]);

  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  const maxRevenue = useMemo(() => Math.max(...(data?.revenue.trend.map((item) => item.amount) || [0]), 1), [data]);
  
  if (state === 'loading') return <OverviewSkeleton />;
  if (state === 'error' || !data) return <div className="mx-auto max-w-7xl"><ErrorState title={t.loadError} retry={load} retryLabel={t.retry} /></div>;

  const pendingOrders = (data.orders.byStatus.pending || 0) + (data.orders.byStatus.processing || 0);

  return (
    <section className="mx-auto max-w-7xl pb-12">
      <Breadcrumbs items={[{ label: t.overview }]} />
      <PageHeader 
        eyebrow="ReadyCommerce" 
        title={t.title} 
        description={t.description} 
        action={
          <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1" aria-label={t.range}>
            <button className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${range === 7 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} onClick={() => setRange(7)}>{t.days7}</button>
            <button className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${range === 30 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} onClick={() => setRange(30)}>{t.days30}</button>
          </div>
        } 
      />

      {/* 1. THE PULSE (KPIs) */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={TrendingUp} tone="primary" label={t.revenue} value={money(data.revenue.period, locale)} detail={`${money(data.revenue.today, locale)} ${t.today}`} />
        <Kpi icon={ShoppingBag} tone="amber" label={t.orders} value={data.orders.total} detail={`${pendingOrders} ${t.pending}`} />
        <Kpi icon={Megaphone} tone="rose" label={t.campaigns} value={data.campaigns.active} detail={`${data.campaigns.stats.conversions} ${t.conversions} / ${data.campaigns.stats.views} ${t.views}`} />
        <Kpi icon={Users} tone="emerald" label={t.customers} value={data.customers.newInPeriod} detail={`${data.customers.total} Total`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        
        {/* LEFT COLUMN: TRENDS & DATA */}
        <div className="space-y-6">
          
          {/* 3. ANALYTICS & TRENDS */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{t.trend}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.trendDescription}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                {money(data.revenue.period, locale)}
              </span>
            </div>
            {data.revenue.trend.some((item) => item.amount > 0) ? (
              <div className="mt-10 flex h-56 items-end gap-2 sm:gap-4">
                {data.revenue.trend.map((item) => (
                  <div className="group relative flex min-w-0 flex-1 flex-col items-center gap-3" key={item.date}>
                    <div className="relative flex h-40 w-full items-end justify-center">
                      <div 
                        className="w-full max-w-[48px] rounded-t-md bg-primary/20 transition-all duration-300 group-hover:bg-primary" 
                        style={{ height: `${Math.max((item.amount / maxRevenue) * 100, 4)}%` }} 
                      />
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-12 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl">
                          {money(item.amount, locale)} <span className="text-slate-400">({item.orders})</span>
                        </div>
                        <div className="mx-auto h-2 w-2 rotate-45 bg-slate-900" style={{ marginTop: '-4px' }} />
                      </div>
                    </div>
                    <span className="truncate text-xs font-medium text-slate-500">{item.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 h-40"><EmptyState title={t.noSales} icon={TrendingUp} /></div>
            )}
          </section>

          {/* 4. OPERATIONAL TABLES (RECENT ORDERS) */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">{t.recent}</h2>
              <Link href={`/${locale}/dashboard/orders`} className="group flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            
            {data.recentOrders.length ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="pb-3">{t.order}</th>
                      <th className="pb-3">{t.customer}</th>
                      <th className="pb-3">{t.amount}</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">{t.date}</th>
                      <th className="pb-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentOrders.map((order) => (
                      <tr key={order._id} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-4 font-bold text-slate-900">{order.orderNumber || order._id.slice(-8)}</td>
                        <td className="py-4 font-medium">{order.customerName}</td>
                        <td className="py-4 font-bold">{money(order.amount, locale)}</td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge value={order.status} kind="status" locale={locale} />
                            <Badge value={order.paymentStatus} locale={locale} />
                          </div>
                        </td>
                        <td className="py-4 text-slate-500">{dateText(order.createdAt, locale)}</td>
                        <td className="py-4 text-right">
                          <Link href={`/${locale}/dashboard/orders/${order._id}`} className="inline-flex rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-primary">
                            {t.action}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-8"><EmptyState title={t.noOrders} icon={ShoppingBag} /></div>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN: ACTION CENTER & LISTS */}
        <div className="space-y-6">
          
          {/* 2. ACTION CENTER */}
          <section className="rounded-2xl border border-border bg-slate-900 p-6 text-white shadow-xl">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              {t.actionCenter}
            </h2>
            <div className="mt-6 space-y-3">
              
              <div className="flex items-center justify-between rounded-xl bg-white/10 p-4 transition hover:bg-white/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{pendingOrders}</p>
                    <p className="text-xs font-medium text-slate-400">{t.actionRequired}</p>
                  </div>
                </div>
                <Link href={`/${locale}/dashboard/orders?status=pending`} className="rounded-md bg-white/10 p-2 hover:bg-white/20">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/10 p-4 transition hover:bg-white/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-400/20 text-rose-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{data.products.lowStock + data.products.outOfStock}</p>
                    <p className="text-xs font-medium text-slate-400">{t.inventoryAlert}</p>
                  </div>
                </div>
                <Link href={`/${locale}/dashboard/inventory`} className="rounded-md bg-white/10 p-2 hover:bg-white/20">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/10 p-4 transition hover:bg-white/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{data.restockLeads.pending}</p>
                    <p className="text-xs font-medium text-slate-400">{t.demandAlert}</p>
                  </div>
                </div>
                <button className="rounded-md bg-white/10 p-2 hover:bg-white/20">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </section>

          {/* TOP PRODUCTS */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">{t.topProducts}</h2>
            <p className="mt-1 mb-5 text-sm text-slate-500">{t.topProductsDesc}</p>
            
            {data.topProducts.length ? (
              <div className="space-y-4">
                {data.topProducts.map((item, index) => (
                  <div key={item._id} className="flex items-center gap-4 group">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900" title={item.product}>{item.product}</p>
                      <p className="text-xs font-medium text-slate-500">{item.quantity} {t.sales}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-primary">{money(item.revenue, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4"><EmptyState title={t.noSales} icon={Package} /></div>
            )}
          </section>

        </div>
      </div>
    </section>
  );
}

function OverviewSkeleton() { 
  return (
    <section className="mx-auto max-w-7xl pb-12">
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="h-16 w-2/3 max-w-sm" />
      
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-[140px] rounded-2xl" key={i} />)}
      </div>
      
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className="h-[340px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[320px] rounded-2xl" />
          <Skeleton className="h-[320px] rounded-2xl" />
        </div>
      </div>
    </section>
  ); 
}
