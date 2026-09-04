'use client';

import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/routing';
import {useCart} from './cart-context';
import SearchBar from './search-bar';

function CartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M3.5 5.5h2l1.6 10.1a1.8 1.8 0 0 0 1.8 1.5h8.5a1.8 1.8 0 0 0 1.7-1.3L21 8H6.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.3 20.2h.01M18.1 20.2h.01" strokeWidth="2.8" strokeLinecap="round"/></svg>; }

export default function Navbar({locale}: {locale: string}) {
  const t = useTranslations('Storefront');
  const pathname = usePathname();
  const {count, openCart} = useCart();
  return <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm transition-all"><div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
    <Link href="/" className="flex items-center gap-3 group" aria-label={t('navigation.home')}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background shadow-md transition-transform group-hover:scale-105">R</span><span className="text-[17px] font-semibold tracking-tight text-foreground">ReadyCommerce</span></Link>
    <div className="hidden lg:block w-full max-w-md ml-8"><SearchBar /></div><nav className="hidden items-center gap-7 xl:flex ml-auto mr-4" aria-label={t('navigation.menu')}><Link href="/shop" className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary">{t('navigation.shop')}</Link><Link href="/#categories" className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary">{t('navigation.categories')}</Link><Link href="/profile" className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary">{t('navigation.profile')}</Link><Link href="/wishlist" className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary">{t('navigation.wishlist')}</Link></nav>
    <div className="flex items-center gap-3 sm:gap-5"><div className="flex items-center rounded-full border border-border bg-surface p-1 text-xs font-semibold shadow-sm"><Link href={pathname} locale="en" className={`rounded-full px-3 py-1.5 transition-colors ${locale === 'en' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>EN</Link><Link href={pathname} locale="bn" className={`rounded-full px-3 py-1.5 transition-colors ${locale === 'bn' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>BN</Link></div><button type="button" onClick={openCart} aria-label={t('navigation.cart')} className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground bg-muted/50 transition-all hover:bg-primary-subtle hover:text-primary"><CartIcon />{count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-sm ring-2 ring-background">{count > 99 ? '99+' : count}</span>}</button></div>
  </div><div className="mx-auto px-5 pb-3 sm:px-8 lg:hidden"><SearchBar /></div></header>;
}
