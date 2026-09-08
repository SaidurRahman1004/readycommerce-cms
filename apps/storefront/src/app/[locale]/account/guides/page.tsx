'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChevronDown, FileText } from 'lucide-react';
import { useLocale } from 'next-intl';
import { manualService, type CustomerManual } from '@/services/api-service';

const copy = {
  en: { title: 'Guides & manuals', description: 'Practical care and activation notes for the products you own.', empty: 'No guides are available yet.', error: 'Guides could not be loaded.', retry: 'Try again', general: 'General guide', read: 'Read guide' },
  bn: { title: 'গাইড ও ম্যানুয়াল', description: 'আপনার কেনা পণ্যের যত্ন ও ব্যবহারের সহায়িকা।', empty: 'এখনও কোনো গাইড পাওয়া যায়নি।', error: 'গাইড লোড করা যায়নি।', retry: 'আবার চেষ্টা করুন', general: 'সাধারণ গাইড', read: 'গাইড পড়ুন' },
} as const;

function GuideCard({ manual, label }: { manual: CustomerManual; label: string }) {
  const [open, setOpen] = useState(false);
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-5 w-5" /></span><span className="min-w-0"><span className="block break-words font-bold text-slate-900">{manual.title}</span><span className="mt-1 block text-xs text-slate-500">{manual.relatedProducts.length ? manual.relatedProducts.map((product) => product.name).join(', ') : label}</span></span></span><ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="border-t border-slate-100 px-5 py-5"><div className="whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700">{manual.content}</div></div>}</article>;
}

export default function AccountGuidesPage() {
  const locale = useLocale() === 'bn' ? 'bn' : 'en';
  const t = copy[locale];
  const [guides, setGuides] = useState<CustomerManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(() => { setLoading(true); setError(false); manualService.customerGuides().then((response) => setGuides(response.data)).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  return <section className="min-w-0 overflow-x-hidden"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><BookOpen className="h-6 w-6" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">ReadyCommerce care</p><h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{t.description}</p></div></div>{loading ? <div className="mt-8 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div> : error ? <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700"><p className="font-bold">{t.error}</p><button type="button" onClick={load} className="mt-4 min-h-11 rounded-xl bg-rose-700 px-4 font-bold text-white">{t.retry}</button></div> : !guides.length ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{t.empty}</div> : <div className="mt-8 space-y-3">{guides.map((manual) => <GuideCard key={manual._id} manual={manual} label={t.general} />)}</div>}</section>;
}
