import type { Metadata } from 'next';
import ProductDetail from '@/components/store/product-detail';
import ProductReviews from '@/components/store/product-reviews';
import { catalogService, CatalogProduct } from '@/services/api-service';

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const absoluteImage = (image: string) => { try { return new URL(image, siteUrl).toString(); } catch { return image; } };

async function getProduct(id: string) {
  try { return (await catalogService.product(id, { cache: 'force-cache', next: { revalidate: 60 } })).data; }
  catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Product not found', description: 'The requested ReadyCommerce product could not be found.' };
  const description = product.shortDescription || product.description || `Discover ${product.name} at ReadyCommerce.`;
  return { title: product.name, description, alternates: { canonical: `/${locale}/products/${product.slug || product._id}` }, openGraph: { type: 'website', title: product.name, description, images: product.images?.[0] ? [{ url: absoluteImage(product.images[0]), alt: product.name }] : undefined } };
}

function ProductJsonLd({ product, locale }: { product: CatalogProduct; locale: string }) {
  const variant = product.variants.find((item) => item.stock === null || (item.stock || 0) > 0) || product.variants[0];
  const price = variant?.price || product.discountPrice || product.basePrice;
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: product.images.map(absoluteImage), description: product.description || product.shortDescription || product.name, sku: variant?.sku || product.slug, brand: { '@type': 'Brand', name: 'ReadyCommerce' }, offers: { '@type': 'Offer', url: `${siteUrl}/${locale}/products/${product.slug || product._id}`, priceCurrency: 'BDT', price: Number(price).toFixed(2), availability: variant && (variant.stock === null || (variant.stock || 0) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' }, ...(product.reviewCount && product.ratingAverage ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.ratingAverage, reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 } } : {}) };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />;
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const product = await getProduct(id);
  return <>{product && <ProductJsonLd product={product} locale={locale} />}<ProductDetail productId={id} /><ProductReviews productId={id} /></>;
}
