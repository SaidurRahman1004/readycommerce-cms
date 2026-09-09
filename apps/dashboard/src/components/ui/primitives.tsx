'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, type LucideIcon } from 'lucide-react';

export function Skeleton({ className = '' }: { className?: string }) { return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />; }
export function EmptyState({ title, description = '', action, children, icon: Icon }: { title: string; description?: string; action?: React.ReactNode; children?: React.ReactNode; icon?: LucideIcon }) { return <div className="rounded-2xl border border-dashed border-border bg-white/60 p-10 text-center">{Icon && <Icon className="mx-auto mb-4 h-8 w-8 text-primary" aria-hidden="true" />}<h2 className="font-bold">{title}</h2>{description && <p className="mt-2 text-sm text-slate-500">{description}</p>}{action && <div className="mt-4 flex justify-center">{action}</div>}{children}</div>; }
export function ErrorState({ title, retry, retryLabel = 'Retry' }: { title: string; retry?: () => void | Promise<void>; retryLabel?: string }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const handleRetry = async () => {
    if (!retry) return;
    setIsRetrying(true);
    try {
      await retry();
    } finally {
      setIsRetrying(false);
    }
  };
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 flex flex-col items-center justify-center text-center">
      <AlertCircle className="h-8 w-8 mb-3 text-rose-500 opacity-80" />
      <p className="font-bold text-base">{title}</p>
      {retry && (
        <button 
          type="button" 
          onClick={handleRetry} 
          disabled={isRetrying}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-70"
        >
          {isRetrying && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRetrying ? 'Retrying...' : retryLabel}
        </button>
      )}
    </div>
  ); 
}
export function ConfirmDialog({ open, title, description, onCancel, onConfirm, cancelLabel = 'Cancel', confirmLabel = 'Confirm', busy = false }: { open: boolean; title: string; description: string; onCancel: () => void; onConfirm: () => void; cancelLabel?: string; confirmLabel?: string; busy?: boolean }) { if (!open) return null; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="confirm-dialog-title" className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:opacity-50">{cancelLabel}</button><button type="button" onClick={onConfirm} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{busy ? '…' : confirmLabel}</button></div></div></div>; }
