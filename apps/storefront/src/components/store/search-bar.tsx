'use client';

import {FormEvent, useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';
import {catalogService, CatalogProduct} from '@/services/api-service';

export default function SearchBar() {
  const t = useTranslations('Discovery'); const router = useRouter(); const [query, setQuery] = useState(''); const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  useEffect(() => {const timer = window.setTimeout(() => {const normalized = query.trim(); if (!normalized) {setSuggestions([]); return;} catalogService.products({search: normalized, limit: 4}).then((result) => setSuggestions(result.data)).catch(() => setSuggestions([]));}, 350); return () => window.clearTimeout(timer);}, [query]);
  const submit = (event: FormEvent) => {event.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);};
  return <div className="relative w-full max-w-lg"><form onSubmit={submit} className="flex h-11 items-center rounded-full border border-border bg-surface px-4 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-subtle"><span className="mr-3 text-muted-foreground" aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search.placeholder')} aria-label={t('search.label')} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground text-foreground" /><button type="submit" className="sr-only">{t('search.submit')}</button></form>{suggestions.length > 0 && <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-premium animate-in fade-in slide-in-from-top-2">{suggestions.map((product) => <button type="button" key={product._id} onClick={() => router.push(`/products/${product._id}`)} className="block w-full rounded-xl px-4 py-3 text-left text-[14px] font-medium text-foreground transition-colors hover:bg-muted/80">{product.name}</button>)}</div>}</div>;
}
