import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

/**
 * Product Card Skeleton matching CatalogCard dimensions and responsive layout
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[24px] border border-slate-200/60 bg-white p-3.5 shadow-xs animate-pulse">
      {/* Product Image Area */}
      <div className="relative aspect-[4/5] w-full rounded-[18px] bg-slate-200/80" />

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-2 pt-4">
        <div>
          {/* Category & Rating Row */}
          <div className="mb-2.5 flex items-center justify-between">
            <div className="h-3 w-16 rounded-md bg-slate-200" />
            <div className="h-3 w-10 rounded-md bg-slate-200" />
          </div>

          {/* Product Title (2 lines) */}
          <div className="space-y-1.5">
            <div className="h-4 w-11/12 rounded-md bg-slate-200" />
            <div className="h-4 w-3/5 rounded-md bg-slate-200" />
          </div>
        </div>

        {/* Price & Cart CTA Area */}
        <div className="mt-5 flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-3 w-12 rounded bg-slate-100" />
            <div className="h-5 w-24 rounded-md bg-slate-200" />
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-200 sm:hidden" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product Detail PDP Skeleton with gallery, variants, and CTA placeholders
 */
export function ProductDetailSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-16 animate-pulse">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: Image Gallery */}
        <div>
          <div className="aspect-square w-full rounded-[2rem] bg-slate-200/80" />
          <div className="mt-4 flex gap-3 overflow-hidden pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square w-20 shrink-0 rounded-2xl bg-slate-200/70"
              />
            ))}
          </div>
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="space-y-6 lg:py-2">
          {/* Eyebrow & Title */}
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-md bg-slate-200" />
            <div className="h-9 w-4/5 rounded-xl bg-slate-200" />
            <div className="h-4 w-36 rounded-md bg-slate-200" />
          </div>

          {/* Price Box */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 rounded-lg bg-slate-200" />
            <div className="h-5 w-20 rounded-md bg-slate-200" />
          </div>

          {/* Stock Scarcity Pill */}
          <div className="h-7 w-64 rounded-full bg-slate-200/70" />

          {/* Variants Row */}
          <div className="space-y-2 pt-2">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-20 rounded-xl bg-slate-200" />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <div className="h-14 w-full rounded-full bg-slate-200" />
            <div className="h-14 w-full rounded-full bg-slate-200/70" />
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Order Card Skeleton matching account order timeline layout
 */
export function OrderCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded-md bg-slate-200" />
          <div className="h-3 w-40 rounded-md bg-slate-100" />
        </div>
        <div className="h-6 w-24 rounded-full bg-slate-200" />
      </div>

      {/* Timeline Bar Skeleton */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center space-y-2">
              <div className="h-7 w-7 rounded-full bg-slate-200" />
              <div className="h-2.5 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
