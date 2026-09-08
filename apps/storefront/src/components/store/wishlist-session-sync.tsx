'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/auth-context';
import { useCart } from './cart-context';
import toast from 'react-hot-toast';

export default function WishlistSessionSync() {
  const { user, loading } = useAuth();
  const { syncWishlist } = useCart();
  const t = useTranslations('Phase13L');
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user || syncedUser.current === user.id) return;
    syncedUser.current = user.id;
    syncWishlist().catch(() => { syncedUser.current = null; toast.error(t('syncError')); });
  }, [loading, syncWishlist, t, user]);

  return null;
}
