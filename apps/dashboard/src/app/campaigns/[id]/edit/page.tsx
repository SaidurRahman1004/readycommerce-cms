'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminCampaignService, type AdminCampaign } from '../../../../services/api-service';
import CampaignForm from '../../../../components/campaigns/campaign-form';
import { ErrorState, Skeleton } from '../../../../components/ui/primitives';

export default function EditCampaignPage() {
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<AdminCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminCampaignService.get(id)
      .then((res) => setCampaign(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="mx-auto max-w-5xl h-96 rounded-3xl" />;
  if (error || !campaign) return <ErrorState title="Campaign could not be loaded." retry={() => location.reload()} />;

  return <CampaignForm mode="edit" initialData={campaign} campaignId={id} />;
}
