'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Monitor, Smartphone, ExternalLink, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCampaignService, type AdminCampaign } from '../../../../services/api-service';
import { ErrorState, Skeleton } from '../../../../components/ui/primitives';

export default function CampaignPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<AdminCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminCampaignService.get(id)
      .then((res) => setCampaign(res.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="mx-auto max-w-5xl h-96 rounded-3xl" />;
  if (!campaign) return <ErrorState title="Campaign not found." retry={() => location.reload()} />;

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';
  const previewUrl = `${storefrontUrl}/campaign/${campaign.slug}?preview=true&token=${campaign.previewToken || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    toast.success('Preview link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mx-auto max-w-7xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${campaign._id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Preview: {campaign.title}</h1>
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {campaign.liveStatus || campaign.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">/campaign/{campaign.slug}</p>
          </div>
        </div>

        {/* Viewport Switcher and Link Actions */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                device === 'desktop' ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-foreground'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                device === 'mobile' ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>Share Link</span>
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Standalone</span>
          </a>
        </div>
      </div>

      {/* Embedded Iframe Preview Device Frame */}
      <div className="mt-8 flex justify-center">
        <div
          className={`transition-all duration-300 ${
            device === 'mobile'
              ? 'w-[375px] h-[780px] rounded-[3rem] p-3 border-8 border-slate-800 shadow-2xl bg-slate-800'
              : 'w-full h-[850px] rounded-2xl border border-border shadow-lg bg-white overflow-hidden'
          }`}
        >
          <iframe
            src={previewUrl}
            title={campaign.title}
            className={`w-full h-full border-0 ${device === 'mobile' ? 'rounded-[2.25rem]' : 'rounded-xl'}`}
          />
        </div>
      </div>
    </section>
  );
}
