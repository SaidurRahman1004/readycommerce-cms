'use client';
import { ReactNode, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  children?: ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isDestructive = true,
  children,
}: ConfirmModalProps) {
  const close = onClose || onCancel || (() => undefined);
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? close : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-xl">
        <button 
          onClick={!isLoading ? onClose : undefined}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
          <p className="mb-6 text-sm text-slate-500 leading-relaxed">{description}</p>
          
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={close}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 shadow-sm ${
                isDestructive 
                  ? 'bg-rose-600 hover:bg-rose-700' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
