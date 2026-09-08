import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { campaignService, PublicCampaignData } from '@/services/api-service';
import CampaignLanding from '@/components/campaign/campaign-landing';

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const absoluteImage = (image?: string) => {
  if (!image) return `${siteUrl}/placeholder.png`;
  try {
    return new URL(image, siteUrl).toString();
  } catch {
    return image;
  }
};

async function getCampaign(slug: string, token?: string): Promise<PublicCampaignData | null> {
  try {
    if (token) {
      const res = await campaignService.getPreview(slug, token, { cache: 'no-store' });
      return res.data ? { ...res.data, isPreview: true } : null;
    }
    const res = await campaignService.getBySlug(slug, {
      cache: 'force-cache',
      next: { revalidate: 60, tags: [`campaign:${slug}`] },
    });
    return res.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ token?: string; previewToken?: string; preview?: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const search = await searchParams;
  const effectiveToken = search.token || search.previewToken;
  const campaign = await getCampaign(slug, effectiveToken);

  if (!campaign) {
    return {
      title: 'Campaign Not Found | ReadyCommerce',
      description: 'The requested promotional campaign could not be found.',
    };
  }

  const title = campaign.seo?.metaTitle || `${campaign.headline} | ReadyCommerce Offer`;
  const description =
    campaign.seo?.metaDescription ||
    campaign.subheadline ||
    `Exclusive limited-time offer on ${campaign.product?.name || 'ReadyCommerce'}`;
  const canonicalUrl = campaign.seo?.canonicalUrl || `/${locale}/campaign/${slug}`;
  const ogImg = absoluteImage(campaign.seo?.ogImage || campaign.bannerImage || campaign.galleryImages?.[0]);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      title: campaign.seo?.ogTitle || title,
      description: campaign.seo?.ogDescription || description,
      url: `${siteUrl}/${locale}/campaign/${slug}`,
      images: [
        {
          url: ogImg,
          width: 1200,
          height: 630,
          alt: campaign.headline,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.seo?.ogTitle || title,
      description: campaign.seo?.ogDescription || description,
      images: [ogImg],
    },
  };
}

function CampaignJsonLd({ campaign, locale }: { campaign: PublicCampaignData; locale: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: campaign.product.name,
    image: (campaign.galleryImages || [campaign.bannerImage]).filter(Boolean).map(absoluteImage),
    description: campaign.subheadline || campaign.headline,
    sku: campaign.product.variants?.[0]?.sku || campaign.slug,
    brand: {
      '@type': 'Brand',
      name: 'ReadyCommerce',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/${locale}/campaign/${campaign.slug}`,
      priceCurrency: 'BDT',
      price: Number(campaign.offerPrice).toFixed(2),
      priceValidUntil: campaign.expiresAt ? new Date(campaign.expiresAt).toISOString().split('T')[0] : undefined,
      availability: campaign.product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(campaign.product.reviewCount && campaign.product.ratingAverage
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: campaign.product.ratingAverage,
            reviewCount: campaign.product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
  );
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ token?: string; previewToken?: string; preview?: string }>;
}) {
  const { locale, slug } = await params;
  const search = await searchParams;
  const effectiveToken = search.token || search.previewToken;
  const campaign = await getCampaign(slug, effectiveToken);

  if (!campaign) {
    notFound();
  }

  // Handle server-side redirection if campaign has expired and action requires redirect
  if (campaign.expired && campaign.targetUrl) {
    redirect(campaign.targetUrl.startsWith('/') ? `/${locale}${campaign.targetUrl}` : campaign.targetUrl);
  }

  return (
    <>
      <CampaignJsonLd campaign={campaign} locale={locale} />
      <CampaignLanding campaign={campaign} locale={locale} />
    </>
  );
}
