'use client';

import { useState } from 'react';
import Image from 'next/image';
import WishlistButton from '@/components/store/wishlist-button';
import { Tag, Sparkles } from 'lucide-react';

interface CampaignGalleryProps {
  images: string[];
  productName: string;
  badgeText?: string;
  discountPercentage?: number;
  productId: string;
}

export default function CampaignGallery({
  images,
  productName,
  badgeText,
  discountPercentage,
  productId,
}: CampaignGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const gallery = images.length > 0 ? images : ['/placeholder.png'];

  return (
    <div className="flex flex-col gap-4">
      {/* Featured Main Image */}
      <div className="relative aspect-[4/5] sm:aspect-square w-full overflow-hidden rounded-[2rem] border border-border/80 bg-surface shadow-md">
        <Image
          src={gallery[activeIndex] || gallery[0]}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-all duration-300 hover:scale-105"
        />

        {/* Floating Badges */}
        <div className="absolute left-4 top-4 flex flex-col gap-2 z-10">
          {discountPercentage && discountPercentage > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg animate-pulse">
              <Tag className="h-3.5 w-3.5" />
              <span>{discountPercentage}% OFF</span>
            </div>
          ) : null}

          {badgeText ? (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/95 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-950 shadow-md">
              <Sparkles className="h-3 w-3" />
              <span>{badgeText}</span>
            </div>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <div className="absolute right-4 top-4 z-10">
          <WishlistButton productId={productId} />
        </div>

        {/* Photo Counter */}
        {gallery.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {activeIndex + 1} / {gallery.length}
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((img, idx) => (
            <button
              type="button"
              key={img + idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                activeIndex === idx
                  ? 'border-primary ring-2 ring-primary/30 shadow-md scale-95'
                  : 'border-border/60 opacity-60 hover:opacity-100 hover:border-border'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
