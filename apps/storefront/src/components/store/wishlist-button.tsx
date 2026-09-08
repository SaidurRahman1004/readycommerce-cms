'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/auth-context';
import { useCart } from './cart-context';

export default function WishlistButton({ productId }: { productId: string }) {
  const t = useTranslations('Discovery');
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist, wishlistPending } = useCart();
  const saved = isWishlisted(productId);
  const pending = wishlistPending === productId;
  return <button type="button" disabled={pending} onClick={() => void toggleWishlist(productId, Boolean(user))} aria-label={saved ? t('wishlist.remove') : t('wishlist.add')} aria-pressed={saved} className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition-all duration-200 hover:bg-white active:scale-90 disabled:cursor-wait disabled:opacity-60 ${saved ? 'text-rose-500' : 'text-slate-500'}`}>{pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : saved ? '♥' : '♡'}</button>;
}
