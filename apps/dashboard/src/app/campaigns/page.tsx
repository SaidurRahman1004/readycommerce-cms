'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Sparkles, Plus, Search, ExternalLink, MoreVertical, Copy,
  CheckCircle2, PauseCircle, Archive, Trash2, Edit3, Eye, Clock, Calendar, Check
} from 'lucide-react';
import { adminCampaignService, type AdminCampaign } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';

type StatusFilter = 'all' | 'active' | 'scheduled' | 'draft' | 'expired' | 'archived';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Generate the proper storefront URL (appends secure preview token for draft or scheduled campaigns)
  const getCampaignViewUrl = (campaign: AdminCampaign) => {
    const status = campaign.liveStatus || campaign.status;
    const isDraftOrScheduled = status === 'draft' || status === 'scheduled';
    const tokenParam = isDraftOrScheduled && campaign.previewToken
      ? `?preview=true&token=${encodeURIComponent(campaign.previewToken)}`
      : '';
    return `${STOREFRONT_URL}/en/campaign/${campaign.slug}${tokenParam}`;
  };

  const handleCopyLink = async (campaign: AdminCampaign) => {
    const url = getCampaignViewUrl(campaign);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(campaign._id);
      toast.success('Campaign storefront link copied!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  const handlePublish = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await adminCampaignService.publish(id);
      toast.success(res.message || 'Campaign published and is now live!');
      await loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish campaign.');
    } finally {
      setTogglingId(null);
      setActiveMenu(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await adminCampaignService.unpublish(id);
      toast.success(res.message || 'Campaign unpublished and returned to draft.');
      await loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to unpublish campaign.');
    } finally {
      setTogglingId(null);
      setActiveMenu(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await adminCampaignService.duplicate(id);
      toast.success(res.message || 'Campaign duplicated!');
      await loadCampaigns();
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
      await loadCampaigns();
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
      await loadCampaigns();
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
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Live
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/80">
            <Clock className="h-3 w-3 text-blue-600" />
            Scheduled
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200/80">
            Expired
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
            Archived
          </span>
        );
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

      {/* Metric Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white/90 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Campaigns</div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{campaigns.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white/90 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active Live Pages</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white/90 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">Total Page Impressions</div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">{totalViews.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active', 'scheduled', 'draft', 'expired', 'archived'] as StatusFilter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-primary text-white shadow-xs'
                  : 'border border-border bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-slate-400 focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load campaigns." retry={loadCampaigns} />
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns found."
            description="Create your first promotional landing page to boost conversions."
            action={
              <Link
                href="/campaigns/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campaign</span>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white/95 shadow-xs">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50/85 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Campaign & Storefront URL</th>
                  <th className="px-5 py-3.5">Target Product</th>
                  <th className="px-5 py-3.5">Pricing</th>
                  <th className="px-5 py-3.5">Schedule</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Quick Toggle</th>
                  <th className="px-5 py-3.5">Views / Clicks</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaigns.map((item) => {
                  const effectiveStatus = item.liveStatus || item.status;
                  const isMenuOpen = activeMenu === item._id;
                  const isToggling = togglingId === item._id;
                  const viewUrl = getCampaignViewUrl(item);
                  const isCopied = copiedId === item._id;

                  return (
                    <tr key={item._id} className="transition-colors hover:bg-slate-50/60">
                      {/* Campaign Title & Verified Storefront URL */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-foreground hover:text-primary transition-colors">
                          <Link href={`/campaigns/${item._id}/edit`}>{item.title}</Link>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-mono">
                          <span className="text-slate-500 truncate max-w-[200px]">/campaign/{item.slug}</span>
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-sans font-semibold text-primary hover:text-primary/80 transition-colors"
                            title="Open live storefront page (appends preview token if draft)"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-sans text-[11px] font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                            title="Copy working storefront link"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Target Product */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground line-clamp-1">{item.product?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">ID: {item.product?._id ? `${item.product._id.slice(0, 8)}...` : 'N/A'}</div>
                      </td>

                      {/* Pricing */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-emerald-600">
                          ৳{(item.offerPrice ?? item.product?.basePrice ?? 0).toLocaleString()}
                        </div>
                        {item.product?.basePrice && item.offerPrice && item.offerPrice < item.product.basePrice && (
                          <div className="text-xs text-slate-400 line-through">৳{item.product.basePrice.toLocaleString()}</div>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(item.startsAt).toLocaleDateString()}</span>
                          <span>→</span>
                          <span>{new Date(item.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        {getStatusBadge(item)}
                      </td>

                      {/* Quick 1-Click Toggle */}
                      <td className="px-5 py-4">
                        {effectiveStatus === 'active' ? (
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleUnpublish(item._id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                            title="Pause campaign (revert to draft)"
                          >
                            <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>{isToggling ? 'Updating...' : 'Pause'}</span>
                          </button>
                        ) : effectiveStatus === 'draft' || effectiveStatus === 'scheduled' ? (
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handlePublish(item._id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            title="Publish immediately to make active on storefront"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{isToggling ? 'Updating...' : 'Publish'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No action</span>
                        )}
                      </td>

                      {/* Views / Clicks */}
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        <div>👁️ {(item.analytics?.views || 0).toLocaleString()} views</div>
                        <div className="text-muted-foreground">🎯 {(item.analytics?.clicks || 0).toLocaleString()} clicks</div>
                      </td>

                      {/* Actions Dropdown */}
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
                            <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-border bg-white p-1.5 shadow-xl">
                              <Link
                                href={`/campaigns/${item._id}/edit`}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-primary" />
                                <span>Edit Campaign</span>
                              </Link>

                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Open Storefront Page</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  handleCopyLink(item);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copy Link</span>
                              </button>

                              <Link
                                href={`/campaigns/${item._id}/preview`}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Preview Device Frame</span>
                              </Link>

                              <div className="my-1 border-t border-border" />

                              {effectiveStatus === 'draft' || effectiveStatus === 'expired' || effectiveStatus === 'scheduled' ? (
                                <button
                                  type="button"
                                  onClick={() => handlePublish(item._id)}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Publish Campaign</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUnpublish(item._id)}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Pause (Revert to Draft)</span>
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
