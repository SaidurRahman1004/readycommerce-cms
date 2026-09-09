'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { manualService, type AdminManual } from '../../../../services/api-service';
import ManualForm from '../../../../components/manuals/manual-form';
import { ErrorState, Skeleton } from '../../../../components/ui/primitives';

export default function EditManualPage() {
  const params = useParams();
  const id = params.id as string;
  const [manual, setManual] = useState<AdminManual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    manualService
      .get(id)
      .then((res) => setManual(res.data))
      .catch((err) => {
        console.error('Failed to fetch manual for edit:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Skeleton className="mx-auto max-w-5xl h-96 rounded-3xl" />;
  }

  if (error || !manual) {
    return (
      <ErrorState
        title="Manual could not be loaded."
        retry={() => window.location.reload()}
      />
    );
  }

  return <ManualForm mode="edit" manualId={id} initialData={manual} />;
}
