'use client';

import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Link } from '@/i18n/routing';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  badge?: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  badge,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/90 bg-white/70 p-8 text-center sm:p-12 lg:p-16 backdrop-blur-xs ${className}`}
    >
      {/* Icon with Double Ring */}
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50/80 text-indigo-600 ring-8 ring-indigo-50/40 shadow-xs">
        <Icon className="h-8 w-8 stroke-[1.75]" />
      </div>

      {/* Optional Status Pill */}
      {badge && (
        <span className="mt-5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {badge}
        </span>
      )}

      {/* Title */}
      <h3 className={`${badge ? 'mt-3' : 'mt-6'} text-xl font-bold tracking-tight text-slate-900 sm:text-2xl`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
          {description}
        </p>
      )}

      {/* Custom Children Slots (e.g. search suggestions, tag pills) */}
      {children && <div className="mt-6 w-full max-w-md">{children}</div>}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                <span>{action.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                <span>{action.label}</span>
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
              >
                {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
              >
                {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
                <span>{secondaryAction.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
