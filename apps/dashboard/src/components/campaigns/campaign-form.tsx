'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Sparkles, Save, ArrowLeft, Calendar, Tag, Image as ImageIcon,
  CheckCircle, Plus, Trash2, Globe, Share2, HelpCircle, Eye
} from 'lucide-react';
import { adminCampaignService, catalogService, type AdminCampaign, type CatalogProduct } from '../../services/api-service';

type FormTab = 'product' | 'marketing' | 'schedule' | 'media' | 'specs' | 'seo';

interface CampaignFormProps {
  initialData?: Partial<AdminCampaign>;
  mode: 'create' | 'edit';
  campaignId?: string;
}

export default function CampaignForm({ initialData, mode, campaignId }: CampaignFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FormTab>('product');
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
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

  const defaultStart = new Date();
  const defaultEnd = new Date(Date.now() + 7 * 86400000); // 7 days later

  const [startsAt, setStartsAt] = useState(formatDatetimeLocal(initialData?.startsAt) || formatDatetimeLocal(defaultStart.toISOString()));
  const [expiresAt, setExpiresAt] = useState(formatDatetimeLocal(initialData?.expiresAt) || formatDatetimeLocal(defaultEnd.toISOString()));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.error('End date must be strictly after start date.');
      setActiveTab('schedule');
      return;
    }

    setSubmitting(true);
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
        startsAt: startUtc,
        expiresAt: endUtc,
        showCountdown,
        onExpiryAction,
        seo: {
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          ogImage: ogImage.trim() || bannerImage.trim() || undefined,
        },
      };

      if (mode === 'create') {
        const res = await adminCampaignService.create(payload);
        toast.success('Campaign created in draft mode!');
        router.push(`/campaigns/${res.data._id}/edit`);
      } else if (campaignId) {
        await adminCampaignService.update(campaignId, payload);
        toast.success('Campaign changes saved.');
        router.push('/campaigns');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: Array<{ id: FormTab; label: string; icon: any }> = [
    { id: 'product', label: '1. Basic & Product', icon: Tag },
    { id: 'marketing', label: '2. Marketing Copy', icon: Sparkles },
    { id: 'schedule', label: '3. Schedule & Timer', icon: Calendar },
    { id: 'media', label: '4. Visual Media', icon: ImageIcon },
    { id: 'specs', label: '5. Benefits & Specs', icon: CheckCircle },
    { id: 'seo', label: '6. SEO & Social Preview', icon: Globe },
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {mode === 'create' ? 'Create New Campaign' : `Edit: ${initialData?.title || 'Campaign'}`}
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure targeted landing page settings, pricing override, and conversion elements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'edit' && campaignId && (
            <Link
              href={`/campaigns/${campaignId}/preview`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4 text-indigo-600" />
              <span>Preview Frame</span>
            </Link>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-premium transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? 'Saving...' : 'Save Campaign'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mt-8 flex overflow-x-auto rounded-2xl border border-border bg-white/70 p-1.5 shadow-sm [scrollbar-width:none]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-white hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Product & Basic */}
      {activeTab === 'product' && (
        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-foreground">Campaign Identification & Product Reference</h2>
            <p className="text-xs text-muted-foreground">Select the canonical product this campaign promotes.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Internal Campaign Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Summer Mega Glow Sale 2026"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Landing Page URL Slug *</label>
              <div className="mt-1.5 flex h-11 items-center rounded-xl border border-border bg-slate-50 px-3 text-xs text-slate-500 font-mono">
                <span>/campaign/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="summer-glow-sale"
                  className="ml-1 h-full w-full bg-transparent font-bold text-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Select Canonical Product *</label>
            {loadingProducts ? (
              <div className="mt-2 h-11 rounded-xl bg-slate-100 animate-pulse" />
            ) : (
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {products.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name} (Regular: ৳{prod.basePrice.toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-2xl border border-border/80 bg-slate-50/70 p-4">
              <div className="flex items-center gap-4">
                {selectedProduct.images?.[0] && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border border-border">
                    <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Target Product Linked</p>
                  <p className="font-bold text-foreground line-clamp-1">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Base Price: ৳{selectedProduct.basePrice.toLocaleString()} • Category: {selectedProduct.category?.name || 'General'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Marketing & Offer */}
      {activeTab === 'marketing' && (
        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-foreground">Marketing Copy & Promotional Pricing</h2>
            <p className="text-xs text-muted-foreground">Override headlines, badge text, and offer pricing.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Promo Badge Tag</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. MEGA EID PROMO • 40% OFF"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Campaign Offer Price (৳)</label>
              <input
                type="number"
                min="0"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={selectedProduct ? String(selectedProduct.discountPrice || selectedProduct.basePrice) : 'Offer price override'}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-muted-foreground">Leave empty to use the product standard price.</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">High-Impact Landing Page Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={selectedProduct?.name || 'e.g. Experience Unmatched Elegance & Radiance'}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-[11px] text-muted-foreground">Appears as the primary H1 title on the landing page.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Subheadline & Campaign Hook</label>
            <textarea
              rows={3}
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="e.g. Handcrafted with premium organic extracts. Limited batches made specially for this festive season."
              className="mt-1.5 w-full rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Call-to-Action (CTA) Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Order Now - Limited Stock"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">CTA Subtext Guarantee</label>
              <input
                type="text"
                value={ctaSubtext}
                onChange={(e) => setCtaSubtext(e.target.value)}
                placeholder="Free Delivery Across Bangladesh"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Schedule & Timing */}
      {activeTab === 'schedule' && (
        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-foreground">Campaign Schedule & Countdown Expiry</h2>
            <p className="text-xs text-muted-foreground">Server-authoritative timing. Automatically transitions between Scheduled, Active, and Expired.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Campaign Starts At *</label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-muted-foreground">Timezone: Local / UTC Synced</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Campaign Ends At *</label>
              <input
                type="datetime-local"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-muted-foreground">Countdown timer counts down to this exact instant.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50/70 p-4">
            <input
              type="checkbox"
              id="countdownToggle"
              checked={showCountdown}
              onChange={(e) => setShowCountdown(e.target.checked)}
              className="h-4 w-4 rounded text-primary focus:ring-primary"
            />
            <label htmlFor="countdownToggle" className="text-sm font-bold text-slate-800 cursor-pointer">
              Display Live Animated Countdown Timer on Landing Page
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Action when campaign expires:</label>
            <select
              value={onExpiryAction}
              onChange={(e) => setOnExpiryAction(e.target.value as any)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="show_expired_page">Show Graceful Expired Page (Retain traffic, offer normal price)</option>
              <option value="redirect_product">307 Redirect to Standard Product Page</option>
              <option value="redirect_home">307 Redirect to Storefront Homepage</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab 4: Media & Visuals */}
      {activeTab === 'media' && (
        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-foreground">Visual Assets & Banners</h2>
            <p className="text-xs text-muted-foreground">Configure desktop and mobile specific high-resolution visual banners.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Desktop Hero Banner URL</label>
              <input
                type="text"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://... or /uploads/hero-desktop.webp"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-muted-foreground">Recommended: 1920x800 or 16:9 ratio.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Mobile Hero Banner URL</label>
              <input
                type="text"
                value={mobileBannerImage}
                onChange={(e) => setMobileBannerImage(e.target.value)}
                placeholder="https://... or /uploads/hero-mobile.webp"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-muted-foreground">Recommended: 800x1000 or 4:5 vertical ratio.</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Custom Showcase Gallery Images (Comma separated)</label>
            <textarea
              rows={2}
              value={galleryImages.join(', ')}
              onChange={(e) => setGalleryImages(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="https://...image1.jpg, https://...image2.jpg"
              className="mt-1.5 w-full rounded-xl border border-border bg-white p-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-[11px] text-muted-foreground">Leave empty to use the standard product photos automatically.</span>
          </div>
        </div>
      )}

      {/* Tab 5: Benefits & Specs */}
      {activeTab === 'specs' && (
        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Key Benefits & Trust Props</h2>
              <button
                type="button"
                onClick={handleAddBenefit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Benefit</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Trust signals displayed below the hero section.</p>
          </div>

          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50/50 p-3">
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => {
                    const next = [...benefits];
                    next[i].title = e.target.value;
                    setBenefits(next);
                  }}
                  placeholder="Benefit Title (e.g. 100% Genuine)"
                  className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-xs font-bold outline-none"
                />
                <input
                  type="text"
                  value={b.description}
                  onChange={(e) => {
                    const next = [...benefits];
                    next[i].description = e.target.value;
                    setBenefits(next);
                  }}
                  placeholder="Short explanation"
                  className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBenefit(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Features & Specifications</h2>
              <button
                type="button"
                onClick={handleAddSpec}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Spec</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {specifications.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50/50 p-3">
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => {
                    const next = [...specifications];
                    next[i].label = e.target.value;
                    setSpecifications(next);
                  }}
                  placeholder="Label (e.g. Warranty)"
                  className="h-10 w-1/3 rounded-xl border border-border bg-white px-3 text-xs font-bold outline-none"
                />
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => {
                    const next = [...specifications];
                    next[i].value = e.target.value;
                    setSpecifications(next);
                  }}
                  placeholder="Value (e.g. 1 Year Replacement)"
                  className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: SEO & Social Share Preview */}
      {activeTab === 'seo' && (
        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-foreground">SEO & Open Graph Social Sharing Metadata</h2>
            <p className="text-xs text-muted-foreground">Control how the campaign appears on Google Search, Facebook, and WhatsApp.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">SEO Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={headline || selectedProduct?.name || 'Campaign SEO Title'}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Open Graph Social Banner URL</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder={bannerImage || selectedProduct?.images?.[0] || '1200x630px image'}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Meta Description</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={subheadline || selectedProduct?.shortDescription || 'Search snippet summary'}
              className="mt-1.5 w-full rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Live Social Share Card Preview */}
          <div className="mt-8 rounded-2xl border border-border bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Share2 className="h-4 w-4" />
              <span>Live Social Card Preview (Facebook & WhatsApp)</span>
            </div>

            <div className="mt-4 max-w-md overflow-hidden rounded-2xl border border-border/80 bg-white shadow-md">
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
              <div className="p-3.5">
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
    </form>
  );
}
