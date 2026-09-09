'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw, LucideIcon, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => Promise<void> | void;
  retryLabel?: string;
  homeLink?: boolean;
  compact?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function ErrorState({
  title = 'Unable to load content',
  message = 'We encountered an unexpected connection issue. Please check your internet connection or try again.',
  onRetry,
  retryLabel = 'Try Again',
  homeLink = false,
  compact = false,
  icon: Icon = AlertCircle,
  className = '',
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-900 ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="truncate font-semibold">{message || title}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-800 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-gradient-to-b from-rose-50/50 to-white p-8 text-center sm:p-12 lg:p-14 shadow-xs ${className}`}
      role="alert"
    >
      {/* Icon Badge */}
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-8 ring-rose-50 shadow-xs">
        <Icon className="h-8 w-8 stroke-[1.75]" />
      </div>

      {/* Error Eyebrow */}
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Connection Error
      </span>

      {/* Title */}
      <h3 className="mt-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h3>

      {/* Message */}
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
        {message}
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Retrying...' : retryLabel}</span>
          </button>
        )}

        {homeLink && (
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Go to Home</span>
          </Link>
        )}
      </div>
    </div>
  );
}
