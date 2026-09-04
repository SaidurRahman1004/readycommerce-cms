import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';

export default function Footer() {
  const t = useTranslations('Storefront');
  return <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-2.5 text-sm font-semibold text-slate-950"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs text-white">R</span>ReadyCommerce</Link><p className="text-sm text-slate-500">{t('footer.copyright')}</p><div className="flex gap-5 text-sm text-slate-500"><Link href="/#about" className="transition hover:text-indigo-600">{t('footer.about')}</Link><Link href="/shop" className="transition hover:text-indigo-600">{t('footer.shop')}</Link></div></div></footer>;
}
