'use client';

import {useTranslations} from 'next-intl';
import {useCart} from './cart-context';

export default function WishlistButton({productId}: {productId: string}) {
  const t = useTranslations('Discovery'); const {isWishlisted, toggleWishlist} = useCart(); const saved = isWishlisted(productId);
  return <button type="button" onClick={() => toggleWishlist(productId)} aria-label={saved ? t('wishlist.remove') : t('wishlist.add')} aria-pressed={saved} className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition hover:bg-white ${saved ? 'text-rose-500' : 'text-slate-500'}`}>{saved ? '♥' : '♡'}</button>;
}
