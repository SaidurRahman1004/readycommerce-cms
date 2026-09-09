'use client';

import { ShoppingBag, ArrowRight, Compass, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function LocalizedNotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-5 py-16 text-center">
      {/* Brand Monogram Badge */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/60 shadow-xs">
        <Compass className="h-10 w-10 stroke-[1.75]" />
      </div>

      {/* 404 Badge */}
      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
        Error 404 · Not Found
      </span>

      {/* Main Heading */}
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
        Page Not Found
      </h1>

      {/* Description */}
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
        Sorry, the page you are looking for doesn&apos;t exist, has been removed, or the link is broken.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <Link
          href="/shop"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-8 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Explore Shop</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Go to Home</span>
        </Link>
      </div>

      {/* Quick Discovery Tags */}
      <div className="mt-14 max-w-lg border-t border-slate-100 pt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Popular Collections
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[
            { name: 'Fragrance', href: '/shop?category=fragrance' },
            { name: 'Skincare', href: '/shop?category=skincare' },
            { name: 'Special Offers', href: '/shop?isSpecialOffer=true' },
            { name: 'New Arrivals', href: '/shop?sort=newest' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
