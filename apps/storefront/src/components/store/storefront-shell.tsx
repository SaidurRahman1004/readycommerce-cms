'use client';

import {usePathname} from '@/i18n/routing';
import Navbar from './navbar';
import Footer from './footer';
import {CartProvider} from './cart-context';
import CartDrawer from './cart-drawer';
import ToastProvider from '@/components/ui/toast-provider';

export default function StorefrontShell({children, locale}: {children: React.ReactNode; locale: string}) {
  const pathname = usePathname();
  const isChromeFree = ['/login', '/register', '/checkout', '/success'].includes(pathname);
  return <CartProvider><ToastProvider />{isChromeFree ? children : <><Navbar locale={locale} /><div className="flex-1">{children}</div><Footer /><CartDrawer /></>}</CartProvider>;
}
