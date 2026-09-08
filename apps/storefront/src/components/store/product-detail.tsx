'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { catalogService, CatalogProduct } from '@/services/api-service';
import { useCart } from './cart-context';
import WishlistButton from './wishlist-button';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import CatalogCard from './catalog-card';
import { ShieldCheck, Truck, RefreshCcw, Award, HelpCircle } from 'lucide-react';

function DetailSkeleton() { return <main className="mx-auto grid max-w-7xl animate-pulse gap-10 px-5 py-10 lg:grid-cols-2 lg:px-10 lg:py-16"><div className="aspect-square rounded-[2rem] bg-muted" /><div className="space-y-5 py-8"><div className="h-5 w-1/3 rounded bg-muted" /><div className="h-14 w-4/5 rounded bg-muted" /><div className="h-8 w-1/4 rounded bg-muted" /><div className="h-32 rounded bg-muted" /></div></main>; }

export default function ProductDetail({ productId }: { productId: string }) {
  const t = useTranslations('Storefront');
  const t13 = useTranslations('Phase13F');
  const { addItem } = useCart();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState('');
  const [open, setOpen] = useState('description');
  const { recentlyViewed, addProduct } = useRecentlyViewed();

  useEffect(() => {
    let mounted = true;
    catalogService.product(productId).then((result) => {
      if (!mounted) return;
      setProduct(result.data); setVariant(result.data.variants[0]?._id || ''); addProduct(result.data);
      catalogService.relatedProducts(result.data._id).then((res) => { if (mounted) setRelated(res.data); }).catch(() => undefined).finally(() => { if (mounted) setLoadingRelated(false); });
    }).catch(() => { if (mounted) setError(true); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [productId, addProduct]);

  if (loading) return <DetailSkeleton />;
  if (error || !product) return <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20 text-center"><h1 className="text-2xl font-bold">{t('shop.empty')}</h1></main>;

  const gallery = product.images.length ? product.images : [];
  const selected = product.variants.find((item) => item._id === variant) || product.variants[0];
  const stock = selected?.stock ?? 0;
  const price = selected?.price || product.discountPrice || product.basePrice;
  const add = () => { if (selected && stock > 0) void addItem(product._id, quantity, { price, name: product.name, image: gallery[0] }, selected._id); };
  const stars = Math.round(product.ratingAverage || 0);

  return (
    <main className="bg-background pb-32 text-foreground lg:pb-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-16">
        <section>
          <div className="relative">
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth lg:block lg:overflow-hidden" onScroll={(event) => { const element = event.currentTarget; if (element.clientWidth) setActive(Math.round(element.scrollLeft / element.clientWidth)); }}>
              {gallery.map((image, index) => <div key={image} className={`relative min-w-full snap-center aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted lg:aspect-square ${index === active ? 'lg:block' : 'lg:hidden'}`}><Image src={image} alt={product.name} fill priority={index === 0} sizes="(max-width: 1023px) 90vw, 50vw" className="object-cover" /></div>)}
            </div>
            <WishlistButton productId={product._id} />
          </div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {gallery.map((image, index) => <button type="button" key={image} onClick={() => setActive(index)} className={`relative aspect-square w-24 shrink-0 overflow-hidden rounded-[1.25rem] border-2 ${active === index ? 'border-primary ring-2 ring-primary-subtle' : 'border-transparent opacity-70'}`} aria-label={t('pdp.thumbnail', { number: index + 1 })}><Image src={image} alt="" fill sizes="96px" className="object-cover" /></button>)}
          </div>
        </section>

        <section className="flex flex-col justify-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{product.category.name}</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{product.name}</h1>
          
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[15px] tracking-widest text-amber-500" aria-label={t('pdp.rating')}>{'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 5 - stars))}</span>
            <span className="text-[14px] font-medium text-muted-foreground">{product.reviewCount ? `${product.ratingAverage?.toFixed(1) || '0.0'} · ${product.reviewCount} ${t13('reviewCount')}` : t13('noReviews')}</span>
          </div>
          
          <p className="mt-8 text-3xl font-bold">৳{price.toLocaleString()}</p>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted-foreground">{product.description || product.shortDescription}</p>
          
          <div className={`mt-8 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${stock > 0 && stock <= 5 ? 'border-amber-200 bg-amber-50' : 'border-border bg-surface'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${stock > 0 && stock <= 5 ? 'bg-amber-500 animate-pulse' : stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`font-semibold ${stock > 0 && stock <= 5 ? 'text-amber-700' : ''}`}>
              {stock > 0 && stock <= 5 ? `🔥 Only ${stock} left in stock - order soon!` : stock > 5 ? '✅ In Stock - Ready to Ship' : t13('outOfStock')}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[14px] font-bold">{t('pdp.size')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {product.variants.map((item) => (
                <button type="button" key={item._id} disabled={!item.stock} onClick={() => setVariant(item._id)} className={`rounded-full border px-5 py-3 text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${variant === item._id ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground'}`}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <div className="flex h-14 w-32 items-center justify-between rounded-xl border border-border bg-surface px-1">
              <button type="button" aria-label={t('pdp.decrease')} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center text-lg">−</button>
              <span className="w-8 text-center text-[15px] font-bold">{quantity}</span>
              <button type="button" aria-label={t('pdp.increase')} onClick={() => setQuantity((value) => Math.min(stock || 1, value + 1))} className="flex h-10 w-10 items-center justify-center text-lg">+</button>
            </div>
            <button type="button" disabled={!stock} onClick={add} className="hidden h-14 flex-1 rounded-xl bg-primary px-6 text-[15px] font-bold text-white shadow-premium transition-all hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:block">
              {stock ? t('products.addToCart') : t13('outOfStock')}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-surface/50 p-5 sm:grid-cols-4">
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="text-[11px] font-bold leading-tight text-muted-foreground">Secure<br/>Checkout</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-[11px] font-bold leading-tight text-muted-foreground">Fast<br/>Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RefreshCcw className="h-6 w-6 text-primary" />
              <span className="text-[11px] font-bold leading-tight text-muted-foreground">30-Day<br/>Returns</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <span className="text-[11px] font-bold leading-tight text-muted-foreground">1-Year<br/>Warranty</span>
            </div>
          </div>

          {/* Inquiry CTA */}
          <div className="mt-6 flex justify-center">
            <a href={`mailto:support@readycommerce.com?subject=Inquiry about ${product.name}`} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              <HelpCircle className="h-4 w-4" /> ❓ Have a question? Contact Us
            </a>
          </div>

          {/* Accordions */}
          <div className="mt-12 divide-y divide-border border-y border-border">
            {['description', 'specifications', 'shipping'].map((key) => (
              <div key={key}>
                <button type="button" onClick={() => setOpen(open === key ? '' : key)} className="flex min-h-[64px] w-full items-center justify-between text-left text-[15px] font-bold hover:text-primary">
                  {key === 'specifications' ? 'Specifications' : t(`pdp.${key}.title`)}
                  <span className="text-xl text-muted-foreground">{open === key ? '−' : '+'}</span>
                </button>
                {open === key && (
                  <div className="pb-6 pr-8 text-[15px] leading-relaxed text-muted-foreground">
                    {key === 'description' ? product.description : 
                     key === 'shipping' ? t('pdp.shipping.body') : 
                     (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                         {product.specifications?.length ? (
                           product.specifications.map((spec, i) => (
                             <div key={i} className="flex justify-between border-b border-border/50 pb-2">
                               <span className="font-medium text-foreground pr-2">{spec.name}</span>
                               <span className="text-right break-words max-w-[60%]">{spec.value}</span>
                             </div>
                           ))
                         ) : (
                           <>
                             {selected?.size && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground pr-2">Size</span><span className="text-right break-words max-w-[60%]">{selected.size}</span></div>}
                             {selected?.color && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground pr-2">Color</span><span className="text-right break-words max-w-[60%]">{selected.color}</span></div>}
                             {product.category?.name && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground pr-2">Category</span><span className="text-right break-words max-w-[60%]">{product.category.name}</span></div>}
                             {selected?.sku && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground pr-2">SKU</span><span className="text-right break-words max-w-[60%]">{selected.sku}</span></div>}
                           </>
                         )}
                       </div>
                     )
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:hidden">
        <button type="button" disabled={!stock} onClick={add} className="h-14 w-full rounded-xl bg-primary text-[15px] font-bold text-white shadow-premium active:scale-95 disabled:opacity-50">
          {stock ? `${t('products.addToCart')} - ৳${(price * quantity).toLocaleString()}` : t13('outOfStock')}
        </button>
      </div>

      {(loadingRelated || related.length > 0) && (
        <div className="mx-auto mt-16 max-w-7xl border-t border-border px-5 pt-16 sm:px-8 lg:px-10 lg:pt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">Perfect Pairings</h2>
          </div>
          <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-8 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingRelated ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="w-[280px] shrink-0 snap-start lg:w-auto">
                <div className="flex flex-col gap-4 animate-pulse">
                  <div className="aspect-[4/5] rounded-[1.5rem] bg-muted w-full" />
                  <div className="space-y-2 px-2"><div className="h-4 w-3/4 bg-muted rounded" /><div className="h-4 w-1/2 bg-muted rounded" /></div>
                </div>
              </div>
            )) : related.map((item) => (
              <div key={item._id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                <CatalogCard product={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {recentlyViewed.filter((item) => item._id !== product._id).length > 0 && (
        <div className="mx-auto mt-16 max-w-7xl border-t border-border px-5 pt-16 sm:px-8 lg:px-10">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('pdp.recentlyViewed')}</h2>
          <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-8 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recentlyViewed.filter((item) => item._id !== product._id).slice(0, 4).map((item) => (
              <div key={item._id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                <CatalogCard product={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
