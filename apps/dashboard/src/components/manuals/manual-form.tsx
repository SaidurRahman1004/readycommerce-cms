'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Sparkles, Check, CheckCircle2, Eye, Edit3,
  Trash2, X, BookOpen, FileText, Search, Bold, Italic, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote, Code, Link2,
  Table, Minus, HelpCircle, ExternalLink, RefreshCw, ShoppingBag,
  Columns, FileCheck, Info
} from 'lucide-react';
import {
  manualService,
  catalogService,
  type AdminManual,
  type CatalogProduct
} from '../../services/api-service';
import { MarkdownPreview } from './markdown-preview';

interface ManualFormProps {
  initialData?: AdminManual;
  mode: 'create' | 'edit';
  manualId?: string;
}

export default function ManualForm({ initialData, mode, manualId }: ManualFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [type, setType] = useState<'staff_sop' | 'customer_guide'>(initialData?.type || 'staff_sop');
  const [status, setStatus] = useState<'active' | 'draft'>(initialData?.status || 'draft');
  const [content, setContent] = useState(initialData?.content || '');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialData?.relatedProducts?.map((p) => p._id) || []
  );

  // UI State
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('write');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // Load catalog products for related products selection
  useEffect(() => {
    let mounted = true;
    catalogService.products({ limit: 150 })
      .then((res) => {
        if (mounted) setProducts(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load products for manuals picker:', err);
      })
      .finally(() => {
        if (mounted) setLoadingProducts(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-generate slug from title if user hasn't typed a custom slug
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (mode === 'create' && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))) {
      const generated = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleSlugChange = (rawSlug: string) => {
    // Only allow lowercase alphanumeric, hyphens, and underscores
    const sanitized = rawSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    setSlug(sanitized);
  };

  // Quick slug suggestions
  const applyPresetSlug = (preset: string) => {
    setSlug(preset);
  };

  // Insert markdown formatting at cursor position in textarea
  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(start + prefix.length, newCursorPos);
    }, 0);
  };

  // Product selection helpers
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const removeProduct = (productId: string) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const clearAllProducts = () => {
    setSelectedProductIds([]);
  };

  // Filter products by search term
  const filteredProducts = products.filter((product) => {
    if (!productSearch.trim()) return true;
    const query = productSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query)
    );
  });

  const selectedProductsList = products.filter((p) => selectedProductIds.includes(p._id));

  // Word count & stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Save / Submit logic
  const handleSave = async (statusOverride?: 'active' | 'draft') => {
    const finalTitle = title.trim();
    if (!finalTitle || finalTitle.length < 3) {
      toast.error('Title must be at least 3 characters.');
      return;
    }

    const finalSlug = (slug.trim() || finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();
    if (!finalSlug) {
      toast.error('A valid slug is required.');
      return;
    }

    const finalContent = content.trim();
    if (!finalContent) {
      toast.error('Please write some content for the manual.');
      return;
    }

    const targetStatus = statusOverride || status;

    setSaving(true);
    try {
      const payload = {
        title: finalTitle,
        slug: finalSlug,
        type,
        status: targetStatus,
        content: finalContent,
        relatedProducts: type === 'customer_guide' ? selectedProductIds : []
      };

      if (mode === 'edit' && manualId) {
        await manualService.update(manualId, payload);
        toast.success(`Manual updated (${targetStatus}).`);
      } else {
        await manualService.create(payload);
        toast.success(`Manual created (${targetStatus}).`);
      }

      router.push('/manuals');
      router.refresh();
    } catch (err: unknown) {
      console.error('Save manual error:', err);
      const message = err instanceof Error ? err.message : 'Could not save manual.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      {/* Top Sticky Action Bar */}
      <div className="sticky top-0 z-30 -mx-4 -mt-6 mb-6 border-b border-border/80 bg-white/95 px-6 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/manuals"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:bg-muted hover:text-slate-900"
              title="Back to Manuals"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {mode === 'edit' ? 'Edit Guide / SOP' : 'New Manual'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {status === 'active' ? 'Active / Published' : 'Draft'}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                {title.trim() ? title : mode === 'edit' ? 'Edit Manual' : 'Untitled Manual'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/manuals"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 text-slate-500" />
              Save Draft
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('active')}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mode === 'edit' ? 'Save & Publish' : 'Publish Manual'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left / Context Right */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Form Fields and Rich Editor */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Core Details */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Guide Details
                </h2>
              </div>
              <span className="text-xs text-slate-500">Required fields marked with *</span>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Perfume Care & Longevity Guide or Order Dispatch SOP"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Slug with explicit user required tip */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Slug *
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => applyPresetSlug('page-orders')}
                      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 hover:bg-primary/10 hover:text-primary transition"
                    >
                      page-orders
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetSlug('page-products')}
                      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 hover:bg-primary/10 hover:text-primary transition"
                    >
                      page-products
                    </button>
                  </div>
                </div>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400 font-mono">
                    manuals/
                  </div>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g. perfume-care-guide or page-orders"
                    className="h-11 w-full rounded-xl border border-border pl-20 pr-3.5 font-mono text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* EXACT REQUIRED HELPER TEXT */}
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <span>
                    Tip: For dashboard contextual help, use slugs like &apos;page-orders&apos; or &apos;page-products&apos;.
                  </span>
                </p>
              </div>

              {/* Type and Status Selectors */}
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Manual Type
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('staff_sop')}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        type === 'staff_sop'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-slate-50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileCheck
                          className={`h-4 w-4 ${
                            type === 'staff_sop' ? 'text-primary' : 'text-slate-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-900">Staff SOP</span>
                      </div>
                      <span className="mt-1 text-[11px] text-slate-500">
                        Internal team procedures
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('customer_guide')}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        type === 'customer_guide'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-slate-50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag
                          className={`h-4 w-4 ${
                            type === 'customer_guide' ? 'text-primary' : 'text-slate-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-900">Customer Guide</span>
                      </div>
                      <span className="mt-1 text-[11px] text-slate-500">
                        Public activation & care
                      </span>
                    </button>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Publication Status
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('draft')}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        status === 'draft'
                          ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                          : 'border-border bg-slate-50 hover:bg-slate-100/70'
                      }`}
                    >
                      <span className="text-xs font-bold text-amber-900">Draft</span>
                      <span className="mt-1 text-[11px] text-amber-700/80">
                        Hidden from public views
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        status === 'active'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                          : 'border-border bg-slate-50 hover:bg-slate-100/70'
                      }`}
                    >
                      <span className="text-xs font-bold text-emerald-900">Active</span>
                      <span className="mt-1 text-[11px] text-emerald-700/80">
                        Visible and live in guides
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Related Products Picker (Conditional for customer_guide) */}
          {type === 'customer_guide' && (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Related Products
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Leave empty for a general guide, or link specific catalog products.
                  </p>
                </div>
                {selectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllProducts}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Clear all ({selectedProductIds.length})
                  </button>
                )}
              </div>

              {/* Selected Products Pills */}
              {selectedProductsList.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedProductsList.map((product) => {
                    const thumbnail = product.images?.[0] || '';
                    return (
                      <div
                        key={product._id}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-1.5 pl-2 pr-3 text-xs font-medium text-slate-800 transition hover:bg-primary/10"
                      >
                        {thumbnail ? (
                          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                            <Image
                              src={thumbnail}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-500">
                            {product.name.charAt(0)}
                          </div>
                        )}
                        <span className="max-w-[180px] truncate font-semibold">
                          {product.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ৳{product.basePrice}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProduct(product._id)}
                          className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                          title="Remove product"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-500">
                  No products linked yet. This guide will be treated as a general customer handbook.
                </div>
              )}

              {/* Product Search & Dropdown Picker */}
              <div className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onFocus={() => setIsProductPickerOpen(true)}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductPickerOpen(true);
                    }}
                    placeholder="Search products to attach (e.g. perfume, oil, serum)..."
                    className="h-10 w-full rounded-xl border border-border pl-10 pr-4 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-2.5 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Dropdown Product List */}
                {isProductPickerOpen && (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-lg">
                    <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <span>Available Products ({filteredProducts.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsProductPickerOpen(false)}
                        className="text-primary hover:underline"
                      >
                        Done
                      </button>
                    </div>

                    {loadingProducts ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Loading products...
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No matching products found.
                      </div>
                    ) : (
                      <div className="mt-1 divide-y divide-slate-100">
                        {filteredProducts.map((product) => {
                          const isSelected = selectedProductIds.includes(product._id);
                          const thumbnail = product.images?.[0] || '';
                          return (
                            <div
                              key={product._id}
                              onClick={() => toggleProduct(product._id)}
                              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition hover:bg-slate-50 ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                    isSelected
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                                {thumbnail ? (
                                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                                    <Image
                                      src={thumbnail}
                                      alt={product.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-400">
                                    {product.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0 truncate">
                                  <p className="truncate text-xs font-semibold text-slate-900">
                                    {product.name}
                                  </p>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {product.category?.name || 'Uncategorized'} • ৳{product.basePrice}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-[11px] font-bold ${
                                  isSelected ? 'text-primary' : 'text-slate-400'
                                }`}
                              >
                                {isSelected ? 'Selected' : '+ Add'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Premium Markdown Editor & Live Preview */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            {/* Editor Header & View Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-slate-50/70 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Content Editor
                </h2>
                <span className="hidden rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-mono text-slate-600 sm:inline-block">
                  Markdown Supported
                </span>
              </div>

              {/* View Mode Toggle: Write / Preview / Split */}
              <div className="flex items-center rounded-xl border border-border bg-white p-1 text-xs shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                    activeTab === 'write'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                    activeTab === 'preview'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('split')}
                  className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                    activeTab === 'split'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns className="h-3.5 w-3.5" />
                  Split
                </button>
              </div>
            </div>

            {/* Quick Formatting Toolbar (Visible in Write and Split modes) */}
            {(activeTab === 'write' || activeTab === 'split') && (
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-white px-3 py-2 text-slate-700">
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**', 'bold text')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Bold (**text**)"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*', 'italic text')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Italic (*text*)"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('~~', '~~', 'strikethrough')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Strikethrough (~~text~~)"
                >
                  <Strikethrough className="h-4 w-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Heading 2 (## Title)"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('### ', '', 'Heading 3')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Heading 3 (### Title)"
                >
                  <Heading3 className="h-4 w-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => insertMarkdown('- ', '', 'List item')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Bullet List (- Item)"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('1. ', '', 'Numbered item')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Numbered List (1. Item)"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('> ', '', 'Important note or quote')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Blockquote (> Quote)"
                >
                  <Quote className="h-4 w-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`', 'code')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Inline Code (`code`)"
                >
                  <Code className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[', '](https://example.com)', 'Link text')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Hyperlink ([title](url))"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertMarkdown(
                      '\n| Feature | Status | Notes |\n| :--- | :--- | :--- |\n| Step 1 | Done | Ready |\n',
                      ''
                    )
                  }
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Insert Table"
                >
                  <Table className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n---\n', '')}
                  className="rounded p-1.5 hover:bg-slate-100 hover:text-slate-900"
                  title="Horizontal Rule (---)"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Editor Workspace */}
            <div className="p-4 sm:p-6">
              {activeTab === 'write' && (
                <div className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    rows={18}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Guide Title&#10;&#10;Write detailed instructions, SOP rules, troubleshooting steps, or customer usage guidelines here...&#10;&#10;## Key Procedures&#10;- Step 1: Check orders&#10;- Step 2: Print packing slip"
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/40 p-4 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="min-h-[420px] rounded-xl border border-slate-200 bg-white p-6">
                  <MarkdownPreview content={content} />
                </div>
              )}

              {activeTab === 'split' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Markdown Input
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows={18}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="# Guide Title&#10;&#10;Write instructions here..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/40 p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Live Formatted Output
                    </div>
                    <div className="max-h-[460px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
                      <MarkdownPreview content={content} />
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Footer / Word & Character Count */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span>
                    Words: <strong className="text-slate-700">{wordCount}</strong>
                  </span>
                  <span>
                    Characters: <strong className="text-slate-700">{charCount}</strong>
                  </span>
                  <span>
                    Est. Read Time:{' '}
                    <strong className="text-slate-700">{readingTimeMinutes} min</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Supports GitHub flavored markdown, tables & callouts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Contextual Help & Metadata */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card: Publishing Summary */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-border/60 pb-3">
              Overview & Visibility
            </h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Audience</span>
                <span className="font-bold text-slate-900 capitalize">
                  {type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-bold capitalize ${
                    status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Slug Key</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                  /{slug || '...'}
                </span>
              </div>
              {type === 'customer_guide' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Linked Products</span>
                  <span className="font-bold text-slate-900">
                    {selectedProductIds.length}{' '}
                    {selectedProductIds.length === 1 ? 'product' : 'products'}
                  </span>
                </div>
              )}
              {initialData?.updatedAt && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                  <span className="text-slate-400">Last Modified</span>
                  <span className="text-slate-600">
                    {new Date(initialData.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('active')}
                className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {mode === 'edit' ? 'Update & Publish' : 'Publish Manual'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('draft')}
                className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 text-slate-500" />
                Save as Draft
              </button>
            </div>
          </div>

          {/* Card: Contextual Help Slugs Guide */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-primary">
              <Info className="h-4 w-4 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Dashboard Help Links
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              When administrators work on complex dashboard pages, contextual help drawers look up manuals matching the current route.
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between rounded-lg bg-white/80 p-2 text-xs border border-primary/10">
                <span className="font-medium text-slate-700">Orders Page</span>
                <button
                  type="button"
                  onClick={() => applyPresetSlug('page-orders')}
                  className="font-mono text-[11px] font-bold text-primary hover:underline"
                >
                  page-orders
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/80 p-2 text-xs border border-primary/10">
                <span className="font-medium text-slate-700">Products Catalog</span>
                <button
                  type="button"
                  onClick={() => applyPresetSlug('page-products')}
                  className="font-mono text-[11px] font-bold text-primary hover:underline"
                >
                  page-products
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/80 p-2 text-xs border border-primary/10">
                <span className="font-medium text-slate-700">Campaigns Page</span>
                <button
                  type="button"
                  onClick={() => applyPresetSlug('page-campaigns')}
                  className="font-mono text-[11px] font-bold text-primary hover:underline"
                >
                  page-campaigns
                </button>
              </div>
            </div>
          </div>

          {/* Card: Markdown Quick Reference */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Markdown Cheatsheet
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-600 font-mono">
              <div className="rounded-md bg-slate-50 p-2 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-sans font-bold">Headings</p>
                <p className="mt-0.5"># Main Title</p>
                <p>## Section Header</p>
                <p>### Sub-header</p>
              </div>
              <div className="rounded-md bg-slate-50 p-2 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-sans font-bold">Lists & Quotes</p>
                <p className="mt-0.5">- Bullet item</p>
                <p>1. Numbered step</p>
                <p>&gt; Note or callout text</p>
              </div>
              <div className="rounded-md bg-slate-50 p-2 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-sans font-bold">Links & Code</p>
                <p className="mt-0.5">[Google](https://google.com)</p>
                <p>`inline code snippet`</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
