'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
import {useCart} from './cart-context';
import {CatalogProduct} from './catalog';
import WishlistButton from './wishlist-button';

export default function CatalogCard({product}: {product: CatalogProduct}) {
  const t = useTranslations('Storefront'); const {addItem} = useCart();
  return <article className="group"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f1f2f6]"><Link href={`/products/${product.id}`}><Image src={product.image} alt={t(`products.${product.key}.name`)} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 23vw" className="object-cover transition duration-700 group-hover:scale-105" /></Link><WishlistButton productId={product.id} /><button type="button" onClick={() => addItem(product.id)} className="absolute bottom-3 left-3 right-3 hidden min-h-11 items-center justify-center rounded-xl bg-white/95 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-indigo-600 hover:text-white sm:flex sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">{t('products.addToCart')}</button></div><div className="mt-4 flex items-start justify-between gap-2"><div><Link href={`/products/${product.id}`} className="text-sm font-semibold text-slate-900 transition hover:text-indigo-600 sm:text-[15px]">{t(`products.${product.key}.name`)}</Link><p className="mt-1 text-xs text-slate-500">{t(`products.${product.key}.category`)}</p></div><p className="text-sm font-semibold text-slate-900">${product.price}</p></div><button type="button" onClick={() => addItem(product.id)} className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white sm:hidden">{t('products.addToCart')}</button></article>;
}
