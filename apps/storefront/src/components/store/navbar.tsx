'use client';

import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/routing';

import {useCart} from './cart-context';
import {useWishlist} from './wishlist-store';

import SearchBar from './search-bar';

function CartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M3.5 5.5h2l1.6 10.1a1.8 1.8 0 0 0 1.8 1.5h8.5a1.8 1.8 0 0 0 1.7-1.3L21 8H6.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.3 20.2h.01M18.1 20.2h.01" strokeWidth="2.8" strokeLinecap="round"/></svg>; }

function HeartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>; }

export default function Navbar({locale}: {locale: string}) {
  const t = useTranslations('Storefront');
  const pathname = usePathname();
  const {count, openCart} = useCart();
  const {items} = useWishlist();
  const wishlistCount = items.length;
  
  return <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#fafbff]/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
    <div className="flex flex-1 items-center">
      <Link href="/" className="flex items-center gap-3" aria-label={t('navigation.home')}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm">R</span><span className="hidden lg:block text-[15px] font-semibold tracking-[-0.02em] text-slate-950">ReadyCommerce</span></Link>
      <SearchBar />
    </div>
    <nav className="hidden items-center gap-6 lg:flex xl:gap-8 mx-auto" aria-label={t('navigation.menu')}><Link href="/shop" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">{t('navigation.shop')}</Link><Link href="/#categories" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">{t('navigation.categories')}</Link><Link href="/#about" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">{t('navigation.about')}</Link></nav>
    <div className="flex flex-1 justify-end items-center gap-2 sm:gap-4">
      <Link href="/profile" className="hidden lg:block text-sm font-medium text-slate-600 transition hover:text-indigo-600 mr-2">{t('navigation.profile')}</Link>
      <div className="hidden sm:flex items-center rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm"><Link href={pathname} locale="en" className={`rounded-full px-2.5 py-1.5 transition ${locale === 'en' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-950'}`}>EN</Link><Link href={pathname} locale="bn" className={`rounded-full px-2.5 py-1.5 transition ${locale === 'bn' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-950'}`}>BN</Link></div>
      
      <div className="flex items-center gap-1">
        <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white hover:text-rose-500">
          <HeartIcon />
          {wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
        </Link>
        <button type="button" onClick={openCart} aria-label={t('navigation.cart')} className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white hover:text-indigo-600">
          <CartIcon />
          {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}
        </button>
      </div>
    </div>
  </div></header>;
}
