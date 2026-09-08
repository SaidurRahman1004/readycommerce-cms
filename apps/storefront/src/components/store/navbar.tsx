'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useCart } from './cart-context';
import SearchBar from './search-bar';
import { Menu, X } from 'lucide-react';

function CartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M3.5 5.5h2l1.6 10.1a1.8 1.8 0 0 0 1.8 1.5h8.5a1.8 1.8 0 0 0 1.7-1.3L21 8H6.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.3 20.2h.01M18.1 20.2h.01" strokeWidth="2.8" strokeLinecap="round"/></svg>; }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[18px] w-[18px]"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function HeartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

export default function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('Storefront');
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    const timer = window.setTimeout(() => setMobileMenuOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm transition-all">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        
        {/* Mobile Hamburger Button */}
        <button 
          type="button" 
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/50 text-foreground transition-all hover:bg-primary-subtle hover:text-primary xl:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex items-center gap-3 group" aria-label={t('navigation.home')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background shadow-md transition-transform group-hover:scale-105">R</span>
          <span className="hidden sm:inline text-[17px] font-semibold tracking-tight text-foreground">ReadyCommerce</span>
        </Link>

        <div className="hidden lg:block w-full max-w-md ml-8"><SearchBar /></div>
        
        <nav className="hidden items-center gap-7 xl:flex ml-auto mr-4" aria-label={t('navigation.menu')}>
          <Link href="/shop" className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary">{t('navigation.shop')}</Link>
          <Link href="/#categories" className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary">{t('navigation.categories')}</Link>
          <Link href="/wishlist" className="flex items-center gap-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary"><HeartIcon /> <span>{t('navigation.wishlist')}</span></Link>
        </nav>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center rounded-full border border-border bg-surface p-1 text-xs font-semibold shadow-sm">
            <Link href={pathname} locale="en" className={`rounded-full px-3 py-1.5 transition-colors ${locale === 'en' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>EN</Link>
            <Link href={pathname} locale="bn" className={`rounded-full px-3 py-1.5 transition-colors ${locale === 'bn' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>BN</Link>
          </div>
          <Link href="/account/profile" className="hidden sm:flex h-11 items-center gap-2 rounded-full bg-primary/10 px-5 text-[14px] font-bold text-primary transition-all hover:bg-primary hover:text-white">
            <UserIcon /> {t('navigation.profile')}
          </Link>
          <button type="button" onClick={openCart} aria-label={t('navigation.cart')} className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground bg-muted/50 transition-all hover:bg-primary-subtle hover:text-primary">
            <CartIcon />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-sm ring-2 ring-background">{count > 99 ? '99+' : count}</span>}
          </button>
        </div>
      </div>
      
      {/* Mobile Search Bar (Bottom row) */}
      <div className="mx-auto flex gap-3 px-5 pb-3 sm:px-8 lg:hidden">
        <div className="flex-1"><SearchBar /></div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-300 xl:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          
          {/* Drawer Content */}
          <div className="relative flex w-full max-w-xs flex-col bg-background shadow-premium animate-in slide-in-from-left duration-300 ease-out">
            <div className="flex items-center justify-between border-b border-border p-5">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background shadow-md">R</span>
                <span className="text-[17px] font-semibold tracking-tight text-foreground">ReadyCommerce</span>
              </Link>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-slate-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              <nav className="flex flex-col gap-6" aria-label="Mobile Navigation">
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground transition-colors hover:text-primary">{t('navigation.shop')}</Link>
                <Link href="/#categories" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground transition-colors hover:text-primary">{t('navigation.categories')}</Link>
                <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground transition-colors hover:text-primary">{t('navigation.wishlist')}</Link>
              </nav>
              
              <div className="mt-10 border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Account</p>
                <Link href="/account/profile" onClick={() => setMobileMenuOpen(false)} className="flex h-12 items-center gap-3 rounded-xl bg-primary/10 px-4 text-[15px] font-bold text-primary transition-all hover:bg-primary hover:text-white">
                  <UserIcon /> {t('navigation.profile')}
                </Link>
              </div>

              <div className="mt-10 border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Language</p>
                <div className="flex items-center rounded-xl border border-border bg-surface p-1 text-sm font-semibold shadow-sm w-fit">
                  <Link href={pathname} locale="en" className={`rounded-lg px-4 py-2 transition-colors ${locale === 'en' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>English</Link>
                  <Link href={pathname} locale="bn" className={`rounded-lg px-4 py-2 transition-colors ${locale === 'bn' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>বাংলা</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
