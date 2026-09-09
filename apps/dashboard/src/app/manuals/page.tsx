'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen, Edit3, Plus, Trash2, Search, Filter,
  FileCheck, ShoppingBag, CheckCircle2, Clock, Eye,
  RefreshCw, Copy, ExternalLink, X, HelpCircle, ArrowRight
} from 'lucide-react';
import { manualService, type AdminManual } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';
import { MarkdownPreview } from '../../components/manuals/markdown-preview';

export default function ManualsPage() {
  const [items, setItems] = useState<AdminManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'staff_sop' | 'customer_guide'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  // Preview Drawer Modal
  const [previewManual, setPreviewManual] = useState<AdminManual | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const response = await manualService.list();
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load manuals:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Handle ESC key and scroll lock for preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewManual) {
        setPreviewManual(null);
      }
    };
    if (previewManual) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewManual]);

  // Quick toggle status (draft <-> active)
  const toggleStatus = async (manual: AdminManual) => {
    const nextStatus = manual.status === 'active' ? 'draft' : 'active';
    try {
      await manualService.update(manual._id, {
        title: manual.title,
        slug: manual.slug,
        type: manual.type,
        status: nextStatus,
        content: manual.content,
        relatedProducts: (manual.relatedProducts || [])
          .map((p) => (typeof p === 'string' ? p : p?._id))
          .filter(Boolean) as string[]
      });
      toast.success(`Manual marked as ${nextStatus}.`);
      setItems((prev) =>
        prev.map((item) => (item._id === manual._id ? { ...item, status: nextStatus } : item))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update status.';
      toast.error(message);
    }
  };

  // Delete manual
  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await manualService.remove(id);
      toast.success('Manual deleted.');
      setItems((prev) => prev.filter((item) => item._id !== id));
      if (previewManual?._id === id) setPreviewManual(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not delete manual.';
      toast.error(message);
    }
  };

  // Copy slug to clipboard
  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success(`Copied slug "${slug}" to clipboard.`);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = items.length;
    const sops = items.filter((m) => m.type === 'staff_sop').length;
    const guides = items.filter((m) => m.type === 'customer_guide').length;
    const active = items.filter((m) => m.status === 'active').length;
    return { total, sops, guides, active };
  }, [items]);

  // Filtered manuals
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSlug = item.slug.toLowerCase().includes(query);
        const matchesContent = item.content.toLowerCase().includes(query);
        return matchesTitle || matchesSlug || matchesContent;
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, searchQuery]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Manuals & SOPs' }]} />

      {/* Page Header */}
      <PageHeader
        eyebrow="Knowledge base"
        title="Manuals & SOPs"
        description="Create staff standard operating procedures and product activation guides from one controlled workspace."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
              title="Refresh manuals list"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/manuals/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-xs transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>New manual</span>
            </Link>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Guides
            </span>
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">All documented records</p>
        </div>

        <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Staff SOPs
            </span>
            <FileCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.sops}</p>
          <p className="mt-1 text-[11px] text-slate-400">Internal operations</p>
        </div>

        <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customer Guides
            </span>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.guides}</p>
          <p className="mt-1 text-[11px] text-slate-400">Product activations</p>
        </div>

        <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live & Active
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{metrics.active}</p>
          <p className="mt-1 text-[11px] text-slate-400">Published to users</p>
        </div>
      </div>

      {/* Main Content Area: Data Table (No Form on this page) */}
      <div className="space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/90 p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, slug, or content..."
              className="h-10 w-full rounded-xl border border-border pl-10 pr-4 text-xs font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('staff_sop')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  typeFilter === 'staff_sop'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff SOP
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('customer_guide')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  typeFilter === 'customer_guide'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customer Guide
              </button>
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  statusFilter === 'draft'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {/* Data Table / State View */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-border bg-white p-6">
            <Skeleton className="h-8 w-1/4 rounded-lg" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : error ? (
          <ErrorState
            title="Manuals could not be loaded."
            retry={() => void load()}
          />
        ) : !items.length ? (
          <div className="rounded-2xl border border-border bg-white/90 p-8 shadow-sm text-center">
            <EmptyState
              title="No manuals or SOPs yet."
              description="Create your first standard operating procedure or product activation guide."
            />
            <div className="mt-5">
              <Link
                href="/manuals/new"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-xs transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Build your first manual
              </Link>
            </div>
          </div>
        ) : !filteredItems.length ? (
          <div className="rounded-2xl border border-border bg-white/90 p-12 text-center">
            <Filter className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No matching manuals found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query or clear the active filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="mt-4 inline-flex h-9 items-center rounded-xl border border-border bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white/95 shadow-xs">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Title & Slug</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Linked Products</th>
                  <th className="px-5 py-4">Last Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((manual) => {
                  const isStaff = manual.type === 'staff_sop';
                  const isActive = manual.status === 'active';
                  const productsCount = manual.relatedProducts?.length || 0;

                  return (
                    <tr
                      key={manual._id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      {/* Title & Slug */}
                      <td className="max-w-xs px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isStaff
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {isStaff ? (
                              <FileCheck className="h-4 w-4" />
                            ) : (
                              <ShoppingBag className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/manuals/${manual._id}/edit`}
                              className="font-bold text-slate-900 transition hover:text-primary"
                            >
                              {manual.title}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                              <span className="truncate">/{manual.slug}</span>
                              <button
                                type="button"
                                onClick={() => copySlug(manual.slug)}
                                className="opacity-0 transition group-hover:opacity-100 hover:text-slate-800"
                                title="Copy slug"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                            isStaff
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          }`}
                        >
                          {isStaff ? 'Staff SOP' : 'Customer Guide'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(manual)}
                          title={`Click to switch to ${isActive ? 'draft' : 'active'}`}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition hover:opacity-80 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Draft'}
                        </button>
                      </td>

                      {/* Linked Products */}
                      <td className="whitespace-nowrap px-5 py-4 text-xs">
                        {isStaff ? (
                          <span className="text-slate-400 italic">Internal SOP</span>
                        ) : productsCount > 0 ? (
                          <span className="font-semibold text-slate-700">
                            {productsCount} {productsCount === 1 ? 'product' : 'products'}
                          </span>
                        ) : (
                          <span className="text-slate-400">General guide</span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {new Date(manual.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview modal trigger */}
                          <button
                            type="button"
                            onClick={() => setPreviewManual(manual)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            title="Quick Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Preview</span>
                          </button>

                          {/* Edit link */}
                          <Link
                            href={`/manuals/${manual._id}/edit`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                            title="Edit manual"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Edit</span>
                          </Link>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => void remove(manual._id, manual.title)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            title="Delete manual"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Quick Preview Slide-over / Modal (Portaled to document.body) */}
      {previewManual && mounted && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setPreviewManual(null)}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs animate-fade-in"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-white shadow-2xl overflow-hidden animate-sheet-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-border bg-slate-50/80 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      previewManual.type === 'staff_sop'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {previewManual.type.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    /{previewManual.slug}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {previewManual.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewManual(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Rendered Markdown with scrollbar */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-8 custom-drawer-scrollbar">
              <MarkdownPreview content={previewManual.content} />
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border bg-slate-50 px-6 py-3.5">
              <span className="text-xs text-slate-500">
                Last updated: {new Date(previewManual.updatedAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewManual(null)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <Link
                  href={`/manuals/${previewManual._id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Manual
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
