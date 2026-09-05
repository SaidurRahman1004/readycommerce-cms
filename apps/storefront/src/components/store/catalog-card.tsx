'use client';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';
import {CatalogProduct} from '@/services/api-service';
import {useCart} from './cart-context';
import WishlistButton from './wishlist-button';

export default function CatalogCard({product}: {product: CatalogProduct}) {
  const t = useTranslations('Storefront');
  const {addItem} = useCart();
  const image = product.images[0];
  const cartProduct = {price: product.basePrice, name: product.name, image};
  
  return (
    <article className="group flex flex-col rounded-[24px] border border-slate-200/60 bg-white p-3.5 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-slate-50">
        <Link href={`/products/${product._id}`}>
          <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 23vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        </Link>
        <WishlistButton productId={product._id} />
        {product.isFeatured && (
          <span className="absolute top-3 left-3 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-md">
            FEATURED
          </span>
        )}
        <button type="button" onClick={() => addItem(product._id, 1, cartProduct)} className="absolute bottom-3 left-3 right-3 flex min-h-[46px] items-center justify-center rounded-xl bg-white/90 text-sm font-bold tracking-tight text-slate-900 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.15)] backdrop-blur-md transition-all duration-300 hover:bg-indigo-600 hover:text-white sm:translate-y-8 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          {t('products.addToCart')}
        </button>
      </div>
      <div className="flex flex-1 flex-col justify-between p-2 pt-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">{product.category.name}</p>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>
              4.8
            </div>
          </div>
          <Link href={`/products/${product._id}`} className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-primary">
            {product.name}
          </Link>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            {product.discountPrice ? (
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-slate-400 line-through">৳{product.basePrice.toLocaleString()}</p>
                <p className="text-[17px] font-extrabold text-red-600">৳{product.discountPrice.toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-[17px] font-extrabold text-foreground">৳{product.basePrice.toLocaleString()}</p>
            )}
          </div>
          <button type="button" onClick={() => addItem(product._id, 1, cartProduct)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white sm:hidden" aria-label={t('products.addToCart')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </article>
  );
}
