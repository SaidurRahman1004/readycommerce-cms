'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PackageSearch, RotateCcw } from 'lucide-react';
import { catalogService, CatalogCategory, CatalogProduct } from '@/services/api-service';
import CatalogCard from './catalog-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

type Filters = {
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
};

const initialFilters: Filters = {
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
};

function FilterContent({
  filters,
  setFilters,
  categories,
  resetFilters = initialFilters,
}: {
  filters: Filters;
  setFilters: (value: Filters) => void;
  categories: CatalogCategory[];
  resetFilters?: Filters;
}) {
  const t = useTranslations('Storefront');

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div>
        <h3 className="text-[15px] font-bold">{t('filters.category')}</h3>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <label
              key={category._id}
              className="flex cursor-pointer items-center gap-3 text-[14px] text-muted-foreground transition hover:text-foreground"
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === category.slug}
                onChange={() =>
                  setFilters({
                    ...filters,
                    category: filters.category === category.slug ? '' : category.slug,
                  })
                }
                className="h-4 w-4 accent-primary"
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h3 className="text-[15px] font-bold">{t('filters.price')}</h3>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* In Stock Filter */}
      <div>
        <label className="flex cursor-pointer items-center gap-3 text-[15px] font-bold">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          {t('filters.inStock')}
        </label>
      </div>

      {/* Clear Filters Button */}
      <button
        type="button"
        onClick={() => setFilters(resetFilters)}
        className="inline-flex items-center gap-1.5 text-[14px] font-bold text-primary transition hover:text-primary/80"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>{t('filters.clear')}</span>
      </button>
    </div>
  );
}

export default function ShopClient({
  initialCategory = '',
}: {
  initialCategory?: string;
}) {
  const t = useTranslations('Storefront');
  const startingFilters = { ...initialFilters, category: initialCategory };
  const [filters, setFilters] = useState(startingFilters);
  const [sort, setSort] = useState('featured');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  // Load categories on mount
  useEffect(() => {
    catalogService
      .categories()
      .then((result) => setCategories(result.data || []))
      .catch(() => undefined);
  }, []);

  // Fetch products with active filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const result = await catalogService.products({
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        inStock: filters.inStock ? true : undefined,
        sort,
        page: 1,
        limit: 12,
      });
      setProducts(result.data || []);
      setTotal(result.pagination?.total || (result.data ? result.data.length : 0));
    } catch (err) {
      console.error('Failed to load products in shop:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts, retryNonce]);

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 lg:px-10 lg:pt-16">
        {/* Header Title */}
        <div className="max-w-2xl">
          <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">
            {t('shop.eyebrow')}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('shop.title')}</h1>
          <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
            {t('shop.description')}
          </p>
        </div>

        {/* Results Count & Sort Bar */}
        <div className="mt-14 flex items-center justify-between border-y border-border py-5">
          <p className="text-[14px] font-medium text-muted-foreground">
            {t('shop.results', { count: total })}
          </p>
          <label className="flex items-center gap-3 text-[14px] font-medium">
            <span className="hidden sm:inline">{t('sort.label')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-[14px] outline-none focus:border-primary"
            >
              <option value="featured">{t('sort.featured')}</option>
              <option value="newest">{t('sort.newest')}</option>
              <option value="popular">{t('sort.popular')}</option>
              <option value="priceLow">{t('sort.priceLow')}</option>
              <option value="priceHigh">{t('sort.priceHigh')}</option>
            </select>
          </label>
        </div>

        {/* Content Layout (Sidebar + Product Grid) */}
        <div className="mt-10 flex gap-10">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-28">
              <h2 className="mb-8 text-lg font-bold">{t('filters.title')}</h2>
              <FilterContent
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                resetFilters={startingFilters}
              />
            </div>
          </aside>

          {/* Main Results Container */}
          <div className="min-w-0 flex-1">
            {/* 1. Loading State */}
            {loading && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <ProductCardSkeleton key={item} />
                ))}
              </div>
            )}

            {/* 2. Error State */}
            {!loading && failed && (
              <ErrorState
                title="Products could not be loaded"
                message="We encountered an issue connecting to the store catalog. Please check your connection and try again."
                onRetry={() => setRetryNonce((prev) => prev + 1)}
              />
            )}

            {/* 3. Empty State (Zero Results) */}
            {!loading && !failed && products.length === 0 && (
              <EmptyState
                icon={PackageSearch}
                badge="0 Products"
                title="No matching products found"
                description="We couldn't find any products matching your current filters. Try changing your price range, category, or clear filters."
                action={{
                  label: 'Clear all filters',
                  onClick: () => setFilters(startingFilters),
                  icon: RotateCcw,
                }}
              />
            )}

            {/* 4. Products Grid */}
            {!loading && !failed && products.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 xl:grid-cols-3">
                {products.map((product) => (
                  <CatalogCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Float Button */}
      <button
        type="button"
        onClick={() => setMobileFilters(true)}
        className="fixed bottom-6 left-1/2 z-30 flex min-h-[52px] -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-6 text-[15px] font-bold text-white shadow-premium transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <span>{t('filters.mobileButton')}</span>
        <span aria-hidden="true">+</span>
      </button>

      {/* Mobile Filters Bottom Sheet */}
      {mobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setMobileFilters(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-background p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('filters.title')}</h2>
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="text-[15px] font-bold text-primary"
              >
                {t('filters.done')}
              </button>
            </div>
            <FilterContent
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              resetFilters={startingFilters}
            />
          </div>
        </div>
      )}
    </main>
  );
}
