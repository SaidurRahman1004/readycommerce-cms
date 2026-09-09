'use client';

import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export interface SuccessStateProps {
  title: string;
  message?: string;
  badge?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SuccessState({
  title,
  message,
  badge = 'Success',
  action,
  secondaryAction,
  compact = false,
  className = '',
  children,
}: SuccessStateProps) {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm text-emerald-950 animate-in fade-in zoom-in-95 duration-200 ${className}`}
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-emerald-950">{title}</p>
          {message && <p className="text-xs text-emerald-700">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/50 to-white p-8 text-center sm:p-12 lg:p-16 shadow-xs animate-in fade-in zoom-in-95 duration-300 ${className}`}
      role="status"
    >
      {/* Animated Green Checkmark with Double Ring */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-100">
        <CheckCircle2 className="h-10 w-10 stroke-[2.25]" />
      </div>

      {/* Badge */}
      {badge && (
        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          {badge}
        </span>
      )}

      {/* Title */}
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>

      {/* Message */}
      {message && (
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          {message}
        </p>
      )}

      {/* Custom Children slot */}
      {children && <div className="mt-6 w-full max-w-md">{children}</div>}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
              >
                <span>{secondaryAction.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
