'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
import CatalogCard from './catalog-card';
import {catalog} from './catalog';
import {useCart} from './cart-context';

export default function WishlistPage() { const t = useTranslations('Discovery'); const {wishlist} = useCart(); const products = catalog.filter((product) => wishlist.includes(product.id)); return <main className="min-h-screen bg-[#fafbff] px-5 py-12 text-slate-950 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{t('wishlist.eyebrow')}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{t('wishlist.title')}</h1>{products.length ? <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <CatalogCard key={product.id} product={product} />)}</div> : <div className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-3xl text-rose-500">♡</div><h2 className="mt-6 text-2xl font-semibold tracking-tight">{t('wishlist.emptyTitle')}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{t('wishlist.emptyDescription')}</p><Link href="/shop" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700">{t('wishlist.continue')}</Link></div>}</div></main>; }
