'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  HelpCircle, X, BookOpen, Edit3, Plus, Copy, ExternalLink,
  RefreshCw, FileCheck, Sparkles, Check, ChevronRight, AlertCircle,
  FileText, ShieldCheck, ArrowRight, Compass
} from 'lucide-react';
import { manualService, type AdminManual } from '../services/api-service';
import { MarkdownPreview } from './manuals/markdown-preview';
import { Skeleton } from './ui/primitives';

/**
 * Maps any pathname to the canonical help slug, section key, and human-readable title.
 * Format: page-[current-path] (e.g. page-orders, page-products, page-overview)
 */
export function resolveHelpContext(pathname: string): {
  sectionKey: string;
  slug: string;
  pageTitle: string;
  routePath: string;
} {
  // Strip trailing slashes and query strings
  const clean = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') {
    return {
      sectionKey: 'overview',
      slug: 'page-overview',
      pageTitle: 'Dashboard Overview',
      routePath: '/'
    };
  }

  // Extract root segment: e.g. /orders/6789 -> orders
  const segments = clean.split('/').filter(Boolean);
  const rootSegment = segments[0] || 'overview';

  // Human-friendly title mapping
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
    notifications: 'Notifications',
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

  // Slug formatting: page-[current-path]
  const cleanSlugPart = rootSegment
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/(^-|-$)+/g, '');

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

  // In-memory cache to prevent redundant fetches when opening/closing
  const manualCache = useRef<Record<string, AdminManual | null>>({});

  // Resolve current route context
  const { sectionKey, slug, pageTitle, routePath } = useMemo(
    () => resolveHelpContext(pathname || '/'),
    [pathname]
  );

  // Load manual for the current page
  const loadManual = useCallback(async (targetSlug: string, bypassCache = false) => {
    if (!bypassCache && manualCache.current[targetSlug] !== undefined) {
      setManual(manualCache.current[targetSlug]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Primary slug attempt
      const res = await manualService.get(targetSlug);
      if (res && res.data) {
        manualCache.current[targetSlug] = res.data;
        setManual(res.data);
        setLoading(false);
        return;
      }
      manualCache.current[targetSlug] = null;
      setManual(null);
    } catch (err: unknown) {
      const isNotFound =
        (err as { status?: number })?.status === 404 ||
        (err instanceof Error && err.message.toLowerCase().includes('not found'));

      if (isNotFound) {
        // 2. Fallback check for alternate plural/singular forms (e.g. page-orders vs page-order)
        let alternateSlug = '';
        if (targetSlug.endsWith('s')) {
          alternateSlug = targetSlug.slice(0, -1);
        } else {
          alternateSlug = `${targetSlug}s`;
        }

        if (alternateSlug && alternateSlug !== targetSlug) {
          try {
            const fallbackRes = await manualService.get(alternateSlug);
            if (fallbackRes && fallbackRes.data) {
              manualCache.current[targetSlug] = fallbackRes.data;
              setManual(fallbackRes.data);
              setLoading(false);
              return;
            }
          } catch {
            // Ignore fallback failure
          }
        }

        // Neither found: set clean empty state
        manualCache.current[targetSlug] = null;
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
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
        title={`In-App Help (${pageTitle}) - Press ?`}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-slate-600 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* 2. Slide-out Sheet Drawer (Right) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs animate-fade-in"
            aria-hidden="true"
          />

          {/* Drawer Panel: Proportional desktop width (sm:max-w-md lg:max-w-lg) & full mobile width */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-drawer-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full sm:max-w-md lg:max-w-lg flex-col border-l border-border bg-white shadow-2xl animate-sheet-in"
          >
            {/* Sheet Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-border/80 bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" />
                    In-App Help
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 truncate">
                    {routePath}
                  </span>
                </div>
                <h2
                  id="help-drawer-title"
                  className="mt-1 text-base font-bold text-slate-900 truncate sm:text-lg"
                >
                  {manual?.title || `${pageTitle} SOP`}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>System Slug:</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                    {slug}
                  </code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Close drawer (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sheet Body (Scrollable with custom padding) */}
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6 space-y-5">
              {/* STATE 1: LOADING */}
              {loading && (
                <div className="space-y-4 py-2">
                  <Skeleton className="h-7 w-3/4 rounded-xl" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-4 w-5/6 rounded-lg" />
                    <Skeleton className="h-4 w-4/6 rounded-lg" />
                  </div>
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-5 w-1/3 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                  </div>
                </div>
              )}

              {/* STATE 2: ERROR */}
              {!loading && error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-center text-sm text-rose-800">
                  <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
                  <h3 className="mt-2 font-bold">Could not load help guide</h3>
                  <p className="mt-1 text-xs text-rose-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadManual(slug, true)}
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
                  {/* Guide Metadata Pill Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-slate-50/70 p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
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
                      Edit SOP
                    </Link>
                  </div>

                  {/* Rendered Markdown Content using Typography Prose */}
                  <div className="prose prose-slate max-w-none break-words">
                    {manual.content && manual.content.trim() ? (
                      <MarkdownPreview content={manual.content} />
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">This guide has no written content yet.</p>
                        <p className="mt-1">Click &quot;Edit SOP&quot; above to add procedures, rules, or checklists.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer note for existing guide */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Updated: {new Date(manual.updatedAt).toLocaleDateString()}</span>
                      <Link
                        href="/manuals"
                        onClick={() => setIsOpen(false)}
                        className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>All SOPs</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 4: NO MANUAL FOUND (PREMIUM REDESIGNED EMPTY STATE) */}
              {!loading && !error && !manual && (
                <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-slate-50/90 to-white p-6 text-center sm:p-7 shadow-xs">
                  {/* Icon with Double Ring */}
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                    <Compass className="h-7 w-7 stroke-[1.75]" />
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    No Guide Published Yet
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
                    Procedure not yet documented
                  </h3>

                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
                    Standard operating procedures for <strong className="font-semibold text-slate-700">{pageTitle}</strong> haven&apos;t been published in the CMS yet.
                  </p>

                  {/* System Slug Box */}
                  <div className="mt-5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-left shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Mapped System Slug
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySlug}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/5 transition"
                        title="Copy slug to clipboard"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200/70">
                      <code className="font-mono text-xs font-bold text-slate-800 truncate">
                        {slug}
                      </code>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 leading-normal">
                      Manuals with slug <code className="font-mono font-semibold text-slate-700">&apos;{slug}&apos;</code> will automatically appear in this contextual drawer.
                    </p>
                  </div>

                  {/* Primary CTA Button */}
                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleCreateGuide}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 hover:shadow-sm"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>Create {pageTitle} Guide</span>
                    </button>

                    <Link
                      href="/manuals"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex min-h-9 items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                    >
                      <span>Browse existing manuals</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border/80 bg-slate-50/90 px-5 py-3.5 text-xs sm:px-6">
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
