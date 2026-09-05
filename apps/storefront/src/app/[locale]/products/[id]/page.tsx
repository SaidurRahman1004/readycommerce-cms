import ProductDetail from '@/components/store/product-detail';
import ProductReviews from '@/components/store/product-reviews';
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><ProductDetail productId={id} /><ProductReviews productId={id} /></>; }
