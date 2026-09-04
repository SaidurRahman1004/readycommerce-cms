'use client';

import {useState, useEffect, useRef} from 'react';
import {useRouter} from '@/i18n/routing';
import {useTranslations} from 'next-intl';
import {catalog} from './catalog';
import Image from 'next/image';

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[18px] w-[18px]"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

export default function SearchBar() {
  const t = useTranslations('Storefront');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = query.length >= 2 
    ? catalog.filter(p => t(`products.${p.key}.name`).toLowerCase().includes(query.toLowerCase()) || t(`products.${p.key}.description`).toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative hidden md:block w-full max-w-xs xl:max-w-md ml-4 lg:ml-8">
      <form onSubmit={handleSearch} className="relative flex items-center">
        <div className="absolute left-3 text-slate-400"><SearchIcon /></div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => {setQuery(e.target.value); setOpen(true);}}
          onFocus={() => setOpen(true)}
          placeholder={t('navigation.searchPlaceholder') || "Search products..."} 
          className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" 
        />
      </form>
      
      {open && query.length >= 2 && (
        <div className="absolute top-12 left-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          {results.length > 0 ? (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggestions</p>
              {results.map((product) => (
                <button 
                  key={product.id} 
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setOpen(false);
                    router.push(`/search?q=${encodeURIComponent(t(`products.${product.key}.name`))}`);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image src={product.image} alt={product.key} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{t(`products.${product.key}.name`)}</p>
                    <p className="truncate text-xs text-slate-500">${product.price}</p>
                  </div>
                </button>
              ))}
              <button 
                type="button" 
                onClick={handleSearch}
                className="w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                View all results
              </button>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">No products found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
