'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() { 
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <h1 className="text-8xl font-black text-slate-900 tracking-tighter drop-shadow-sm">404</h1>
      </div>
      
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Page Not Found</p>
      
      <h2 className="text-2xl font-bold text-slate-800 max-w-[400px]">
        We couldn&apos;t find the page you&apos;re looking for.
      </h2>
      
      <p className="mt-4 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        The page might have been removed, had its name changed, or is temporarily unavailable. Please check the URL or return to the dashboard.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm">
        <Link 
          href="/" 
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 shadow-lg shadow-slate-900/20"
        >
          <Home className="h-4 w-4" />
          Dashboard Overview
        </Link>
        <button 
          type="button"
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </main>
  ); 
}
