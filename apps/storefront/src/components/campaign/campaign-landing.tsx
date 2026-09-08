'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Shield, Eye, Flame } from 'lucide-react';
import { PublicCampaignData, campaignService } from '@/services/api-service';
import CampaignGallery from './campaign-gallery';
import CampaignCountdown from './campaign-countdown';
import CampaignOfferBox from './campaign-offer-box';
import CampaignBenefits from './campaign-benefits';
import CampaignStickyBar from './campaign-sticky-bar';
import CampaignExpired from './campaign-expired';
import CatalogCard from '@/components/store/catalog-card';
import ProductReviews from '@/components/store/product-reviews';

interface CampaignLandingProps {
  campaign: PublicCampaignData;
  locale: string;
}

export default function CampaignLanding({ campaign, locale }: CampaignLandingProps) {
  const [isLiveExpired, setIsLiveExpired] = useState(campaign.status === 'expired');

  // Track campaign page view once mounted
  useEffect(() => {
    if (!campaign.isPreview) {
      campaignService.trackAction(campaign.slug, 'view', {
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
      }).catch(() => {});
    }
  }, [campaign.slug, campaign.isPreview]);

  // If expired and expiry action was to show expired page
  if (isLiveExpired && campaign.onExpiryAction === 'show_expired_page') {
    return (
      <CampaignExpired
        productId={campaign.product._id}
        productSlug={campaign.product.slug}
        productName={campaign.product.name}
        recommendedProducts={campaign.recommendedProducts}
        locale={locale}
      />
    );
  }

  const primaryImage = campaign.bannerImage || campaign.galleryImages?.[0] || '/placeholder.png';
  const stars = Math.round(campaign.product.ratingAverage || 5);

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground selection:bg-primary selection:text-white">
      {/* Preview Mode Notification Banner */}
      {campaign.isPreview && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/40 bg-amber-500/90 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-950 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" />
            <span>
              <strong>PREVIEW MODE:</strong> This campaign is currently in draft or scheduled state. You are viewing live admin preview.
            </span>
          </div>
          <span className="rounded-full bg-amber-950/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
            Status: {campaign.status}
          </span>
        </div>
      )}

      {/* Hero Promotional Banner Header */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/5 via-surface/30 to-background pt-8 pb-10 sm:pt-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Badge */}
          {campaign.badgeText && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary shadow-sm">
              <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>{campaign.badgeText}</span>
            </div>
          )}

          {/* Main Headline */}
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            {campaign.headline}
          </h1>

          {/* Subheadline */}
          {campaign.subheadline && (
            <p className="mx-auto mt-4 max-w-3xl text-base sm:text-xl font-normal leading-relaxed text-muted-foreground">
              {campaign.subheadline}
            </p>
          )}

          {/* Social Proof & Rating Badge */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 border border-border/80 shadow-sm">
              <div className="flex text-amber-400">
                {'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 5 - stars))}
              </div>
              <span className="font-bold text-foreground">
                {campaign.product.ratingAverage ? campaign.product.ratingAverage.toFixed(1) : '5.0'}
              </span>
              <span className="text-muted-foreground">
                ({campaign.product.reviewCount || 24} reviews)
              </span>
            </div>

            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Shield className="h-4 w-4" />
              <span>100% Authentic Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Campaign Product Section (2-Column Grid) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column (6 cols): Product Visuals & Benefits */}
          <div className="lg:col-span-6 space-y-8">
            <CampaignGallery
              images={campaign.galleryImages?.length ? campaign.galleryImages : [primaryImage]}
              productName={campaign.product.name}
              badgeText={campaign.badgeText}
              discountPercentage={campaign.discountPercentage}
              productId={campaign.product._id}
            />

            {/* Campaign Highlights Pill List */}
            {campaign.specifications && campaign.specifications.length > 0 && (
              <div className="hidden lg:block">
                <CampaignBenefits
                  benefits={campaign.benefits}
                  specifications={campaign.specifications}
                />
              </div>
            )}
          </div>

          {/* Right Column (6 cols): Timer & Offer Box */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Countdown Timer */}
            {campaign.showCountdown && campaign.expiresAt && !isLiveExpired && (
              <CampaignCountdown
                expiresAt={campaign.expiresAt}
                serverTime={campaign.serverTime}
                title="⚡ Limited-Time Promotional Pricing Ends In"
                onExpire={() => setIsLiveExpired(true)}
                variant="card"
              />
            )}

            {/* Core Offer Box */}
            <CampaignOfferBox
              campaignSlug={campaign.slug}
              productId={campaign.product._id}
              productName={campaign.product.name}
              primaryImage={primaryImage}
              offerPrice={campaign.offerPrice}
              regularPrice={campaign.regularPrice}
              discountPercentage={campaign.discountPercentage}
              ctaText={campaign.ctaText}
              ctaSubtext={campaign.ctaSubtext}
              variants={campaign.product.variants || []}
              locale={locale}
              isExpired={isLiveExpired}
            />

            {/* Mobile specs and benefits */}
            <div className="block lg:hidden pt-4">
              <CampaignBenefits
                benefits={campaign.benefits}
                specifications={campaign.specifications}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">
        <ProductReviews productId={campaign.product._id} />
      </section>

      {/* Recommended Products */}
      {campaign.recommendedProducts && campaign.recommendedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 border-t border-border/60 mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                More Exclusive Offers
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Frequently paired items recommended by our team
              </p>
            </div>
            <Link
              href={`/${locale}/shop`}
              className="text-xs sm:text-sm font-bold text-primary hover:underline"
            >
              Browse All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {campaign.recommendedProducts.slice(0, 4).map((p) => (
              <CatalogCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile/Scroll Sticky Bar */}
      <CampaignStickyBar
        campaignSlug={campaign.slug}
        productId={campaign.product._id}
        productName={campaign.product.name}
        thumbnail={primaryImage}
        offerPrice={campaign.offerPrice}
        regularPrice={campaign.regularPrice}
        expiresAt={campaign.expiresAt}
        serverTime={campaign.serverTime}
        showCountdown={campaign.showCountdown}
        ctaText={campaign.ctaText}
        locale={locale}
        isExpired={isLiveExpired}
        inStock={campaign.product.inStock}
      />
    </main>
  );
}
