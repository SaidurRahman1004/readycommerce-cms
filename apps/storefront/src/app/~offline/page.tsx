'use client';
import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <WifiOff size={48} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        You are currently offline
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-slate-500">
        It seems you have lost your internet connection. We&apos;ll automatically reconnect you when your network returns.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl bg-slate-100 px-8 py-3.5 text-base font-bold text-slate-900 transition-colors hover:bg-slate-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
