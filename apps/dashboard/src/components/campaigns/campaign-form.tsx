'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Sparkles, Save, ArrowLeft, Calendar, Tag, Image as ImageIcon,
  CheckCircle2, Plus, Trash2, Globe, Share2, HelpCircle, Eye,
  ExternalLink, Rocket, Clock, ChevronRight, ChevronLeft, DollarSign,
  AlertCircle, ShieldCheck, Truck, RefreshCcw, CreditCard, Layout
} from 'lucide-react';
import { adminCampaignService, catalogService, type AdminCampaign, type CatalogProduct } from '../../services/api-service';

type FormTab = 'product' | 'marketing' | 'schedule' | 'media' | 'specs' | 'seo';

interface CampaignFormProps {
  initialData?: Partial<AdminCampaign>;
  mode: 'create' | 'edit';
  campaignId?: string;
}

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

export default function CampaignForm({ initialData, mode, campaignId }: CampaignFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FormTab>('product');
  const [submitting, setSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish' | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [currentStatus, setCurrentStatus] = useState(initialData?.status || 'draft');
  const [productId, setProductId] = useState(
    typeof initialData?.product === 'string' ? initialData.product : initialData?.product?._id || ''
  );
  const [selectedVariants, setSelectedVariants] = useState<string[]>(initialData?.selectedVariants || []);

  const [headline, setHeadline] = useState(initialData?.headline || '');
  const [subheadline, setSubheadline] = useState(initialData?.subheadline || '');
  const [badgeText, setBadgeText] = useState(initialData?.badgeText || 'LIMITED TIME OFFER');
  const [offerPrice, setOfferPrice] = useState<string>(
    initialData?.offerPrice !== undefined && initialData?.offerPrice !== null ? String(initialData.offerPrice) : ''
  );
  const [discountPercentage, setDiscountPercentage] = useState<string>(
    initialData?.discountPercentage !== undefined && initialData?.discountPercentage !== null ? String(initialData.discountPercentage) : ''
  );
  const [ctaText, setCtaText] = useState(initialData?.ctaText || 'Order Now - Limited Stock');
  const [ctaSubtext, setCtaSubtext] = useState(initialData?.ctaSubtext || 'Free Delivery Across Bangladesh');

  // Convert Date to ISO string formatted for datetime-local (YYYY-MM-DDTHH:mm)
  const formatDatetimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [defaultSchedule] = useState(() => {
    const start = new Date();
    return { start, end: new Date(start.getTime() + 7 * 86400000) };
  });

  const [startsAt, setStartsAt] = useState(formatDatetimeLocal(initialData?.startsAt) || formatDatetimeLocal(defaultSchedule.start.toISOString()));
  const [expiresAt, setExpiresAt] = useState(formatDatetimeLocal(initialData?.expiresAt) || formatDatetimeLocal(defaultSchedule.end.toISOString()));
  const [showCountdown, setShowCountdown] = useState(initialData?.showCountdown !== false);
  const [onExpiryAction, setOnExpiryAction] = useState(initialData?.onExpiryAction || 'show_expired_page');

  const [bannerImage, setBannerImage] = useState(initialData?.bannerImage || '');
  const [mobileBannerImage, setMobileBannerImage] = useState(initialData?.mobileBannerImage || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData?.galleryImages || []);

  const [benefits, setBenefits] = useState<Array<{ icon: string; title: string; description: string }>>(
    initialData?.benefits?.length
      ? initialData.benefits.map((b) => ({ icon: b.icon || 'CheckCircle', title: b.title, description: b.description || '' }))
      : [
          { icon: 'ShieldCheck', title: '100% Genuine Product', description: 'Direct from verified brand manufacturer' },
          { icon: 'Truck', title: 'Fast Nationwide Delivery', description: 'Delivered to your doorstep inside 48-72 hours' },
          { icon: 'RefreshCcw', title: '7-Day Easy Return', description: 'Hassle-free replacement guarantee' },
          { icon: 'CreditCard', title: 'Cash on Delivery', description: 'Pay conveniently upon package inspection' },
        ]
  );

  const [specifications, setSpecifications] = useState<Array<{ label: string; value: string }>>(
    initialData?.specifications?.length
      ? initialData.specifications
      : [
          { label: 'Warranty', value: '1 Year Brand Warranty' },
          { label: 'Delivery', value: 'Cash On Delivery Available' },
        ]
  );

  const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.seo?.metaDescription || '');
  const [ogImage, setOgImage] = useState(initialData?.seo?.ogImage || '');

  // Load available products for selection
  useEffect(() => {
    catalogService.products({ limit: 50 })
      .then((res) => {
        setProducts(res.data);
        if (!productId && res.data[0]) {
          setProductId(res.data[0]._id);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = products.find((p) => p._id === productId);

  // Auto-slugify when title changes in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (mode === 'create' && !initialData?.slug) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleAddBenefit = () => {
    setBenefits([...benefits, { icon: 'CheckCircle', title: '', description: '' }]);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecifications([...specifications, { label: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // Submit Handler: supports saving as Draft or Publishing immediately
  const handleFormSubmit = async (publishImmediately: boolean) => {
    if (!title.trim()) {
      toast.error('Campaign title is required.');
      setActiveTab('product');
      return;
    }
    if (!productId) {
      toast.error('Please select a target product.');
      setActiveTab('product');
      return;
    }
    if (!startsAt || !expiresAt) {
      toast.error('Start and end dates are required.');
      setActiveTab('schedule');
      return;
    }

    const startUtc = new Date(startsAt).toISOString();
    const endUtc = new Date(expiresAt).toISOString();

    if (new Date(endUtc) <= new Date(startUtc)) {
      toast.error('Campaign end date must be strictly after start date.');
      setActiveTab('schedule');
      return;
    }

    setSubmitting(true);
    setSubmitAction(publishImmediately ? 'publish' : 'draft');

    try {
      const payload: any = {
        title: title.trim(),
        slug: slug.trim() ? slug.trim().toLowerCase() : undefined,
        product: productId,
        selectedVariants,
        headline: headline.trim() || undefined,
        subheadline: subheadline.trim() || undefined,
        badgeText: badgeText.trim() || undefined,
        offerPrice: offerPrice ? Number(offerPrice) : undefined,
        discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
        ctaText: ctaText.trim() || undefined,
        ctaSubtext: ctaSubtext.trim() || undefined,
        bannerImage: bannerImage.trim() || undefined,
        mobileBannerImage: mobileBannerImage.trim() || undefined,
        galleryImages: galleryImages.filter((img) => img.trim() !== ''),
        benefits: benefits.filter((b) => b.title.trim() !== ''),
        specifications: specifications.filter((s) => s.label.trim() !== '' && s.value.trim() !== ''),
        startsAt: publishImmediately ? new Date().toISOString() : startUtc,
        expiresAt: endUtc,
        showCountdown,
        onExpiryAction,
        status: publishImmediately ? 'active' : 'draft',
        publishImmediately,
        seo: {
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          ogImage: ogImage.trim() || bannerImage.trim() || undefined,
        },
      };

      if (mode === 'create') {
        const res = await adminCampaignService.create(payload);
        if (publishImmediately) {
          toast.success('Campaign created and published live!');
        } else {
          toast.success('Campaign created in draft mode.');
        }
        router.push(`/campaigns`);
      } else if (campaignId) {
        await adminCampaignService.update(campaignId, payload);
        if (publishImmediately) {
          toast.success('Campaign updated and published live!');
          setCurrentStatus('active');
        } else {
          toast.success('Campaign changes saved as draft.');
          setCurrentStatus('draft');
        }
        router.push('/campaigns');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save campaign.');
    } finally {
      setSubmitting(false);
      setSubmitAction(null);
    }
  };

  const tabs: Array<{ id: FormTab; label: string; icon: any }> = [
    { id: 'product', label: '1. Basic & Product', icon: Tag },
    { id: 'marketing', label: '2. Offer & Pricing', icon: Sparkles },
    { id: 'schedule', label: '3. Schedule & Timer', icon: Calendar },
    { id: 'media', label: '4. Visual Media', icon: ImageIcon },
    { id: 'specs', label: '5. Benefits & Specs', icon: CheckCircle2 },
    { id: 'seo', label: '6. SEO & Social Preview', icon: Globe },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  // Storefront preview link for edit mode
  const storefrontPreviewUrl = initialData?.slug
    ? `${STOREFRONT_URL}/en/campaign/${initialData.slug}${
        (currentStatus === 'draft' || currentStatus === 'scheduled') && initialData?.previewToken
          ? `?preview=true&token=${encodeURIComponent(initialData.previewToken)}`
          : ''
      }`
    : null;

  return (
    <div className="mx-auto max-w-5xl pb-32">
      {/* ========================================================================= */}
      {/* 1. STICKY TOP ACTION BAR                                                  */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-40 -mx-4 mb-6 border-b border-border/80 bg-white/95 px-4 py-3.5 shadow-xs backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50 hover:text-foreground transition-colors"
              title="Back to Campaigns"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                  {mode === 'create' ? 'Create New Campaign' : `Edit Campaign`}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    currentStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {currentStatus === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {currentStatus === 'active' ? 'Live' : 'Draft'}
                </span>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block truncate max-w-md">
                {title || 'Targeted high-converting promotional landing page builder'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {storefrontPreviewUrl && (
              <a
                href={storefrontPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                title="View live storefront landing page (appends preview token if draft)"
              >
                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                <span>Open Storefront</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            )}

            {/* Save Draft Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleFormSubmit(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              <span>{submitting && submitAction === 'draft' ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            {/* Publish Campaign Immediately Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleFormSubmit(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>{submitting && submitAction === 'publish' ? 'Publishing...' : 'Publish Campaign'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABBED STEP NAVIGATION                                                 */}
      {/* ========================================================================= */}
      <div className="mb-6 flex overflow-x-auto rounded-2xl border border-border bg-white/80 p-1.5 shadow-xs [scrollbar-width:none]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. CARD CONTENT SECTIONS                                                  */}
      {/* ========================================================================= */}

      {/* CARD 1: Basic & Product */}
      {activeTab === 'product' && (
        <div className="space-y-6 rounded-3xl border border-border bg-white/95 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Campaign Identification & Target Product</h2>
              <p className="text-xs text-muted-foreground">Select the canonical product this targeted landing page promotes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-800">
                Internal Campaign Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Summer Mega Glow Sale 2026"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Used internally in the dashboard to organize your marketing campaigns.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">
                Landing Page URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex h-11 items-center rounded-xl border border-border bg-slate-50 px-3 text-xs font-mono text-slate-500 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="shrink-0 text-slate-400">/campaign/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="summer-glow-sale"
                  className="ml-1 h-full w-full bg-transparent font-bold text-primary outline-hidden"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                The public URL slug. Lowercase alphanumeric and hyphens only (e.g. <span className="font-mono text-slate-700">/campaign/summer-glow-sale</span>).
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800">
              Select Canonical Product <span className="text-rose-500">*</span>
            </label>
            {loadingProducts ? (
              <div className="mt-2 h-11 rounded-xl bg-slate-100 animate-pulse" />
            ) : (
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {products.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name} (Regular Price: ৳{prod.basePrice.toLocaleString()})
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Orders and payments made on this campaign will deduct stock directly from this product.</p>
          </div>

          {selectedProduct && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-4">
                {selectedProduct.images?.[0] && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border border-border shadow-xs">
                    <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Linked Catalog Product
                  </span>
                  <p className="mt-1 font-bold text-foreground line-clamp-1">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Base Price: <span className="font-semibold text-slate-800">৳{selectedProduct.basePrice.toLocaleString()}</span>
                    {selectedProduct.discountPrice && (
                      <span className="ml-2 text-emerald-700 font-semibold">
                        (Discount: ৳{selectedProduct.discountPrice.toLocaleString()})
                      </span>
                    )}
                    {' '}• Category: {selectedProduct.category?.name || 'General'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CARD 2: Offer & Pricing */}
      {activeTab === 'marketing' && (
        <div className="space-y-6 rounded-3xl border border-border bg-white/95 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Promotional Pricing & Marketing Copy</h2>
              <p className="text-xs text-muted-foreground">Configure price overrides, headline hooks, and call-to-action guarantees.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-800">Promotional Badge Tag</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. LIMITED TIME OFFER • 40% OFF"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Displays as an animated glowing badge above the hero headline.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Campaign Offer Price (৳)</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder={selectedProduct ? String(selectedProduct.discountPrice || selectedProduct.basePrice) : 'Special campaign price'}
                  className="h-11 w-full rounded-xl border border-border bg-white pl-8 pr-4 text-sm font-bold text-emerald-600 outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Overrides regular product price for visitors to this campaign only. Leave empty to use product standard price.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800">High-Impact Landing Page Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={selectedProduct?.name || 'e.g. Experience Luxury & Flawless Radiance Today'}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">The primary hero title. Leave empty to default to the canonical product title.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800">Subheadline & Emotional Hook</label>
            <textarea
              rows={3}
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="e.g. Handcrafted with 100% pure organic extracts. Specially formulated for healthy, glowing skin this season."
              className="mt-1.5 w-full rounded-xl border border-border bg-white p-3.5 text-sm outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Compelling 1-2 sentence description placed directly underneath the headline.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-800">Primary CTA Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Order Now - Limited Stock"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">e.g. "Order Now - Pay on Delivery" or "Claim 40% Off".</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">CTA Guarantee Subtext</label>
              <input
                type="text"
                value={ctaSubtext}
                onChange={(e) => setCtaSubtext(e.target.value)}
                placeholder="Free Delivery Across Bangladesh"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Reassurance displayed below the main order button.</p>
            </div>
          </div>
        </div>
      )}

      {/* CARD 3: Schedule & Timer */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 rounded-3xl border border-border bg-white/95 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Campaign Schedule & Countdown Expiry</h2>
              <p className="text-xs text-muted-foreground">Server-authoritative scheduling. Automatically tracks start and expiry timestamps.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-800">
                Campaign Starts At <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tip: When you click <span className="font-semibold text-primary">"Publish Campaign"</span>, it goes live immediately regardless of timezone.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">
                Campaign Ends At (Expiry) <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">The countdown timer on the storefront ticks down to this exact minute.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50/70 p-4">
            <input
              type="checkbox"
              id="countdownToggle"
              checked={showCountdown}
              onChange={(e) => setShowCountdown(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="countdownToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
              Display Live Animated Countdown Timer on Landing Page (Urgency Driver)
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800">Action when campaign expires:</label>
            <select
              value={onExpiryAction}
              onChange={(e) => setOnExpiryAction(e.target.value as any)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="show_expired_page">Show Graceful Expired Page (Keep traffic, offer normal catalog purchase)</option>
              <option value="redirect_product">307 Redirect to Standard Catalog Product Page</option>
              <option value="redirect_home">307 Redirect to Storefront Homepage</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Protects ad spend and customer experience by handling expired links gracefully without broken pages.
            </p>
          </div>
        </div>
      )}

      {/* CARD 4: Visual Media */}
      {activeTab === 'media' && (
        <div className="space-y-6 rounded-3xl border border-border bg-white/95 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Visual Assets & Landing Banners</h2>
              <p className="text-xs text-muted-foreground">Configure desktop and mobile-optimized high-resolution banner visuals.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-800">Desktop Hero Banner URL</label>
              <input
                type="text"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://... or /uploads/hero-desktop.webp"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Recommended: 1920x800 or 16:9 ratio. Leave empty to use product image.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Mobile Hero Banner URL</label>
              <input
                type="text"
                value={mobileBannerImage}
                onChange={(e) => setMobileBannerImage(e.target.value)}
                placeholder="https://... or /uploads/hero-mobile.webp"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Recommended: 800x1000 or 4:5 vertical ratio for smartphones.</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800">Showcase Gallery Images (Comma separated URLs)</label>
            <textarea
              rows={2}
              value={galleryImages.join(', ')}
              onChange={(e) => setGalleryImages(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="https://...image1.jpg, https://...image2.jpg"
              className="mt-1.5 w-full rounded-xl border border-border bg-white p-3.5 text-xs font-mono outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Leave empty to inherit standard product photo gallery automatically.</p>
          </div>
        </div>
      )}

      {/* CARD 5: Benefits & Specs */}
      {activeTab === 'specs' && (
        <div className="space-y-6 rounded-3xl border border-border bg-white/95 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-foreground">Trust Signals & Specifications</h2>
                <p className="text-xs text-muted-foreground">Reassurance badges, warranty info, and key specs.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddBenefit}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Benefit</span>
            </button>
          </div>

          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-slate-50/50 p-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => {
                    const next = [...benefits];
                    next[i].title = e.target.value;
                    setBenefits(next);
                  }}
                  placeholder="Benefit Title (e.g. 100% Genuine)"
                  className="h-10 w-full sm:w-1/3 rounded-xl border border-border bg-white px-3 text-xs font-bold outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="text"
                  value={b.description}
                  onChange={(e) => {
                    const next = [...benefits];
                    next[i].description = e.target.value;
                    setBenefits(next);
                  }}
                  placeholder="Short explanation (e.g. Direct from verified brand manufacturer)"
                  className="h-10 w-full flex-1 rounded-xl border border-border bg-white px-3 text-xs outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBenefit(i)}
                  className="flex h-10 w-full sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Remove benefit"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 pt-6">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-slate-800">Product Specifications Table</h3>
              <button
                type="button"
                onClick={handleAddSpec}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Spec</span>
              </button>
            </div>

            <div className="space-y-3">
              {specifications.map((s, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-slate-50/50 p-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => {
                      const next = [...specifications];
                      next[i].label = e.target.value;
                      setSpecifications(next);
                    }}
                    placeholder="Spec Label (e.g. Warranty)"
                    className="h-10 w-full sm:w-1/3 rounded-xl border border-border bg-white px-3 text-xs font-bold outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => {
                      const next = [...specifications];
                      next[i].value = e.target.value;
                      setSpecifications(next);
                    }}
                    placeholder="Spec Value (e.g. 1 Year Replacement Warranty)"
                    className="h-10 w-full flex-1 rounded-xl border border-border bg-white px-3 text-xs outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(i)}
                    className="flex h-10 w-full sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Remove specification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARD 6: SEO & Social Share Preview */}
      {activeTab === 'seo' && (
        <div className="space-y-6 rounded-3xl border border-border bg-white/95 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">SEO & Open Graph Social Sharing</h2>
              <p className="text-xs text-muted-foreground">Control how this landing page appears on Google Search, Facebook, and WhatsApp.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-800">SEO Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={headline || selectedProduct?.name || 'Campaign SEO Title'}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Appears in browser tabs and search engine results.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Open Graph Social Image URL</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder={bannerImage || selectedProduct?.images?.[0] || '1200x630px image'}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-medium outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Image preview when shared on WhatsApp, Facebook, or Twitter.</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800">Meta Description</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={subheadline || selectedProduct?.shortDescription || 'Search snippet summary'}
              className="mt-1.5 w-full rounded-xl border border-border bg-white p-3.5 text-sm outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Social Card Preview */}
          <div className="mt-6 rounded-2xl border border-border bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Share2 className="h-4 w-4 text-primary" />
              <span>Live Social Card Preview (Facebook & WhatsApp)</span>
            </div>

            <div className="mt-4 max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="relative aspect-[1.91/1] w-full bg-slate-200">
                {ogImage || bannerImage || selectedProduct?.images?.[0] ? (
                  <Image
                    src={ogImage || bannerImage || selectedProduct?.images?.[0] || ''}
                    alt="Social Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    No preview image specified
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">READYCOMMERCE.COM</p>
                <p className="mt-1 font-bold text-slate-900 line-clamp-1">
                  {metaTitle || headline || title || 'Campaign Headline'}
                </p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {metaDescription || subheadline || 'Exclusive limited-time promotional offer. Order today with free home delivery across Bangladesh.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM STEP NAVIGATION & PERSISTENT ACTION FOOTER                      */}
      {/* ========================================================================= */}
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-white/90 p-4 shadow-xs">
        <button
          type="button"
          disabled={currentTabIndex === 0}
          onClick={() => setActiveTab(tabs[currentTabIndex - 1].id)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Step</span>
        </button>

        <div className="text-xs font-bold text-slate-500">
          Step {currentTabIndex + 1} of {tabs.length}
        </div>

        {currentTabIndex < tabs.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveTab(tabs[currentTabIndex + 1].id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all"
          >
            <span>Next Step</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleFormSubmit(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-primary/90 transition-all"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>Publish Campaign</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FLOATING BOTTOM BAR (ALWAYS VISIBLE ON SCREEN)                         */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 left-1/2 z-40 w-[92%] max-w-3xl -translate-x-1/2 rounded-2xl border border-border/90 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatus === 'active' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          <span className="text-xs font-bold text-slate-700">
            {currentStatus === 'active' ? 'Campaign is Live' : 'Unpublished Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleFormSubmit(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span>{submitting && submitAction === 'draft' ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleFormSubmit(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>{submitting && submitAction === 'publish' ? 'Publishing...' : 'Publish Campaign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
