'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {useCart} from './cart-context';
import WishlistButton from './wishlist-button';

const products = [
  {id: 'noir-07', key: 'noir', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=88', price: '$86'},
  {id: 'santal-33', key: 'santal', image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=88', price: '$72'},
  {id: 'botanical-glow', key: 'serum', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=88', price: '$48'},
  {id: 'muse-veil', key: 'muse', image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=88', price: '$64'}
];

export default function ProductGrid() { const t = useTranslations('Storefront'); const {addItem} = useCart(); return <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="group flex flex-col"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow hover:shadow-premium"><Image src={product.image} alt={t(`products.${product.key}.name`)} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 23vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /><WishlistButton productId={product.id} /><button type="button" onClick={() => addItem(product.id)} className="absolute bottom-4 left-4 right-4 hidden min-h-[44px] items-center justify-center rounded-xl bg-background/95 text-[13px] font-bold text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-primary hover:text-white sm:flex sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">{t('products.addToCart')}</button></div><div className="mt-5 flex items-start justify-between gap-3"><div><h3 className="text-[14px] font-bold tracking-tight text-foreground sm:text-[15px]">{t(`products.${product.key}.name`)}</h3><p className="mt-1.5 text-[13px] text-muted-foreground">{t(`products.${product.key}.category`)}</p></div><p className="text-[15px] font-bold text-foreground">{product.price}</p></div><button type="button" onClick={() => addItem(product.id)} className="mt-4 min-h-[44px] w-full rounded-xl border border-border text-[13px] font-bold text-foreground transition-all hover:border-primary hover:bg-primary hover:text-white sm:hidden">{t('products.addToCart')}</button></article>)}</div>; }
