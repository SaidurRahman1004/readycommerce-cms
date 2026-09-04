'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {useCart} from './cart-context';

const products = [
  {key: 'noir', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=88', price: '$86'},
  {key: 'santal', image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=88', price: '$72'},
  {key: 'serum', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=88', price: '$48'},
  {key: 'muse', image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=88', price: '$64'}
];

export default function ProductGrid() {
  const t = useTranslations('Storefront');
  const {addItem} = useCart();
  return <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">{products.map((product) => <article key={product.key} className="group"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f1f2f6]"><Image src={product.image} alt={t(`products.${product.key}.name`)} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 23vw" className="object-cover transition duration-700 group-hover:scale-105" /><button type="button" onClick={addItem} className="absolute bottom-3 left-3 right-3 hidden min-h-11 items-center justify-center rounded-xl bg-white/95 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-indigo-600 hover:text-white sm:flex sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">{t('products.addToCart')}</button></div><div className="mt-4 flex items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900 sm:text-[15px]">{t(`products.${product.key}.name`)}</h3><p className="mt-1 text-xs text-slate-500">{t(`products.${product.key}.category`)}</p></div><p className="text-sm font-semibold text-slate-900">{product.price}</p></div><button type="button" onClick={addItem} className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white sm:hidden">{t('products.addToCart')}</button></article>)}</div>;
}
