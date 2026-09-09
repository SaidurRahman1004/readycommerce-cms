'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

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
    <main className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-sm ring-8 ring-rose-50">
        <AlertTriangle className="h-10 w-10" />
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 mb-2">Something went wrong</h1>
      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        An unexpected error occurred while loading this view. Our team has been notified. 
      </p>

      {/* Development Error Details */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 w-full max-w-2xl rounded-xl bg-slate-900 p-4 text-left shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
            <div className="h-3 w-3 rounded-full bg-rose-500"></div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dev Error Details</p>
          </div>
          <p className="text-sm font-mono text-rose-400 break-words">{error.message || 'Unknown Error'}</p>
          {error.digest && <p className="mt-1 text-xs font-mono text-slate-500">Digest: {error.digest}</p>}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm">
        <button 
          type="button" 
          onClick={() => reset()} 
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 shadow-lg shadow-slate-900/20"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </button>
        <Link 
          href="/" 
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
        >
          <Home className="h-4 w-4" />
          Dashboard Home
        </Link>
      </div>
    </main>
  ); 
}
