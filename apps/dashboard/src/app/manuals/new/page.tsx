'use client';

import { Suspense } from 'react';
import ManualForm from '../../../components/manuals/manual-form';
import { Skeleton } from '../../../components/ui/primitives';

export default function NewManualPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto max-w-5xl h-96 rounded-3xl" />}>
      <ManualForm mode="create" />
    </Suspense>
  );
}
