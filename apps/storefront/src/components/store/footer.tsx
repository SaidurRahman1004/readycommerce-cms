import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';

export default function Footer() {
  const t = useTranslations('Storefront');
  return <footer className="border-t border-border bg-background"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-3 text-[15px] font-semibold text-foreground"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-[13px] text-background shadow-sm">R</span>ReadyCommerce</Link><p className="text-[14px] text-muted-foreground">{t('footer.copyright')}</p><div className="flex gap-6 text-[14px] font-medium text-muted-foreground"><Link href="/#about" className="transition-colors hover:text-primary">{t('footer.about')}</Link><Link href="/shop" className="transition-colors hover:text-primary">{t('footer.shop')}</Link></div></div></footer>;
}
