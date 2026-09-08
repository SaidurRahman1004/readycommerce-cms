import { redirect } from 'next/navigation';

export default async function CampaignsAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ token?: string; preview?: string; previewToken?: string }>;
}) {
  const { locale, slug } = await params;
  const search = await searchParams;
  const sp = new URLSearchParams();
  if (search.token) sp.set('token', search.token);
  if (search.previewToken) sp.set('previewToken', search.previewToken);
  if (search.preview) sp.set('preview', search.preview);
  const queryStr = sp.toString();

  redirect(`/${locale}/campaign/${slug}${queryStr ? `?${queryStr}` : ''}`);
}
