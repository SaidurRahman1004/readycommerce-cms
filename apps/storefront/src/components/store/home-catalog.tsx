'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { catalogService, CatalogCategory, CatalogProduct } from '@/services/api-service';
import CatalogCard from './catalog-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';

export default function HomeCatalog() {
  const t = useTranslations('Storefront');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [specialOffers, setSpecialOffers] = useState<CatalogProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categoryResult, productResult, specialOffersResult, newArrivalsResult] =
        await Promise.all([
          catalogService.categories(),
          catalogService.products({ sort: 'featured', limit: 4 }),
          catalogService.products({ isSpecialOffer: true, limit: 4 }),
          catalogService.products({ sort: 'newest', limit: 4 }),
        ]);

      setCategories(categoryResult.data || []);
      setProducts(productResult.data || []);
      setSpecialOffers(specialOffersResult.data || []);
      setNewArrivals(newArrivalsResult.data || []);
    } catch (err) {
      console.error('Failed to load home catalog:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  if (error && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
        <ErrorState
          title="Catalog is temporarily unavailable"
          message="We could not connect to the store catalog. Please check your internet connection and try again."
          onRetry={loadData}
          homeLink={false}
        />
      </div>
    );
  }

  return (
    <>
      {/* Categories Section */}
      <section id="categories" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-10">
          <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">
            {t('categories.eyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-[40px]">
            {t('categories.title')}
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="aspect-[4/5] rounded-[24px] bg-slate-200/80 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {categories.map((category) => (
              <Link
                href={`/categories/${category.slug}`}
                key={category._id}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
              >
                <Image
                  src={
                    category.image ||
                    'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=88'
                  }
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 45vw, 23vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {category.name}
                  </h3>
                  <span className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:-translate-y-2 group-hover:opacity-100">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Special Offers Section */}
      {(!loading && specialOffers.length > 0) || loading ? (
        <section className="bg-primary/5 py-16 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-12 flex items-end justify-between gap-5">
              <div>
                <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-amber-600">
                  {t('specialOffers.eyebrow') || 'Limited Time'}
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-[40px]">
                  {t('specialOffers.title') || 'Special Offers'}
                </h2>
              </div>
              <Link
                href="/shop?isSpecialOffer=true"
                className="text-[15px] font-semibold text-slate-500 transition-colors hover:text-primary"
              >
                {t('trending.viewAll')} <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <ProductCardSkeleton key={item} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {specialOffers.map((product) => (
                  <CatalogCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* New Arrivals Section */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-28">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div>
              <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">
                {t('newArrivals.eyebrow')}
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-[40px]">
                {t('newArrivals.title')}
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-[15px] font-semibold text-slate-500 transition-colors hover:text-primary"
            >
              {t('trending.viewAll')} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <ProductCardSkeleton key={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <CatalogCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending / Featured Section */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-28">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div>
              <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">
                {t('trending.eyebrow')}
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-[40px]">
                {t('trending.title')}
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-[15px] font-semibold text-slate-500 transition-colors hover:text-primary"
            >
              {t('trending.viewAll')} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <ProductCardSkeleton key={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <CatalogCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
