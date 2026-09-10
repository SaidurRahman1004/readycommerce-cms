'use client';

import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'border border-border bg-white text-foreground hover:bg-muted',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-foreground hover:bg-muted',
  outline: 'border border-border bg-white text-foreground hover:bg-muted',
};

export function Button({ className = '', variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
