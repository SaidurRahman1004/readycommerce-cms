'use client';

import Image from 'next/image';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {catalogService, CatalogProduct} from '@/services/api-service';
import {useCart} from './cart-context';
import WishlistButton from './wishlist-button';
import {useRecentlyViewed} from '@/hooks/useRecentlyViewed';
import CatalogCard from './catalog-card';
import { ShieldCheck, Truck, RotateCcw, Shield, HelpCircle } from 'lucide-react';

function DetailSkeleton() { 
  return (
    <main className="mx-auto grid max-w-7xl animate-pulse gap-10 px-5 py-10 lg:grid-cols-2 lg:px-10 lg:py-16">
      <div className="aspect-square rounded-[2rem] bg-muted" />
      <div className="space-y-5 py-8">
        <div className="h-5 w-1/3 rounded bg-muted" />
        <div className="h-14 w-4/5 rounded bg-muted" />
        <div className="h-8 w-1/4 rounded bg-muted" />
        <div className="h-32 rounded bg-muted" />
      </div>
    </main>
  ); 
}

export default function ProductDetail({productId}: {productId: string}) { 
  const t = useTranslations('Storefront'); 
  const {addItem} = useCart(); 
  const [product, setProduct] = useState<CatalogProduct | null>(null); 
  const [related, setRelated] = useState<CatalogProduct[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(false); 
  const [active, setActive] = useState(0); 
  const [quantity, setQuantity] = useState(1); 
  const [variant, setVariant] = useState(''); 
  const [open, setOpen] = useState('description'); 
  const { recentlyViewed, addProduct } = useRecentlyViewed(); 
  
  useEffect(() => {
    catalogService.product(productId)
      .then((result) => {
        setProduct(result.data); 
        setVariant(result.data.variants[0]?._id || ''); 
        addProduct(result.data); 
        catalogService.relatedProducts(result.data._id)
          .then((res) => setRelated(res.data))
          .catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [productId, addProduct]); 

  if (loading) return <DetailSkeleton />; 
  if (error || !product) return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20 text-center">
      <h1 className="text-2xl font-bold">{t('shop.empty')}</h1>
    </main>
  ); 
  
  const gallery = product.images.length ? product.images : []; 
  const selected = product.variants.find((item) => item._id === variant) || product.variants[0]; 
  const stock = selected?.stock ?? 0; 
  
  const add = () => {
    if (selected && stock > 0) addItem(product._id, quantity);
  }; 
  
  return (
    <main className="bg-background pb-24 text-foreground lg:pb-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-16">
        <section>
          <div className="relative">
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth lg:block lg:overflow-hidden" onScroll={(event) => {
              const element = event.currentTarget; 
              if (element.clientWidth) setActive(Math.round(element.scrollLeft / element.clientWidth));
            }}>
              {gallery.map((image, index) => (
                <div key={image} className={`relative min-w-full snap-center aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted lg:aspect-square ${index === active ? 'lg:block' : 'lg:hidden'}`}>
                  <Image src={image} alt={product.name} fill priority={index === 0} sizes="(max-width: 1023px) 90vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>
            <WishlistButton productId={product._id} />
          </div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {gallery.map((image, index) => (
              <button type="button" key={image} onClick={() => setActive(index)} className={`relative aspect-square w-24 shrink-0 overflow-hidden rounded-[1.25rem] border-2 ${active === index ? 'border-primary ring-2 ring-primary-subtle' : 'border-transparent opacity-70'}`} aria-label={t('pdp.thumbnail', {number: index + 1})}>
                <Image src={image} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        </section>
        
        <section className="flex flex-col justify-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{product.category?.name}</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{product.name}</h1>
          
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[15px] tracking-widest text-amber-500" aria-label={t('pdp.rating')}>★★★★★</span>
            <span className="text-[14px] font-medium text-muted-foreground">{t('pdp.reviews')}</span>
          </div>
          
          <p className="mt-8 text-3xl font-bold">৳{(selected?.price || product.basePrice).toLocaleString()}</p>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted-foreground">{product.description || product.shortDescription}</p>
          
          <div className="mt-10">
            <p className="text-[14px] font-bold">{t('pdp.size')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {product.variants.map((item) => (
                <button type="button" key={item._id} onClick={() => setVariant(item._id)} className={`rounded-full border px-5 py-3 text-[14px] font-bold ${variant === item._id ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground'}`}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* ADVANCED AVAILABILITY */}
          <div className="mt-8 flex items-center">
             {stock > 0 && stock <= 5 ? (
               <p className="text-[15px] font-bold text-amber-600 flex items-center gap-1.5">
                 🔥 Only {stock} left in stock - order soon!
               </p>
             ) : stock > 5 ? (
               <p className="text-[15px] font-bold text-emerald-600 flex items-center gap-1.5">
                 <ShieldCheck className="h-5 w-5" /> In Stock - Ready to Ship
               </p>
             ) : (
               <p className="text-[15px] font-bold text-red-500">Out of Stock</p>
             )}
          </div>

          <div className="mt-6 flex gap-4">
            <div className="flex h-14 w-32 items-center justify-between rounded-xl border border-border bg-surface px-1">
              <button type="button" aria-label={t('pdp.decrease')} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center text-lg">−</button>
              <span className="w-8 text-center text-[15px] font-bold">{quantity}</span>
              <button type="button" aria-label={t('pdp.increase')} onClick={() => setQuantity((value) => Math.min(stock || 1, value + 1))} className="flex h-10 w-10 items-center justify-center text-lg">+</button>
            </div>
            <button type="button" disabled={!stock} onClick={add} className="hidden h-14 flex-1 rounded-xl bg-primary px-6 text-[15px] font-bold text-white shadow-premium transition-all hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:block">
              {stock ? t('products.addToCart') : 'Out of stock'}
            </button>
          </div>
          
          {/* TRUST BLOCK */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/20 p-5 sm:grid-cols-2 lg:grid-cols-2">
            <div className="flex items-center gap-2.5 text-[13.5px] font-medium text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Secure Checkout</div>
            <div className="flex items-center gap-2.5 text-[13.5px] font-medium text-muted-foreground"><Truck className="h-4 w-4 text-primary" /> Fast Delivery</div>
            <div className="flex items-center gap-2.5 text-[13.5px] font-medium text-muted-foreground"><RotateCcw className="h-4 w-4 text-primary" /> 30-Day Easy Returns</div>
            <div className="flex items-center gap-2.5 text-[13.5px] font-medium text-muted-foreground"><Shield className="h-4 w-4 text-primary" /> 1-Year Warranty</div>
          </div>
          
          {/* INQUIRY CTA */}
          <div className="mt-5 text-center sm:text-left">
            <a href={`mailto:support@readycommerce.com?subject=Question about ${encodeURIComponent(product.name)}`} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-primary">
              <HelpCircle className="h-4 w-4" /> <span>Have a question? Contact Us</span>
            </a>
          </div>

          {/* ACCORDIONS */}
          <div className="mt-12 divide-y divide-border border-y border-border">
            {['description', 'specifications', 'shipping'].map((key) => (
              <div key={key}>
                <button type="button" onClick={() => setOpen(open === key ? '' : key)} className="flex min-h-[64px] w-full items-center justify-between text-left text-[15px] font-bold hover:text-primary capitalize">
                  {key === 'description' ? t('pdp.description.title') : key === 'shipping' ? t('pdp.shipping.title') : 'Specifications'}
                  <span className="text-xl text-muted-foreground">{open === key ? '−' : '+'}</span>
                </button>
                {open === key && (
                  <div className="pb-6 pr-8 text-[15px] leading-relaxed text-muted-foreground">
                    {key === 'description' ? (
                      <p>{product.description}</p>
                    ) : key === 'shipping' ? (
                      <p>{t('pdp.shipping.body')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                        {product.specifications && product.specifications.length > 0 ? (
                          product.specifications.map((spec) => (
                            <div key={spec.name} className="flex justify-between border-b border-border/50 pb-2">
                              <span className="font-medium text-foreground">{spec.name}</span>
                              <span className="text-right">{spec.value}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            {selected?.size && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground">Size</span><span className="text-right">{selected.size}</span></div>}
                            {selected?.color && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground">Color</span><span className="text-right">{selected.color}</span></div>}
                            {product.category?.name && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground">Category</span><span className="text-right">{product.category.name}</span></div>}
                            {selected?.sku && <div className="flex justify-between border-b border-border/50 pb-2"><span className="font-medium text-foreground">SKU</span><span className="text-right">{selected.sku}</span></div>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* MOBILE STICKY CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:hidden">
        <button type="button" disabled={!stock} onClick={add} className="h-14 w-full rounded-xl bg-primary text-[15px] font-bold text-white shadow-premium transition-transform active:scale-95 disabled:opacity-50">
          {stock ? `${t('products.addToCart')} - ৳${((selected?.price || product.basePrice) * quantity).toLocaleString()}` : 'Out of stock'}
        </button>
      </div>
      
      {related.length > 0 && (
        <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 lg:px-10 lg:pt-24 border-t border-border mt-16">
          <h2 className="text-2xl font-bold">{t('pdp.related')}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item) => <CatalogCard key={item._id} product={item} />)}
          </div>
        </div>
      )}
      
      {recentlyViewed.filter(item => item._id !== product._id).length > 0 && (
        <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 lg:px-10 border-t border-border mt-16">
          <h2 className="text-2xl font-bold">{t('pdp.recentlyViewed')}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {recentlyViewed.filter(item => item._id !== product._id).slice(0, 4).map((item) => <CatalogCard key={item._id} product={item} />)}
          </div>
        </div>
      )}
    </main>
  ); 
}
