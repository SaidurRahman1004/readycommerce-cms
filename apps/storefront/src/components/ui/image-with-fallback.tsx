'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string | undefined | null;
  fallbackText?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackText = 'Image not available',
  className = '',
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // If no source is provided at all, immediately show fallback
  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <ImageOff className="h-8 w-8 mb-2 opacity-50" />
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
