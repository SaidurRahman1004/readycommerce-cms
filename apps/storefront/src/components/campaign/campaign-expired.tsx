'use client';

import Link from 'next/link';
import { Clock, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import CatalogCard from '@/components/store/catalog-card';
import { CatalogProduct } from '@/services/api-service';

interface CampaignExpiredProps {
  productId: string;
  productSlug?: string;
  productName: string;
  recommendedProducts?: CatalogProduct[];
  locale: string;
}

export default function CampaignExpired({
  productId,
  productSlug,
  productName,
  recommendedProducts = [],
  locale,
}: CampaignExpiredProps) {
  return (
    <div className="mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
      {/* Notice Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-surface p-8 sm:p-12 text-center shadow-lg backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-inner">
          <Clock className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">
          Campaign Concluded
        </span>

        <h1 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-foreground">
          This Special Offer Has Expired
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          The promotional discount period for <strong>{productName}</strong> has officially ended.
          However, you can still purchase this item at our standard catalogue price or explore other ongoing promotions!
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/${locale}/products/${productSlug || productId}`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>View Regular Product</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/${locale}/shop`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-bold text-foreground transition-all hover:border-primary active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Browse All Products</span>
          </Link>
        </div>
      </div>

      {/* Recommended Products Carousel / Grid */}
      {recommendedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                You Might Also Like
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Hand-picked trending items available right now
              </p>
            </div>
            <Link
              href={`/${locale}/shop`}
              className="text-xs sm:text-sm font-bold text-primary hover:underline"
            >
              View More &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {recommendedProducts.slice(0, 4).map((p) => (
              <CatalogCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
