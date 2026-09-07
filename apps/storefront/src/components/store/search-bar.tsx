'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { catalogService, CatalogProduct } from '@/services/api-service';
import Image from 'next/image';

export default function SearchBar() {
  const t = useTranslations('Discovery');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = query.trim();
      if (!normalized) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      catalogService.products({ search: normalized, limit: 4 })
        .then((result) => setSuggestions(result.data))
        .catch(() => setSuggestions([]))
        .finally(() => setIsLoading(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      setSuggestions([]); // close suggestions
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <form onSubmit={submit} className="flex h-11 items-center rounded-full border border-border bg-surface px-4 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-subtle">
        <span className="mr-3 text-muted-foreground" aria-hidden="true">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          )}
        </span>
        <input 
          value={query} 
          onChange={(event) => setQuery(event.target.value)} 
          placeholder={t('search.placeholder')} 
          aria-label={t('search.label')} 
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground text-foreground" 
        />
        <button type="submit" className="sr-only">{t('search.submit')}</button>
      </form>
      
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-14 z-[100] overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-premium animate-in fade-in slide-in-from-top-2">
          {suggestions.map((product) => (
            <button 
              type="button" 
              key={product._id} 
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                router.push(`/products/${product._id}`);
              }} 
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {product.images?.[0] && (
                  <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[14px] font-bold text-foreground">{product.name}</p>
                <p className="text-[13px] font-semibold text-primary">
                  &#2547;{(product.discountPrice || product.basePrice).toLocaleString()}
                </p>
              </div>
            </button>
          ))}
          <button 
            type="button" 
            onClick={submit} 
            className="mt-2 block w-full rounded-lg bg-primary/5 py-2.5 text-center text-[13px] font-bold text-primary transition-colors hover:bg-primary/10"
          >
            View all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
}
