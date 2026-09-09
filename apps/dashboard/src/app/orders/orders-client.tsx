'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminOrderService, type AdminOrder } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { DataTable, Column } from '../../components/ui/data-table';
import { Pagination } from '../../components/ui/pagination';
import { ConfirmModal } from '../../components/ui/confirm-modal';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const money = (v: number) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v);

function Badge({ value, payment = false }: { value: string; payment?: boolean }) { 
  return (
    <span className={`status-${value} inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${payment ? (value === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700') : ''}`}>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function OrdersClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk action states
  const [bulkStatus, setBulkStatus] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // URL state
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentStatus = searchParams.get('status') || '';
  const currentPaymentStatus = searchParams.get('paymentStatus') || '';
  const initialSearch = searchParams.get('search') || '';
  const currentSortKey = searchParams.get('sort');
  const currentSortOrder = searchParams.get('order');

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Update URL helper
  const updateUrl = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== debouncedSearch) {
        setDebouncedSearch(search);
        updateUrl('search', search);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, debouncedSearch, updateUrl]);

  // Fetch data
  const load = useCallback(() => {
    setLoading(true);
    adminOrderService.list({ 
      page: currentPage, 
      status: currentStatus || undefined, 
      paymentStatus: currentPaymentStatus || undefined, 
      search: debouncedSearch || undefined,
      sort: currentSortKey || undefined,
      order: currentSortOrder || undefined
    })
    .then((r) => { 
      setOrders(r.data); 
      if (r.pagination) setPagination(r.pagination);
      setSelectedIds(new Set()); 
    })
    .catch(() => toast.error('Orders could not be loaded.'))
    .finally(() => setLoading(false));
  }, [currentPage, currentStatus, currentPaymentStatus, debouncedSearch, currentSortKey, currentSortOrder]);

  useEffect(() => { load(); }, [load]);

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
      setIsConfirmOpen(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (currentStatus) params.append('status', currentStatus);
    if (currentPaymentStatus) params.append('paymentStatus', currentPaymentStatus);
    if (debouncedSearch) params.append('search', debouncedSearch);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/orders/export?${params.toString()}`;
  };

  const columns: Column<AdminOrder>[] = [
    { key: 'orderNumber', label: 'Order', sortable: true, render: (row) => <span className="font-bold">{row.orderNumber || row._id.slice(-8)}</span> },
    { key: 'customer', label: 'Customer', render: (row) => (<div><p className="font-semibold">{row.customer.name}</p><p className="text-xs text-slate-500">{row.customer.email}</p></div>) },
    { key: 'amount', label: 'Amount', sortable: true, render: (row) => <span className="font-bold">{money(row.amount)}</span> },
    { key: 'paymentStatus', label: 'Payment', sortable: true, render: (row) => <Badge value={row.paymentStatus} payment /> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <Badge value={row.status} /> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (row) => <span className="whitespace-nowrap text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', align: 'right', render: (row) => (
      <Link href={`/orders/${row._id}`} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold shadow-sm transition-colors hover:border-primary hover:text-primary">
        View details
      </Link>
    ) }
  ];

  return (
    <section className="mx-auto max-w-7xl pb-24">
      <Breadcrumbs items={[{ label: 'Orders' }]} />
      <PageHeader 
        eyebrow="Operations" 
        title="Orders" 
        description="Review, verify and move customer orders through fulfillment." 
        action={
          <button type="button" onClick={handleExport} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800">
            Export CSV
          </button>
        } 
      />

      <div className="mb-5 grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_180px]">
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search order number or email..." 
          className="min-h-11 rounded-xl border border-border bg-white px-4 text-sm outline-none transition-all focus:border-primary" 
        />
        <select 
          value={currentStatus} 
          onChange={(e) => updateUrl('status', e.target.value)} 
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
        >
          <option value="">All Statuses</option>
          {statuses.map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
        </select>
        <select 
          value={currentPaymentStatus} 
          onChange={(e) => updateUrl('paymentStatus', e.target.value)} 
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
        >
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      
      <DataTable 
        data={orders}
        columns={columns}
        keyExtractor={(row) => row._id}
        isLoading={loading}
        enableSelection={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
      
      <Pagination 
        currentPage={pagination.page}
        totalPages={pagination.pages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
      />

      {/* Floating Bulk Action Bar */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-full bg-slate-900 px-6 py-4 shadow-2xl transition-all duration-300 ${selectedIds.size > 0 ? 'translate-y-0 opacity-100 scale-100' : 'pointer-events-none translate-y-16 scale-95 opacity-0'}`}>
        <div className="flex items-center gap-2 border-r border-slate-700 pr-4 text-sm font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs">{selectedIds.size}</span>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="h-10 cursor-pointer rounded-xl border-none bg-slate-800 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary">
            <option value="" disabled>Change status to...</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!bulkStatus} className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            Apply
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={applyBulkStatus}
        title="Update Orders"
        description={`Are you sure you want to change the status of ${selectedIds.size} order(s) to "${bulkStatus}"?`}
        confirmText="Update Orders"
        isLoading={isUpdating}
        isDestructive={bulkStatus === 'cancelled'}
      />
    </section>
  );
}
