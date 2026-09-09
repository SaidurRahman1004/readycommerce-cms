'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SearchX, ShoppingBag } from 'lucide-react';
import { catalogService, CatalogProduct } from '@/services/api-service';
import CatalogCard from './catalog-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

export default function SearchResults() {
  const t = useTranslations('Discovery');
  const params = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const result = await catalogService.products({ search: query, limit: 48 });
      setProducts(result.data || []);
    } catch (err) {
      console.error('Search request failed:', err);
      setFailed(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults, retryCount]);

  return (
    <main className="min-h-screen bg-[#fafbff] px-5 py-12 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
          {t('search.eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
          {query ? t('search.resultsFor', { query }) : t('search.title')}
        </h1>

        <div className="mt-10">
          {/* 1. Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <ProductCardSkeleton key={item} />
              ))}
            </div>
          )}

          {/* 2. Error State with Retry */}
          {!loading && failed && (
            <ErrorState
              title="Search request failed"
              message="We could not complete your search query due to a connection issue. Please try again."
              onRetry={() => setRetryCount((prev) => prev + 1)}
              homeLink
            />
          )}

          {/* 3. Empty State (0 Results) */}
          {!loading && !failed && products.length === 0 && (
            <EmptyState
              icon={SearchX}
              badge="0 Results"
              title={t('search.emptyTitle')}
              description={t('search.emptyDescription')}
              action={{
                label: 'Browse all products',
                href: '/shop',
                icon: ShoppingBag,
              }}
            />
          )}

          {/* 4. Product Results Grid */}
          {!loading && !failed && products.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <CatalogCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
