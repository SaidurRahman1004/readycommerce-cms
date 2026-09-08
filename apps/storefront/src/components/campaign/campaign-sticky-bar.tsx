'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/components/store/cart-context';
import { campaignService } from '@/services/api-service';
import CampaignCountdown from './campaign-countdown';

interface CampaignStickyBarProps {
  campaignSlug: string;
  productId: string;
  productName: string;
  thumbnail: string;
  offerPrice: number;
  regularPrice: number;
  expiresAt?: string;
  serverTime?: string;
  showCountdown?: boolean;
  ctaText?: string;
  locale: string;
  isExpired?: boolean;
  inStock?: boolean;
}

export default function CampaignStickyBar({
  campaignSlug,
  productId,
  productName,
  thumbnail,
  offerPrice,
  regularPrice,
  expiresAt,
  serverTime,
  showCountdown = true,
  ctaText = 'Order Now',
  locale,
  isExpired = false,
  inStock = true,
}: CampaignStickyBarProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [visible, setVisible] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when user scrolls beyond 400px
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickBuy = async () => {
    if (!inStock) return;
    setIsOrdering(true);
    try {
      await addItem(
        productId,
        1,
        { price: offerPrice, name: productName, image: thumbnail }
      );
      campaignService.trackAction(campaignSlug, 'cta_click', { source: 'sticky_bar' }).catch(() => {});
      router.push(`/${locale}/checkout`);
    } catch {
      setIsOrdering(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 sm:p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
        {/* Left: Product summary & price */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="relative hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface sm:block sm:h-14 sm:w-14">
            <Image
              src={thumbnail || '/placeholder.png'}
              alt={productName}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <h4 className="max-w-[42vw] truncate text-xs font-bold text-foreground sm:max-w-none sm:text-sm">
              {productName}
            </h4>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-black text-primary">
                ৳{offerPrice.toLocaleString()}
              </span>
              {!isExpired && regularPrice > offerPrice && (
                <span className="hidden sm:inline text-xs text-muted-foreground line-through">
                  ৳{regularPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Countdown timer (desktop only) */}
        {!isExpired && showCountdown && expiresAt && (
          <div className="hidden md:block shrink-0">
            <CampaignCountdown
              expiresAt={expiresAt}
              serverTime={serverTime}
              variant="compact"
            />
          </div>
        )}

        {/* Right: CTA Button */}
        <div className="shrink-0">
          {inStock ? (
            <button
              type="button"
              onClick={handleQuickBuy}
              disabled={isOrdering}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-white shadow-md transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 sm:h-12 sm:gap-2 sm:px-8 sm:text-sm"
            >
              {isOrdering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current text-amber-300 hidden sm:inline" />
                  <span>{ctaText}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <span className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
