'use client';

import {usePathname} from '@/i18n/routing';
import Navbar from './navbar';
import Footer from './footer';
import {CartProvider} from './cart-context';

export default function StorefrontShell({children, locale}: {children: React.ReactNode; locale: string}) {
  const pathname = usePathname();
  const isAuth = pathname === '/login' || pathname === '/register';
  return <CartProvider>{isAuth ? children : <><Navbar locale={locale} /><div className="flex-1">{children}</div><Footer /></>}</CartProvider>;
}
