'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useCart } from '@/components/store/cart-context';
import { leadService, campaignService } from '@/services/api-service';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, RefreshCw, Bell, Mail, CheckCircle2, Loader2, Zap } from 'lucide-react';

interface CampaignOfferBoxProps {
  campaignSlug: string;
  productId: string;
  productName: string;
  primaryImage: string;
  offerPrice: number;
  regularPrice: number;
  discountPercentage?: number;
  ctaText?: string;
  ctaSubtext?: string;
  variants: Array<{
    _id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    size?: string;
    color?: string;
  }>;
  locale: string;
  isExpired?: boolean;
}

export default function CampaignOfferBox({
  campaignSlug,
  productId,
  productName,
  primaryImage,
  offerPrice,
  regularPrice,
  discountPercentage,
  ctaText = 'Order Now - Limited Stock',
  ctaSubtext = 'Free Delivery Across Bangladesh',
  variants = [],
  locale,
  isExpired = false,
}: CampaignOfferBoxProps) {
  const router = useRouter();
  const t = useTranslations('Storefront');
  const { addItem } = useCart();

  // Find first in-stock variant or first variant
  const firstInStock = variants.find((v) => (v.stock ?? 0) > 0);
  const [selectedVariantId, setSelectedVariantId] = useState(
    firstInStock ? firstInStock._id : variants[0]?._id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isOrderingNow, setIsOrderingNow] = useState(false);

  // Out of stock lead capture
  const [notifyEmail, setNotifyEmail] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSubscribed, setLeadSubscribed] = useState(false);

  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];
  const stock = selectedVariant?.stock ?? 0;
  
  // Calculate effective price: if campaign is expired, fallback to normal variant price/regular price
  const displayOfferPrice = isExpired ? (selectedVariant?.price || regularPrice) : offerPrice;
  const savings = Math.max(0, regularPrice - displayOfferPrice);

  const handleAddToCart = async () => {
    if (stock <= 0) return;
    setIsAdding(true);
    try {
      await addItem(
        productId,
        quantity,
        { price: displayOfferPrice, name: productName, image: primaryImage },
        selectedVariant?._id
      );
      // Non-blocking action tracking
      campaignService.trackAction(campaignSlug, 'add_to_cart', { variantId: selectedVariant?._id, quantity }).catch(() => {});
    } catch {
      toast.error('Could not add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (stock <= 0) return;
    setIsOrderingNow(true);
    try {
      await addItem(
        productId,
        quantity,
        { price: displayOfferPrice, name: productName, image: primaryImage },
        selectedVariant?._id
      );
      // Track CTA click
      campaignService.trackAction(campaignSlug, 'cta_click', { action: 'buy_now', variantId: selectedVariant?._id }).catch(() => {});
      // Immediate redirect to checkout
      router.push(`/${locale}/checkout`);
    } catch {
      toast.error('Failed to initiate checkout.');
      setIsOrderingNow(false);
    }
  };

  const handleNotifyLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setSubmittingLead(true);
    try {
      const res = await leadService.notifyRestock({
        email: notifyEmail.trim(),
        productId,
        variantId: selectedVariant?._id || null,
      });
      toast.success(res?.message || 'We will alert you as soon as this item restocks!');
      setLeadSubscribed(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to register notification.');
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-border/80 bg-surface/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
      {/* Price Block */}
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-primary">৳</span>
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            {displayOfferPrice.toLocaleString()}
          </span>
        </div>

        {!isExpired && regularPrice > displayOfferPrice && (
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-medium text-muted-foreground line-through decoration-rose-500/80 decoration-2">
              ৳{regularPrice.toLocaleString()}
            </span>
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Save ৳{savings.toLocaleString()} {discountPercentage ? `(${discountPercentage}%)` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stock Status Badge */}
      <div
        className={`mt-5 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
          stock > 5
            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300'
            : stock > 0
            ? 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300'
            : 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300'
        }`}
      >
        <span>
          {stock > 5
            ? '🟢 In Stock — Ready for Express Dispatch'
            : stock > 0
            ? `🔥 High Demand! Only ${stock} units left in stock`
            : '🔴 Currently Sold Out'}
        </span>
      </div>

      {/* Variant Selector */}
      {variants.length > 1 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-foreground">Choose Option:</span>
            {selectedVariant && (
              <span className="text-muted-foreground">
                {selectedVariant.name} {stock === 0 ? '(Out of Stock)' : ''}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const isSelected = selectedVariantId === v._id;
              const isOutOfStock = (v.stock ?? 0) <= 0;
              return (
                <button
                  type="button"
                  key={v._id}
                  onClick={() => {
                    setSelectedVariantId(v._id);
                    setLeadSubscribed(false);
                  }}
                  className={`group relative overflow-hidden rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    isSelected
                      ? isOutOfStock
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                        : 'border-primary bg-primary text-white shadow-md'
                      : isOutOfStock
                      ? 'border-border/40 bg-muted/30 text-muted-foreground/50 hover:bg-muted/50'
                      : 'border-border bg-surface text-foreground hover:border-primary/50'
                  }`}
                >
                  <span>{v.name}</span>
                  {isOutOfStock && (
                    <span className="pointer-events-none absolute inset-0 m-auto h-[1.5px] w-[120%] -rotate-12 bg-rose-500/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase Controls if in stock */}
      {stock > 0 ? (
        <div className="mt-6 space-y-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qty:</span>
            <div className="flex h-11 items-center rounded-xl border border-border bg-background px-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground active:scale-95"
              >
                −
              </button>
              <span className="w-10 text-center font-mono text-sm font-bold text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                className="flex h-9 w-9 items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground active:scale-95"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              Total: <strong className="text-foreground">৳{(displayOfferPrice * quantity).toLocaleString()}</strong>
            </span>
          </div>

          {/* Primary CTA (Buy Now) */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOrderingNow || isAdding}
            className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-emerald-600 to-primary bg-[length:200%_auto] px-6 text-base font-black text-white shadow-xl transition-all duration-300 hover:bg-[position:right_center] hover:shadow-primary/25 active:scale-98 disabled:opacity-50"
          >
            {isOrderingNow ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Zap className="h-5 w-5 fill-current text-amber-300 animate-pulse" />
                <span>{ctaText}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          {/* Secondary CTA (Add to Cart) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding || isOrderingNow}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 bg-background px-6 text-sm font-bold text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-98 disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {ctaSubtext && (
            <p className="text-center text-xs font-semibold text-muted-foreground">
              ✨ {ctaSubtext}
            </p>
          )}
        </div>
      ) : (
        /* Out of Stock Lead Capture */
        <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Bell className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>Notify Me When In Stock</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            We will send you an exclusive email notification as soon as fresh stock arrives.
          </p>

          {leadSubscribed ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>You are subscribed! We will notify you promptly.</span>
            </div>
          ) : (
            <form onSubmit={handleNotifyLead} className="mt-3 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  disabled={submittingLead}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={submittingLead || !notifyEmail.trim()}
                className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {submittingLead ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Notify Me</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border/60 pt-6 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <Truck className="h-5 w-5 text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground leading-tight">
            Fast Nationwide<br />Delivery
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground leading-tight">
            Cash On<br />Delivery
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <RefreshCw className="h-5 w-5 text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground leading-tight">
            7 Days Easy<br />Return Policy
          </span>
        </div>
      </div>
    </div>
  );
}
