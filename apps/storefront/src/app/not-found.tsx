'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() { 
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4 bg-background">
      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <h1 className="text-9xl font-black text-foreground tracking-tighter drop-shadow-sm">404</h1>
      </div>
      
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Page Not Found</p>
      
      <h2 className="text-3xl font-bold text-foreground max-w-[500px]">
        Looks like you&apos;ve wandered off the map.
      </h2>
      
      <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. 
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
        <Link 
          href="/en/shop" 
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-105 shadow-lg shadow-primary/20"
        >
          <ShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Link>
        <button 
          type="button"
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-background px-6 py-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </main>
  ); 
}
