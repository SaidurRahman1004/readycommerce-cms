'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminOrderService, type AdminOrder } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';
const labels = { en: { title: 'Orders', desc: 'Review, verify and move customer orders through fulfillment.', search: 'Search order number or email', all: 'All status', payment: 'Payment', order: 'Order', customer: 'Customer', amount: 'Amount', status: 'Status', date: 'Created', view: 'View details', empty: 'No orders found.', error: 'Orders could not be loaded.', retry: 'Retry' }, bn: { title: 'অর্ডার', desc: 'কাস্টমার অর্ডার পর্যালোচনা, পেমেন্ট যাচাই ও fulfillment পরিচালনা করুন।', search: 'অর্ডার নম্বর বা ইমেইল খুঁজুন', all: 'সব স্ট্যাটাস', payment: 'পেমেন্ট', order: 'অর্ডার', customer: 'কাস্টমার', amount: 'পরিমাণ', status: 'স্ট্যাটাস', date: 'তৈরির তারিখ', view: 'বিস্তারিত দেখুন', empty: 'কোনো অর্ডার পাওয়া যায়নি।', error: 'অর্ডার লোড করা যায়নি।', retry: 'আবার চেষ্টা করুন' } } as const;
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const money = (v: number) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v);
function Badge({ value, payment = false }: { value: string; payment?: boolean }) { return <span className={`status-${value} inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${payment ? value === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700' : ''}`}>{value.replaceAll('_', ' ')}</span>; }
export default function OrdersClient() {
  const [locale, setLocale] = useState<'en' | 'bn'>('en');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const t = labels[locale];

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    adminOrderService.list({ status: status || undefined, paymentStatus: paymentStatus || undefined, search: search || undefined })
      .then((r) => { setOrders(r.data); setSelectedIds(new Set()); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [status, paymentStatus, search]);

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(orders.map(o => o._id)));
  };

  const applyBulkStatus = async () => {
    if (selectedIds.size === 0 || !bulkStatus) return;
    setIsUpdating(true);
    try {
      const res = await adminOrderService.bulkStatus(Array.from(selectedIds), bulkStatus);
      if (res.success) {
        toast.success(res.message || 'Orders updated successfully.');
        load();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update orders.');
    } finally {
      setIsUpdating(false);
      setBulkStatus('');
    }
  };
  const handleExport = () => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (paymentStatus) params.append('paymentStatus', paymentStatus);
    if (search) params.append('search', search);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/admin/orders/export?${params.toString()}`;
  };
  return (
    <section className="mx-auto max-w-7xl pb-24">
      <Breadcrumbs items={[{ label: t.title }]} />
      <PageHeader 
        eyebrow="Operations" 
        title={t.title} 
        description={t.desc} 
        action={
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleExport} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm hover:shadow">Export CSV</button>
            <button type="button" onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors">{locale === 'en' ? 'BN' : 'EN'}</button>
          </div>
        } 
      />
      <div className="mb-5 grid gap-3 rounded-2xl border border-border bg-white/80 p-4 md:grid-cols-[1fr_180px_180px] shadow-sm">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="min-h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm focus:border-primary outline-none transition-colors">
          <option value="">{t.all}</option>
          {statuses.map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm focus:border-primary outline-none transition-colors">
          <option value="">{t.payment}</option>
          <option value="pending">pending</option><option value="paid">paid</option><option value="failed">failed</option>
        </select>
      </div>
      
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((x) => <Skeleton key={x} className="h-16" />)}</div>
      ) : error ? (
        <ErrorState title={t.error} retry={load} retryLabel={t.retry} />
      ) : orders.length === 0 ? (
        <EmptyState title={t.empty} description={locale === 'bn' ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।' : 'Try changing your filters.'} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm relative">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-slate-500 bg-slate-50">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <input type="checkbox" checked={selectedIds.size === orders.length && orders.length > 0} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                </th>
                {[t.order, t.customer, t.amount, t.payment, t.status, t.date, ''].map((x, i) => <th key={i} className="px-5 py-4">{x}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => {
                const isSelected = selectedIds.has(o._id);
                return (
                  <tr key={o._id} className={`transition duration-200 ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <td className="px-5 py-4 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(o._id)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                    </td>
                    <td className="px-5 py-4 font-bold">{o.orderNumber || o._id.slice(-8)}</td>
                    <td className="px-5 py-4"><p className="font-semibold">{o.customer.name}</p><p className="text-xs text-slate-500">{o.customer.email}</p></td>
                    <td className="px-5 py-4 font-bold">{money(o.amount)}</td>
                    <td className="px-5 py-4"><Badge value={o.paymentStatus} payment /></td>
                    <td className="px-5 py-4"><Badge value={o.status} /></td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">{new Date(o.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-BD')}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/orders/${o._id}`} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors shadow-sm">
                        {t.view}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-slate-900 px-6 py-4 shadow-2xl transition-all duration-300 ${selectedIds.size > 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-16 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="flex items-center gap-2 border-r border-slate-700 pr-4 text-sm font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs">{selectedIds.size}</span>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="h-10 rounded-xl border-none bg-slate-800 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="" disabled>Change status to...</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button type="button" onClick={applyBulkStatus} disabled={!bulkStatus || isUpdating} className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            {isUpdating ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </section>
  );
}
