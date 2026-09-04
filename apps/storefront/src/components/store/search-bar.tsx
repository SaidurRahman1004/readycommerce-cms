'use client';

import {FormEvent, useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';
import {catalog} from './catalog';

export default function SearchBar() {
  const t = useTranslations('Discovery'); const router = useRouter(); const [query, setQuery] = useState(''); const [suggestions, setSuggestions] = useState<typeof catalog>([]);
  useEffect(() => {const timer = window.setTimeout(() => {const normalized = query.trim().toLowerCase(); setSuggestions(normalized ? catalog.filter((product) => `${product.key} ${product.category}`.includes(normalized)).slice(0, 4) : []);}, 350); return () => window.clearTimeout(timer);}, [query]);
  const submit = (event: FormEvent) => {event.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);};
  return <div className="relative w-full max-w-xs"><form onSubmit={submit} className="flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 shadow-sm"><span className="mr-2 text-slate-400" aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => query && setSuggestions(catalog.slice(0, 4))} placeholder={t('search.placeholder')} aria-label={t('search.label')} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /><button type="submit" className="sr-only">{t('search.submit')}</button></form>{suggestions.length > 0 && <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">{suggestions.map((product) => <button type="button" key={product.id} onClick={() => router.push(`/products/${product.id}`)} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">{t(`products.${product.key}.name`)}</button>)}</div>}</div>;
}
