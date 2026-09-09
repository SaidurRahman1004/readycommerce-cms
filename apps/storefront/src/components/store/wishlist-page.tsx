'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { HeartOff, ShoppingBag } from 'lucide-react';
import { catalogService, CatalogProduct } from '@/services/api-service';
import { useCart } from './cart-context';
import CatalogCard from './catalog-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function WishlistPage() {
  const t = useTranslations('Discovery');
  const { wishlist } = useCart();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all(
      wishlist.map((id) =>
        catalogService
          .product(id)
          .then((result) => result.data)
          .catch(() => null)
      )
    )
      .then((items) => {
        if (active) {
          setProducts(items.filter((item): item is CatalogProduct => Boolean(item)));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [wishlist]);

  return (
    <main className="min-h-screen bg-[#fafbff] px-5 py-12 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
          {t('wishlist.eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
          {t('wishlist.title')}
        </h1>

        {/* 1. Loading Skeleton */}
        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <ProductCardSkeleton key={item} />
            ))}
          </div>
        ) : products.length > 0 ? (
          /* 2. Wishlist Products Grid */
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <CatalogCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          /* 3. Empty State */
          <div className="mt-10">
            <EmptyState
              icon={HeartOff}
              badge="0 Saved Items"
              title={t('wishlist.emptyTitle')}
              description={t('wishlist.emptyDescription')}
              action={{
                label: t('wishlist.continue'),
                href: '/shop',
                icon: ShoppingBag,
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
