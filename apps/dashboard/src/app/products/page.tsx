'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminCatalogService, adminDirectoryService, type AdminProduct, type AdminCategory } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';

function ProductsTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Read URL state
  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Update URL utility
  const updateUrl = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    
    // Always reset to page 1 on filter change
    if (key !== 'page') params.delete('page');
    
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Load Categories on mount
  useEffect(() => {
    adminDirectoryService.categories()
      .then(r => setCategories(r.data))
      .catch(() => toast.error('Could not load categories.'));
  }, []);

  // Handle Search Debounce (300ms)
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (search !== debouncedSearch) {
        setDebouncedSearch(search);
        updateUrl('search', search);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, debouncedSearch, updateUrl]);

  // Fetch Products based on URL State
  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    
    adminCatalogService.products({
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
      category: currentCategory || undefined,
      status: currentStatus || undefined
    })
    .then(r => {
      setItems(r.data);
      if (r.pagination) setPagination(r.pagination);
    })
    .catch(() => setError(true))
    .finally(() => setLoading(false));
  }, [currentPage, debouncedSearch, currentCategory, currentStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    router.replace(pathname);
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    try {
      await adminCatalogService.archive(id);
      toast.success('Product archived.');
      load();
    } catch {
      toast.error('Could not archive product.');
    }
  };

  return (
    <section className="mx-auto max-w-7xl pb-10">
      <Breadcrumbs items={[{ label: 'Products' }]} />
      <PageHeader 
        eyebrow="Catalog" 
        title="Products" 
        description="Manage the catalog that powers your storefront." 
        action={
          <Link href="/products/new" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity">
            Create product
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search products by name or slug..." 
          className="min-h-11 w-full flex-1 rounded-xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-primary"
        />
        <select
          value={currentCategory}
          onChange={(e) => updateUrl('category', e.target.value)}
          className="min-h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-primary sm:max-w-[240px]"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select
          value={currentStatus}
          onChange={(e) => updateUrl('status', e.target.value)}
          className="min-h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-primary sm:max-w-[180px]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(x => <Skeleton className="h-20 w-full rounded-2xl" key={x} />)}
        </div>
      ) : error ? (
        <ErrorState title="Products could not be loaded." retry={load} />
      ) : !items.length ? (
        <EmptyState 
          title="No products found." 
          description="Create a new product or adjust your filters to see results." 
          action={
            (search || currentCategory || currentStatus) ? (
              <button 
                onClick={clearFilters} 
                className="mt-4 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white/85 shadow-sm backdrop-blur-xl">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs uppercase text-slate-500">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Action'].map(x => (
                  <th className="px-5 py-4 font-bold" key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(p => (
                <tr className="transition-colors hover:bg-muted/50" key={p._id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{p.variants.map(v => v.sku).join(', ')}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">{p.category?.name || '—'}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">৳{p.discountPrice ?? p.basePrice}</td>
                  <td className="px-5 py-4 font-medium text-slate-700">{p.variants.reduce((n, v) => n + v.stock, 0)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/products/${p._id}/edit`} className="font-bold text-primary hover:underline">
                        Edit
                      </Link>
                      <button 
                        className="font-bold text-rose-600 hover:underline" 
                        onClick={() => handleArchive(p._id)}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination UI */}
          {pagination.pages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-muted/10 px-5 py-4 sm:flex-row">
              <span className="text-sm font-medium text-slate-500">
                Page {pagination.page} of {pagination.pages} <span className="mx-1">•</span> {pagination.total} products
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => updateUrl('page', String(pagination.page - 1))}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => updateUrl('page', String(pagination.page + 1))}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <section className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Catalog" title="Products" description="Loading workspace..." />
        <div className="mt-8 space-y-4">
          {[1, 2, 3, 4, 5].map(x => <Skeleton className="h-20 w-full rounded-2xl" key={x} />)}
        </div>
      </section>
    }>
      <ProductsTable />
    </Suspense>
  );
}
