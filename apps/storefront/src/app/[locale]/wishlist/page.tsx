'use client';

import {useTranslations} from 'next-intl';
import Image from 'next/image';
import {Link} from '@/i18n/routing';
import {catalog} from '@/components/store/catalog';
import WishlistButton from '@/components/store/wishlist-button';
import {useCart} from '@/components/store/cart-context';
import {useWishlist} from '@/components/store/wishlist-store';
import {useEffect, useState} from 'react';

export default function WishlistPage() {
  const t = useTranslations('Storefront');
  const {addItem} = useCart();
  const {items} = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const results = items.map(id => catalog.find(p => p.id === id)).filter(Boolean) as typeof catalog;

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#fafbff] py-24 text-center">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-12 text-slate-500">
          Loading wishlist...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbff] pb-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-12">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">Your Favorites</p>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Wishlist
          </h1>
          <p className="mt-2 text-slate-500">
            {results.length} {results.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

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
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 text-rose-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Your wishlist is empty</h2>
            <p className="mt-2 max-w-md text-slate-500">Save items you love to your wishlist to easily find them later.</p>
            <Link href="/shop" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600">
              Browse products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
