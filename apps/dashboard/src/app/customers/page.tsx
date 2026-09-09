'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { adminDirectoryService, type AdminCustomer } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { Skeleton } from '../../components/ui/primitives';
import { DataTable, Column } from '../../components/ui/data-table';
import { Pagination } from '../../components/ui/pagination';

function CustomersClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

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
    if (key !== 'page') params.delete('page'); // reset page on filter
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
  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    adminDirectoryService.customers({
      page: currentPage,
      search: debouncedSearch || undefined,
      sort: currentSortKey || undefined,
      order: currentSortOrder || undefined
    }, { signal })
    .then((r) => {
      setCustomers(r.data);
      if (r.pagination) setPagination(r.pagination);
    })
    .catch((error) => {
      if (error?.code !== 'ABORTED') console.error(error);
    })
    .finally(() => {
      if (!signal?.aborted) setLoading(false);
    });
  }, [currentPage, debouncedSearch, currentSortKey, currentSortOrder]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const columns: Column<AdminCustomer>[] = [
    { key: 'name', label: 'Customer', sortable: true, render: (row) => (<div><p className="font-bold">{row.name}</p><p className="text-xs text-slate-500">{row.email}</p></div>) },
    { key: 'phone', label: 'Phone', render: (row) => <span>{row.phone || '—'}</span> },
    { key: 'totalOrders', label: 'Orders', sortable: true, render: (row) => <span className="font-bold">{row.totalOrders}</span> },
    { key: 'totalSpend', label: 'Lifetime Spend', sortable: true, render: (row) => <span className="font-bold">৳{row.totalSpend || 0}</span> },
    { key: 'createdAt', label: 'Joined', sortable: true, render: (row) => <span className="whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'isActive', label: 'Status', render: (row) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: '', align: 'right', render: (row) => (
      <Link href={`/customers/${row._id}`} className="font-bold text-primary hover:underline">
        View
      </Link>
    )}
  ];

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search by name, email, or phone..." 
          className="min-h-11 w-full max-w-md rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary" 
        />
      </div>

      <DataTable
        data={customers}
        columns={columns}
        keyExtractor={(row) => row._id}
        isLoading={loading}
      />

      <Pagination 
        currentPage={pagination.page}
        totalPages={pagination.pages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
      />
    </>
  );
}

export default function CustomersPage() {
  return (
    <section className="mx-auto max-w-7xl pb-24">
      <Breadcrumbs items={[{ label: 'Customers' }]} />
      <PageHeader eyebrow="Relationships" title="Customers" description="Understand customer activity and lifetime value from real order data." />
      
      <Suspense fallback={<div className="mt-8 space-y-4">{[1, 2, 3, 4, 5].map(x => <Skeleton className="h-16 w-full rounded-xl" key={x} />)}</div>}>
        <CustomersClient />
      </Suspense>
    </section>
  );
}
