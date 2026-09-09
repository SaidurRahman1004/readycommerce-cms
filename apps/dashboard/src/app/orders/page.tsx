import { Suspense } from 'react';
import OrdersClient from './orders-client';
import { PageHeader } from '../../components/ui/page-header';
import { Skeleton } from '../../components/ui/primitives';

export default function OrdersPage() {
  return (
    <Suspense 
      fallback={
        <section className="mx-auto max-w-7xl">
          <PageHeader eyebrow="Operations" title="Orders" description="Loading..." />
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4, 5].map(x => <Skeleton className="h-16 w-full" key={x} />)}
          </div>
        </section>
      }
    >
      <OrdersClient />
    </Suspense>
  );
}
