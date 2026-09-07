'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminCatalogService, type AdminInventory } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';

export default function InventoryPage() {
  const [items, setItems] = useState<AdminInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkThreshold, setBulkThreshold] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminCatalogService.inventory()
      .then(r => { setItems(r.data); setSelectedIds(new Set()); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(load, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map(i => i._id)));
  };

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
    }
  };

  const adjust = async (item: AdminInventory) => {
    const value = window.prompt('Set stock quantity', String(item.quantity));
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

  return (
    <section className="mx-auto max-w-7xl pb-24">
      <Breadcrumbs items={[{ label: 'Inventory' }]} />
      <PageHeader eyebrow="Operations" title="Inventory" description="Monitor real-time availability and make safe stock adjustments." />
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(x => <Skeleton className="h-20" key={x} />)}</div>
      ) : error ? (
        <ErrorState title="Inventory could not be loaded." retry={load} />
      ) : !items.length ? (
        <EmptyState title="No inventory records." description="Inventory appears when product variants are created." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm relative">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-slate-500 bg-slate-50 tracking-wider">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <input type="checkbox" checked={selectedIds.size === items.length && items.length > 0} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                </th>
                {['Product', 'SKU', 'Available', 'Reserved', 'Threshold', 'Status', 'Action'].map(x => <th className="px-5 py-4" key={x}>{x}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(i => {
                const isSelected = selectedIds.has(i._id);
                return (
                  <tr key={i._id} className={`transition duration-200 ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <td className="px-5 py-4 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(i._id)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {i.product}
                      <span className="block text-xs font-normal text-slate-500">{i.variant}</span>
                    </td>
                    <td className="px-5 py-4">{i.sku}</td>
                    <td className="px-5 py-4 font-bold">{i.available}</td>
                    <td className="px-5 py-4">{i.reservedQuantity}</td>
                    <td className="px-5 py-4">{i.threshold}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${i.status === 'out_of_stock' ? 'bg-rose-50 text-rose-700' : i.status === 'low_stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {i.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => adjust(i)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors shadow-sm">
                        Adjust stock
                      </button>
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
          <input type="number" min="0" placeholder="New Threshold..." value={bulkThreshold} onChange={(e) => setBulkThreshold(e.target.value)} className="h-10 w-40 rounded-xl border-none bg-slate-800 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary placeholder-slate-400" />
          <button type="button" onClick={applyBulkThreshold} disabled={!bulkThreshold || isUpdating} className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            {isUpdating ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </section>
  );
}
