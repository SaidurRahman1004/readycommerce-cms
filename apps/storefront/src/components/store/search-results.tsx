'use client';

import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import CatalogCard from './catalog-card';
import {catalog} from './catalog';

export default function SearchResults() { const t = useTranslations('Discovery'); const params = useSearchParams(); const query = params.get('q')?.trim() ?? ''; const normalized = query.toLowerCase(); const results = catalog.filter((product) => `${product.key} ${product.category} ${product.id}`.includes(normalized)); return <main className="min-h-screen bg-[#fafbff] px-5 py-12 text-slate-950 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{t('search.eyebrow')}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{query ? t('search.resultsFor', {query}) : t('search.title')}</h1><div className="mt-10">{results.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">{results.map((product) => <CatalogCard key={product.id} product={product} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><p className="text-xl font-semibold">{t('search.emptyTitle')}</p><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{t('search.emptyDescription')}</p></div>}</div></div></main>; }
