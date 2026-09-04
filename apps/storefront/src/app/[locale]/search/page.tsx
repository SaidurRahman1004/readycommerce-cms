'use client';

import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import {Link} from '@/i18n/routing';
import {catalog} from '@/components/store/catalog';
import WishlistButton from '@/components/store/wishlist-button';
import {useCart} from '@/components/store/cart-context';

import {Suspense} from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const t = useTranslations('Storefront');
  const {addItem} = useCart();
  
  const results = query.length > 0 
    ? catalog.filter(p => t(`products.${p.key}.name`).toLowerCase().includes(query.toLowerCase()) || t(`products.${p.key}.description`).toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <main className="min-h-screen bg-[#fafbff] pb-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-12">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          {query ? `Search results for "${query}"` : 'Search Products'}
        </h1>
        <p className="mt-4 text-slate-500">
          {results.length} {results.length === 1 ? 'product' : 'products'} found
        </p>

        {results.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {results.map((product) => (
              <article key={product.id} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f1f2f6]">
                  <div className="absolute right-3 top-3 z-10">
                    <WishlistButton productId={product.id} className="h-8 w-8 rounded-full bg-white/90 shadow-sm backdrop-blur" />
                  </div>
                  <Link href={`/product/${product.id}`} className="absolute inset-0 z-0">
                    <Image src={product.image} alt={t(`products.${product.key}.name`)} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 23vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  </Link>
                  <button type="button" onClick={() => addItem(product.id)} className="absolute bottom-3 left-3 right-3 hidden z-10 min-h-11 items-center justify-center rounded-xl bg-white/95 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-indigo-600 hover:text-white sm:flex sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    {t('products.addToCart')}
                  </button>
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                      <Link href={`/product/${product.id}`} className="hover:underline">{t(`products.${product.key}.name`)}</Link>
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{t(`products.${product.key}.category`)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">${product.price}</p>
                </div>
                <button type="button" onClick={() => addItem(product.id)} className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white sm:hidden">
                  {t('products.addToCart')}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">No results found</h2>
            <p className="mt-2 max-w-md text-slate-500">We couldn't find anything matching "{query}". Try adjusting your search term or browse our categories.</p>
            <Link href="/shop" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600">
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbff] py-24 text-center">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
