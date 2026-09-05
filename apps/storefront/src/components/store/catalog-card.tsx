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
          <p className="text-[12px] font-semibold tracking-wider text-indigo-600 uppercase mb-1.5">{product.category.name}</p>
          <Link href={`/products/${product._id}`} className="line-clamp-2 text-[16px] font-bold leading-snug tracking-tight text-slate-900 transition-colors hover:text-indigo-600">
            {product.name}
          </Link>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[18px] font-extrabold text-slate-900">৳{product.basePrice.toLocaleString()}</p>
        </div>
      </div>
    </article>
  );
}
