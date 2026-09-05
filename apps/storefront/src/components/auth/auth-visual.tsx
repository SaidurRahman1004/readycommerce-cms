import Image from 'next/image';
import {useTranslations} from 'next-intl';

export default function AuthVisual() {
  const t = useTranslations('Auth.visual');
  return <aside className="hidden relative min-h-[220px] overflow-hidden bg-slate-900 lg:flex lg:min-h-full lg:flex-1"><Image src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=90" alt={t('imageAlt')} fill priority sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-slate-950/10" /><div className="relative flex h-full min-h-[220px] flex-col justify-between p-6 text-white sm:p-10 lg:min-h-full lg:p-14 xl:p-20"><div className="hidden items-center gap-3 lg:flex"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[15px] font-bold text-slate-950 shadow-md">R</span><span className="text-[17px] font-semibold tracking-tight">{t('brand')}</span></div><div className="max-w-lg"><p className="text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">“{t('quote')}”</p><p className="mt-6 text-[16px] text-white/80">{t('tagline')}</p></div></div></aside>;
}
