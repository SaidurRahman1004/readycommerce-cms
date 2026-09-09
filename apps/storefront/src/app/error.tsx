'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, ShoppingBag } from 'lucide-react';

export default function ErrorPage({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void 
}) { 
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4 bg-background">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-sm ring-8 ring-rose-50">
        <AlertTriangle className="h-12 w-12" />
      </div>
      
      <h1 className="text-4xl font-black text-foreground mb-3">Oops! Something went wrong</h1>
      <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
        We encountered an unexpected error while trying to load this page. Our engineering team has been automatically notified.
      </p>

      {/* Development Error Details */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 w-full max-w-2xl rounded-2xl border-2 border-rose-100 bg-rose-50/50 p-5 text-left overflow-hidden">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-rose-100">
            <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse"></div>
            <p className="text-sm font-bold text-rose-800 uppercase tracking-wider">Dev Error Details</p>
          </div>
          <p className="text-sm font-mono text-rose-700 break-words">{error.message || 'Unknown Error'}</p>
          {error.digest && <p className="mt-2 text-xs font-mono text-rose-600/70">Digest: {error.digest}</p>}
        </div>
      )}

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
        <button 
          type="button" 
          onClick={() => reset()} 
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-105 shadow-lg shadow-primary/20"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </button>
        <Link 
          href="/en/shop" 
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-background px-6 py-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          <ShoppingBag className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>
    </main>
  ); 
}
