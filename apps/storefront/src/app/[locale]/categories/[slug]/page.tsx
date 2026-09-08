import type { Metadata } from 'next';
import ShopClient from '@/components/store/shop-client';
import { catalogService } from '@/services/api-service';

export const revalidate = 60;

async function getCategory(slug: string) {
  try { const result = await catalogService.categories({ cache: 'force-cache', next: { revalidate: 300 } }); return result.data.find((category) => category.slug === slug) || null; }
  catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found', description: 'The requested ReadyCommerce category could not be found.' };
  const description = `Explore the ${category.name} collection at ReadyCommerce.`;
  return { title: category.name, description, alternates: { canonical: `/${locale}/categories/${category.slug}` }, openGraph: { type: 'website', title: category.name, description, images: category.image ? [{ url: category.image, alt: category.name }] : undefined } };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <ShopClient initialCategory={slug} />; }
