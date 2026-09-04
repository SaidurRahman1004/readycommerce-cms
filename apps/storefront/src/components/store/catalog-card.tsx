'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
import {useCart} from './cart-context';
import {CatalogProduct} from './catalog';
import WishlistButton from './wishlist-button';

export default function CatalogCard({product}: {product: CatalogProduct}) {
  const t = useTranslations('Storefront'); 
  const {addItem} = useCart();
  
  // Stable prototype values avoid changing product content on every render.
  const rating = '4.8';
  const reviews = 124;

  return (
    <article className="group flex flex-col rounded-[2rem] bg-surface p-3 shadow-sm border border-border/60 transition-all duration-500 hover:shadow-premium hover:-translate-y-1.5">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-muted">
        <Link href={`/products/${product.id}`}>
          <Image 
            src={product.image} 
            alt={t(`products.${product.key}.name`)} 
            fill 
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 23vw" 
            className="object-cover transition-transform duration-1000 group-hover:scale-110" 
          />
        </Link>
        <div className="absolute inset-0 bg-black/5 transition-colors duration-500 group-hover:bg-transparent pointer-events-none" />
        
        {/* Badges & Actions */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm backdrop-blur-md">
            New
          </span>
        </div>
        <WishlistButton productId={product.id} />

        {/* Hover Add to Cart Button (Desktop) */}
        <button 
          type="button" 
          onClick={() => addItem(product.id)} 
          className="absolute bottom-3 left-3 right-3 hidden min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white/95 text-[14px] font-bold text-foreground shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-primary hover:text-white sm:flex sm:translate-y-6 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          {t('products.addToCart')}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 pt-5">
        {/* Rating */}
        <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-bold text-amber-500">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          <span className="text-foreground">{rating}</span>
          <span className="text-muted-foreground font-medium">({reviews})</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link href={`/products/${product.id}`} className="line-clamp-2 text-[15px] leading-snug font-bold tracking-tight text-foreground transition-colors hover:text-primary">
              {t(`products.${product.key}.name`)}
            </Link>
            <p className="mt-1.5 text-[13px] font-medium text-muted-foreground capitalize">
              {t(`products.${product.key}.category`)} • In Stock
            </p>
          </div>
          <p className="text-[17px] font-bold text-foreground shrink-0">
            ${product.price}
          </p>
        </div>

        {/* Mobile Add to Cart Button */}
        <button 
          type="button" 
          onClick={() => addItem(product.id)} 
          className="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary/10 text-[13px] font-bold text-primary transition-all hover:bg-primary hover:text-white sm:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add to bag
        </button>
      </div>
    </article>
  );
}
