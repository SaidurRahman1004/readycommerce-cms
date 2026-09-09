'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SearchX, ShoppingBag } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { catalogService, CatalogProduct } from '@/services/api-service';
import CatalogCard from './catalog-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import Pagination from '@/components/ui/pagination';

const PAGE_SIZE = 12;

export default function SearchResults() {
  const t = useTranslations('Discovery');
  const shopT = useTranslations('Storefront');
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = params.get('q')?.trim() ?? '';
  const sort = params.get('sort') || 'relevance';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    router.replace(`${pathname}?${next.toString()}`);
  }, [params, pathname, router]);

  const fetchResults = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFailed(false);
    try {
      const result = await catalogService.products(
        { search: query || undefined, sort, page, limit: PAGE_SIZE },
        { signal }
      );
      setProducts(result.data || []);
      setPagination(result.pagination || { page, limit: PAGE_SIZE, total: result.data?.length || 0, pages: 1 });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ABORTED') return;
      console.error('Search request failed:', error);
      setFailed(true);
      setProducts([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query, sort]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchResults(controller.signal);
    return () => controller.abort();
  }, [fetchResults, retryCount]);

  const changeSort = (value: string) => updateParams({ sort: value, page: undefined });
  const changePage = (value: number) => updateParams({ page: value });

  return (
    <main className="min-h-screen bg-[#fafbff] px-5 py-12 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{t('search.eyebrow')}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              {query ? t('search.resultsFor', { query }) : t('search.title')}
            </h1>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <span className="text-muted-foreground">{shopT('sort.label')}</span>
            <select
              value={sort}
              onChange={(event) => changeSort(event.target.value)}
              className="min-h-11 rounded-xl border border-border bg-white px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label={shopT('sort.label')}
            >
              <option value="relevance">Relevance</option>
              <option value="newest">{shopT('sort.newest')}</option>
              <option value="priceLow">{shopT('sort.priceLow')}</option>
              <option value="priceHigh">{shopT('sort.priceHigh')}</option>
            </select>
          </label>
        </div>

        <div className="mt-8">
          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <ProductCardSkeleton key={item} />)}
            </div>
          )}

          {!loading && failed && (
            <ErrorState
              title="Search request failed"
              message="We could not complete your search query due to a connection issue. Please try again."
              onRetry={() => setRetryCount((previous) => previous + 1)}
              homeLink
            />
          )}

          {!loading && !failed && products.length === 0 && (
            <EmptyState
              icon={SearchX}
              badge="0 Results"
              title={t('search.emptyTitle')}
              description={t('search.emptyDescription')}
              action={{ label: 'Browse all products', href: '/shop', icon: ShoppingBag }}
            />
          )}

          {!loading && !failed && products.length > 0 && (
            <>
              <p className="mb-5 text-sm text-muted-foreground">
                {shopT('shop.results', { count: pagination.total })}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => <CatalogCard key={product._id} product={product} />)}
              </div>
              <Pagination page={pagination.page || page} pages={pagination.pages} onPageChange={changePage} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
