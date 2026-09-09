'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  HelpCircle, X, BookOpen, Edit3, Plus, Copy, ExternalLink,
  RefreshCw, FileCheck, Sparkles, Check, ChevronRight, AlertCircle,
  FileText, ShieldCheck, ArrowRight
} from 'lucide-react';
import { manualService, type AdminManual } from '../services/api-service';
import { MarkdownPreview } from './manuals/markdown-preview';
import { Skeleton } from './ui/primitives';

/**
 * Maps any pathname to the canonical help slug, section key, and human-readable title.
 * Format requested: page-[current-path] (e.g. page-orders, page-products, page-overview)
 */
export function resolveHelpContext(pathname: string): {
  sectionKey: string;
  slug: string;
  pageTitle: string;
  routePath: string;
} {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') {
    return {
      sectionKey: 'overview',
      slug: 'page-overview',
      pageTitle: 'Overview',
      routePath: '/'
    };
  }

  // Extract root segment (e.g. /orders/123 -> orders)
  const segments = clean.split('/').filter(Boolean);
  const rootSegment = segments[0] || 'overview';

  // Map known routes to nice titles and clean slugs
  const knownTitles: Record<string, string> = {
    overview: 'Dashboard Overview',
    orders: 'Orders Management',
    products: 'Products Catalog',
    categories: 'Categories',
    inventory: 'Inventory & Stock',
    customers: 'Customers Directory',
    reviews: 'Reviews & Moderation',
    coupons: 'Coupons & Promotions',
    campaigns: 'Marketing & Campaigns',
    cms: 'Storefront CMS',
    'media-library': 'Media Library',
    manuals: 'Manuals & SOPs',
    analytics: 'Analytics & Reports',
    notifications: 'Operations Notifications',
    'team-&-roles': 'Team & Roles',
    settings: 'Store Settings',
    'audit-logs': 'Audit Logs'
  };

  const pageTitle =
    knownTitles[rootSegment] ||
    rootSegment
      .replace(/-/g, ' ')
      .replace(/&/g, 'and')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Slug: page-[current-path] (e.g. page-orders, page-products)
  // Sanitize special characters like & -> and for safe URL slug
  const cleanSlugPart = rootSegment.replace(/&/g, 'and').replace(/[^a-z0-9-_]/g, '-').replace(/(^-|-$)+/g, '');
  const slug = `page-${cleanSlugPart}`;

  return {
    sectionKey: rootSegment,
    slug,
    pageTitle,
    routePath: clean
  };
}

export default function ContextualHelpDrawer() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [manual, setManual] = useState<AdminManual | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract context based on current route
  const { sectionKey, slug, pageTitle, routePath } = useMemo(
    () => resolveHelpContext(pathname || '/'),
    [pathname]
  );

  // Load manual for the current page
  const loadManual = useCallback(async (targetSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      // First attempt: fetch by exact target slug
      const res = await manualService.get(targetSlug);
      setManual(res.data || null);
    } catch (err: unknown) {
      // Check if it was 404 (Not Found) or a real network error
      const isNotFound =
        err instanceof Error &&
        (err.message.includes('not found') || (err as { status?: number }).status === 404);

      if (isNotFound) {
        // Fallback check if route had special characters like team-&-roles
        if (targetSlug.includes('and')) {
          try {
            const fallbackSlug = targetSlug.replace('and', '');
            const fallbackRes = await manualService.get(fallbackSlug);
            setManual(fallbackRes.data || null);
            setLoading(false);
            return;
          } catch {
            // ignore fallback error
          }
        }
        setManual(null);
      } else {
        console.error('Failed to load contextual manual:', err);
        setError(err instanceof Error ? err.message : 'Could not load guide.');
        setManual(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever drawer is opened or pathname changes while drawer is open
  useEffect(() => {
    if (isOpen) {
      void loadManual(slug);
    }
  }, [isOpen, slug, loadManual]);

  // Handle ESC key press to close drawer & '?' key to toggle help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      } else if (
        e.key === '?' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Copy slug helper
  const handleCopySlug = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    toast.success(`Copied "${slug}" to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Navigate to create new manual with pre-filled slug and title
  const handleCreateGuide = () => {
    setIsOpen(false);
    const newGuideUrl = `/manuals/new?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(
      pageTitle + ' SOP'
    )}&type=staff_sop`;
    router.push(newGuideUrl);
  };

  return (
    <>
      {/* 1. Header Trigger Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`In-app help for ${pageTitle}`}
        title={`Contextual Help (${pageTitle}) - Press ?`}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-slate-600 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <HelpCircle className="h-4 w-4" />
        {/* Subtle indicator ring if manual exists */}
        {manual && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
        )}
      </button>

      {/* 2. Slide-out Sheet Drawer (Right) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-drawer-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-white shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right sm:max-w-xl"
          >
            {/* Sheet Header */}
            <div className="flex items-start justify-between border-b border-border/80 bg-slate-50/90 px-6 py-4">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" />
                    In-App Help
                  </span>
                  <span className="font-mono text-xs text-slate-400 truncate">
                    {routePath}
                  </span>
                </div>
                <h2
                  id="help-drawer-title"
                  className="mt-1 text-lg font-bold text-slate-900 truncate"
                >
                  {manual?.title || `${pageTitle} Guide`}
                </h2>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <span>Target Slug:</span>
                  <code className="rounded bg-slate-200/70 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-700">
                    {slug}
                  </code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                title="Close drawer (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sheet Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              {/* STATE 1: LOADING */}
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-7 w-3/4 rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4 w-4/6 rounded" />
                  </div>
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-5 w-1/3 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                </div>
              )}

              {/* STATE 2: ERROR */}
              {!loading && error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-center text-sm text-rose-800">
                  <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
                  <h3 className="mt-2 font-bold">Could not load help guide</h3>
                  <p className="mt-1 text-xs text-rose-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadManual(slug)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {/* STATE 3: MANUAL FOUND */}
              {!loading && !error && manual && (
                <div className="space-y-5">
                  {/* Guide Metadata Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-slate-50/60 p-3.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          manual.type === 'staff_sop'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}
                      >
                        {manual.type === 'staff_sop' ? (
                          <FileCheck className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        {manual.type.replace('_', ' ')}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          manual.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            manual.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {manual.status}
                      </span>
                    </div>

                    <Link
                      href={`/manuals/${manual._id}/edit`}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-2xs hover:bg-slate-50 transition"
                      title="Edit this manual in CMS"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit Guide
                    </Link>
                  </div>

                  {/* Rendered Markdown Content */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-2">
                    <MarkdownPreview content={manual.content} />
                  </div>

                  {/* Footer note for existing guide */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-500">
                    <p className="flex items-center justify-between">
                      <span>Last updated: {new Date(manual.updatedAt).toLocaleDateString()}</span>
                      <Link
                        href="/manuals"
                        onClick={() => setIsOpen(false)}
                        className="font-bold text-primary hover:underline"
                      >
                        Browse all manuals →
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 4: NO MANUAL FOUND (EMPTY STATE) */}
              {!loading && !error && !manual && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50/50 p-8 text-center sm:p-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                    <BookOpen className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    No guide available for this section yet.
                  </h3>

                  <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
                    Staff standard operating procedures and documentation have not been published for the{' '}
                    <strong className="text-slate-700">{pageTitle}</strong> page yet.
                  </p>

                  {/* Slug Requirement Box with Copy Button */}
                  <div className="mt-5 w-full max-w-md rounded-xl border border-primary/20 bg-white p-3.5 shadow-xs text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Target Slug Required:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySlug}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/5 transition"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                      <code className="font-mono text-xs font-bold text-slate-800">
                        {slug}
                      </code>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500">
                      Tip: Create a new manual with slug <code className="font-bold text-slate-700">&apos;{slug}&apos;</code> to make it appear automatically on this page.
                    </p>
                  </div>

                  {/* Call to Action: Create One in Manuals CMS */}
                  <div className="mt-6 flex flex-col gap-2 w-full max-w-md">
                    <button
                      type="button"
                      onClick={handleCreateGuide}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Create one in the Manuals CMS with slug: &apos;{slug}&apos;
                    </button>

                    <Link
                      href="/manuals"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex min-h-9 items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      View existing manuals <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Footer */}
            <div className="flex items-center justify-between border-t border-border bg-slate-50/90 px-6 py-3.5 text-xs">
              <span className="text-slate-400">
                Press <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 shadow-2xs">Esc</kbd> to close
              </span>
              <Link
                href="/manuals"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              >
                <span>Knowledge Base</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
