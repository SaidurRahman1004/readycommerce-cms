'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminCatalogService, type AdminInventory } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { Skeleton } from '../../components/ui/primitives';
import { DataTable, Column } from '../../components/ui/data-table';
import { Pagination } from '../../components/ui/pagination';
import { ConfirmModal } from '../../components/ui/confirm-modal';

function InventoryClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminInventory[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk action states
  const [bulkThreshold, setBulkThreshold] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // URL state
  const currentPage = Number(searchParams.get('page')) || 1;
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
    adminCatalogService.inventory({
      page: currentPage,
      search: debouncedSearch || undefined,
      sort: currentSortKey || undefined,
      order: currentSortOrder || undefined
    })
    .then(r => { 
      setItems(r.data); 
      if (r.pagination) setPagination(r.pagination);
      setSelectedIds(new Set()); 
    })
    .catch(() => toast.error('Inventory could not be loaded.'))
    .finally(() => setLoading(false));
  }, [currentPage, debouncedSearch, currentSortKey, currentSortOrder]);

  useEffect(() => { load(); }, [load]);

  const applyBulkThreshold = async () => {
    const val = Number(bulkThreshold);
    if (selectedIds.size === 0 || !Number.isInteger(val) || val < 0) return;
    setIsUpdating(true);
    try {
      const res = await adminCatalogService.bulkThreshold(Array.from(selectedIds), val);
      if (res.success) {
        toast.success(res.message || 'Thresholds updated successfully.');
        load();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update thresholds.');
    } finally {
      setIsUpdating(false);
      setBulkThreshold('');
      setIsConfirmOpen(false);
    }
  };

  const adjust = async (item: AdminInventory) => {
    const value = window.prompt(`Set stock quantity for ${item.product} - ${item.variant || item.sku}`, String(item.quantity));
    if (value === null) return;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) return toast.error('Enter a non-negative whole number.');
    try {
      await adminCatalogService.adjust(item._id, quantity);
      toast.success('Stock updated.');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update stock.');
    }
  };

  const columns: Column<AdminInventory>[] = [
    { key: 'product', label: 'Product', sortable: true, render: (row) => (
      <div><span className="font-bold">{row.product}</span><span className="block text-xs font-normal text-slate-500">{row.variant}</span></div>
    )},
    { key: 'sku', label: 'SKU', sortable: true, render: (row) => <span>{row.sku}</span> },
    { key: 'available', label: 'Available', sortable: true, render: (row) => <span className="font-bold">{row.available}</span> },
    { key: 'reservedQuantity', label: 'Reserved', sortable: true, render: (row) => <span>{row.reservedQuantity}</span> },
    { key: 'threshold', label: 'Threshold', sortable: true, render: (row) => <span>{row.threshold}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === 'out_of_stock' ? 'bg-rose-50 text-rose-700' : row.status === 'low_stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
        {row.status.replaceAll('_', ' ')}
      </span>
    )},
    { key: 'actions', label: 'Action', align: 'right', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); adjust(row); }} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold shadow-sm transition-colors hover:border-primary hover:text-primary">
        Adjust stock
      </button>
    )}
  ];

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search product name or SKU..." 
          className="min-h-11 w-full max-w-md rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary" 
        />
      </div>

      <DataTable 
        data={items}
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
          <input 
            type="number" 
            min="0" 
            placeholder="New Threshold..." 
            value={bulkThreshold} 
            onChange={(e) => setBulkThreshold(e.target.value)} 
            className="h-10 w-40 rounded-xl border-none bg-slate-800 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary placeholder-slate-400" 
          />
          <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!bulkThreshold} className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            Apply
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={applyBulkThreshold}
        title="Update Stock Threshold"
        description={`Are you sure you want to set a new low stock threshold of ${bulkThreshold} for ${selectedIds.size} item(s)?`}
        confirmText="Update Threshold"
        isLoading={isUpdating}
        isDestructive={false}
      />
    </>
  );
}

export default function InventoryPage() {
  return (
    <section className="mx-auto max-w-7xl pb-24">
      <Breadcrumbs items={[{ label: 'Inventory' }]} />
      <PageHeader eyebrow="Operations" title="Inventory" description="Monitor real-time availability and make safe stock adjustments." />
      
      <Suspense fallback={<div className="mt-8 space-y-4">{[1, 2, 3, 4, 5].map(x => <Skeleton className="h-16 w-full rounded-xl" key={x} />)}</div>}>
        <InventoryClient />
      </Suspense>
    </section>
  );
}
