'use client';

import { FormEvent, useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SearchX } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { catalogService, CatalogProduct } from '@/services/api-service';
import Image from 'next/image';

export default function SearchBar() {
  const t = useTranslations('Discovery');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = query.trim();
      if (!normalized) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      setIsOpen(true);
      catalogService
        .products({ search: normalized, limit: 4 })
        .then((result) => setSuggestions(result.data || []))
        .catch(() => setSuggestions([]))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const submit = (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form
        onSubmit={submit}
        className="flex h-11 items-center rounded-full border border-border bg-surface px-4 shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-subtle"
      >
        <span className="mr-3 text-muted-foreground" aria-hidden="true">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Search className="h-4 w-4 opacity-70" />
          )}
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={t('search.placeholder')}
          aria-label={t('search.label')}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground text-foreground"
        />
        <button type="submit" className="sr-only">
          {t('search.submit')}
        </button>
      </form>

      {isOpen && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 top-14 z-[100] overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
          {/* Loading Skeletons in Dropdown */}
          {isLoading ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-2 animate-pulse">
                  <div className="h-12 w-10 shrink-0 rounded-md bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            /* Suggestions List */
            <>
              {suggestions.map((product) => (
                <button
                  type="button"
                  key={product._id}
                  onClick={() => {
                    setQuery('');
                    setIsOpen(false);
                    router.push(`/products/${product._id}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-foreground">{product.name}</p>
                    <p className="text-[13px] font-semibold text-primary">
                      ৳{(product.discountPrice || product.basePrice).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => submit()}
                className="mt-2 block w-full rounded-lg bg-primary/5 py-2.5 text-center text-[13px] font-bold text-primary transition-colors hover:bg-primary/10"
              >
                View all results for &quot;{query}&quot;
              </button>
            </>
          ) : (
            /* Empty State in Dropdown */
            <div className="py-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <SearchX className="h-5 w-5" />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-slate-800">
                No matching products found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
