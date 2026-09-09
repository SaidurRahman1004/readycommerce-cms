'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unhandled render crash for observability
    console.error('Storefront Unhandled Render Error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-5 py-16 text-center">
      {/* Brand Icon */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 shadow-xs">
        <AlertTriangle className="h-10 w-10 stroke-[1.75]" />
      </div>

      {/* Error Badge */}
      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
        System Notice
      </span>

      {/* Title */}
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Something went wrong
      </h1>

      {/* Explanation */}
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-500">
        We encountered an unexpected problem while loading this page. Our team has been notified.
      </p>

      {/* Error Digest (if available) */}
      {error?.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">
          Ref ID: {error.digest}
        </p>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reload Page</span>
        </button>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Go to Home</span>
        </Link>
      </div>
    </main>
  );
}
