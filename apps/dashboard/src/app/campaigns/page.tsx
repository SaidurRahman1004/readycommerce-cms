'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Sparkles, Plus, Search, ExternalLink, MoreVertical, Copy,
  CheckCircle, PauseCircle, Archive, Trash2, Edit3, Eye, Clock, Calendar
} from 'lucide-react';
import { adminCampaignService, type AdminCampaign } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';

type StatusFilter = 'all' | 'active' | 'scheduled' | 'draft' | 'expired' | 'archived';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCampaignService.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
        limit: 50,
      });
      setCampaigns(res.data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handlePublish = async (id: string) => {
    try {
      const res = await adminCampaignService.publish(id);
      toast.success(res.message || 'Campaign published!');
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish campaign.');
    } finally {
      setActiveMenu(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const res = await adminCampaignService.unpublish(id);
      toast.success(res.message || 'Campaign unpublished.');
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to unpublish campaign.');
    } finally {
      setActiveMenu(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await adminCampaignService.duplicate(id);
      toast.success(res.message || 'Campaign duplicated!');
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to duplicate campaign.');
    } finally {
      setActiveMenu(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this campaign?')) return;
    try {
      await adminCampaignService.archive(id);
      toast.success('Campaign archived.');
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to archive campaign.');
    } finally {
      setActiveMenu(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this campaign? This action cannot be undone.')) return;
    try {
      await adminCampaignService.delete(id);
      toast.success('Campaign permanently deleted.');
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete campaign.');
    } finally {
      setActiveMenu(null);
    }
  };

  const activeCount = campaigns.filter((c) => (c.liveStatus || c.status) === 'active').length;
  const totalViews = campaigns.reduce((sum, c) => sum + (c.analytics?.views || 0), 0);

  const getStatusBadge = (campaign: AdminCampaign) => {
    const status = campaign.liveStatus || campaign.status;
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" /> Active</span>;
      case 'scheduled':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/60"><Clock className="h-3 w-3" /> Scheduled</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">Draft</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200/60">Expired</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/60">Archived</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{status}</span>;
    }
  };

  return (
    <section className="mx-auto max-w-7xl pb-16">
      <Breadcrumbs items={[{ label: 'Marketing' }, { label: 'Campaigns' }]} />
      <PageHeader
        eyebrow="Marketing Engine"
        title="Campaigns & Landing Pages"
        description="Launch targeted, high-converting product landing pages with countdown timers and promotional offers."
        action={
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-premium transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </Link>
        }
      />

      {/* Metrics Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Campaigns</p>
          <p className="mt-2 text-3xl font-extrabold text-foreground">{campaigns.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active Live Pages</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Total Page Impressions</p>
          <p className="mt-2 text-3xl font-extrabold text-foreground">{totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'scheduled', 'draft', 'expired', 'archived'] as StatusFilter[]).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-border bg-white/60 text-muted-foreground hover:bg-white hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : error ? (
          <ErrorState title="Campaigns could not be loaded." retry={loadCampaigns} />
        ) : !campaigns.length ? (
          <EmptyState
            title="No campaigns found."
            description="Create your first promotional landing page to boost conversions."
            action={
              <Link
                href="/campaigns/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campaign</span>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white/90 shadow-sm">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Campaign & URL</th>
                  <th className="px-5 py-3.5">Target Product</th>
                  <th className="px-5 py-3.5">Pricing</th>
                  <th className="px-5 py-3.5">Schedule</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Views / Clicks</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaigns.map((item) => {
                  const effectiveStatus = item.liveStatus || item.status;
                  const isMenuOpen = activeMenu === item._id;
                  const publicUrl = `/campaign/${item.slug}`;

                  return (
                    <tr key={item._id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-foreground">{item.title}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-primary font-mono">
                          <span>/campaign/{item.slug}</span>
                          <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground line-clamp-1">{item.product?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">ID: {item.product?._id ? `${item.product._id.slice(0, 8)}...` : 'N/A'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-emerald-600">
                          ৳{(item.offerPrice ?? item.product?.basePrice ?? 0).toLocaleString()}
                        </div>
                        {item.product?.basePrice && item.offerPrice && item.offerPrice < item.product.basePrice && (
                          <div className="text-xs text-slate-400 line-through">৳{item.product.basePrice.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(item.startsAt).toLocaleDateString()}</span>
                          <span>→</span>
                          <span>{new Date(item.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        <div>👁️ {(item.analytics?.views || 0).toLocaleString()} views</div>
                        <div className="text-muted-foreground">🎯 {(item.analytics?.clicks || 0).toLocaleString()} clicks</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setActiveMenu(isMenuOpen ? null : item._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-white text-slate-500 hover:bg-slate-50 hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-border bg-white p-1.5 shadow-xl">
                              <Link
                                href={`/campaigns/${item._id}/edit`}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-primary" />
                                <span>Edit Campaign</span>
                              </Link>

                              <Link
                                href={`/campaigns/${item._id}/preview`}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Preview Frame</span>
                              </Link>

                              {effectiveStatus === 'draft' || effectiveStatus === 'expired' ? (
                                <button
                                  type="button"
                                  onClick={() => handlePublish(item._id)}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Publish Campaign</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUnpublish(item._id)}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Unpublish (Draft)</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDuplicate(item._id)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Duplicate</span>
                              </button>

                              {effectiveStatus !== 'archived' && (
                                <button
                                  type="button"
                                  onClick={() => handleArchive(item._id)}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                  <Archive className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Archive</span>
                                </button>
                              )}

                              <div className="my-1 border-t border-border" />

                              <button
                                type="button"
                                onClick={() => handleDelete(item._id)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                <span>Delete Permanently</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
