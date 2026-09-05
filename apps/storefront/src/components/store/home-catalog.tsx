'use client';

import Image from 'next/image';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
import {catalogService, CatalogCategory, CatalogProduct} from '@/services/api-service';
import CatalogCard from './catalog-card';

function Skeleton() { return <div className="animate-pulse rounded-[24px] bg-slate-100"><div className="aspect-[4/5] rounded-[24px] bg-slate-200/50" /><div className="p-4"><div className="mt-2 h-4 w-1/3 rounded bg-slate-200/50" /><div className="mt-3 h-5 w-3/4 rounded bg-slate-200/50" /></div></div>; }
export default function HomeCatalog() {
  const t = useTranslations('Storefront');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [specialOffers, setSpecialOffers] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      catalogService.categories(),
      catalogService.products({sort: 'featured', limit: 4}),
      catalogService.products({isSpecialOffer: true, limit: 4})
    ])
    .then(([categoryResult, productResult, specialOffersResult]) => {
      setCategories(categoryResult.data);
      setProducts(productResult.data);
      setSpecialOffers(specialOffersResult.data);
    })
    .catch(() => undefined)
    .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section id="categories" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-10">
          <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{t('categories.eyebrow')}</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-[40px]">{t('categories.title')}</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">{[1,2,3,4].map((item) => <Skeleton key={item} />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {categories.map((category) => (
              <Link href={`/shop?category=${category.slug}`} key={category._id} className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
                <Image src={category.image || 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=88'} alt={category.name} fill sizes="(max-width: 640px) 45vw, 23vw" className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{category.name}</h3>
                  <span className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:-translate-y-2 group-hover:opacity-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-amber-600">{t('specialOffers.eyebrow') || 'Limited Time'}</p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-[40px]">{t('specialOffers.title') || 'Special Offers'}</h2>
              </div>
              <Link href="/shop?isSpecialOffer=true" className="text-[15px] font-semibold text-slate-500 transition-colors hover:text-primary">
                {t('trending.viewAll')} <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{[1,2,3,4].map((item) => <Skeleton key={item} />)}</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {specialOffers.map((product) => <CatalogCard key={product._id} product={product} />)}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-28">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div>
              <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{t('trending.eyebrow')}</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-[40px]">{t('trending.title')}</h2>
            </div>
            <Link href="/shop" className="text-[15px] font-semibold text-slate-500 transition-colors hover:text-primary">
              {t('trending.viewAll')} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{[1,2,3,4].map((item) => <Skeleton key={item} />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => <CatalogCard key={product._id} product={product} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
